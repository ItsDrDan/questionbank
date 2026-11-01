// Sampler for the thermochemistry game: calls the game's own generator functions (generators.* for CHEM 3A,
// GEN1A.* for CHEM 1A) and converts each multi-step problem into shared-bank items:
//  - problems whose last step asks for a number -> one "number" item (the final numeric field)
//  - problems whose last step is multiple choice -> one "mc" item per field of that step
//    (Phase & Energy Detective / Heat Foundations identify problems: every choice field, all steps are independent)
// Every kept answer is graded with the game's own isCorrect() before it is returned.
const fs = require('fs'), path = require('path'), vm = require('vm');
const GAME = 'thermochemistry';
const MODES = [
  // 3A modes (generators table)
  { key: 'identify', slug: 'phase-energy-detective', table: 'generators', courses: ['3A'], chapters: ['3A-7'], want: 40 },
  { key: 'sensible', slug: 'specific-heat', table: 'generators', courses: ['3A'], chapters: ['3A-7'], want: 35 },
  { key: 'latent', slug: 'phase-change-heat', table: 'generators', courses: ['3A'], chapters: ['3A-7'], want: 35 },
  { key: 'explore', slug: 'heat-explorer', table: 'generators', courses: ['3A'], chapters: ['3A-7'], want: 30 },
  { key: 'challenge', slug: 'total-heat', table: 'generators', courses: ['3A'], chapters: ['3A-7'], want: 35 },
  // 1A modes (GEN1A table)
  { key: 'basics', slug: 'heat-foundations', table: 'GEN1A', courses: ['1A'], chapters: ['1A-5', '1A-10'], want: 35 },
  { key: 'energy', slug: 'heat-work', table: 'GEN1A', courses: ['1A'], chapters: ['1A-5'], want: 35 },
  { key: 'calorimetry', slug: 'calorimetry', table: 'GEN1A', courses: ['1A'], chapters: ['1A-5'], want: 40 },
  { key: 'hess', slug: 'hess', table: 'GEN1A', courses: ['1A'], chapters: ['1A-5'], want: 40, origin: 'openstax' },
  { key: 'formation', slug: 'formation-enthalpy', table: 'GEN1A', courses: ['1A'], chapters: ['1A-5'], want: 40 },
  { key: 'enthalpy', slug: 'reaction-enthalpy', table: 'GEN1A', courses: ['1A'], chapters: ['1A-5', '1A-4'], want: 40 },
  { key: 'advanced', slug: 'advanced-challenge', table: 'GEN1A', courses: ['1A'], chapters: ['1A-5', '1A-4'], want: 35 },
];

// fractions are drawn with CSS in the game; write them inline so the HTML stands on its own
const clean = s => String(s).replace(/<span class="fraction"><span>(.*?)<\/span><span>(.*?)<\/span><\/span>/g, '$1/$2');

function loadQB() {
  const ctx = { window: {}, fetch: () => Promise.reject(new Error('offline')), console };
  vm.createContext(ctx);
  vm.runInContext(fs.readFileSync(path.join(__dirname, '..', '..', 'qb.js'), 'utf8'), ctx);
  return ctx.window.QB;
}

