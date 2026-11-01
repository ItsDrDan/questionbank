// Sampler for the gaslaws game: runs the game's own generators (LEVELS[*].gen) per course and
// converts the question objects to the shared bank format. Every item is graded by the game's own
// checkAnswer()/checkChoice() before it is kept.
const GAME = 'gaslaws';
const CH = { '3A': ['3A-8'], '1A': ['1A-9'] };
// mode -> { courses to sample, chapters per course, per-course target, skip predicate on q.mode }
const CONCEPT_MODES = ['Kinetic molecular theory', 'Real gases', 'Molecular speed']; // static CONCEPTS: already in bank
const MODES = [
  { key: 'units', slug: 'units', split: true, ch: { '3A': ['3A-8', '3A-1'], '1A': ['1A-9'] } },
  { key: 'kmt', slug: 'kmt', split: false, sampleAs: '3A' },
  { key: 'boyle', slug: 'boyle', split: true },
  { key: 'temp', slug: 'charles-gay-lussac', split: true },
  { key: 'avog', slug: 'avogadro', split: true },
  { key: 'combined', slug: 'combined', split: true },
  { key: 'ideal', slug: 'ideal', split: true },
  { key: 'stp', slug: 'stp-molar-volume', split: false, sampleAs: '3A', ch: { '3A': ['3A-8', '3A-11'], '1A': ['1A-9'] } },
  { key: 'molar', slug: 'molar-mass', split: true },
  { key: 'dalton', slug: 'partial-pressure', split: true },
  { key: 'wet', slug: 'gas-over-water', split: true },
  { key: 'stoich', slug: 'gas-stoichiometry', split: true, ch: { '3A': ['3A-11', '3A-8'], '1A': ['1A-9', '1A-4'] } },
  { key: 'rms', slug: 'rms-speed', only: '1A' },
  { key: 'graham', slug: 'graham', only: '1A' },
  { key: 'real', slug: 'van-der-waals', only: '1A' },
];

const fracRe = /<span class="fraction"><span class="num">(.*?)<\/span><span class="den">(.*?)<\/span><\/span>/g;
const clean = s => String(s == null ? '' : s)
  .replace(fracRe, '($1)/($2)')

  .replace(/<i style="background:([^"]+)"><\/i>/g, '<span style="display:inline-block;width:12px;height:12px;border-radius:50%;vertical-align:middle;margin-right:3px;background:$1"></span>')
  .replace(/<svg class="pbox"/g, '<svg class="pbox" style="max-width:300px;border:1px solid #ccc"')
  .replace(/<div class="legend">/g, '<div class="legend" style="display:flex;gap:12px">');

module.exports = async (page, ctx) => {
  const items = [];
  const byKey = new Map();
  let seed = 1000;
  for (const m of MODES) {
    const runs = m.only ? [[m.only, [m.only]]] : m.split ? [['3A', ['3A']], ['1A', ['1A']]] : [[m.sampleAs, ['3A', '1A']]];
    const perRun = m.only || !m.split ? 38 : 20;
    let index = 0;
    for (const [course, courses] of runs) {
      await ctx.seed(++seed);
      const raw = await page.evaluate(({ key, course, want, skip }) => {
        setCourse(course);
        const lvl = LEVELS.find(l => l.id === key);
        const out = [], seen = new Set();
        const vpTableHTML = '<table border="1" cellpadding="3" style="border-collapse:collapse"><tr><th>T (°C)</th><th>P<sub>H₂O</sub> (mmHg)</th></tr>' +
          Object.entries(VP).map(([t, p]) => '<tr><td>' + t + '</td><td>' + p + '</td></tr>').join('') + '</table>';
        for (let tries = 0; tries < 600 && out.length < want; tries++) {
          const q = lvl.gen();
          if (skip.includes(q.mode)) continue;
          if (seen.has(q.prompt)) continue;
          // grade the correct answer with the game's own checker
          const c = JSON.parse(JSON.stringify(q)); c.scored = 0; c.done = 0; S.q = c; S.quiz = null;
          let given;
          if (q.kind === 'choice') { byId('feedback').className = ''; checkChoice(q.answer); given = q.answer; }
          else { given = q.kind === 'abs' ? q.answer.toFixed(2) : fmt(q.answer, q.sf || 4); byId('answer').value = given; byId('feedback').className = ''; checkAnswer(); }
          const ok = /\bgood\b/.test(byId('feedback').className);
          seen.add(q.prompt);
          let visual = q.visual || '';
          if (key === 'wet') visual = /water vapor pressure table/.test(q.prompt) ? vpTableHTML : '';
          const sol = (q.guide && q.guide.length ? '<ol>' + q.guide.map(s => '<li><b>' + esc(s.title) + ':</b> ' + s.explain + '</li>').join('') + '</ol>' : '') +
            '<p>' + (q.finalExplain || 'Answer: <b>' + answerText(q) + '</b>') + '</p>';
          out.push({
            mode: q.mode, kind: q.kind, prompt: q.prompt, visual, eqn: q.equationHTML || '',
            answer: q.kind === 'choice' ? (q.options.find(o => o.key === q.answer) || {}).html : q.answer,
            choices: q.kind === 'choice' ? q.options.map(o => o.html) : null,
            unit: q.unit, sf: q.sf, tol: q.tol, hints: q.hints || [], explain: sol, ok, given,
          });
        }
        return out;
      }, { key: m.key, course, want: perRun, skip: CONCEPT_MODES });
      for (const r of raw) {
        if (!r.ok) throw new Error(`${m.key}/${course}: game checker rejected its own answer ${r.given} for: ${r.prompt.slice(0, 120)}`);
        let prompt = r.prompt;
        if (m.key === 'stoich') prompt = r.prompt + '<div>' + r.eqn + '</div>';
        if (r.visual) prompt = '<div>' + r.visual + '</div>' + prompt;
        const item = { skill: `${GAME}.${m.slug}`, courses: [...courses], chapters: [], type: null, prompt: clean(prompt) };
        if (r.kind === 'choice') { item.type = 'mc'; item.choices = r.choices.map(clean); item.answer = clean(r.answer); }
        else {
          item.type = 'number';
          item.answer = Number(Number(r.answer).toPrecision(6));
          if (r.unit && !/^\(no unit\)$/.test(r.unit)) item.unit = r.unit;
          if (r.kind === 'abs') {
            const rel = r.tol / Math.abs(r.answer);
            if (!(rel <= 0.05)) continue; // absolute-tolerance answer near zero (e.g. °C) can't map to a relative tolerance
            item.tolerance = Number(rel.toPrecision(2));
          } else { item.tolerance = 0.01; if (r.sf) item.sigfigs = r.sf; }
        }
        if (r.hints.length) item.hint = clean(r.hints.join(' '));
        item.explain = clean(r.explain);
        item.origin = 'original';
        const dk = item.skill + '|' + item.prompt + '|' + JSON.stringify(item.answer);
        if (byKey.has(dk)) { const o = byKey.get(dk); courses.forEach(c => o.courses.includes(c) || o.courses.push(c)); continue; }
        item.from = { game: GAME, list: 'sample:' + m.key, index: index++ };
        item.__ch = m.ch || CH;
        byKey.set(dk, item); items.push(item);
      }
    }
  }
  for (const it of items) { it.chapters = it.courses.flatMap(c => it.__ch[c]); delete it.__ch; }
  return items;
};
