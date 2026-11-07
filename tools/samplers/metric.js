// Sampler for "Prefix Power-Up" (metric; was "SI Prefix Challenge"). Uses the game's own generate(topic, {course})
// for every topic, under each course, and grades every bank answer back through the question's own check().
// Prefix topics (the six original question types): every active prefix is asked once per type and course
//   (o.prefix forces the prefix), so the pool is complete. CHEM 3A uses tera..pico, CHEM 1A tera..femto:
//   a prefix in the 3A range is tagged 3A+1A; femto is 1A-only.
// Conversion topics: random, so up to CAP distinct items per topic and course. An item made under 3A is tagged 3A+1A
//   (1A covers everything 3A does) unless the topic is a 3A-only health topic (iv, dose); one made only under 1A is 1A.
// Grading: QB.check() compares text case-insensitively unless caseSensitive is set. Symbol answers (prefixToSymbol)
// are caseSensitive. For name-or-symbol answers the symbol is left out of accept when it has a case twin (m milli / M mega).
module.exports = async (page, ctx) => {
  const CAP = 30;
  const PREFIX_TYPES = ['prefixToNumber', 'symbolToNumber', 'prefixToSymbol', 'symbolToPrefix', 'scientificToPrefix', 'standardToPrefix'];
  const raw = {};
  let seed = 11;
  for (const course of ['3A', '1A']) {
    await ctx.seed(seed++);
    const got = await page.evaluate(({ course, PREFIX_TYPES, CAP }) => {
      window.__qs = window.__qs || [];
      const out = [];
      const strip = s => String(s);
      const keep = (q) => {
        const id = window.__qs.push(q) - 1;
        out.push({
          id, topic: q.topic, skill: TOPICS[q.topic].skill, kind: q.kind, eq: strip(q.eq), prompt: strip(q.prompt), story: !!q.story,
          value: q.value, answerText: q.answerText, accept: q.accept || [], caseSensitive: !!q.caseSensitive, symAlso: q.symAlso || null,
          answer: q.answer, answerPlain: q.answerPlain || null, unit: q.unit || '', toU: q.toU || '', hint: q.hint, solution: q.solution,
          prefix: q.p ? q.p.name : null, health: !!(q.flags && q.flags.health),
        });
      };
      for (const t of PREFIX_TYPES) for (const p of getActivePrefixes(course)) keep(generate(t, { course, prefix: p.name }));
      for (const t of Object.keys(TOPICS)) {
        if (PREFIX_TYPES.includes(t)) continue;
        if (TOPICS[t].courses && !TOPICS[t].courses.includes(course)) continue;
        const seen = new Set();
        for (let i = 0; i < 600 && seen.size < CAP; i++) {
          const q = generate(t, { course });
          const k = q.eq + '|' + q.prompt;
          if (seen.has(k)) continue;
          seen.add(k); keep(q);
        }
      }
      return out;
    }, { course, PREFIX_TYPES, CAP });
    for (const q of got) {
      const k = q.topic + '|' + q.eq + '|' + q.prompt;
      if (!raw[k]) raw[k] = { ...q, courses: new Set() };
      raw[k].courses.add(course);
    }
  }

  const all = await page.evaluate(() => allPrefixes);
  const in3A = await page.evaluate(() => getActivePrefixes('3A').map(p => p.name));
  const caseTwin = sym => all.some(p => p.symbol !== sym && p.symbol.toLowerCase() === sym.toLowerCase());
  const TOPIC_ORDER = await page.evaluate(() => Object.keys(TOPICS));

  const items = [];
  const sorted = Object.values(raw).sort((a, b) => TOPIC_ORDER.indexOf(a.topic) - TOPIC_ORDER.indexOf(b.topic));
  for (const q of sorted) {
    let courses;
    if (q.prefix) courses = in3A.includes(q.prefix) ? ['3A', '1A'] : ['1A'];
    else if (q.health) courses = ['3A'];
    else courses = q.courses.has('3A') ? ['3A', '1A'] : ['1A'];
    const chapters = courses.map(c => c + '-1');
    const prompt = q.story ? `${q.eq} ${q.prompt}` : q.toU ? `Convert <strong>${q.eq}</strong> to <b>${q.toU}</b>.` : `${q.prompt} <strong>${q.eq}</strong>`;
    const it = { skill: q.skill, courses, chapters, prompt, hint: q.hint, explain: q.solution };
    const tests = [];
    if (q.kind === 'num') {
      Object.assign(it, { type: 'number', answer: q.value, tolerance: 0.001 });
      if (q.unit && !q.prefix) it.unit = q.unit.replace(/<sup>(\d)<\/sup>/g, (m, d) => '⁰¹²³⁴⁵⁶⁷⁸⁹'[d]);
      it.prompt += q.prefix ? '<br>Enter the number, e.g. 1 × 10^-3 or 0.001.' : '<br>Enter the number, e.g. 4.5E-6 or 0.0045.';
      tests.push(q.answerPlain || String(q.value), String(q.value));
    } else if (q.topic === 'prefixToSymbol') {
      Object.assign(it, { type: 'text', answer: q.answerText, caseSensitive: true });
      if (q.accept.length) it.accept = q.accept;
      tests.push(q.answerText, ...q.accept);
    } else if (q.topic === 'symbolToPrefix') {
      Object.assign(it, { type: 'text', answer: q.answerText });
      if (q.accept.length) it.accept = q.accept;
      tests.push(q.answerText, ...q.accept);
    } else {
      // name or symbol; drop a symbol that has a case twin (QB.check is case-insensitive here)
      const acc = q.accept.filter(a => !(a === q.symAlso && caseTwin(a)));
      Object.assign(it, { type: 'text', answer: q.answerText });
      if (acc.length) it.accept = acc;
      if (q.symAlso && caseTwin(q.symAlso)) it.prompt = it.prompt.replace('Type the <b>name</b> or the <b>symbol</b>.', 'Type the <b>name</b>.');
      tests.push(q.answerText, ...acc);
    }
    it.origin = 'original';
    it.from = { game: 'metric', list: 'sample:' + q.topic, index: 0 };
    it._t = { id: q.id, tests };
    items.push(it);
  }
  const idx = {};
  items.forEach(it => { it.from.index = idx[it.skill] = (idx[it.skill] ?? -1) + 1; });

  // Verify with the game's own check(): the answer and every accept must be graded correct.
  const bad = await page.evaluate((tests) => {
    const fails = [];
    for (const t of tests) for (const r of t.tests) { const res = window.__qs[t.id].check(r); if (!res.ok) fails.push(window.__qs[t.id].topic + ' ' + window.__qs[t.id].eq + ' <- ' + r); }
    return fails;
  }, items.map(it => it._t));
  if (bad.length) throw new Error('game rejected bank answers:\n' + bad.slice(0, 30).join('\n'));
  items.forEach(it => delete it._t);
  return items;
};
