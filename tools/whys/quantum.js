// Per-choice feedback ("why") for Quantum Quest items in bank/quantum.json.
// Called by tools/build.js for every multiple-choice quantum item. Rule-based for the repeating question types
// (configurations, blocks, magnetism, trends, quantum numbers, light), hand-written (HAND, keyed by the start of the
// plain-text prompt) for the one-of-a-kind concept questions. Returns an array parallel to item.choices ('' for the
// right answer), or undefined.
const SYM = 'H He Li Be B C N O F Ne Na Mg Al Si P S Cl Ar K Ca Sc Ti V Cr Mn Fe Co Ni Cu Zn Ga Ge As Se Br Kr Rb Sr Y Zr Nb Mo Tc Ru Rh Pd Ag Cd In Sn Sb Te I Xe Cs Ba La Ce Pr Nd Pm Sm Eu Gd Tb Dy Ho Er Tm Yb Lu Hf Ta W Re Os Ir Pt Au Hg Tl Pb Bi Po At Rn Fr Ra Ac Th Pa U'.split(' ');
const Z = s => SYM.indexOf(s) + 1;
const CORE = { He: 2, Ne: 10, Ar: 18, Kr: 36, Xe: 54, Rn: 86 };
const SUPD = { '⁰': '0', '¹': '1', '²': '2', '³': '3', '⁴': '4', '⁵': '5', '⁶': '6', '⁷': '7', '⁸': '8', '⁹': '9' };
const plain = x => String(x == null ? '' : x).replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/[⁰¹²³⁴⁵⁶⁷⁸⁹]+/g, m => ' ' + [...m].map(c => SUPD[c]).join('') + ' ').replace(/\s+/g, ' ').trim();
const plainKeep = x => String(x == null ? '' : x).replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
const count = cfg => { let n = 0; const core = cfg.match(/\[(\w+)\]/); if (core) n += CORE[core[1]] || 0; for (const m of cfg.matchAll(/\d[spdf] (\d+)/g)) n += +m[1]; return n; };
const VAL = { Li: 1, Be: 2, B: 3, C: 4, N: 5, O: 6, F: 7, Ne: 8, Na: 1, Mg: 2, Al: 3, Si: 4, P: 5, S: 6, Cl: 7, Ar: 8 };
const AUFBAU = ['1s', '2s', '2p', '3s', '3p', '4s', '3d', '4p', '5s', '4d', '5p', '6s', '4f', '5d', '6p', '7s', '5f', '6d', '7p'];
const REGION = { 'Radio': 'longer than about 1 m', 'Microwave': 'about 1 mm to 1 m', 'Infrared': 'about 700 nm to 1 mm', 'Visible': 'about 400 to 700 nm', 'Ultraviolet': 'about 10 to 400 nm', 'X-ray': 'about 0.01 to 10 nm' };
const COLOR = { 'Violet': 420, 'Blue': 455, 'Blue-green': 480, 'Green': 525, 'Yellow-green': 565, 'Yellow': 580, 'Orange': 620, 'Red': 660 };
const BLOCK = { s: 'The s block is groups 1–2 (plus He).', p: 'The p block is groups 13–18 (except He).', d: 'The d block is the transition metals, groups 3–12.', f: 'The f block is the lanthanides and actinides (the two rows below the table).' };
const LETTER = ['s', 'p', 'd', 'f'];

