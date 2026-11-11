// Per-choice feedback rules for the functionalgroups game (used by tools/samplers/functionalgroups.js and, via whys.js, by the game itself).
// ---------- Per-choice feedback ("why"), from functional-group definitions and IUPAC naming rules ----------
const plainT = x => String(x == null ? '' : x).replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/&quot;/g, '"').replace(/\s+/g, ' ').trim();
const GDEF = { 'Alkane': 'only C–C single bonds (and C–H bonds)', 'Alkene': 'a C=C double bond', 'Alkyne': 'a C≡C triple bond', 'Alkyl halide': 'a halogen (F, Cl, Br or I) on a carbon',
  'Aromatic ring': 'a benzene ring: six carbons with alternating double bonds', 'Alcohol': 'an –OH on a carbon with only single bonds', 'Phenol': 'an –OH directly on a benzene ring carbon',
  'Ether': 'an O between two carbons (C–O–C) and no C=O', 'Aldehyde': 'a C=O at the end of a chain with an H on the carbonyl carbon (–CHO)', 'Ketone': 'a C=O with a carbon on each side',
  'Carboxylic acid': 'a –COOH: C=O and –OH on the same carbon', 'Ester': 'a C=O attached to –O–C (–COO–)', 'Amine': 'an N bonded only by single bonds to C and H (no C=O on it)', 'Amide': 'a C=O attached directly to N (–CON)' };
const ROOT = { meth: 1, eth: 2, prop: 3, but: 4, pent: 5, hex: 6, hept: 7, oct: 8, non: 9, dec: 10 };
const CLASS = [[/oic acid$/, 'Carboxylic acid', '-oic acid'], [/oate$/, 'Ester', '-oate'], [/amide$/, 'Amide', '-amide'], [/amine$/, 'Amine', '-amine'], [/ol$/, 'Alcohol', '-ol'], [/al$/, 'Aldehyde', '-al'], [/one$/, 'Ketone', '-one'],
  [/oxy/, 'Ether', 'alkoxy (-oxy) prefix'], [/yne$/, 'Alkyne', '-yne'], [/ene$/, 'Alkene', '-ene'], [/(fluoro|chloro|bromo|iodo)/, 'Alkyl halide', 'halo prefix'], [/benzene$/, 'Aromatic ring', 'benzene'], [/ane$/, 'Alkane', '-ane']];
const classOf = n => (CLASS.find(([re]) => re.test(n)) || [])[1];
const IMF = { 'London dispersion forces': 1, 'Dipole–dipole attractions': 2, 'Hydrogen bonding': 3 };
const IMFDEF = { 'Hydrogen bonding': 'Hydrogen bonding needs an O–H or N–H bond in the molecule.', 'Dipole–dipole attractions': 'Dipole–dipole is the strongest force only for polar molecules without O–H or N–H.',
  'London dispersion forces': 'London dispersion is the strongest force only in nonpolar molecules (just C and H, or symmetric).', 'Ionic bonds': 'Ionic bonds hold ions together in salts. These are neutral molecules.' };
