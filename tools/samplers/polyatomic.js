// Sampler for "Polyatomic Ion Practice" (polyatomic). Fixed list: all 30 Green Sheet ions, both directions.
// Uses the game's own buildDeck() with Ion set = all and the mode fixed to each direction, then showQuestion()
// for every card to read the prompt the game shows.
// Skipped: "Mixed" mode (same 30 ions, random direction per card = union of the two sampled modes).
// accept: Name -> Formula lists every plain-text form the game's formulaVariants() accepts for each listed formula
// (e.g. SO4^2-, SO42-, SO4-2, SO4^-2 ...; acetate also CH3COO^-). Formula -> Name lists the game's name variants
// plus spaced-paren forms the game's normalizeName() also takes.
// Grading: every answer and accept string is passed through the game's isFormulaCorrect()/isNameCorrect() and must
// pass for its own ion; it is also checked (case-insensitively, as QB.check() compares) not to match any other ion.
module.exports = async (page, ctx) => {
  const DIRS = [['nameToFormula', 'polyatomic.nametoformula'], ['formulaToName', 'polyatomic.formulatoname']];
  const items = [];
  for (const [dir, skill] of DIRS) {
    await ctx.seed(dir === 'nameToFormula' ? 31 : 32);
    const res = await page.evaluate((dir) => {
      modeSelect.value = dir; groupSelect.value = 'all';
      startSession();
      const out = [];
      const fails = [];
      for (let i = 0; i < deck.length; i++) {
        currentIndex = i; showQuestion();
        const ion = currentQuestion.ion;
        let answer, accept;
        if (dir === 'nameToFormula') {
          answer = plainFormula(ion.formulas[0]);
          accept = [];
          ion.formulas.forEach(f => formulaVariants(f).forEach(v => accept.push(v)));
        } else {
          answer = ion.name;
          accept = [...ion.names];
          ion.names.filter(n => /\(/.test(n)).forEach(n => accept.push(n.replace('(', ' (')));
        }
        accept = [...new Set(accept)].filter(a => a !== answer);
        for (const r of [answer, ...accept]) {
          const ok = dir === 'nameToFormula' ? isFormulaCorrect(r, ion) : isNameCorrect(r, ion);
          if (!ok) fails.push(ion.name + ' <- ' + r);
          for (const other of ions) if (other !== ion) {
            const lc = s => s.toLowerCase();
            const clash = dir === 'nameToFormula'
              ? other.formulas.some(f => [...formulaVariants(f)].some(v => lc(v) === lc(r)))
              : other.names.some(n => normalizeName(n) === normalizeName(r));
            if (clash) fails.push('clash ' + ion.name + ' / ' + other.name + ' <- ' + r);
          }
        }
        out.push({
          name: ion.name, html: ion.html, answer, accept, note: ion.displayNoteHtml || '',
          label: promptLabel.textContent, shown: prompt.innerHTML,
        });
      }
      return { out, fails };
    }, dir);
    if (res.fails.length) throw new Error('polyatomic check failed:\n' + res.fails.join('\n'));
    // keep the Green Sheet order (deck is shuffled) so indices are stable and readable
    const order = await page.evaluate(() => ions.map(i => i.name));
    res.out.sort((a, b) => order.indexOf(a.name) - order.indexOf(b.name));
    res.out.forEach((q, i) => {
      const it = { skill, courses: ['3A', '1A'], chapters: ['3A-4', '1A-2'], type: 'text' };
      if (dir === 'nameToFormula') {
        it.prompt = `Write the formula, with its charge, for the <strong>${q.name}</strong> ion.<br>Type it like SO4^2- (element symbols are case-sensitive).`;
      } else {
        it.prompt = `Name this ion: <strong>${q.html}</strong>`;
      }
      it.answer = q.answer;
      if (q.accept.length) it.accept = q.accept;
      it.explain = `${q.name} = ${q.html}` + (q.note ? `. ${q.note}.` : '');
      Object.assign(it, { origin: 'original', from: { game: 'polyatomic', list: 'sample:' + dir, index: i } });
      items.push(it);
    });
  }
  return items;
};