const HAND = {
  'If wavelength doubles in a vacuum': { 'It doubles': 'Wavelength and frequency move in opposite directions (c = λν, and c is constant).', 'It stays the same': 'c = λν with c constant, so if λ changes, ν must change too.', 'It becomes four times larger': 'Frequency goes the opposite way, and only by the same factor: doubling λ halves ν.' },
  'In a photoelectric-effect experiment': { 'Electrons are ejected': 'Each photon’s energy (hν) is still below the threshold. Brighter light means more photons, not more energetic ones.', 'Each photon has greater energy': 'Photon energy depends only on frequency (E = hν). Intensity changes the number of photons.', 'The threshold frequency decreases': 'The threshold frequency belongs to the metal. Changing the light doesn’t change it.' },
  'What does a bright-line atomic emission spectrum show?': { 'A continuous range of all wavelengths': 'A continuous spectrum comes from a hot solid. Atoms emit only certain wavelengths.', 'Only wavelengths absorbed': 'That is an absorption spectrum (dark lines). A bright-line spectrum shows emitted light.', 'The paths of electrons in an atom': 'Spectra show photon energies, not electron paths; electrons don’t follow traceable paths.' },
  'Which observation most directly demonstrates wave interference?': { 'An electron has mass': 'Mass is a particle property; it says nothing about interference.', 'A photon ejects an electron from metal': 'The photoelectric effect shows light acting as particles (photons), not as waves.', 'An atom emits a line spectrum': 'Line spectra show quantized energy levels, not interference.' },
  'What does the uncertainty principle say?': { 'We can know position and momentum both exactly': 'That is exactly what the uncertainty principle rules out.', 'Electrons move in known circular orbits': 'That is the Bohr model. The uncertainty principle says such exact paths can’t be known.', 'Measurement errors can always be completely eliminated': 'The limit is built into nature, not a flaw in our instruments.' },
  'What does |ψ|² describe?': { 'The exact path of the electron': 'Quantum mechanics gives probabilities, not exact paths.', 'A fixed electron orbit': 'Fixed orbits are the Bohr model. |ψ|² gives where the electron is likely to be.', 'The charge on an atom': 'Charge comes from protons and electrons. |ψ|² is a probability density.' },
  'In the quantum mechanical model, what is an atomic orbital?': { 'A circular path the electron must follow': 'That is a Bohr orbit, not a quantum-mechanical orbital.', 'The path traced by one lobe of a p orbital': 'Lobes aren’t paths. An orbital is a region of probability.', 'A fixed-size solid object': 'An orbital has no hard edge; it is a probability distribution.' },
  'An atom with unpaired electrons is generally:': { 'Diamagnetic': 'Diamagnetic means all electrons are paired.', 'Electrically neutral only': 'Charge has nothing to do with pairing; ions can have unpaired electrons too.', 'A noble gas': 'Noble gases have all electrons paired, so they are diamagnetic.' },
  'Compared with Na, the radius of Na⁺ is:': { 'Larger': 'Losing electrons removes the outer 3s shell, so the cation is smaller.', 'Identical': 'Removing an electron changes the size: Na⁺ loses its whole 3s shell.', 'Not related to electron loss': 'The size change comes directly from losing the 3s electron.' },
  'Compared with Cl, the radius of Cl⁻ is:': { 'Smaller': 'Adding an electron adds repulsion with the same nuclear charge, so the anion is larger.', 'Identical': 'Adding an electron increases repulsion, so the ion is larger.', 'Zero': 'An ion still has electrons around its nucleus, so its radius isn’t zero.' },
  'For comparable orbitals in a multi-electron atom, penetration is generally:': { 'f > d > p > s': 'That is reversed: s orbitals have density closest to the nucleus.', 'p > s > f > d': 'Penetration follows ℓ: the lower ℓ, the more penetration (s > p > d > f).', 'All equal': 'They are equal only in hydrogen. In multi-electron atoms, lower ℓ penetrates more.' },
  'Why is the first ionization energy of Al lower than that of Mg?': { 'Al has fewer protons': 'Al has more protons (13) than Mg (12).', 'Mg has a larger radius': 'Mg is slightly larger, which would make it easier to ionize, not harder.', 'Al has a full 3p subshell': 'Al has only one 3p electron (3p¹).' },
  'Why is the first ionization energy of O lower than that of N?': { 'O has fewer electrons': 'O has more electrons (8) than N (7).', 'N is larger and more shielded': 'Being larger would make N easier to ionize. The real cause is pairing in O’s 2p.', 'O is a noble gas': 'O is in group 16, not 18.' },
  'Two light waves travel through the same medium.': { 'Twice as large': 'Intensity goes with amplitude squared, not amplitude: 2² = 4.', 'Half as large': 'A bigger amplitude means more intensity, not less.', 'The same': 'Intensity depends on amplitude, so doubling it changes the intensity.' },
  'Which photon has the greatest energy?': null,
  'Why is there a particularly large jump between the third and fourth ionization energies of aluminum?': { 'The fourth electron is farther from the nucleus': 'It is the opposite: the fourth electron is in an inner shell, closer to the nucleus.', 'Al has no attraction for the fourth electron': 'The fourth electron is held very strongly, which is why the jump is so big.', 'The fourth electron is added rather than removed': 'Ionization energies are for removing electrons.' },
  'Which is the correct first-ionization equation': { 'X(g) + e⁻ → X⁻(g)': 'Adding an electron is electron affinity, not ionization.', 'X(s) → X(g)': 'That is sublimation (atomization). No electron is removed.', 'X⁺(g) + e⁻ → X(g)': 'That is the reverse: an ion capturing an electron.' },
  'An orbital diagram uses two different colors': { 'Positive and negative electric charges': 'The colors show the sign (phase) of ψ, not electric charge.', 'Two electron trajectories': 'Orbitals don’t show paths.', 'Two different chemical elements': 'One orbital belongs to one atom. The colors show the wavefunction’s sign.' },
  'What supplies the initial excitation energy in a flame test?': { 'Electrons permanently losing their mass': 'Electrons don’t lose mass. Heat from the flame excites them.', 'The visible photon emitted afterward': 'The photon is emitted afterward, as the electron drops back down. It can’t be the source.' },
  'When an excited atom emits a visible photon': { 'It increases by the photon energy': 'Emitting a photon carries energy away, so the atom’s energy goes down.', 'It remains exactly unchanged': 'Energy is conserved: the photon’s energy comes from the atom.' },
  'Why can different elements produce different flame-test spectra?': { 'All their electrons have different masses': 'All electrons have the same mass. Elements differ in their energy levels.', 'Each element emits every visible wavelength equally': 'Then every flame would look the same. Each element emits only certain wavelengths.' },
  'A graph compares representative photon energy with visible wavelength.': { 'Energy rises linearly with wavelength': 'E = hc/λ: energy goes down as wavelength goes up, and not in a straight line.', 'Energy remains constant': 'Photon energy depends on wavelength (E = hc/λ).' },
  'Why is an observed flame color only an approximate wavelength guide?': { 'All photons from a flame have exactly the same wavelength': 'A flame usually emits several lines, which is why the color is only approximate.', 'The speed of light changes to match each element': 'The speed of light in air is essentially constant.' },
  'Which curve describes probability per unit volume': { 'Curve B': 'Curve B is the radial distribution (probability per unit radius, summed over a shell). Per unit volume is |ψ|².' },
  'Which curve describes probability per unit radial distance': { 'Curve A': 'Curve A is |ψ|², probability per unit volume at a point. Summing over a shell gives the radial distribution.' },
  'For hydrogen 1s, why is radial probability distribution zero at r = 0': { 'The wavefunction is zero at the nucleus': 'For 1s, ψ is largest at the nucleus, not zero.', 'The electron follows a fixed circular orbit': 'There are no fixed orbits in the quantum model.' },
  'At what radius does hydrogen 1s radial probability distribution reach its maximum?': { 'r = 0': 'At r = 0 the shell volume (4πr²) is zero, so the radial distribution is zero there.', 'r = 5a₀': 'The 1s radial distribution peaks at a₀ and is small by 5a₀.' },
  'What gives the probability of finding the electron between radii': { 'Only the height of curve A at r₁': 'A single height doesn’t give a probability over a range. You need the area under the radial curve.', 'The sign of the wavefunction': 'The sign doesn’t give a probability; probabilities come from |ψ|².' },
  'Does multiplying the entire normalized wavefunction by −1 change |ψ|²?': { 'Yes': 'Squaring removes the sign: |−ψ|² = |ψ|².' },
  'Can a probability density be negative?': { 'Yes; whenever ψ is negative': 'ψ can be negative, but |ψ|² is a square, so it is never negative.' },
};
function handFor(p) { const k = Object.keys(HAND).find(k => p.startsWith(k)); return k && HAND[k]; }


