// Per-choice feedback ("why") for thermochemistry items: bank/thermochemistry.json (the game's concept list, via
// tools/build.js) and bank/thermochemistry-practice.json (tools/samplers/thermochemistry.js).
// Returns an array parallel to item.choices ('' for the right answer), or undefined.
const plain = x => String(x == null ? '' : x).replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
const ENDO = 'Melting, vaporization and sublimation absorb heat (endothermic). Freezing, condensation and deposition release heat (exothermic).';
const PHASE = { Melting: 'solid → liquid', Freezing: 'liquid → solid', Vaporization: 'liquid → gas', Condensation: 'gas → liquid', Sublimation: 'solid → gas', Deposition: 'gas → solid' };
const STATE = { Solid: 'A solid’s particles are close together in a regular, fixed pattern.', Liquid: 'A liquid’s particles are close together but jumbled and able to slide past each other.', Gas: 'A gas’s particles are far apart and spread out.' };
const POINT = { 'Triple point': 'The triple point is where all three phase lines meet: solid, liquid and gas coexist.', 'Critical point': 'The critical point is the end of the liquid–gas line; above it, liquid and gas can’t be told apart.',
  'Normal boiling point': 'The normal boiling point is on the liquid–gas line at 1 atm.', 'Melting point only': 'A melting point is on the solid–liquid line, between only two phases.' };
const CVAL = { Water: 4.184, Lead: 0.128, Gold: 0.128, Silver: 0.235, Copper: 0.385, Iron: 0.449, Aluminum: 0.903, Ethanol: 2.42, Bismuth: 0.122, Diamond: 0.509 };

const HAND = {
  'Sweat evaporates from your skin.': ['Evaporation absorbs heat; it doesn’t release it. That is why sweating cools you.', 'Evaporation takes energy from your skin, which is why it cools you.'],
  'A reaction makes its test tube feel colder.': ['If the system released heat, the tube would feel warmer.', 'Endothermic means absorbing heat, not releasing it.'],
  'Compare equal masses of water and aluminum heated by the same ΔT.': ['Aluminum’s specific heat (0.903 J/(g·°C)) is much smaller than water’s (4.184), so it needs less heat.', 'q = mcΔT, and water and aluminum have different c values.'],
  'What does temperature measure?': ['Total energy also depends on how much sample there is. Temperature is an average.', 'Temperature reflects motion (kinetic energy), not potential energy.'],
  'What happens to temperature while a pure substance boils at fixed pressure?': ['During boiling, the heat goes into separating molecules, so temperature stays flat.', 'Heat is going in, but it goes into the phase change, so temperature stays flat.'],
  'An instant cold pack feels cold': ['If it released heat, the pack would feel warm.', 'The pack feels cold, so heat is moving from your hand into it.'],
  'A chemical hand warmer feels hot': ['If it absorbed heat, your hands would feel colder.', 'Absorbing heat and releasing heat are opposites; a warm pack is releasing heat.'],
  'Steam at 100 °C usually burns skin worse': ['Both are at 100 °C. The extra damage comes from the heat released as steam condenses.', 'Steam carries a lot of heat: its heat of vaporization is released when it condenses on skin.'],
  'Ice melts in a room-temperature drink.': ['Energy is never destroyed; it goes into separating the water molecules.', 'Absorbing heat can’t make the ice colder. It melts at 0 °C instead.'],
  'You touch a cold metal rail with a warm hand.': ['Heat flows from hot to cold, so it leaves your warmer hand.', 'Whenever two objects touch at different temperatures, heat flows between them.'],
  'Water droplets form on the outside of a cold glass': ['Droplets forming means vapor is turning into liquid: condensation, not evaporation.', 'Freezing makes a solid. Liquid droplets come from condensation, which releases heat.'],
  'A system releases heat to its surroundings. What is the sign of q': ['Positive q means heat flows into the system.', 'Zero would mean no heat is exchanged, but heat is leaving.'],
  'The same amount of heat is added to 50 g of water and 50 g of iron.': ['Water has the larger specific heat, so it warms less for the same heat.', 'Different specific heats give different temperature rises for the same heat.'],
  'Liquid water in a freezer turns into ice.': ['Freezing releases heat; melting is what absorbs it.', 'The water loses energy as it freezes.'],
  'Coastal cities often have milder temperatures': ['Density doesn’t control how much heat water stores.', 'Boiling point doesn’t matter here; specific heat controls temperature swings.'],
  'A hot cup of coffee cools on a desk.': ['Positive q would mean the coffee gains heat, but it is cooling.', 'The coffee is losing heat, so q isn’t zero.'],
  'Dry ice (solid CO₂) changes directly to gas': ['Going from solid to gas separates particles, which absorbs heat.', 'Freezing is liquid → solid. Sublimation is solid → gas.'],
  'Rubbing alcohol feels cold when it evaporates': ['The alcohol starts near room temperature. It feels cold because evaporation takes heat from your skin.', 'Evaporation absorbs heat, so it can’t warm the skin.'],
  'A bathtub of 40 °C water and a cup of 90 °C water': ['The cup is hotter, but thermal energy also depends on mass. The tub has far more water.', 'Different masses at different temperatures don’t give equal thermal energy.'],
  'For water, which phase change needs more heat per mole': ['Fusion only loosens attractions (about 6.02 kJ/mol). Vaporization separates molecules completely (about 40.7 kJ/mol).', 'Their values are very different: about 6.02 vs 40.7 kJ/mol.'],
  'A candle burns and warms the air above it.': ['Combustion warms the air, so it releases heat; it doesn’t absorb it.', 'Burning wax releases a lot of energy as heat and light.'],
  'What happens to temperature while pure water freezes': ['While freezing, the temperature stays at 0 °C until all the water is solid.', 'Heat is being removed, but it comes from the phase change, so temperature holds steady.'],
  'Which quantity depends only on the initial and final states': ['Heat (q) depends on the path taken, so it isn’t a state function.', 'Work (w) depends on the path taken, so it isn’t a state function.'],
  'A sealed, insulated, rigid container': ['ΔE would be positive only if heat or work entered. Nothing crosses the boundary.', 'ΔE would be negative only if heat or work left. Nothing crosses the boundary.'],
  'A gas expands against a constant external pressure.': ['Positive w means work is done on the gas (compression). Expanding gas does work on the surroundings.', 'The gas pushes back the surroundings, so work is done and w isn’t zero.'],
  'A reaction is run in a rigid bomb calorimeter.': ['qp = ΔH needs constant pressure. A rigid bomb keeps volume constant.', 'ΔG isn’t measured by a calorimeter; it combines ΔH and TΔS.'],
  'A reaction is run in an open coffee-cup calorimeter.': ['qv = ΔE needs constant volume. A coffee cup is open, at constant pressure.', 'A coffee-cup calorimeter measures heat, not work.'],
  'A reaction has ΔH = −120 kJ. What is ΔH for the reverse reaction?': ['Reversing a reaction flips the sign of ΔH.', 'The reverse reaction has the same size of ΔH with the opposite sign, not zero.'],
  'What is ΔHf° of an element in its standard state': ['By definition, an element in its standard state has ΔHf° = 0.', 'By definition, an element in its standard state has ΔHf° = 0.'],
};