const bpRank = n => { const c = classOf(n); return { 'Alkane': 1, 'Alkene': 1, 'Alkyne': 1, 'Aromatic ring': 1, 'Ether': 2, 'Alkyl halide': 2, 'Aldehyde': 3, 'Ketone': 3, 'Ester': 3, 'Amine': 4, 'Alcohol': 4, 'Carboxylic acid': 5, 'Amide': 5 }[c] || (/toluene|benzene/.test(n) ? 1 : 0); };
const bpWord = n => ['', 'only London dispersion forces', 'weak dipole–dipole attractions', 'dipole–dipole attractions (a polar C=O)', 'hydrogen bonding', 'strong hydrogen bonding (–COOH or amide)'][bpRank(n)];
const locs = n => (n.match(/\d+(,\d+)*/g) || []).join(' ');
const SUBRE = /(?:(\d+(?:,\d+)*)-|^|-)(di|tri|tetra)?((?:sec-|tert-)?(?:iso)?(?:methyl|ethyl|propyl|butyl|pentyl|hexyl)(?=[a-z-])|fluoro|chloro|bromo|iodo|methoxy|ethoxy|propoxy|butoxy)/g;
const subs = n => { const body = n.replace(/^(?:methyl|ethyl|propyl|isopropyl|butyl|isobutyl|sec-butyl|tert-butyl|pentyl) (?=\S)/, ''); return [...body.replace(/N(,N)?-(di)?\w+?yl(?=[a-z])/g, '').matchAll(SUBRE)].filter(m => m[1] || /o$|oxy$/.test(m[3])).map(m => ({ loc: m[1] || '', mult: m[2] || '', name: m[3] })); };
const ALK = { methyl: 1, ethyl: 2, propyl: 3, butyl: 4, pentyl: 5, hexyl: 6 };
const nGroups = n => { const g = []; for (const m of n.matchAll(/(di|tri)?(methyl|ethyl|propyl|butyl|pentyl|hexyl)/g)) for (let k = 0; k < (m[1] === 'di' ? 2 : m[1] === 'tri' ? 3 : 1); k++) g.push(m[2]); return g; };
const amineGroups = n => /^[a-z]+amine$/.test(n) && !/anamine$/.test(n) ? nGroups(n) : (n.match(/^\d+-(\w+?)anamine$/) ? [Object.keys(ALK).find(k => k.startsWith(n.match(/^\d+-(\w+?)anamine$/)[1])) || '?'] : null);
const amideN = n => /amide$/.test(n) ? (n.match(/^(N(?:,N)?-(?:di)?(?:methyl|ethyl|propyl|butyl))/) || [])[1] : undefined;
const subKey = a => a.map(x => x.name).sort().join(',');
const alphaName = x => x.name.replace(/^(sec-|tert-)/, '');
function fgWhy(it) {
  const p = plainT(it.prompt), ans = plainT(it.answer), ex = plainT(it.explain), ch = it.choices.map(plainT), sk = it.skill.split('.')[1];
  const cap = t => t && /^[a-z]/.test(t) ? t.charAt(0).toUpperCase() + t.slice(1) : (t || ''), one = f => ch.map(c => c === ans ? '' : cap(f(c) || ''));
  if (/^Label /.test(ch[0])) return;
  if (ch.every(c => GDEF[c])) return one(c => `${c} needs ${GDEF[c]}. ${sk === 'med-molecules' ? 'The highlighted part' : 'This compound'} is ${/^[AEIOU]/.test(ans) ? 'an' : 'a'} ${ans.toLowerCase()}: it has ${GDEF[ans]}.`);
  if (sk === 'classify-degree') {
    const kind = (p.match(/Classify this (\w+)/) || [])[1], nm = ex.match(/(\d) other carbons?|: (\d)\./), n = nm ? +(nm[1] ?? nm[2]) : null;
    const rule = kind === 'alcohol' ? 'count the carbons bonded to the carbon that carries the –OH' : kind === 'amide' ? 'count the carbon groups on the N, not counting the carbonyl carbon' : 'count the carbon groups bonded to the N';
    return one(c => { const k = { 'Primary (1°)': 1, 'Secondary (2°)': 2, 'Tertiary (3°)': 3 }[c]; return k ? (kind === 'amide' ? `A ${c.split(' ')[0].toLowerCase()} amide has ${['no carbon groups on N (–NH2)', '1 carbon group on N (–NH–)', '2 carbon groups on N'][k - 1]}.` : `${c.split(' ')[0]} means ${k} carbon${k > 1 ? 's' : ''}.`) + ` For ${/^[aeiou]/.test(kind) ? 'an' : 'a'} ${kind}, ${rule}${n != null ? `: here there ${n === 1 ? 'is 1' : 'are ' + n}` : ''}.` : ''; });
  }
  if (sk === 'properties') {
    if (/strongest attraction/.test(p)) return one(c => IMFDEF[c] ? `${IMFDEF[c]} ${ex}` : '');
    if (/soluble in water/.test(p)) return one(c => `${c} has ${bpWord(c) || 'weaker attractions'}${bpRank(c) <= 1 ? ', so it is nonpolar and doesn’t mix with water' : ' but is less able to hydrogen bond with water'}. ${ans} is small and can hydrogen bond with water.`);
    if (/LOWEST boiling/.test(p)) return one(c => `${c} has ${bpWord(c) || 'stronger attractions'}, stronger than ${ans}’s London forces, so it boils higher.`);
    if (/HIGHEST boiling/.test(p)) return one(c => `${c} has ${bpWord(c) || 'weaker attractions'}, weaker than ${ans}’s ${bpWord(ans)}, so it boils lower.`);
    return;
  }
  if (sk === 'name' || sk === 'name-branched') {
    const ac = classOf(ans), parent = n => n.replace(/^(?:methyl|ethyl|propyl|isopropyl|butyl|isobutyl|sec-butyl|tert-butyl|pentyl) (?=\S)/, '').replace(/^N(,N)?-(di)?[a-z]+?yl(?=meth|eth|prop|but|pent|hex|hept|oct|non|dec)/, '').replace(SUBRE, '').replace(/^-+/, '');
    const rootOf = n => { const r = parent(n).match(/(meth|eth|prop|but|pent|hex|hept|oct|non|dec)/); return r ? r[1] : null; };
    const art = w => (/^[AEIOU]/.test(w) ? 'an ' : 'a ') + w.toLowerCase();
    const sa = subs(ans);
    return one(c => { const cc = classOf(c);
      if (cc && ac && cc !== ac) { const lab = (CLASS.find(([re]) => re.test(c)) || [])[2]; return `${/prefix/.test(lab) ? (/^a/.test(lab) ? 'An ' : 'A ') + lab : 'The ending ' + lab} names ${art(cc)} (${GDEF[cc]}). This compound is ${art(ac)}.`; }
      if (/^\w+ \w+oate$/.test(ans) && /^\w+ \w+oate$/.test(c)) { const [a1, a2] = ans.split(' '), [c1, c2] = c.split(' ');
        if (c1 !== a1 && c2 !== a2) return 'Check both parts. Name the alkyl group on the single-bonded O first, then the acid part (which includes the C=O carbon) with -oate.';
        return c1 !== a1 ? `Check the group on the single-bonded O: count its carbons.` : `Check the acid part: count the carbons in the chain that includes the C=O carbon.`; }
      if (ac === 'Amine') { const ga = amineGroups(ans), gc = amineGroups(c);
        if (ga && gc && (ga.length > 1 || gc.length > 1)) return `${c} would put ${gc.length} carbon group${gc.length > 1 ? 's' : ''} (${gc.join(', ')}) on the N. Here the N carries ${ga.length} (${ga.join(', ')}). Name each group on N, in alphabetical order, then add -amine.`; }
      if (ac === 'Amide') { const na = amideN(ans) || '', nc = amideN(c) || '';
        if (na !== nc) return na ? (nc ? `Check the groups on the N: this amide has ${na}, not ${nc}.` : `This amide has carbon groups on its N, written with N- in front (${na}).`) : `This amide has no carbon groups on its N (just –NH2), so there is no N- prefix.`; }
      const sc = subs(c);
      if (sc.some(x => x.loc.includes(',') && !x.mult)) return 'Two or more of the same branch need di-, tri- or tetra- in front, for example 2,2-dibromo.';
      const ra = rootOf(ans), rc = rootOf(c);
      if (ra && rc && ra !== rc) return `${rc.charAt(0).toUpperCase() + rc.slice(1)}- means a ${ROOT[rc]}-carbon main chain. The longest chain${ac && !/Alkane|Alkyl halide/.test(ac) ? ' that includes the functional group' : ''} has ${ROOT[ra]} carbon${ROOT[ra] === 1 ? '' : 's'} (${ra}-).`;
      if (subKey(sc) !== subKey(sa)) { const miss = sa.filter(x => !sc.some(y => y.name === x.name)).map(x => x.name), extra = sc.filter(x => !sa.some(y => y.name === x.name)).map(x => x.name);
        return (extra.length ? `This compound has no ${extra.join(' or ')} group. ` : '') + (miss.length ? (extra.length ? `Look for the ${miss.join(' and ')} instead.` : `The name leaves out the ${miss.join(' and ')} branch${miss.length > 1 ? 'es' : ''}.`) : '') || `Check the branch names against the structure.`; }
      const ord = sc.map(alphaName);
      if (sc.length > 1 && ord.some((b, k) => k && ord[k - 1] > b)) return 'List the branches in alphabetical order (ignore sec-, tert- and di-), not by number.';
      if (locs(c) !== locs(ans)) return /Carboxylic acid|Aldehyde|Ester|Amide/.test(ac || '') ? 'Check the numbers. The C=O carbon of this group is always C1; count from there.' : 'Check the numbers. Number from the end that gives the functional group (then the branches) the lowest numbers.';
      return `Compare with the correct name: ${ans}.`; });
  }
}
module.exports = fgWhy;