// ---- general rules for the game-only (publisher-style) items
const PERIOD = z => z <= 2 ? 1 : z <= 10 ? 2 : z <= 18 ? 3 : z <= 36 ? 4 : z <= 54 ? 5 : z <= 86 ? 6 : 7;
const GROUP = z => { const st = [0, 2, 10, 18, 36, 54, 86][PERIOD(z) - 1], k = z - st; if (z === 1) return 1; if (z === 2) return 18; if (PERIOD(z) <= 3) return k <= 2 ? k : k + 10; if (PERIOD(z) <= 5) return k; if (k <= 2) return k; if (k >= 17) return k - 14; return 3; };
const where = s => { const z = Z(s); return z ? `${s} is in period ${PERIOD(z)}, group ${GROUP(z)}` : ''; };
const TREND = { radius: 'Atomic radius grows down a group and toward the left of a period.', ionization: 'Ionization energy grows up a group and toward the right of a period (watch the Be/B, N/O type exceptions).', electronegativity: 'Electronegativity grows up a group and toward the right (F is highest).', metallic: 'Metallic character grows down a group and toward the left.', affinity: 'Electron affinity is generally most exothermic toward the upper right (halogens), with exceptions for filled or half-filled subshells.', zeff: 'Effective nuclear charge on the valence electrons grows across a period.' };
const trendKey = p => /radius|radii/.test(p) ? 'radius' : /ionization/.test(p) ? 'ionization' : /electronegativ/.test(p) ? 'electronegativity' : /metallic/.test(p) ? 'metallic' : /affinity/.test(p) ? 'affinity' : /nuclear charge/.test(p) ? 'zeff' : '';
function generalQuantum(p, ex, ans, ch, one) {
  let m, tk = trendKey(p);
  if (tk && /^Which (element|atom) has the (most|least|highest|lowest|largest|smallest|greatest)/.test(p) && ch.every(c => Z(c))) return one(c => `${where(c)}; ${where(ans)}. ${TREND[tk]}`);
  if (tk && /^Arrange in order of (decreasing|increasing)/.test(p)) { const dir = p.match(/order of (\w+)/)[1], A = ans.split(/ [<>] /);
    return one(c => { const C = c.split(/ [<>] /); if (C.slice().reverse().join() === A.join()) return `That is the reverse order. The question asks for ${dir} ${tk === 'zeff' ? 'effective nuclear charge' : tk}.`;
      const i = C.findIndex((x, k) => x !== A[k]); return i >= 0 ? `${C[i]} and ${C[i + 1]} are out of order. ${TREND[tk] || ''}` : ''; }); }
  if ((m = p.match(/configuration of (?:a ground-state )?([A-Z][a-z]?)([¹²³⁴⁵]?)([⁺⁻]?)(?: atom| ion)?\?/)) && Z(m[1]) && !/valence/.test(p)) { const q = m[3] ? (+(SUPD[m[2]] || 1)) * (m[3] === '⁺' ? 1 : -1) : 0, e = Z(m[1]) - q, sp = m[1] + m[2] + m[3];
    return one(c => { const n = count(plain(c)); if (n !== e) return `That configuration has ${n} electrons; ${sp} has ${e}.`;
      if (q > 0 && /4s|5s|6s/.test(c) && /d/.test(c)) return 'Right electron count, but ions lose their highest-n (outer s) electrons before d electrons.';
      if (/^(Cr|Cu|Mo|Ag|Au)$/.test(m[1]) && q === 0) return `Right electron count, but ${m[1]} is an exception: one s electron moves into d to give a ${/Cr|Mo/.test(m[1]) ? 'half-filled' : 'filled'} d subshell.`;
      return 'Right electron count, but fill subshells in Aufbau order (for example 4s before 3d) and don’t skip any.'; }); }
  if ((m = p.match(/valence-electron configuration of a ground-state ([A-Z][a-z]?) atom/))) { const g = GROUP(Z(m[1])), v = g > 12 ? g - 10 : g, per = PERIOD(Z(m[1]));
    return one(c => { const n = count(plain(c).replace(/\[\w+\]/, '')); if (g > 2 && g < 13) return `${m[1]} is a transition metal in period ${per}: its valence electrons are the ${per}s and ${per - 1}d electrons.`;
      return n !== v ? `That shows ${n} valence electron${n === 1 ? '' : 's'}; ${m[1]} (group ${g}) has ${v}.` : `Right number, but the valence shell of ${m[1]} is n = ${per}.`; }); }
  const eOf = t => { const x = plain(t).match(/^([A-Z][a-z]?)\s*([0-9]*)\s*([⁺⁻+−-]?)$/) || t.match(/^([A-Z][a-z]?)([¹²³⁴⁵]?)([⁺⁻]?)$/); if (!x || !Z(x[1])) return null; const n = x[2] ? +(SUPD[x[2]] || x[2]) : 1; return Z(x[1]) - (x[3] ? (/[⁺+]/.test(x[3]) ? n : -n) : 0); };
  if ((m = p.match(/Which species has the ground-state configuration (.+)\?/))) { const n = count(plain(m[1])); return one(c => { const e = eOf(c); return e != null ? `${c} has ${e} electrons; this configuration has ${n}.` : ''; }); }
  if ((m = p.match(/isoelectronic with \S+ \(has (\d+) electrons\)/))) return one(c => { const e = eOf(c); return e != null ? `${c} has ${e} electrons, not ${m[1]}.` : ''; });
  if (/Which ion does NOT have a noble-gas electron configuration/.test(p)) return one(c => { const e = eOf(c); return e != null ? `${c} has ${e} electrons, the same as a noble gas.` : ''; });  if (/hydrogen-atom transition represents (emission|absorption)/.test(p)) { const em = /emission/.test(p);
    return one(c => { const x = c.match(/n\s*=\s*(\d+)\s*→\s*n\s*=\s*(\d+)/); if (!x) return ''; const down = +x[1] > +x[2];
      if (down !== em) return `${c} goes ${down ? 'down' : 'up'}, so it ${down ? 'emits' : 'absorbs'} light. The question asks about ${em ? 'emission' : 'absorption'}.`;
      return 'Compare the energy gaps: levels get closer together as n increases, so gaps to n = 1 are biggest. Bigger gap = higher energy and frequency, shorter wavelength.'; }); }
  if (/Which equation represents the (first|second) (ionization|electron affinity)/.test(p)) return one(c => /e⁻ →/.test(c) || /\+ e⁻ →/.test(c) ? 'Adding an electron is electron affinity, not ionization.' : /\(s\)/.test(c) ? 'Ionization and electron affinity are defined for gas-phase atoms (g).' : /→ \w+⁺⁺|²⁺/.test(c) && /first/.test(p) ? 'The first ionization removes only one electron.' : 'Check which particle is on the left and how many electrons move. ' + ex);
  if (/Which set of quantum numbers/.test(p) || /Each set is supposed to describe an orbital/.test(p)) return one(c => 'Check each rule: n ≥ 1, ℓ from 0 to n − 1, mℓ from −ℓ to +ℓ, ms = +½ or −½. Then match ℓ to the subshell letter (0 = s, 1 = p, 2 = d, 3 = f). ' + ex);
}

