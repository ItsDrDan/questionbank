// Sampler for the IMF game ("Sticky Molecules", CHEM 3A / 1A / 3B): intermolecular forces, boiling points, liquids and
// mixing, phase changes, osmosis, colligative properties (1A) and biomolecules (3B).
// For each course it switches the game to that course, runs the game's own generate(topic) with Math.random seeded,
// and turns each usable step into one bank item: the step is shown alone with the game's newQuestion(), the rendered
// stem (Lewis structures, heating curve, phase diagram, DNA pieces) and question are inlined, and the right answer is
// graded with the game's own checker (choose(i) for choices, checkCurrent() for typed numbers).
// Multi-step questions give one item per step when the step makes sense on its own next to the stem; steps that only
// make sense after the one before ("Why?", "Is that a covalent bond?") are left out (SKIP_PARTS).
// The same question reached from two courses becomes one item tagged with both.
// Lab questions (topics marked lab, game v9+) are plain multiple choice here; the lab itself stays in the game.
// Skipped: ranking steps (tap in order) and anything a topic the game does not have (so an older game still samples).
const { installInliner } = require('../sampler-kit');
const GAME = 'IMF';
const COURSES = ['3A', '1A', '3B'];
const WANT = 12;                                  // questions tried for per topic per course
// steps (0-based) that lean on the step before them
// (fpbp has two shapes: 5 steps forward, or 3 steps working backward, so its list is keyed by the number of steps)
const SKIP_PARTS = { mixing: [1], endoexo: [1], osmoticp: [2], sidechain: [1], fpbp: { 5: [0, 2], 3: [1] } };
// hub chapter ids by course: a tile default, then topic overrides
const CH_TILE = {
  '3A': { t1: ['3A-6'], t2: ['3A-6'], t3: ['3A-7'], t4: ['3A-7'], t5: ['3A-9'] },
  '1A': { t1: ['1A-10'], t2: ['1A-10'], t3: ['1A-10'], t4: ['1A-10'], t5: ['1A-11'], t6: ['1A-11'] },
  '3B': { t1: ['3B-2', '3B-4'], t2: ['3B-2', '3B-4'], t3: ['3B-2', '3B-4'], t5: ['3B-10', '3B-15'], t7: ['3B-11'] }
};
const CH_TOPIC = { '3B': { fats: ['3B-10'], dna: ['3B-13'], carbs: ['3B-9'], colloid: ['3B-10'] } };

// runs inside the game page
const IN_PAGE = ({ course, topic, want, skip }) => {
  const SUP = { 0: '⁰', 1: '¹', 2: '²', 3: '³', 4: '⁴', 5: '⁵', 6: '⁶', 7: '⁷', 8: '⁸', 9: '⁹', '+': '⁺', '-': '⁻', '−': '⁻' }, SUB = { 0: '₀', 1: '₁', 2: '₂', 3: '₃', 4: '₄', 5: '₅', 6: '₆', 7: '₇', 8: '₈', 9: '₉' };
  const uni = (t, map) => [...t].every(c => map[c]) ? [...t].map(c => map[c]).join('') : null;
  // H<sub>2</sub>O → H₂O and K<sub>f</sub> → K_f, so plain-text choices, hints and explanations read correctly
  const strip = s => String(s == null ? '' : s).replace(/<sup>([^<]*)<\/sup>/g, (m, t) => uni(t, SUP) || '^' + t).replace(/<sub>([^<]*)<\/sub>/g, (m, t) => uni(t, SUB) || '_' + t)
    .replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim();
  const inl = el => { const c = el.cloneNode(true); el.after(c); const h = window.__inline(c); c.remove(); return h; };
  if (!TOPICS[topic] || !TOPICS[topic].courses.includes(course)) return { out: [], why: { 'topic not in this game or course': 1 } };
  if (state.course !== course) setCourse(course);
  const out = [], seen = new Set(), why = {}, bump = k => { why[k] = (why[k] || 0) + 1; };
  let fixed = null; window.makeQuestion = () => fixed;          // newQuestion() shows the question we hand it
  for (let tries = 0; tries < 30 * want && seen.size < want; tries++) {
    let q; try { OPTS.course = course; q = generate(topic); } catch (e) { bump('error: ' + e.message); continue; }
    const sig = strip(q.stem || '') + '|' + q.parts.map(p => strip(p.ask) + '=' + strip(p.answer)).join('|');
    if (seen.has(sig)) { bump('repeat'); continue; } seen.add(sig);
    const sk = Array.isArray(skip) ? skip : (skip && skip[q.parts.length]) || [];
    q.parts.forEach((p, pi) => {
      if (sk.includes(pi)) return;
      if (p.kind !== 'choice' && p.kind !== 'nums') { bump('kind ' + p.kind); return; }
      if (p.kind === 'choice' && p.choices.some(c => /<svg|<img/i.test(c.html))) { bump('picture choices'); return; }
      if (p.kind === 'nums' && p.fields.length !== 1) { bump('more than one number box'); return; }
      fixed = Object.assign({}, q, { parts: [p], sim: undefined }); state.ch = null; state.mode = 'practice';
      try { newQuestion(); } catch (e) { bump('render error: ' + e.message); return; }
      const stem = document.getElementById('stem'), ask = document.querySelector('#parts .part.current .ask');
      const prompt = (!stem.hidden && stem.innerHTML.trim() ? '<div>' + inl(stem) + '</div>' : '') + '<div>' + inl(ask) + '</div>';
      const hint = strip(p.hint), explain = strip(p.solution), tile = TOPICS[q.topic || topic].tile;
      if (p.kind === 'choice') {
        const btns = [...document.querySelectorAll('#parts .part.current [data-choice]')];
        if (btns.length !== p.choices.length) { bump('choice buttons not found'); return; }
        const choices = btns.map(b => strip(b.innerHTML)), right = p.choices.findIndex(c => c.ok);
        if (new Set(choices).size !== choices.length) { bump('choices read the same as plain text'); return; }
        const whys = p.choices.map(c => c.ok ? '' : strip(c.why));
        choose(right);
        const ok = state.done && /\bgood\b/.test(document.getElementById('feedback').className);
        out.push({ type: 'mc', topic: q.topic || topic, tile, part: pi, prompt, choices, answer: choices[right], why: whys, hint, explain, ok });
      } else {
        const f = p.fields[0], shown = String(f.show).replace(/ .*$/, '').replace(/%$/, '').replace(/[−–]/g, '-'), unit = (String(f.label).match(/\(([^)]+)\)\s*$/) || [])[1] || '';
        // the number as the game displays it: 7.84, 100., 1.20×10^3
        const val = Number(shown.replace(/×10\^?/, 'e').replace(/\.$/, ''));
        if (!isFinite(val)) { bump('answer is not a plain number: ' + f.show); return; }
        const inp = document.getElementById('in-' + f.key); if (!inp) { bump('number box not found'); return; }
        inp.value = shown; checkCurrent();
        const ok = state.done && /\bgood\b/.test(document.getElementById('feedback').className) && !/fix your sig figs/.test(document.getElementById('feedback').textContent);
        out.push({ type: 'number', topic: q.topic || topic, tile, part: pi, prompt: prompt + (f.sf ? `<p><small>Give ${f.sf} significant figures.</small></p>` : ''), answer: val, unit: strip(unit), tol: f.exact ? 0 : f.abs ? f.abs / Math.max(Math.abs(val), 1e-9) : (f.tol || 0.01), hint, explain, ok });
      }
    });
  }
  return { out, why };
};

