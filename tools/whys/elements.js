// Per-choice feedback rules for the elements game (used by tools/samplers/elements.js and, via whys.js, by the game itself).
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
module.exports = elementWhy;
