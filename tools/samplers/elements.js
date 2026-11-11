// Sampler for "Symbol Safari" (elements, formerly Element Symbol Study Lab).
// Fixed lists, one item per element, built with the game's own generate(topic, {el, course, variant}):
//   elements.nametosymbol / elements.symboltoname : every ELEMENTS entry (first 20 + health set = 3A and 1A; CHEM 1A additions = 1A only)
//   elements.tricky : the 11 tricky symbols, "which name does the symbol come from" (multiple choice)
//   elements.where  : family name, metal/nonmetal/metalloid, group and period (multiple choice)
//   elements.ions   : common (predictable) ion of an element (multiple choice)
// Grading: every expected answer is run through the game's own q.check() (symbols case-sensitive; names accept
// aluminium/sulphur/caesium). The game's mistake catchers are self-tested too (capitalization, latin-symbol, look-alike).

// ---------- Per-choice feedback ("why") for the multiple-choice items, from each item's own facts ----------
const FAM_GROUP = { 'Alkali metals': 'group 1 (1A)', 'Alkaline earth metals': 'group 2 (2A)', 'Transition metals': 'groups 3–12 (the B groups)', 'Pnictogens': 'group 15 (5A)', 'Chalcogens': 'group 16 (6A)', 'Halogens': 'group 17 (7A)', 'Noble gases': 'group 18 (8A)' };
const LATIN = { hydrargyrum: ['Hg', 'mercury'], ferrum: ['Fe', 'iron'], cuprum: ['Cu', 'copper'], stannum: ['Sn', 'tin'], natrium: ['Na', 'sodium'], kalium: ['K', 'potassium'], argentum: ['Ag', 'silver'], aurum: ['Au', 'gold'], plumbum: ['Pb', 'lead'], stibium: ['Sb', 'antimony'], wolfram: ['W', 'tungsten'] };
const SUPN = { '⁰': 0, '¹': 1, '²': 2, '³': 3, '⁴': 4, '⁵': 5, '⁶': 6, '⁷': 7, '⁸': 8, '⁹': 9 };
const ionCharge = t => { const m = String(t).match(/([⁰¹²³⁴⁵⁶⁷⁸⁹]*)([⁺⁻])$/); if (!m) return null; return (m[1] ? +[...m[1]].map(c => SUPN[c]).join('') : 1) * (m[2] === '⁺' ? 1 : -1); };
const stripTags = x => String(x == null ? '' : x).replace(/<[^>]+>/g, '');
function elementWhy(q) {
  const p = stripTags(q.prompt), ex = q.explain || '', name = (p.match(/\b([a-z]+) \(([A-Z][a-z]?)\)/) || []), el = name[1], sym = name[2];
  const El = el ? el.charAt(0).toUpperCase() + el.slice(1) : '';
  const one = f => q.choices.map(c => c === q.answer ? '' : f(c));
  if (q.skill === 'elements.tricky') return one(c => LATIN[c] ? `${c.charAt(0).toUpperCase() + c.slice(1)} is the old name behind ${LATIN[c][0]}, the symbol for ${LATIN[c][1]}.` : '');
  if (/family is/.test(p)) return one(c => FAM_GROUP[c] ? `${c} are ${FAM_GROUP[c]}. ${ex}` : '');
  if (/metal, a nonmetal, or a metalloid/.test(p)) return one(c => c === 'Metal' ? `Metals are left of the staircase line${sym === 'H' ? '' : ' (hydrogen is the exception)'}. ${ex}`
    : c === 'Metalloid' ? `Metalloids touch the staircase line: B, Si, Ge, As, Sb and Te. ${ex}` : c === 'Nonmetal' ? `Nonmetals are right of the staircase line, plus hydrogen. ${ex}` : '');
  if (/Where is/.test(p)) {
    const rg = q.answer.match(/Group (\d+), period (\d+)/); if (!rg) return;
    return one(c => { const m = c.match(/Group (\d+), period (\d+)/); if (!m) return '';
      const [g, pe] = [m[1], m[2]], [G, P] = [rg[1], rg[2]];
      if (g === P && pe === G) return `Group and period are swapped. The group is the column (${G}); the period is the row (${P}).`;
      if (g === G) return `Right group, wrong period. The period is the row, and ${El.toLowerCase()} is in row ${P}.`;
      if (pe === P) return `Right period, wrong group. The group is the column, and ${El.toLowerCase()} is in column ${G}.`;
      return `${El} is in group ${G} (column) and period ${P} (row).`; });
  }
  if (q.skill === 'elements.ions') {
    const right = ionCharge(q.answer); if (right == null) return;
    const metal = right > 0, n = Math.abs(right);
    return one(c => { const z = ionCharge(c); if (z == null) return '';
      if (Math.sign(z) !== Math.sign(right)) return metal ? `${El} is a metal, and metals lose electrons to form positive ions, not negative ones.` : `${El} is a nonmetal, and nonmetals gain electrons to form negative ions, not positive ones.`;
      return metal ? `${El} usually loses ${n} electron${n === 1 ? '' : 's'}, not ${Math.abs(z)}. ` + (/^(Zn|Cd|Ag)$/.test(sym) ? 'Zn, Cd and Ag are the transition metals with one predictable ion: Zn²⁺, Cd²⁺ and Ag⁺.' : 'Check its group: main-group metals lose all their valence electrons.') : `${El} gains ${n} electron${n === 1 ? '' : 's'}, not ${Math.abs(z)}: 8 minus its ${8 - n} valence electrons fills its octet.`; });
  }
}

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