module.exports = async (page, ctx) => {
  await installInliner(page);
  const topics = await page.evaluate(() => Object.keys(TOPICS).map(t => ({ t, tile: TOPICS[t].tile, courses: TOPICS[t].courses })));
  const merged = new Map();
  let seed = 9300;
  for (const course of COURSES) {
    for (const { t, tile, courses } of topics) {
      if (!courses.includes(course)) continue;
      await ctx.seed(++seed);
      const raw = await page.evaluate(IN_PAGE, { course, topic: t, want: WANT, skip: SKIP_PARTS[t] });
      if (ctx.log !== false && Object.keys(raw.why).length) console.log(`  ${GAME}/${course}/${t}: kept ${raw.out.length}; left out`, JSON.stringify(raw.why));
      for (const r of raw.out) {
        if (!r.ok) throw new Error(`${course}/${t}: the game did not accept its own answer (${String(r.answer).slice(0, 60)}) for ${r.prompt.replace(/<[^>]+>/g, ' ').slice(0, 90)}`);
        const chapters = (CH_TOPIC[course] && CH_TOPIC[course][r.topic]) || CH_TILE[course][r.tile || tile];
        if (!chapters) throw new Error(`${course}/${t}: no chapter mapping for tile ${r.tile || tile}`);
        const key = r.topic + '|' + r.prompt + '|' + JSON.stringify(r.answer);
        const had = merged.get(key);
        if (had) { if (!had.courses.includes(course)) had.courses.push(course); for (const c of chapters) if (!had.chapters.includes(c)) had.chapters.push(c); continue; }
        const item = { skill: `${GAME}.${r.topic}`, courses: [course], chapters: chapters.slice(), type: r.type, prompt: r.prompt, answer: r.answer, hint: r.hint || undefined, explain: r.explain || undefined, origin: 'original', from: { game: GAME, list: `sample:${r.topic}`, index: 0 } };
        if (r.type === 'mc') { item.choices = r.choices; if (r.why.some(Boolean)) item.why = r.why; }
        if (r.type === 'number') { item.tolerance = r.tol || 1e-9; if (r.unit) item.unit = r.unit; }
        merged.set(key, item);
      }
    }
  }
  const items = [...merged.values()], n = {};
  items.forEach(it => { it.from.index = n[it.from.list] = (n[it.from.list] || 0) + 1; it.from.index--; });
  return items;
};
module.exports.IN_PAGE = IN_PAGE;
