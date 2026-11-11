// Sampler for the carbohydrates game ("Sweet Structures"): runs the game's own generators (GEN[mode]) and
// converts them to the shared bank format. Fischer/Haworth drawings are the game's own inline SVG (fischerSVG /
// haworthSVG), which are self-contained. Every item is graded with the game's own check() before it is kept.
// Skipped: Haworth "match" sub-type (answer choices are pictures) and Exam Practice (Final Boss items, already in bank).
const GAME = 'carbohydrates';
const MODES = [
  { key: 'classify', slug: 'classify', ch: ['3B-9'] },
  { key: 'fischer', slug: 'fischer', ch: ['3B-9', '3B-6'] },
  { key: 'haworth', slug: 'haworth', ch: ['3B-9'] },
  { key: 'stereo', slug: 'stereo', ch: ['3B-6', '3B-9'] },
  { key: 'disacc', slug: 'disaccharides', ch: ['3B-9'] },
  { key: 'react', slug: 'sugar-reactions', ch: ['3B-9', '3B-5'] },
];
const WANT = 36;


const sugarWhy = require('../whys/carbs');
module.exports = async (page, ctx) => {
  const items = [];
  let seed = 3100;
  const SUG = await page.evaluate(() => JSON.parse(JSON.stringify(Array.isArray(SUG) ? Object.fromEntries(SUG) : SUG)));
  for (const m of MODES) {
    await ctx.seed(++seed);
    const raw = await page.evaluate(({ key, want }) => {
      state.mode = key;
      const out = [], seen = new Set();
      for (let tries = 0; tries < 3000 && out.length < want; tries++) {
        const q = GEN[key]();
        if (q.struct) continue; // pictures as answer choices
        const opt = q.options.find(o => o.key === q.answer);
        const sig = q.html + '|' + q.answer;
        if (!opt || seen.has(sig)) continue;
        seen.add(sig);
        // grade with the game's own checker
        state.q = q; state.done = false; state.revealed = false; state.selected = q.answer;
        $('feedback').className = '';
        check();
        const ok = /\bgood\b/.test($('feedback').className) && state.done;
        out.push({ html: q.html, choices: q.options.map(o => o.html), answer: opt.html, hint: q.hint, why: q.why, ok,
          notes: q.notes ? q.options.map(o => o.key === q.answer ? '' : (q.notes[o.key] || '').replace(/<[^>]+>/g, '')) : null });
      }
      return out;
    }, { key: m.key, want: WANT });
    raw.forEach((r, index) => {
      if (!r.ok) throw new Error(`${m.key}: game checker rejected its own answer for ${r.html.slice(0, 100)}`);
      const prompt = r.html
        .replace(/<div class="struct pair">/g, '<div class="struct pair" style="display:flex;gap:16px;flex-wrap:wrap">')
        .replace(/<span class="optname">/g, '<span class="optname" style="display:block;text-align:center;font-weight:bold">');
      items.push({
        skill: `${GAME}.${m.slug}`, courses: ['3B'], chapters: m.ch, type: 'mc', prompt,
        choices: r.choices, answer: r.answer, hint: r.hint, explain: r.why,
        origin: 'original', from: { game: GAME, list: `sample:${m.key}`, index },
      });
      const it = items[items.length - 1];
      // the game's own per-option notes come first; the rule module fills any it leaves blank
      const w = sugarWhy(it, SUG) || [], n = r.notes || [];
      const merged = it.choices.map((c, i) => c === it.answer ? '' : (n[i] || w[i] || ''));
      if (merged.some(Boolean)) it.why = merged;
    });
  }
  return items;
};
