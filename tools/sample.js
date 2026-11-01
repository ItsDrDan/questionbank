// Run one game's sampler and check its output.
// usage: node tools/sample.js <game> [reposDir]   -> writes /tmp/sample-<game>.json and prints a report
// A sampler (tools/samplers/<game>.js) exports: async (page, ctx) => items[]
//   page: Playwright page with the game already loaded, Math.random seeded (same output every run)
//   ctx:  { game, seed(n) } — call ctx.seed(n) to re-seed before each mode if you like
const fs = require('fs'), path = require('path');
const { chromium } = require('playwright');
const SEED_SCRIPT = `(()=>{let s=20261101;const r=()=>{s|=0;s=s+0x6D2B79F5|0;let t=Math.imul(s^s>>>15,1|s);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296};Math.random=r;window.__seed=n=>{s=n|0};try{localStorage.clear()}catch(e){}})();`;
async function openGame(browser, reposDir, game) {
  const page = await browser.newPage();
  await page.addInitScript(SEED_SCRIPT);
  await page.route(/^https?:/, r => r.abort());
  page.on('pageerror', e => (page.__errors = (page.__errors || []).concat(e.message)));
  await page.goto('file://' + path.join(reposDir, game, 'index.html'), { waitUntil: 'load' });
  await page.waitForTimeout(500);
  return page;
}
const TYPES = new Set(['mc', 'number', 'text']);
function validate(items) {
  const problems = [];
  const seen = new Set();
  items.forEach((q, i) => {
    const where = `#${i} ${q.skill || '?'}`;
    for (const k of ['skill', 'courses', 'chapters', 'type', 'prompt']) if (!q[k] || (Array.isArray(q[k]) && !q[k].length)) problems.push(`${where}: missing ${k}`);
    if (!TYPES.has(q.type)) problems.push(`${where}: type must be mc/number/text, got ${q.type}`);
    if (q.answer === undefined || q.answer === null || q.answer === '') problems.push(`${where}: no answer`);
    if (q.type === 'mc' && (!Array.isArray(q.choices) || !q.choices.map(String).includes(String(q.answer)))) problems.push(`${where}: answer not among choices`);
    if (q.type === 'mc' && q.choices && new Set(q.choices.map(String)).size !== q.choices.length) problems.push(`${where}: duplicate choices`);
    if (q.type === 'number' && !isFinite(Number(q.answer))) problems.push(`${where}: numeric answer not a number (${q.answer})`);
    if (/undefined|(^|[^A-Za-z])NaN(?=[\s,.;:)\]"']|$)|\[object Object\]/.test(JSON.stringify([q.prompt, q.choices, q.answer])))  /* NaNO3 is fine */ problems.push(`${where}: contains undefined/NaN/[object Object]`);
    const key = q.skill + '|' + q.prompt + '|' + JSON.stringify(q.answer);
    if (seen.has(key)) problems.push(`${where}: duplicate item`); seen.add(key);
  });
  return problems;
}
module.exports = { openGame, validate, SEED_SCRIPT };
if (require.main === module) (async () => {
  const [game, repos = '/home/claude/repos'] = process.argv.slice(2);
  const sampler = require(path.join(__dirname, 'samplers', game + '.js'));
  const browser = await chromium.launch();
  const page = await openGame(browser, repos, game);
  const items = await sampler(page, { game, seed: n => page.evaluate(n => window.__seed(n), n) });
  await browser.close();
  fs.writeFileSync(`/tmp/sample-${game}.json`, JSON.stringify(items, null, 1));
  const by = {}; items.forEach(q => (by[q.skill] = (by[q.skill] || 0) + 1));
  console.log(game, items.length, 'items'); console.log(by);
  const p = validate(items); console.log(p.length ? 'PROBLEMS:\n' + p.slice(0, 40).join('\n') : 'no problems');
  if (page.__errors) console.log('page errors:', page.__errors.slice(0, 5));
})();