module.exports = function thermoWhy(item) {
  if (!item.choices || !item.choices.length) return;
  const p = plain(item.prompt), ex = plain(item.explain), ans = plain(item.answer), ch = item.choices.map(plain);
  const cap = t => t && !/^q[ vp]/.test(t) ? t.charAt(0).toUpperCase() + t.slice(1) : (t || ''), one = f => ch.map(c => c === ans ? '' : cap(f(c) || ''));
  const hk = Object.keys(HAND).find(k => p.startsWith(k));
  if (hk) { const wr = HAND[hk]; let k = 0; return ch.map(c => c === ans ? '' : (wr[k++] || '')); }
  let m;
  if (ch.every(c => /^(Endothermic|Exothermic)$/.test(c))) return one(c => c === 'Exothermic' ? 'Exothermic means heat is released: energy appears on the product side. ' + ex : 'Endothermic means heat is absorbed: energy appears on the reactant side. ' + ex);
  if (ch.every(c => /^(Phase change|Temperature change)$/.test(c))) return one(c => c === 'Phase change' ? 'A phase change is a flat plateau (constant temperature). A sloped segment means the temperature is changing.' : 'A temperature change is a sloped segment. A flat plateau means the phase is changing at constant temperature.');
  if (ch.every(c => STATE[c])) return one(c => STATE[c]);
  if (ch.every(c => PHASE[c])) return one(c => `${c} is ${PHASE[c]}.`);
  if (ch.every(c => /^(Absorbed|Released)$/.test(c))) return one(c => ENDO);
  if (ch.every(c => POINT[c])) return one(c => POINT[c]);
  if (/Likely material/.test(p) && (m = ex.match(/= ([\d.]+) J\/\(g/))) return one(c => CVAL[c] != null ? `${c} has c = ${CVAL[c]} J/(g·°C). Your calculated c is ${m[1]} J/(g·°C): use c = q ÷ (m × ΔT).` : '');
  if (/melting or vaporizing|whether the sample is melt/.test(p) || ch.every(c => /^(Vaporization|Melting \(fusion\))$/.test(c))) return one(c => /Melting/.test(c) ? 'Melting water takes about 6.02 kJ/mol. Your heat per mole is much larger, which matches vaporization (about 40.7 kJ/mol).' : 'Vaporizing water takes about 40.7 kJ/mol. Your heat per mole is much smaller, which matches melting (about 6.02 kJ/mol).');
  if (/Which way does heat transfer/.test(p)) return one(c => /No heat/.test(c) ? 'Objects at different temperatures always exchange heat until they reach the same temperature.' : 'Heat flows from the hotter object to the colder one. Compare the two starting temperatures.');
  if (/larger temperature increase|larger ΔT/.test(p)) return one(c => /^Same/.test(c) ? 'ΔT = q ÷ (m × c). With a different mass or specific heat, the same heat gives a different ΔT.'
    : /^Water$/.test(c) ? 'Water has the largest specific heat (4.184 J/(g·°C)), so the same heat raises its temperature the least.'
    : /g sample/.test(c) ? 'ΔT = q ÷ (m × c). The bigger sample spreads the same heat over more mass, so it warms less.' : '');
  if (/releases more heat|absorbs more heat/.test(p)) return one(c => /^Same/.test(c) ? 'q = m × c × ΔT. With a different mass or specific heat, the heat is different.'
    : /g sample/.test(c) ? 'q = m × c × ΔT. With the same c and ΔT, the smaller mass has less heat to give or take.'
    : `${c} has a much smaller specific heat than water, so it needs less heat for the same ΔT.`);
  if (ch.some(c => /^q[vp] = /.test(c))) return one(c => /ΔH/.test(c) ? 'q = ΔH only at constant pressure. In a rigid bomb the volume is constant.' : /= 0/.test(c) ? 'Heat still flows in a bomb calorimeter. It is the work that is zero, since ΔV = 0.' : /ΔU/.test(c) ? 'qv = ΔU needs constant volume, which isn’t the case here.' : '');

  if (ch.every(c => /^(Absorbs|Releases) heat/.test(c))) return one(c => /^Absorbs/.test(c) ? 'Absorbing heat means energy is a reactant (endothermic). ' + ex : 'Releasing heat means energy is a product (exothermic). ' + ex);
  if (ch.every(c => /^(Positive|Negative)$/.test(c))) return one(c => c === 'Positive' ? 'q is positive only when heat flows into the system (endothermic). ' + ex : 'q is negative only when heat flows out of the system (exothermic). ' + ex);
  if (ch.every(c => /^q = (mcΔT|nΔH)$/.test(c))) return one(c => /nΔH/.test(c) ? 'q = nΔH is for a phase change, a flat plateau at constant temperature. This segment slopes, so the temperature is changing: q = mcΔT.' : 'q = mcΔT is for a temperature change, a sloped segment. This segment is flat (a phase change), so use q = nΔH.');
  if (ch.every(c => /^(Decreases|Remains constant|Increases)$/.test(c))) return one(c => c === 'Remains constant' ? 'Temperature stays constant only on a flat plateau (a phase change). This segment slopes.' : c === 'Increases' ? (/removed/.test(p) ? 'Heat is being removed, so the temperature can’t rise.' : 'Check the slope: on a heating curve, a sloped segment rises.') : (/added/.test(p) ? 'Heat is being added, so the temperature can’t fall.' : 'Check the slope of this segment.') + ' ' + ex);
  if (/Phases in equilibrium/.test(p)) return one(c => ex.replace(/^Identify point \w+: /, '') + ` ${c} would be a ${/only/.test(c) ? 'point on a single line or inside one region' : 'point away from all the lines'}.`);
  if (/Pressure-volume work/.test(p)) return one(c => 'Pressure–volume work needs a volume change (w = −PΔV). In a rigid bomb ΔV = 0, so w = 0.');
  if (ch.every(c => /^(Absorbed|Released) \((endo|exo)thermic\)$/.test(c))) return one(c => /Absorbed/.test(c) ? 'A negative ΔH means heat is released, not absorbed. ' + ex : 'A positive ΔH means heat is absorbed, not released. ' + ex);
};
