// Sampler for "Holy Moley!" (moles). Runs the game's own Practice Quest generators (genFor) per course.
// Skipped: Mixed (mix of the others), Learn Trail stops and Skill Check Prep (they call the same generators).
// Grading carried from the game's checkAnswer():
//   sig-fig items: answer rounded to q.sf, tolerance 0.6% relative, sigfigs = q.sf
//   molar-mass items (q.dp): absolute tolerance q.tolAbs (0.015 g/mol) -> converted to relative
//   integer items: exact; formula items: text (game accepts any element order).
// Every item is re-graded by feeding the bank answer into the game's checkAnswer()/answer key.
module.exports = async (page, ctx) => {
  const PLAN = [
    // [modeKey, course, seed, tries, cap]
    ['road', '3A', 101, 400, 35], ['road', '1A', 102, 400, 35],
    ['molar', '3A', 201, 400, 35],
    ['percent', '3A', 301, 400, 35], ['percent', '1A', 302, 400, 30],
    ['formula', '3A', 401, 400, 35], ['formula', '1A', 402, 600, 40],
    ['sense', '3A', 501, 600, 35],
    ['health', '3A', 601, 400, 30], ['health', '1A', 602, 400, 15],
    ['solution', '1A', 701, 400, 35],
  ];
  const CH = { '3A': '3A-5', '1A': '1A-3' };
  const out = [], seen = new Set(), counters = {};
  for (const [mode, course, seed, tries, cap] of PLAN) {
    await ctx.seed(seed);
    // Course-dependent modes: 3A pass is valid for both courses; 1A pass tagged 1A-only.
    // Course-independent modes (molar, sense) and 1A-only Solution Lab sampled once.
    const both = course === '3A';
    const raw = await page.evaluate(({ mode, course, tries, cap }) => {
      state.course = course; state.view = 'practice'; state.mode = mode; state.stepLen = 0; state.quiz = null;
      const strip = s => String(s == null ? '' : s).replace(/^🩺\s*/, '').trim();
      const res = [], keys = new Set();
      for (let t = 0; t < tries && res.length < cap; t++) {
        const q = genFor(mode, course);
        q.kind = q.kind || 'numeric'; q.modeKey = mode; q.pickFactors = false;
        let type, answer, choices, accept, tolerance, sigfigs;
        if (q.kind === 'choice') {
          type = 'mc'; choices = q.options.map(o => o.html);
          answer = q.options.find(o => o.key === q.answer).html;
        } else if (q.kind === 'formula') {
          type = 'text'; answer = q.answer;
          const els = Object.keys(q.answerComp);
          if (els.length <= 3) {
            const perms = a => a.length <= 1 ? [a] : a.flatMap((x, i) => perms(a.filter((_, j) => j !== i)).map(p => [x, ...p]));
            accept = [...new Set(perms(els).map(p => p.map(e => e + (q.answerComp[e] > 1 ? q.answerComp[e] : '')).join('')))].filter(f => f !== answer);
          }
        } else if (q.kind === 'integer') {
          type = 'number'; answer = q.answer; tolerance = 0.001;
        } else if (q.dp != null) {
          type = 'number'; answer = q.answer; tolerance = Number(((q.tolAbs || .015) / Math.abs(q.answer)).toPrecision(2));
        } else {
          type = 'number'; answer = Number(q.answer.toPrecision(q.sf)); tolerance = 0.006; sigfigs = q.sf;
        }
        // data needed to make the prompt self-contained (Yellow Sheet atomic masses, Avogadro's number)
        const steps = q.steps || [];
        const needNA = steps.some(s => s.name === 'Avogadro’s number');
        const massTopics = ['molarMass', 'percent', 'empirical', 'empiricalPct', 'molecular', 'hydrate', 'combustion', 'molarity'];
        const needMass = steps.some(s => s.name.startsWith('Molar mass')) || massTopics.includes(q.topic);
        const els = new Set();
        if (needMass) {
          const add = c => c && Object.keys(c).forEach(e => els.add(e));
          if (q.answerComp) add(q.answerComp);
          if (q.hydData) { add(parseFormula(q.hydData.f)); add({ H: 1, O: 1 }); }
          if (q.combData) add({ C: 1, H: 1, O: 1 });
          if (!q.answerComp && !q.hydData && q.c) add(q.c.comp);
        }
        const data = [];
        if (els.size) data.push('atomic masses (g/mol): ' + [...els].map(e => e + ' ' + masses[e]).join(', '));
        if (needNA) data.push('N<sub>A</sub> = ' + NA_TEXT + ' mol⁻¹');
        let prompt = strip(q.prompt);
        if (q.dp != null) prompt += ' Report the answer to ' + q.dp + ' decimal places.';
        if (data.length) prompt += '<br><small>Use: ' + data.join('; ') + '.</small>';
        const guide = buildGuide(q).filter(s => s.explain);
        const explain = [...guide.map(s => '<b>' + s.title + ':</b> ' + s.explain), q.finalExplain, q.solutionExtra].filter(Boolean).join('<br>');
        // game's stepTip names the compound instead of the element when the subscript is 1 (e.g. CaCO3 -> Ca): fix the wording
        const hint = (q.hints || []).map(h => q.el && q.c ? h.replace('mol of ' + plainF(q.c.f) + ' atoms', 'mol of ' + q.el + ' atoms') : h).join(' ');
        const key = prompt + '|' + JSON.stringify(answer);
        if (keys.has(key)) continue; keys.add(key);
        // ---- verify with the game's own checker ----
        let ok;
        if (type === 'mc') ok = choices.indexOf(answer) === q.options.findIndex(o => o.key === q.answer);
        else {
          const str = type === 'text' ? answer : (sigfigs ? answer.toExponential(sigfigs - 1) : String(answer));
          state.q = q; q.scored = false; q.alts = mistakeAlternatives(q); q.guide = buildGuide(q);
          byId('answer').value = str; byId('feedback').className = 'feedback';
          checkAnswer();
          ok = byId('feedback').className.includes('good');
          if (ok && accept) for (const a of accept) { q.scored = false; byId('answer').value = a; byId('feedback').className = 'feedback'; checkAnswer(); if (!byId('feedback').className.includes('good')) ok = false; }
        }
        // independent check for empirical/molecular-from-data items: the mole ratios in the prompt data must reproduce the answer
        if (ok && q.empData) { const { els, ratio, mult } = q.empData, base = q.molecData ? Object.fromEntries(Object.entries(q.answerComp).map(([e, n]) => [e, n / q.molecData.k])) : q.answerComp;
          const g = Object.values(base).reduce(gcd); if (!els.every((e, i) => Math.abs(ratio[i] * mult - base[e] / g) < 0.1)) ok = false; }
        res.push({ type, prompt, choices, answer, accept: accept && accept.length ? accept : undefined, unit: type === 'number' && q.unit ? String(q.unit).replace(/<[^>]+>/g, '') : undefined,
          tolerance, sigfigs, hint: hint || undefined, explain: explain || undefined, ok, sub: q.topic });
      }
      return res;
    }, { mode, course, tries, cap });
    for (const r of raw) {
      if (!r.ok) throw new Error(`game checker rejected ${mode}/${course}: ${r.prompt} -> ${r.answer}`);
      const k = r.prompt + '|' + JSON.stringify(r.answer);
      if (seen.has(k)) continue; seen.add(k);
      const only1A = !both || mode === 'solution' || ['hydrate', 'combustion'].includes(r.sub);
      const it = { skill: 'moles.' + mode, courses: only1A ? ['1A'] : ['3A', '1A'], chapters: only1A ? [CH['1A']] : [CH['3A'], CH['1A']],
        type: r.type, prompt: r.prompt };
      if (r.choices) it.choices = r.choices;
      it.answer = r.answer;
      for (const f of ['accept', 'unit', 'tolerance', 'sigfigs', 'hint', 'explain']) if (r[f] !== undefined) it[f] = r[f];
      it.origin = 'original';
      counters[mode] = counters[mode] || 0;
      it.from = { game: 'moles', list: 'sample:' + mode, index: counters[mode]++ };
      out.push(it);
    }
  }
  return out;
};