module.exports = async (page, ctx) => {
  const QB = loadQB();
  // The game draws randomness from crypto.getRandomValues (not Math.random). Route it through the seeded
  // Math.random so output is repeatable, and keep only the OpenStax-sourced Hess templates.
  await page.evaluate(() => {
    crypto.getRandomValues = a => { for (let i = 0; i < a.length; i++) a[i] = Math.floor(Math.random() * 4294967296); return a; };
    HESS_BANK.length = 0; HESS_BANK.push(...OPENSTAX_HESS);
  });
  const items = [], seen = new Set();
  let seed = 3000;
  for (const m of MODES) {
    await ctx.seed(++seed);
    const raw = await page.evaluate(({ key, table, want }) => {
      bags = {}; drawStore = {};
      const gen = (table === 'GEN1A' ? GEN1A : generators)[key];
      const out = [], keys = new Set(), stats = { skippedConcept: 0, skippedLookup: 0, tries: 0 };
      const rowsHTML = rows => rows && rows.length ? '<table border="1" cellpadding="3" style="border-collapse:collapse"><caption>Given reference data</caption>' +
        rows.map(r => '<tr><td>' + notationHTML(esc(r[0])) + '</td><td>' + esc(r[1]) + '</td><td>' + esc(r[2] || '') + '</td></tr>').join('') + '</table>' : '';
      const heatChart = '<table border="1" cellpadding="3" style="border-collapse:collapse"><caption>Specific heat reference chart, J/(g·°C)</caption>' +
        HEATS.map(([n, c]) => '<tr><td>' + n + '</td><td>' + c + '</td></tr>').join('') + '</table>';
      const fieldUnit = u => (u && !['formula', 'coefficient', 'factor', 'stages'].includes(u)) ? u : '';
      const solution = p => '<ol>' + p.steps.map(s => '<li><b>' + esc(s.title) + ':</b> ' + (s.explain || '') + '</li>').join('') + '</ol>';
      for (let t = 0; t < 400 && out.length < want; t++) {
        stats.tries++;
        const p = tidyProblem(gen());
        if (p.steps.some(s => s.title === 'Explain the concept')) { stats.skippedConcept++; continue; } // static concepts bank: already in the shared bank
        if (p.lookup) { stats.skippedLookup++; continue; } // needs the embedded OpenStax table; same problem exists with the data supplied
        let story = p.story, visual = p.visual || '', solHTML = solution(p);
        if (p.hessGame) {
          const a = p.advancedAudit;
          story = 'Use Hess’s law and the reactions below to find ΔH for the target reaction.';
          visual = '<div><b>Target:</b> ' + eqHTML(a.target) + '</div><ol>' + a.parts.map(x => '<li>' + eqHTML(x.shown) + '; ΔH = ' + fmt(x.dh, 7) + ' kJ</li>').join('') + '</ol>';
          solHTML = '<ol>' + a.parts.map((x, i) => '<li>Reaction ' + (i + 1) + ' × ' + (x.factor < 0 ? '(−1) × ' : '') + coefficientText(Math.abs(x.factor)) + ': ' + eqHTML(x.adjusted) + '; ΔH = ' + fmt(x.factor * x.dh, 7) + ' kJ</li>').join('') + '</ol>' + p.steps[p.steps.length - 1].explain;
        }
        if (p.title === 'Identify a mystery material') visual += heatChart;
        const base = '<p>' + notationHTML(esc(story)) + '</p>' + (p.predictionNote ? '<p>' + notationHTML(esc(p.title === 'Challenge: limiting reactant and heat' ? p.predictionNote.replace(' in excess oxygen', '') : p.predictionNote)) + '</p>' : '') + visual + rowsHTML(p.dataRows);
        const hints = (p.route && p.route.length ? 'Plan: ' + p.route.join(' → ') + '.' : '');
        const last = p.steps[p.steps.length - 1];
        const nums = last.fields.filter(f => !f.options && !f.chemical && !f.exact);
        const picks = [];
        if (nums.length) {
          let f = nums[nums.length - 1];
          // limiting-reactant problems end with a tiny leftover (ill-conditioned); use the reaction-heat field instead
          if (p.title === 'Challenge: limiting reactant and heat') { const st = p.steps.find(s => s.fields.some(x => x.id === 'q')); f = st.fields.find(x => x.id === 'q'); picks.push({ f, step: st }); }
          else picks.push({ f, step: last });
        } else {
          const steps = (key === 'identify' || key === 'basics') && p.topic === 'identify' ? p.steps : [last];
          for (const st of steps) for (const f of st.fields) if (f.options) picks.push({ f, step: st });
        }
        for (const { f, step } of picks) {
          const sp = String(step.prompt || '').replace(/\s*Use the model below to explore after predicting\./, '');
          const u = fieldUnit(f.unit);
          // number items: the story states the target; keep the step text only when it is itself the question
          const lead = (f.options || /\?\s*$/.test(sp)) && !p.hessGame ? '<p>' + notationHTML(esc(sp)) + '</p>' : '';
          const ask = lead + (f.options ? '<p><b>' + notationHTML(esc(f.label)) + ':</b></p>'
            : '<p><b>Enter:</b> ' + notationHTML(esc(f.label)) + (u ? ' (' + esc(u) + ')' : '') + '</p>');
          const prompt = base + ask;
          let answer = f.options ? f.answer : Number(Number(f.answer).toPrecision(6));
          const ok = f.options ? (f.options.includes(f.answer) && isCorrect(f, f.answer)) : isCorrect(f, String(answer));
          const k = prompt + '|' + answer;
          if (keys.has(k)) continue; keys.add(k);
          out.push({ title: p.title, prompt, mc: !!f.options, choices: f.options ? f.options.slice() : null, answer, unit: u, ok,
            hint: [step.hint || '', hints].filter(Boolean).join(' '), explain: solHTML, source: p.source || '' });
        }
      }
      return { out: out.slice(0, want), stats };
    }, { key: m.key, table: m.table, want: m.want });
    let index = 0;
    for (const r of raw.out) {
      if (!r.ok) throw new Error(`${m.key}: game checker rejected its own answer ${r.answer} for: ${r.prompt.slice(0, 160)}`);
      if (m.key === 'hess' && !/OpenStax/.test(r.source)) throw new Error('hess item not from OPENSTAX_HESS: ' + r.title);
      const item = { skill: `${GAME}.${m.slug}`, courses: m.courses, chapters: m.chapters, type: r.mc ? 'mc' : 'number', prompt: clean(r.prompt) };
      if (r.mc) { item.choices = r.choices.map(clean); item.answer = clean(r.answer); }
      else { item.answer = r.answer; if (r.unit) item.unit = r.unit; item.tolerance = 0.005; } // game accepts ±0.5% when sig figs are not graded
      if (r.hint) item.hint = clean(r.hint);
      item.explain = clean(r.explain);
      item.origin = m.origin || 'original';
      const dk = item.skill + '|' + item.prompt + '|' + JSON.stringify(item.answer);
      if (seen.has(dk)) continue; seen.add(dk);
      if (!QB.check(item, String(item.answer))) throw new Error('QB.check rejects answer for ' + item.skill + ': ' + item.answer);
      item.from = { game: GAME, list: 'sample:' + m.key, index: index++ };
      items.push(item);
    }
  }
  return items;
};
