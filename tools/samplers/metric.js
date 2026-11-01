// Sampler for "SI Prefix Challenge" (metric). Uses the game's own newQuestion() (all six question types on)
// under each course setting (#courseToggle -> updateCourse()), and reads currentPrefix / currentQuestionType
// plus the question text the game writes to the page.
// The whole pool is 13 prefixes x 6 types, so every distinct item is kept (no cap).
// Courses: CHEM 3A uses tera..nano, CHEM 1A tera..femto. A prefix in the 3A range is tagged 3A+1A;
// pico and femto are 1A-only.
// Grading: every answer and accept spelling is fed back through the game's own checkAnswer().
// QB.check() compares text case-insensitively, so where a symbol answer could collide with another
// prefix's symbol in a different case (m milli / M mega) the item is mc (choices without the twin)
// and the symbol is left out of the name-or-symbol accept lists.
module.exports = async (page, ctx) => {
  const SKILL = {
    prefixToNumber: 'metric.prefixtonumber', symbolToNumber: 'metric.symboltonumber',
    prefixToSymbol: 'metric.prefixtosymbol', symbolToPrefix: 'metric.symboltoprefix',
    scientificToPrefix: 'metric.scientifictoprefix', standardToPrefix: 'metric.standardtoprefix',
  };
  const ORDER = Object.keys(SKILL);
  const raw = {};
  let seed = 11;
  for (const course of ['CHEM3A', 'CHEM1A']) {
    await ctx.seed(seed++);
    const got = await page.evaluate((course) => {
      const t = document.getElementById('courseToggle');
      t.checked = course === 'CHEM1A';
      updateCourse();
      const out = [];
      for (let i = 0; i < 1500; i++) {
        newQuestion();
        out.push({
          type: currentQuestionType, name: currentPrefix.name, symbol: currentPrefix.symbol, exponent: currentPrefix.exponent,
          label: document.getElementById('questionLabel').textContent,
          display: document.getElementById('questionDisplay').textContent,
          instruction: document.getElementById('instruction').textContent,
          explain: getCompleteAnswer(),
          active: getActivePrefixes().map(p => p.name),
        });
      }
      return out;
    }, course);
    for (const q of got) {
      const k = q.type + '|' + q.name;
      if (!raw[k]) raw[k] = { ...q, courses: new Set() };
      raw[k].courses.add(course);
    }
  }

  // course tagging by the game's own active-prefix lists
  const active = await page.evaluate(() => {
    const r = {};
    for (const c of ['CHEM3A', 'CHEM1A']) { currentCourse = c; r[c] = getActivePrefixes().map(p => p.name); }
    return r;
  });
  const all = await page.evaluate(() => allPrefixes);
  const lowerTwin = sym => all.some(p => p.symbol !== sym && p.symbol.toLowerCase() === sym.toLowerCase());

  const items = [];
  const sorted = Object.values(raw).sort((a, b) => ORDER.indexOf(a.type) - ORDER.indexOf(b.type) || b.exponent - a.exponent);
  for (const q of sorted) {
    const in3A = active.CHEM3A.includes(q.name);
    const courses = in3A ? ['3A', '1A'] : ['1A'];
    const chapters = in3A ? ['3A-1', '1A-1'] : ['1A-1'];
    const base = `${q.label} <strong>${q.display}</strong>`;
    const it = { skill: SKILL[q.type], courses, chapters };
    const microAlt = q.name === 'micro' ? ['μ', 'u'] : [];
    if (q.type === 'prefixToNumber' || q.type === 'symbolToNumber') {
      Object.assign(it, {
        type: 'number',
        prompt: base + (q.type === 'symbolToNumber' ? ' (symbols are case-sensitive)' : '') +
          '<br>Enter the numerical value, e.g. 1 × 10^-3 or 0.001.',
        answer: Number('1e' + q.exponent), tolerance: 0.001,
      });
    } else if (q.type === 'prefixToSymbol') {
      it.prompt = base + '<br>Enter the SI prefix symbol (symbols are case-sensitive).';
      if (lowerTwin(q.symbol)) {
        // mc: nearest prefixes as distractors, never the case twin
        const pool = all.filter(p => p.name !== q.name && !lowerTwin(p.symbol) && (in3A ? active.CHEM3A : active.CHEM1A).includes(p.name))
          .sort((a, b) => Math.abs(a.exponent - q.exponent) - Math.abs(b.exponent - q.exponent) || b.exponent - a.exponent)
          .slice(0, 3);
        const ch = [...pool, all.find(p => p.name === q.name)].sort((a, b) => b.exponent - a.exponent).map(p => p.symbol);
        Object.assign(it, { type: 'mc', prompt: base + '<br>Choose the SI prefix symbol (symbols are case-sensitive).', choices: ch, answer: q.symbol });
      } else {
        Object.assign(it, { type: 'text', answer: q.symbol });
        if (microAlt.length) it.accept = microAlt;
      }
    } else if (q.type === 'symbolToPrefix') {
      Object.assign(it, { type: 'text', prompt: base + ' (symbols are case-sensitive)<br>Enter the SI prefix name.', answer: q.name });
    } else {
      const acc = lowerTwin(q.symbol) ? [] : [q.symbol, ...microAlt];
      Object.assign(it, {
        type: 'text',
        prompt: base + (lowerTwin(q.symbol) ? '<br>Enter the SI prefix name.' : '<br>Enter the SI prefix name or symbol.'),
        answer: q.name,
      });
      if (acc.length) it.accept = acc;
    }
    it.explain = q.explain;
    it.origin = 'original';
    it.from = { game: 'metric', list: 'sample:' + q.type, index: 0 };
    it._q = q;
    items.push(it);
  }
  const idx = {};
  items.forEach(it => { it.from.index = idx[it.skill] = (idx[it.skill] ?? -1) + 1; });

  // Verify with the game's checkAnswer(): answer + every accept must be graded correct.
  const tests = items.map(it => ({
    type: it._q.type, name: it._q.name, course: it.courses.includes('3A') ? 'CHEM3A' : 'CHEM1A',
    responses: [String(it.answer), ...(it.accept || [])],
  }));
  const bad = await page.evaluate((tests) => {
    const fails = [];
    for (const t of tests) {
      currentCourse = t.course;
      for (const r of t.responses) {
        currentPrefix = allPrefixes.find(p => p.name === t.name);
        currentQuestionType = t.type;
        questionAnswered = false;
        document.getElementById('answer').value = r;
        checkAnswer();
        if (!document.getElementById('feedback').className.includes('correct')) fails.push(t.type + ' ' + t.name + ' <- ' + r);
      }
    }
    return fails;
  }, tests);
  if (bad.length) throw new Error('game rejected bank answers:\n' + bad.join('\n'));
  items.forEach(it => delete it._q);
  return items;
};
