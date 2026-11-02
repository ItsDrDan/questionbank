// Per-question CHEM 3B chapter tags for the practice banks.
// The samplers tag a whole mode with every chapter it can touch (Organic Origins "name" = Units 2,4,5,7,8),
// so a question about an amide showed up under "Unit 2 · Alkanes" in the Daily 5. This reads the question
// itself (answer, explanation, prompt text) and narrows the tags to the units the compound or reaction
// actually belongs to. Hub chapter ids: 1 structure & functional groups, 2 alkanes/alkenes/alkynes,
// 3 aromatics, 4 alcohols/phenols/thiols/ethers, 5 aldehydes & ketones, 6 chirality,
// 7 carboxylic acids & esters, 8 amines & amides, 9 carbohydrates.
'use strict';

const strip = s => String(s == null ? '' : s).replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();

// functional-group word -> unit
const GROUP = [
  [/carboxylic acid|\bacid\b/, '7'], [/\bester\b|carboxylate/, '7'],
  [/\bamide\b/, '8'], [/\bamine\b/, '8'],
  [/aldehyde|ketone|hemiacetal|\bacetal\b/, '5'],
  [/\balcohol\b|\bphenol\b|\bether\b|\bthiol\b|sulfide|thioether/, '4'],
  [/aromatic|benzene|phenyl/, '3'],
  [/alkane|alkene|alkyne|alkyl halide|haloalkane|hydrocarbon/, '2'],
];
function groupUnit(text) { text = String(text || '').toLowerCase(); for (const [re, u] of GROUP) if (re.test(text)) return u; return null; }

// IUPAC/common name -> unit, by suffix (highest-priority group first, as in naming)
function nameUnit(name) {
  const n = String(name || '').toLowerCase().trim();
  if (!n) return null;
  if (/oic acid\b|\bacid\b|oate\b|carboxylate/.test(n)) return '7';
  if (/amide\b/.test(n)) return '8';
  if (/amine\b|ammonium\b|anilin/.test(n)) return '8';
  if (/(^|[^a-z])(di|tri)?(meth|eth|prop|but|pent|hex|hept|oct|non|dec|undec|dodec)[a-z]*(an|en|yn)al\b|anal\b|enal\b|ynal\b|aldehyde\b|formaldehyde|acetaldehyde|benzaldehyde/.test(n)) return '5';
  if (/one\b|acetone|acetal\b|hemiacetal/.test(n)) return '5';
  if (/thiol\b|phenol\b|ol\b|\bether\b|oxy[a-z]+ane\b|oxy[a-z]*benz/.test(n)) return '4';
  if (/benzene|toluene|phenyl|xylene|naphthalene|styrene|aromatic/.test(n)) return '3';
  if (/yne\b|ene\b|ane\b|alkane|alkene|alkyne|cyclo/.test(n)) return '2';
  return null;
}

// compound names in free text (used for reaction prompts: "3-hexene + H₂O ⟶ 3-hexanol")
function unitsInText(text) {
  const t = strip(text).toLowerCase();
  const out = new Set();
  // names first (multi-word ones like "butanoic acid", "ethyl ethanoate", "methyl ethyl ether")
  const words = t.match(/[a-z0-9,\-–]+(?: acid| ether| ion)?/g) || [];
  const STEM = /meth|eth|prop|but|pent|hex|hept|oct|non|dec|benz|phen|cyclo|form|acet|tolu|anilin|glyc/;
  for (const w of words) { if (!STEM.test(w)) continue; const u = nameUnit(w); if (u) out.add(u); }
  return out;
}

function refineFunctionalGroups(q) {
  const skill = String(q.skill || '').split('.')[1], ans = strip(q.answer), why = strip(q.explain), prompt = strip(q.prompt);
  const u = x => x ? [x] : [];
  if (skill === 'spot-group') return ['1', ...u(groupUnit(ans))];
  if (skill === 'med-molecules') {
    const m = why.match(/is the ([a-z ]+?)[:.]/i) || why.match(/Label [A-C] is the ([a-z ]+)/i);
    const g = groupUnit(m ? m[1] : ans);
    return ['1', ...u(g)];
  }
  if (skill === 'classify-degree') { const m = prompt.match(/Classify this (\w+)/i); return u(groupUnit(m ? m[1] : why)); }
  if (skill === 'name' || skill === 'name-branched') return u(nameUnit(ans));
  if (skill === 'properties') {
    // the compound the answer talks about: either the answer itself or the first words of the explanation
    let g = nameUnit(ans);
    if (!g) { const m = why.match(/^([^.]*?) (has|is|have|are) /); g = nameUnit(m ? m[1] : ''); }
    return ['1', ...u(g)];
  }
  return null;
}

function refineOrganicReactions(q) {
  const prompt = strip(q.prompt), why = strip(q.explain), ans = strip(q.answer);
  const [left, right = ''] = prompt.split(/⟶|→|->/);
  const typ = (ans + ' ' + why.split(/[:(.]/)[0]).toLowerCase();
  const L = unitsInText(left), R = unitsInText(right + ' ' + ans);
  const has = (set, u) => set.has(u);
  if (/hydrogenation|hydrohalogenation|hydration|addition|combustion/.test(typ)) return ['2'];
  if (/halogenation/.test(typ)) return ['2'];
  if (/dehydration|elimination/.test(typ)) return ['4'];
  if (/hemiacetal|acetal/.test(typ)) return ['5'];
  if (/oxidation/.test(typ)) return /oxidation of an aldehyde/i.test(why) || (has(L, '5') && !has(L, '4')) ? ['5'] : ['4'];
  if (/reduction/.test(typ)) return has(L, '5') || has(R, '4') ? ['5'] : has(L, '7') ? ['7'] : ['5'];
  if (/esterification|saponification/.test(typ)) return ['7'];
  if (/amidation|amines?\b/.test(typ)) return ['8'];
  if (/hydrolysis|condensation|acid|base/.test(typ)) {
    if (has(L, '8') || has(R, '8')) return ['8'];
    if (has(L, '7') || has(R, '7')) return ['7'];
    if (has(L, '5') || has(R, '5')) return ['5'];
  }
  const all = new Set([...L, ...R]); all.delete('2');
  return all.size ? [...all] : null;
}

/* Returns the refined chapter list for a bank item, or the original list when nothing better is known. */
function refine(item) {
  if (!item || !Array.isArray(item.chapters) || !(item.courses || []).includes('3B')) return item && item.chapters;
  const game = String(item.skill || '').split('.')[0];
  let units = null;
  if (game === 'functionalgroups') units = refineFunctionalGroups(item);
  else if (game === 'organicreactions') units = refineOrganicReactions(item);
  else if (game === 'organic') { const u = groupUnit(strip(item.answer)); units = ['1', ...(u ? [u] : [])]; }  // flashcards: Unit 1 + the group's own unit
  if (!units || !units.length) return item.chapters;
  const keep = item.chapters.filter(c => !/^3B-/.test(c));           // other courses' tags stay
  return [...new Set(units)].map(u => '3B-' + u).concat(keep);
}

module.exports = { refine, nameUnit, groupUnit };
