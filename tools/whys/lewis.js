// Per-choice feedback rules for the lewisstructures game (used by tools/samplers/lewisstructures.js and, via whys.js, by the game itself).
// ---------- Per-choice feedback ("why"): one short reason for each wrong choice, built from the item's own numbers ----------
const SHAPES = { 'Linear': [[2, 0], [5, 3]], 'Bent or Angular': [[3, 1], [4, 2]], 'Trigonal planar': [[3, 0]], 'Tetrahedral': [[4, 0]],
  'Trigonal pyramidal': [[4, 1]], 'Trigonal bipyramidal': [[5, 0]], 'Sawhorse or Seesaw': [[5, 1]], 'T-shape': [[5, 2]],
  'Octahedral': [[6, 0]], 'Square pyramidal': [[6, 1]], 'Square planar': [[6, 2]] };
SHAPES['Bent'] = SHAPES['Bent or Angular']; SHAPES['Seesaw'] = SHAPES['Sawhorse or Seesaw']; SHAPES['T-shaped'] = SHAPES['T-shape'];
const BASIC = { 'Linear': 2, 'Trigonal planar': 3, 'Tetrahedral': 4, 'Trigonal bipyramidal': 5, 'Octahedral': 6 };
const strip = x => String(x == null ? '' : x).replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
const pl = (n, w) => n + ' ' + w + (n === 1 ? '' : 's');
const lpWord = n => n === 0 ? 'no lone pairs' : pl(n, 'lone pair');
function whyFor(it) {
  const ex = strip(it.explain), ans = strip(it.answer), skill = it.skill.split('.')[1];
  const one = (c, f) => strip(c) === ans ? '' : f(strip(c));
  if (/vsepr-(molecular-shape|electron-geometry)$/.test(skill)) {
    const m = ex.match(/(\d+) electron groups? \((\d+) bonded atoms? \+ (\d+) lone pairs?\)/); if (!m) return;
    const [g, b, l] = [+m[1], +m[2], +m[3]], here = `This atom has ${g} electron groups (${pl(b, 'bonded atom')} + ${lpWord(l)}).`;
    if (/molecular-shape/.test(skill)) return it.choices.map(c => one(c, c => {
      const need = SHAPES[c]; if (!need) return '';
      const sameG = need.find(([G]) => G === g);
      const desc = need.map(([G, L]) => `${G} electron groups with ${lpWord(L)}`).join(', or ');
      if (BASIC[c] === g && c !== ans && l > 0) return `${c} is the basic (electron-group) geometry here, not the molecular shape. The shape names only where the atoms are, so the ${lpWord(l)} change it. ${here}`;
      if (sameG) return `${c} needs ${desc}. The electron-group count matches, but the lone pairs don’t. ${here}`;
      return `${c} needs ${desc}. ${here}`;
    }));
    return it.choices.map(c => one(c, c => {
      const n = BASIC[c]; if (!n) return '';
      if (n === b && l > 0) return `${c} counts only the ${b} bonded atoms. Lone pairs are electron groups too, so count them. ${here}`;
      return `${c} is the basic geometry for ${n} electron groups. ${here}`;
    }));
  }
  if (/polarity$/.test(skill) && it.choices.length === 2 && /molecule/i.test(ans)) {
    const core = ex.replace(/\s*\(Bonds:[^)]*\)\s*$/, '');
    return it.choices.map(c => one(c, c => /^Polar/i.test(c)
      ? `Polar needs a net dipole, with one side of the molecule partly negative. This molecule has none. ${core}`
      : `Nonpolar would need no polar bonds, or bond dipoles that cancel perfectly. Here they don’t. ${core}`));
  }
  if (skill === 'bond-category') {
    const d = (ex.match(/ΔEN = ([\d.]+)/) || [])[1]; if (!d) return;
    return it.choices.map(c => one(c, c => /^Nonpolar/i.test(c) ? `Nonpolar covalent needs ΔEN of 0.4 or less. Here ΔEN = ${d}, so electrons are shared unevenly.`
      : /^Polar/i.test(c) ? `Polar covalent needs ΔEN greater than 0.4. Here ΔEN = ${d}, so the electrons are shared about equally.`
      : /^Ionic/i.test(c) ? `Ionic needs a very large ΔEN (a metal with a nonmetal). Here ΔEN = ${d}.` : ''));
  }
  if (skill === 'polarity-trends') {
    const p = strip(it.prompt), check = (ex.match(/Yellow-sheet check:\s*(.*)$/) || [])[1] || '';
    const tail = check ? ` Yellow-sheet check: ${check}` : '';
    if (/polar or nonpolar\?/.test(p)) return it.choices.map(c => one(c, c => /^Nonpolar/i.test(c)
      ? `The two atoms sit far enough apart on the trend that one pulls the shared electrons harder, so the bond isn’t nonpolar.${tail}`
      : `These atoms are close enough on the trend (ΔEN 0.4 or less) that the electrons are shared about equally, so the bond isn’t polar.${tail}`));
    if (/more polar/.test(p)) return it.choices.map(c => one(c, c => `The ${c} bond has the smaller electronegativity difference: its atoms are closer together on the trend, so it is less polar than ${ans}.${tail}`));
    const bnd = p.match(/the ([A-Z][a-z]?)–([A-Z][a-z]?) bond/);
    if (/partial negative/.test(p) && bnd && bnd[1] === bnd[2]) return it.choices.map(c => one(c, c => `Both atoms are ${bnd[1]}, so they have the same electronegativity. Neither end pulls harder, so neither is δ−.`));
    if (/partial negative/.test(p)) return it.choices.map(c => one(c, c => /^Neither/.test(c)
      ? `Electrons are shared equally only between atoms with the same electronegativity. ${ans} is more electronegative, so it pulls the electrons closer and gets δ−.${tail}`
      : `${c} is farther from fluorine on the table, so it is less electronegative. It gets δ+, not δ−.${tail}`));
    if (/more electronegative|most electronegative/.test(p)) return it.choices.map(c => one(c, c => c === 'H'
      ? `H is an exception to the corner rule: its electronegativity (2.1) is lower than C, N, O and the halogens. ${ans} is closer to fluorine.${tail}`
      : `${c} is farther from fluorine (the upper right corner) than ${ans}, so it pulls electrons less strongly.${tail}`));
    return;
  }
  if (skill === 'octet-exception') {
    const ve = (ex.match(/^(\d+) valence electrons/) || [])[1], center = (ex.match(/central (\w+)/) || [])[1];
    const here = ve ? ` This species has ${ve} valence electrons${ve % 2 ? ' (an odd number)' : ' (an even number)'}${center ? ' and its central atom is ' + center : ''}.` : '';
    return it.choices.map(c => one(c, c => /^Electron-deficient/.test(c) ? `Electron-deficient means the central atom has fewer than 8 electrons (usually B or Be, or a carbocation).${here}`
      : /^Odd/.test(c) ? `An odd-electron radical needs an odd total number of valence electrons, leaving one unpaired.${here}`
      : /^Expanded/.test(c) ? `Expanded valence means more than 8 electrons on a central atom from period 3 or below.${here}` : ''));
  }
}

module.exports = whyFor;
