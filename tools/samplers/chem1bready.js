// Sampler for chem1bready (Bridge to 1B). Runs the game's topic generators (generators[topic]) and keeps
// one-answer items:
//  - SKIPPED: topics 'reactions' and 'redox' (now loaded from the bank), lewis (drawing workbench),
//    concept() draws from CORE / PHYSICAL / WATER_CONCEPTS / KE_CONCEPTS / BRIDGE_CONCEPTS (static, banked or excluded),
//    and every problem whose source mentions Tro (BRIDGE_SOURCE: serialDilution, mixedIon, prepareSolution,
//    millimole*/millimolar*, molecularFormula, wetGas, energyScale) plus both concentrationBridge() versions.
//  - Multi-step problems: the item is the problem's final answer (or, for a few problem types, a chosen
//    field listed in PICK); the prompt carries the story, equation, picture and any givens that appear in
//    step prompts, then names the quantity to find.
// Every kept answer is graded with the game's own check(): the problem is rendered at that step, the stored
// answer is typed into the target field (game answers in the others) and the step must be accepted.
const GAME = 'chem1bready';
const TOPICS = [
  { key: 'titration', slug: 'acid-base-stoichiometry', ch: ['1A-3', '1A-4', '1B-ready', '1B-14'] },
  { key: 'limiting', slug: 'limiting-reactant', perTitle: 20, ch: ['1A-4', '1B-ready'] },
  { key: 'ions', slug: 'dissolution-ions', ch: ['1A-3', '1A-4', '1A-11', '1B-ready', '1B-15'] },
  { key: 'aqueous', slug: 'reactions-in-water', perTitle: 25, ch: ['1A-4', '1B-ready', '1B-14'] },
  { key: 'geometry', slug: 'shape-hybridization', perTitle: 40, ch: ['1A-7', '1A-8', '1B-ready'] },
  { key: 'mo', slug: 'mo-theory', perTitle: 40, ch: ['1A-8', '1B-ready'] },
  { key: 'foundations', slug: 'core-toolkit', ch: ['1A-1', '1A-2', '1A-3', '1A-6', '1B-ready'] },
  { key: 'physical', slug: 'matter-energy', ch: ['1A-5', '1A-9', '1A-10', '1A-11', '1B-ready'] },
  { key: 'kineq', slug: 'kinetics-equilibrium-prep', ch: ['1B-12', '1B-13', '1B-ready'] },
  { key: 'mathgym', slug: 'math-gym', perTitle: 10, ch: ['1B-12', '1B-13', '1B-14', '1B-16', '1B-ready'] },
];
// problem title -> field labels to ask (default: last field of the last step that has fields)
const PICK = {
  'From a Lewis structure to bonding': ['Molecular geometry', 'Central hybridization model', 'Molecule polarity'],
  'Two atoms → one MO diagram': ['Bond order', 'Unpaired electrons', 'Magnetic behavior'],
  'Molar solubility → ion concentrations': [/^\[/],
  'The “change” row of an ICE table': [/^Increase in/],
  'Connect temperature to reaction heat': ['Reaction heat'],
  'Is x small?': ['Can x be ignored next to the start?'],
  'Heat and temperature in equilibrium': ['Heat acts like a…'],
  'Two dissolved salts share an ion': [/^Final \[Cl/],
  // 1B Math Gym (v43+): ask for the quantity that carries the skill, not the follow-up choice
  'Two kinds of log': ['−log(x)', 'ln(x)'],
  'Undo a log': ['[H⁺]', 'y'],
  'Solve for t inside a log': ['Time t'],
  'The unknown is in the exponent': ['x'],
  'kJ, J and a log: the classic trap': ['ln K', 'K'],
  'Slope with units from a plot': ['Slope', 'Rate of disappearance of A'],
  'Find the exponent from two trials': ['Exponent n'],
  'Fill the ln column, then take a slope': ['k = −slope'],
  'A quadratic from an ICE table': ['Positive root x'],
  'The small-x shortcut, and checking it': ['x', 'x as a percent of c'],
  'Powers of a tiny number': ['Result'],
  'Solve for the unknown in a denominator': ['c'],
  'Solve a rate law for k': ['k'],
  'Solve for one concentration inside K': ['[B]'],
};
const SKIP_TITLES = ['Molarity, molality, and particle concentration', 'Mass percent, molarity, and molality']; // concentrationBridge (both versions)
const PER_TITLE = 8, PER_TOPIC = 40;

module.exports = async (page, ctx) => {
  const items = [];
  let seed = 9300;
  for (const T of TOPICS) {
    await ctx.seed(++seed);
    const raw = await page.evaluate(({ topic, PICK, SKIP_TITLES, PER_TITLE, PER_TOPIC }) => {
      // the game's pick/shuffle use crypto.getRandomValues; route it through the seeded Math.random
      crypto.getRandomValues = a => { for (let i = 0; i < a.length; i++) a[i] = Math.floor(Math.random() * 4294967296); return a; };
      const conceptStories = new Set([CORE, PHYSICAL, WATER_CONCEPTS, KE_CONCEPTS, (typeof MG_CONCEPTS !== 'undefined' ? MG_CONCEPTS : []), ...Object.values(BRIDGE_CONCEPTS)].flat().map(c => c[1]));
      const picks = Object.fromEntries(Object.entries(PICK).map(([k, v]) => [k, v.map(x => typeof x === 'string' ? x : new RegExp(x.source || x))]));
      const strip = s => String(s).replace(/<[^>]+>/g, '');
      const dropQuestions = s => s.split(/(?<=[.?!])\s+/).filter(x => !/\?\s*$/.test(strip(x))).join(' ');
      const optText = (f, o) => optionLabel(f.optionLabels?.[o] || o);
      function grade(prob, si, fi, value) {
        mode = topic; q = structuredClone(prob); index = si; completed = []; awarded = false; watching = false;
        render();
        q.steps[si].fields.forEach((f, k) => { $('input-' + f.id).value = k === fi ? value : String(f.answer); });
        $('feedback').className = 'feedback'; check();
        return !/\bbad\b/.test($('feedback').className) && (index > si || awarded);
      }
      const out = [], seen = new Set(), perTitle = {};
      for (let t = 0; t < 1500 && out.length < PER_TOPIC; t++) {
        const p = generators[topic]();
        if (/\bTro\b/.test(p.source) || SKIP_TITLES.includes(p.title)) continue;
        if (conceptStories.has(p.story) || conceptStories.has(strip(p.story))) continue;
        if ((perTitle[p.title] || 0) >= PER_TITLE) continue;
        // choose target fields
        const targets = [];
        const want = picks[p.title];
        p.steps.forEach((s, si) => s.fields.forEach((f, fi) => {
          if (want && want.some(w => typeof w === 'string' ? f.label === w : w.test(f.label))) targets.push([si, fi]);
        }));
        if (!want) { const si = p.steps.map((s, i) => s.fields.length ? i : -1).filter(i => i >= 0).pop(); targets.push([si, p.steps[si].fields.length - 1]); }
        for (const [si, fi] of targets) {
          const s = p.steps[si], f = s.fields[fi];
          if (f.formula) continue;
          let story = p.story;
          if (topic === 'mo') story = story.replace(' using atomic orbitals on the left and right and molecular orbitals in the middle', ' with molecular orbital theory')
            .replace('Only valence orbitals are shown;', 'Consider only the valence orbitals;');
          let html = '<p>' + story + '</p>';
          if (p.equation) html += '<div class="equation">' + p.equation + '</div>';
          if (p.visual && /<svg/.test(p.visual) && !/bridge-map/.test(p.visual)) html += p.visual;
          for (let k = 0; k < si; k++) { const sp = p.steps[k].prompt; if (/\d/.test(strip(sp))) { const d = dropQuestions(sp); if (d.trim()) html += '<p>' + d + '</p>'; } }
          if (/\d|\?/.test(strip(s.prompt))) html += '<p>' + s.prompt + '</p>';
          const unit = f.options || !f.unit || f.label.toLowerCase().includes(String(f.unit).toLowerCase()) ? '' : f.unit; // e.g. "Bond order (bond order)"
          html += '<p><b>Find:</b> ' + inlineChem(f.label) + (unit ? ' (' + inlineChem(unit) + ')' : '') + '</p>';
          let answer, value, choices = null;
          if (f.options) { choices = f.options.map(o => optText(f, o)); answer = optText(f, f.answer); value = f.answer; }
          else { answer = f.exact ? f.answer : Number(f.answer.toPrecision(3)); value = String(answer); }
          const key = html + '|' + answer;
          if (seen.has(key)) continue;
          const ok = grade(p, si, fi, value);
          seen.add(key); perTitle[p.title] = (perTitle[p.title] || 0) + 1;
          const explain = p.steps.slice(0, si + 1).filter(x => x.explain).map(x => '<p><b>' + x.title + ':</b> ' + x.explain + '</p>').join('');
          out.push({ title: p.title, source: p.source, html, answer, choices, exact: !!f.exact, unit,
            hint: s.hint || f.hint || '', explain, ok, raw: f.answer, label: f.label });
          if (out.length >= PER_TOPIC) break;
        }
      }
      return out;
    }, { topic: T.key, PICK, SKIP_TITLES, PER_TITLE: T.perTitle || PER_TITLE, PER_TOPIC });

    let index = 0;
    for (const r of raw) {
      if (!r.ok) throw new Error(`${T.key}: game check() rejected ${r.answer} for "${r.label}" in ${r.title}`);
      const item = { skill: `${GAME}.${T.slug}`, courses: ['1A', '1B'], chapters: [...T.ch], type: null, prompt: r.html };
      if (r.choices) { item.type = 'mc'; item.choices = r.choices; item.answer = r.answer; }
      else {
        item.type = 'number'; item.answer = r.answer;
        if (r.unit) item.unit = r.unit.replace(/<[^>]+>/g, '');
        item.tolerance = r.exact ? 0.0001 : 0.005; // game: within 0.5% of the 3-sig-fig answer; exact fields must match
      }
      if (r.hint) item.hint = r.hint;
      if (r.explain) item.explain = r.explain;
      item.origin = 'original';
      item.from = { game: GAME, list: 'sample:' + T.key, index: index++ };
      items.push(item);
    }
  }
  return items;
};