module.exports = function quantumWhy(item) {
  if (!item.choices || !item.choices.length) return;
  const p = plainKeep(item.prompt), ex = plainKeep(item.explain), ans = plainKeep(item.answer), ch = item.choices.map(plainKeep);
  const cap = t => t && /^[a-z]/.test(t) ? t.charAt(0).toUpperCase() + t.slice(1) : (t || ''), one = f => ch.map(c => c === ans ? '' : cap(f(c) || ''));
  const h = handFor(p); if (h) return one(c => h[c]);
  let m;
  if (/Which photon has the greatest energy/.test(p)) return one(c => `Longer wavelength means lower energy (E = hc/λ). ${ans} is the shortest wavelength here.`);
  // ---- configurations
  if ((m = p.match(/configuration of neutral (\w+)\?/))) { const el = m[1], z = Z(el);
    return one(c => { const n = count(plain(c));
      if (n !== z) return `That configuration has ${n} electron${n === 1 ? '' : 's'}; neutral ${el} has ${z}.`;
      if ((el === 'Cr' || el === 'Cu') && /4s/.test(c)) return `Right electron count, but ${el} is an exception: moving one 4s electron into 3d gives a more stable ${el === 'Cr' ? 'half-filled' : 'filled'} 3d subshell.`;
      return 'Right electron count, but neutral atoms fill 4s before 3d.'; }); }
  if ((m = p.match(/configuration of (\w+?)([¹²³⁴]?)([⁺⁻])\?/))) { const el = m[1], q = (+(SUPD[m[2]] || 1)) * (m[3] === '⁺' ? 1 : -1), e = Z(el) - q;
    return one(c => { const n = count(plain(c)); return n !== e ? `That has ${n} electrons; ${el}${m[2]}${m[3]} has ${Z(el)} − ${q} = ${e}.` : 'Right electron count, but transition-metal ions lose their 4s electrons first, before any 3d electrons.'; }); }
  if (/paramagnetic or diamagnetic/.test(p)) return one(c => (c === 'Diamagnetic' ? 'Diamagnetic means every electron is paired. ' : 'Paramagnetic needs at least one unpaired electron. ') + ex);
  if ((m = p.match(/block contains (\w+)\?/))) return one(c => `${BLOCK[c[0]]} ${m[1]} is in the ${ans[0]} block.`);
  if (/same electron count and closed-shell/.test(p)) return one(c => ex);
  if ((m = p.match(/ground-state configuration (.+?) \?$/)) || (m = p.match(/ground-state configuration (.+)\?$/))) { const n = count(plain(m[1]));
    return one(c => Z(c) ? `Neutral ${c} has ${Z(c)} electrons; this configuration has ${n}.` : ''); }
  // ---- quantum numbers, subshells, nodes, Aufbau
  if (/quantum-number set allowed/.test(p)) return one(c => (c === 'Allowed' ? 'Check each rule: ℓ goes from 0 to n − 1, mℓ from −ℓ to +ℓ, and ms is +½ or −½. ' : 'Every rule is met: ℓ is 0 to n − 1, mℓ is −ℓ to +ℓ, and ms is ±½. ') + ex);
  if ((m = p.match(/n = (\d), ℓ = (\d), mℓ = /))) { const n = +m[1], l = +m[2];
    return one(c => { const w = c.match(/^(\d)([spdf])$/); if (!w) return ''; const wl = LETTER.indexOf(w[2]);
      if (wl > +w[1] - 1) return `${c} doesn’t exist: ℓ can be at most n − 1, so the ${w[1]} shell has no ${w[2]} subshell.`;
      if (+w[1] !== n) return `The number in front is n. Here n = ${n}.`;
      return `${w[2]} means ℓ = ${wl}. Here ℓ = ${l}, which is ${LETTER[l]}.`; }); }
  if ((m = p.match(/hydrogenic (\d)([spdf]) orbital, how many radial nodes/))) { const n = +m[1], l = LETTER.indexOf(m[2]); return one(c => `Radial nodes = n − ℓ − 1 = ${n} − ${l} − 1 = ${n - l - 1}.`); }
  if ((m = p.match(/filled immediately after (\d[spdf])\?/))) { const i = AUFBAU.indexOf(m[1]);
    return one(c => { const j = AUFBAU.indexOf(c); return j < 0 ? '' : j <= i ? `${c} fills before ${m[1]}, so it is already full by then.` : `${c} comes later. Order by n + ℓ (lowest n first when tied): ${AUFBAU.slice(i, j + 1).join(' → ')}.`; }); }
  if (/Classify the pictured/.test(p)) return one(c => /^Forbidden/.test(c) ? 'Pauli exclusion is broken only when one orbital holds two electrons with the same spin. That doesn’t happen here.'
    : /ground state/.test(c) ? 'A ground state must follow Aufbau and Hund’s rule exactly. ' + ex : /^Forbidden/.test(ans) ? 'Even an excited arrangement must obey Pauli exclusion. ' + ex : 'Nothing is promoted or wrongly paired here. ' + ex);
  // ---- hydrogen energy levels, penetration
  if (/orbitals of an isolated hydrogen atom/.test(p)) return one(c => 'In hydrogen (one electron) the energy depends only on n, so these are equal. Subshells split only in many-electron atoms.');
  if (/penetrates closer to the nucleus/.test(p)) return one(c => 'Within the same shell, lower ℓ penetrates more: s > p > d > f.');
  // ---- trends
  if (/Careful: this pair breaks the simple trend/.test(p)) return one(c => `This pair is an exception to the simple trend. ${ex}`);
  if (/larger atomic radius/.test(p)) return one(c => `${c} is smaller. Radius decreases across a period (more nuclear charge, same shell) and increases down a group (more shells). ${ex}`);
  if (/greater first ionization energy/.test(p)) return one(c => `${c} holds its outer electron less tightly. ${ex}`);
  if (/greater metallic character/.test(p)) return one(c => `${c} holds its electrons more tightly, so it is less metallic. ${ex}`);
  if (/more exothermic first electron affinity/.test(p)) return one(c => ex);
  if (/order of increasing/.test(p)) { const A = ans.split(' < ');
    return one(c => { const C = c.split(' < '); if (C.slice().reverse().join() === A.join()) return 'That is the reverse order. The question asks for smallest first.';
      const i = C.findIndex((x, k) => x !== A[k]); return `${C[i]} and ${C[i + 1]} are out of order. ${ex}`; }); }
  if (/successive ionization energies for a main-group atom/.test(p)) return one(c => { const g = +c.match(/\d+/)[0], v = g > 12 ? g - 10 : g; return `Group ${g} has ${v} valence electron${v > 1 ? 's' : ''}, so its big jump would come right after IE ${v}. ${ex}`; });
  if (/period-3 element has successive ionization energies|mystery element from the (second|third) row/.test(p)) return one(c => { const s = (c.match(/\((\w+)\)/) || [, c])[1], v = VAL[s]; return v ? `${c} has ${v} valence electron${v > 1 ? 's' : ''}, so its big jump would come between IE ${v} and IE ${v + 1}. Find where this table’s jump is.` : ''; });
  // ---- light
  if ((m = p.match(/wavelength ([\d.]+ \S+)\. Which electromagnetic region/))) return one(c => REGION[c] ? `${c} is ${REGION[c]}. This photon is ${m[1]}.` : '');
  if ((m = p.match(/wavelength (\d+) nm\. Which color/))) return one(c => COLOR[c] ? `The activity’s reference for ${c.toLowerCase()} is ${COLOR[c]} nm; this emission is ${m[1]} nm.` : '');
  if (/Four light waves are drawn/.test(p)) return one(c => /highest energy/.test(p) ? 'Highest energy means the shortest wavelength: the most cycles in the same distance. Count the cycles.' : /lowest frequency/.test(p) ? 'Lowest frequency means the longest wavelength: the fewest cycles in the same distance.' : 'Longest wavelength means the fewest cycles in the same distance. Count the cycles.');
  if (/standing-wave pattern/.test(p)) return one(c => 'A string with N loops has N − 1 internal nodes (the points that never move between loops). Count the loops.');
  if (/What type of interference occurs/.test(p)) return one(c => /different frequencies/.test(c) ? 'The two waves are drawn with the same wavelength, so they have the same frequency.' : /No superposition/.test(c) ? 'Overlapping waves always add (superpose).' : /Destructive/.test(c) ? 'Destructive interference needs crests lined up with troughs (opposite phase).' : 'Constructive interference needs crests lined up with crests (same phase).');
  if (/Which transition in hydrogen emits a photon/.test(p)) return one(c => 'That goes up to a higher n, which absorbs energy. Emission is a downward transition (higher n → lower n).');
  { const g = generalQuantum(p, ex, ans, ch, one); if (g) return g; }
  if (/emission transition produces the longest wavelength/.test(p)) return one(c => /^I →/.test(c) ? `${c} goes up, so it absorbs light; it isn’t an emission.` : `${c} has a bigger energy gap, so its wavelength is shorter (λ = hc/ΔE). The longest wavelength comes from the smallest downward gap.`);
};
