// Sampler for "Symbol Safari" (elements, formerly Element Symbol Study Lab).
// Fixed lists, one item per element, built with the game's own generate(topic, {el, course, variant}):
//   elements.nametosymbol / elements.symboltoname : every ELEMENTS entry (first 20 + health set = 3A and 1A; CHEM 1A additions = 1A only)
//   elements.tricky : the 11 tricky symbols, "which name does the symbol come from" (multiple choice)
//   elements.where  : family name, metal/nonmetal/metalloid, group and period (multiple choice)
//   elements.ions   : common (predictable) ion of an element (multiple choice)
// Grading: every expected answer is run through the game's own q.check() (symbols case-sensitive; names accept
// aluminium/sulphur/caesium). The game's mistake catchers are self-tested too (capitalization, latin-symbol, look-alike).

const elementWhy = require('../whys/elements');
module.exports = async (page, ctx) => {
  await ctx.seed(21);
  const got = await page.evaluate(() => {
    const SUP = { '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴', '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹', '+': '⁺', '−': '⁻', '-': '⁻' };
    const plain = h => String(h).replace(/<sup>(.*?)<\/sup>/g, (m, x) => [...x].map(c => SUP[c] || c).join('')).replace(/<span class="sub">.*?<\/span>/g, '').replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
    const in3A = new Set(courseScope('3A').map(e => e.symbol));
    const out = { text: [], mc: [], problems: [] };
    // self-tests of the mistake catchers
    const el = s => ELEMENTS.find(e => e.symbol === s);
    [['co', 'Co', 'capitalization'], ['CO', 'Co', 'capitalization'], ['So', 'Na', 'latin-symbol'], ['P', 'K', 'latin-symbol'], ['Ir', 'Fe', 'latin-symbol'], ['Si', 'S', 'look-alike'], ['Sn', 'S', 'look-alike'], ['Po', 'P', 'look-alike'], ['K', 'P', 'look-alike']].forEach(([typed, s, slip]) => {
      const r = checkSymbol(typed, el(s)); if (r.ok || r.slip !== slip) out.problems.push(`checkSymbol(${typed}, ${s}) gave ${r.ok ? 'ok' : r.slip}, expected ${slip}`);
    });
    if (!/carbon monoxide/.test(checkSymbol('CO', el('Co')).note)) out.problems.push('CO/Co note missing carbon monoxide');
    [['aluminium', 'Al'], ['sulphur', 'S'], ['caesium', 'Cs'], ['ALUMINUM', 'Al']].forEach(([typed, s]) => { if (!checkName(typed, el(s)).ok) out.problems.push(`checkName(${typed}) rejected`); });
    if (checkName('silicon', el('S')).slip !== 'look-alike') out.problems.push('silicon for S not a look-alike');
    ELEMENTS.forEach(e => {
      const courses = in3A.has(e.symbol) ? ['3A', '1A'] : ['1A'];
      const a = generate('n2s', { el: e, course: courses[0] });
      if (!a.check(e.symbol).ok) out.problems.push('game rejected symbol ' + e.symbol);
      if (e.symbol.length === 2 && a.check(e.symbol.toUpperCase()).ok) out.problems.push('game accepted all-caps ' + e.symbol);
      out.text.push({ dir: 'nameToSymbol', z: e.z, name: e.name, symbol: e.symbol, courses, hint: a.hint, explain: a.explain });
      const b = generate('s2n', { el: e, course: courses[0] });
      if (!b.check(e.name).ok) out.problems.push('game rejected name ' + e.name);
      (b.accept || []).forEach(x => { if (!b.check(x).ok) out.problems.push('game rejected ' + x); });
      out.text.push({ dir: 'symbolToName', z: e.z, name: e.name, symbol: e.symbol, courses, accept: b.accept || [], hint: b.hint, explain: b.explain });
    });
    const mc = (skill, q, prompt, courses, chapters) => {
      const choices = q.choices.map(c => plain(c.html)), answer = plain(q.choices.find(c => c.ok).html);
      if (q.choices.filter(c => c.ok).length !== 1) out.problems.push(skill + ': not exactly one right choice for ' + prompt);
      out.mc.push({ skill, prompt, choices, answer, courses, chapters, hint: plain(q.hint), explain: plain(q.solution) });
    };
    TRICKY.forEach(s => {
      const e = el(s), q = generate('latinorigin', { el: e, variant: 'word', course: '1A' });
      mc('elements.tricky', q, `The symbol <strong>${s}</strong> for ${e.name.toLowerCase()} comes from which name?`, in3A.has(s) ? ['3A', '1A'] : ['1A'], in3A.has(s) ? ['3A-2', '1A-2'] : ['1A-2']);
    });
    ELEMENTS.forEach(e => {
      const s = e.symbol, both = in3A.has(s), f = familyOf(s);
      const ch = both ? ['3A-2', '1A-2'] : ['1A-2'], cs = both ? ['3A', '1A'] : ['1A'];
      if (f) {
        const only1A = FAMILIES[f].only1A || !both, q = generate('family', { el: e, variant: 'name', course: only1A ? '1A' : '3A' });
        mc('elements.where', q, `Which family is <strong>${e.name.toLowerCase()} (${s})</strong> in?`, only1A ? ['1A'] : cs, only1A ? ['1A-2'] : ch);
      }
      if (!TYPE_UNCLEAR.has(s)) mc('elements.where', generate('mtype', { el: e, course: '1A' }), `Is <strong>${e.name.toLowerCase()} (${s})</strong> a metal, a nonmetal, or a metalloid?`, cs, ch);
      mc('elements.where', generate('gp', { el: e, course: '1A' }), `Where is <strong>${e.name.toLowerCase()} (${s})</strong> on the periodic table? (group = column, period = row)`, cs, ch);
      if (ION_CHARGE[s] !== undefined) mc('elements.ions', generate('ions', { el: e, course: '1A' }), `What ion does <strong>${e.name.toLowerCase()} (${s})</strong> usually form?`, cs, both ? ['3A-2', '3A-4', '1A-2'] : ['1A-2']);
    });
    return out;
  });
  if (got.problems.length) throw new Error('elements sampler: ' + got.problems.slice(0, 5).join('; '));
  const items = [];
  got.text.forEach((q, i) => {
    const it = { skill: q.dir === 'nameToSymbol' ? 'elements.nametosymbol' : 'elements.symboltoname', courses: q.courses, chapters: q.courses.length > 1 ? ['3A-2', '1A-2'] : ['1A-2'], type: 'text' };
    if (q.dir === 'nameToSymbol') {
      it.prompt = `What is the symbol for <strong>${q.name}</strong>? (Atomic number ${q.z})<br>Symbol capitalization counts.`;
      it.answer = q.symbol; it.caseSensitive = true;
    } else {
      it.prompt = `What element has the symbol <strong>${q.symbol}</strong>? (Atomic number ${q.z})`;
      it.answer = q.name;
      if (q.accept.length) it.accept = q.accept;
    }
    Object.assign(it, { hint: q.hint.replace(/^Hint:\s*/, ''), explain: q.explain, origin: 'original', from: { game: 'elements', list: 'sample:' + q.dir, index: i } });
    items.push(it);
  });
  got.mc.forEach((q, i) => { const why = elementWhy(q); items.push({ skill: q.skill, courses: q.courses, chapters: q.chapters, type: 'mc', prompt: q.prompt, choices: q.choices, answer: q.answer, why: why && why.some(Boolean) ? why : undefined, hint: q.hint, explain: q.explain, origin: 'original', from: { game: 'elements', list: 'sample:' + q.skill.split('.')[1], index: i } }); });
  return items;
};
