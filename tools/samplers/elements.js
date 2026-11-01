// Sampler for "Element Study Lab" (elements). Fixed list: all 39 ELEMENTS (Combined Study Set), both directions.
// Uses the game's own newQuestion() with Order = Atomic Number and Direction fixed, so it walks every element once.
// Prompt carries the atomic-number line the game shows. Hint = the game's showHint() text.
// Grading: the game's checkAnswer() (symbol exact, case-sensitive; names case-insensitive) is run on every answer.
// accept adds British spellings (aluminium, sulphur) that the game itself does not accept.
// Note: QB.check() is case-insensitive, so the bank will also accept e.g. "fe" for Fe (no element symbols collide
// case-insensitively, so it never accepts a different element).
module.exports = async (page, ctx) => {
  const ALT = { Aluminum: ['aluminium'], Sulfur: ['sulphur'], Cesium: ['caesium'] };
  const DIRS = [['nameToSymbol', 'elements.nametosymbol'], ['symbolToName', 'elements.symboltoname']];
  const items = [];
  for (const [dir, skill] of DIRS) {
    await ctx.seed(dir === 'nameToSymbol' ? 21 : 22);
    const got = await page.evaluate((dir) => {
      els.setSelect.value = 'combined'; els.directionSelect.value = dir; els.orderSelect.value = 'atomic';
      atomicIndex = 0;
      const out = [];
      for (let i = 0; i < ELEMENTS.length; i++) {
        newQuestion();
        const q = { dir: currentDirection, z: current.z, name: current.name, symbol: current.symbol,
          shown: els.questionText.textContent, atomicLine: els.atomicLine.textContent };
        showHint();
        q.hint = els.feedback.querySelector('span').innerHTML.replace(/^Hint:\s*/, '');
        // grade the expected answer with the game's own checker
        const ans = dir === 'nameToSymbol' ? current.symbol : current.name;
        els.answerInput.value = ans;
        checkAnswer();
        q.ok = els.feedback.className.includes('good');
        q.explain = els.feedback.querySelector('.small').textContent;
        out.push(q);
      }
      return out;
    }, dir);
    got.forEach((q, i) => {
      if (!q.ok) throw new Error('game rejected ' + q.name);
      const it = { skill, courses: ['3A', '1A'], chapters: ['3A-2', '1A-2'], type: 'text' };
      if (dir === 'nameToSymbol') {
        it.prompt = `What is the symbol for <strong>${q.shown}</strong>? (${q.atomicLine})<br>Symbol capitalization counts.`;
        it.answer = q.symbol;
      } else {
        it.prompt = `What element has the symbol <strong>${q.shown}</strong>? (${q.atomicLine})`;
        it.answer = q.name;
        if (ALT[q.name]) it.accept = ALT[q.name];
      }
      Object.assign(it, { hint: q.hint, explain: q.explain, origin: 'original', from: { game: 'elements', list: 'sample:' + dir, index: i } });
      items.push(it);
    });
  }
  return items;
};
