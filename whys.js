/* QBWhy: per-choice "why" feedback for Dr. Dan's study games. Built from questionbank/tools/whys by tools/build-whys.js. Do not edit by hand. */
(function () {
const M = {};
M["rest"] = (function () { const module = { exports: {} }; const exports = module.exports;
// Per-choice feedback ("why") for the rest of the bank: Bridge to 1B, gas laws, REDOX, moles, stoichiometry,
// polyatomic ions, intro organic, organic reactions, plus the leftovers in the 3B games.
// tools/build.js calls fillWhy(item) on every multiple-choice item after the banks are built; it only fills
// choices that have no reason yet. HAND entries are keyed by a piece of the plain-text prompt; inside, each key
// is the start of a wrong choice's plain text.
const plain = x => String(x == null ? '' : x).replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/&rarr;/g, '→').replace(/&quot;/g, '"').replace(/&amp;/g, '&').replace(/[​]/g, '').replace(/\s+/g, ' ').trim();
const tight = x => plain(x).replace(/([A-Za-z\)]) (\d)/g, '$1$2').replace(/(\d) (?=[A-Z(])/g, '$1').replace(/ ([⁺⁻+−-])(?=\s|$)/g, '$1');

const HAND = {
  // ---------- Bridge to 1B: core toolkit
  'Which formula represents aluminum sulfate?': { 'AlSO4': 'Al³⁺ and SO₄²⁻ don’t balance one-to-one: +3 and −2 leave a +1 charge.', 'Al3SO4': 'Three Al³⁺ (+9) and one SO₄²⁻ (−2) don’t balance.', 'Al2SO4': 'The sulfate needs parentheses and a subscript: two Al³⁺ (+6) need three SO₄²⁻ (−6).' },
  'ground-state electron configuration of Fe2+?': { '[Ar] 4s2 3d4': 'Right electron count, but ions lose their 4s electrons first.', '[Ar] 4s1 3d5': 'Right electron count, but both 4s electrons leave before any 3d electron.', '[Ar] 3d8': 'That has 26 electrons. Fe²⁺ has 24.' },
  'neutral Mg atom becomes Mg2+?': { 'It gains two protons': 'The nucleus doesn’t change when an ion forms; only electrons move.', 'It gains two electrons': 'Gaining electrons gives a negative ion. A 2+ charge means two electrons were lost.', 'It loses two neutrons': 'Neutrons have no charge, so losing them can’t make an ion.' },
  'Which atom is larger: Na or Cl': { 'Cl': 'Across a period, more protons pull the same shell in, so Cl is smaller.', 'They have identical radius': 'Atoms in the same period differ in size: radius shrinks left to right.', 'No periodic trend exists': 'Atomic radius has a clear trend: it decreases across a period.' },
  'Which is larger: O2− or Mg2+?': { 'Mg2+': 'Both have 10 electrons, but Mg²⁺ has 12 protons pulling them in, so it is smaller.', 'Exactly equal': 'Same electron count, different nuclear charge (8 vs 12), so different sizes.', 'Neither has electrons': 'Both ions still have 10 electrons.' },
  'Which atom is most electronegative?': { 'Na': 'Na is on the far left, so it is one of the least electronegative.', 'C': 'C is fairly electronegative, but F (top right) is the most electronegative element.', 'Mg': 'Mg is a metal on the left side, with low electronegativity.' },
  'Which quantum-number pair is impossible?': { 'n = 3, l = 2': 'Allowed: for n = 3, l can be 0, 1 or 2.', 'n = 2, l = 1': 'Allowed: for n = 2, l can be 0 or 1.', 'n = 1, l = 0': 'Allowed: for n = 1, l must be 0.' },
  'three electrons arranged in three degenerate p orbitals?': { 'Pair two before filling the third': 'Hund’s rule: fill each equal-energy orbital singly before pairing.', 'All three in one orbital': 'One orbital holds at most two electrons (Pauli exclusion).', 'One orbital holds three spins': 'An orbital can hold only two electrons, with opposite spins.' },
  'empirical formula CH2O and molar mass 180.16': { 'CH2O': 'CH₂O has a molar mass of only about 30 g/mol. 180.16 ÷ 30.03 ≈ 6.', 'C3H6O3': 'That is about 90 g/mol, only half of 180.16.', 'C12H24O12': 'That is about 360 g/mol, twice 180.16.' },
  'How many significant figures are in 0.004070?': { '2': 'The zero between 7 and the end counts, and so does the trailing zero after the decimal.', '3': 'The trailing zero after a decimal point is significant too: 4, 0, 7, 0.', '6': 'Leading zeros (0.00) are placeholders and never count.' },
  'Measurements cluster tightly but far from the accepted value': { 'Accurate but imprecise': 'Accurate means close to the accepted value, which these aren’t. Clustering tightly means precise.', 'Both accurate and precise': 'They are far from the accepted value, so they aren’t accurate.', 'Neither measurable': 'These are real measurements; they are just consistently off.' },
  'A uniform salt solution is best classified as': { 'A pure element': 'Salt water contains more than one substance, so it is a mixture.', 'A pure compound': 'Its composition can vary (more or less salt), so it is a mixture, not a compound.', 'A heterogeneous mixture': 'A solution looks the same throughout, so it is homogeneous.' },
  // ---------- Bridge to 1B: matter & energy
  'strongest intermolecular attraction occurs between water molecules?': { 'Covalent O–H bonding between molecules': 'O–H covalent bonds are inside each molecule. Between molecules, the attraction is hydrogen bonding.', 'Metallic bonding': 'Metallic bonding is in metals, not water.', 'Only London dispersion': 'Water has dispersion forces, but its strongest attraction is hydrogen bonding.' },
  'Which statement about London dispersion forces is correct?': { 'Only polar molecules exhibit them': 'Every atom and molecule has dispersion forces, polar or not.', 'They are covalent bonds': 'They are weak attractions between molecules, not bonds inside them.', 'They require hydrogen bonded to fluorine': 'That describes hydrogen bonding, not dispersion.' },
  'stronger intermolecular attractions generally give': { 'Higher vapor pressure': 'Stronger attractions hold molecules in the liquid, so fewer escape: vapor pressure goes down.', 'Exactly zero vapor pressure': 'Some molecules always escape, so vapor pressure isn’t zero.', 'No change in boiling point': 'Stronger attractions raise the boiling point.' },
  'What interaction helps stabilize ions in water?': { 'Only ion–ion attractions in a crystal': 'Once dissolved, the ions are surrounded by water, not by each other.', 'Covalent bonding of every ion to water': 'Water attracts ions through its partial charges; it doesn’t form covalent bonds with them.', 'Metallic electron sea': 'That describes metals, not ions in water.' },
  'A gas expands into a larger volume at the same temperature': { 'Decrease': 'More volume gives the particles more possible positions, so entropy increases.', 'Exactly unchanged': 'Entropy depends on volume for a gas, so it changes.', 'Entropy becomes negative': 'Entropy is positive for any real substance; here it increases.' },
  'Breaking an ionic lattice by separating its ions is': { 'Always energy releasing': 'Pulling opposite charges apart takes energy.', 'Always neutralization': 'Neutralization is an acid–base reaction, not separating ions.', 'Always a reduction': 'No electrons are gained when ions are separated.' },
  'greatest ideal dissolved-particle concentration': { 'NaCl': 'NaCl gives 2 ions per formula unit; AlCl₃ gives 4.', 'Glucose': 'Glucose doesn’t dissociate, so it gives just 1 particle.', 'CaCl2': 'CaCl₂ gives 3 ions; AlCl₃ gives 4.' },
  'Two ideal gases have the same temperature. They have the same': { 'Average molecular speed': 'Lighter molecules move faster at the same temperature, so speeds differ.', 'Molecular mass': 'Temperature says nothing about which gas it is.', 'Density': 'Density depends on molar mass and pressure, not only temperature.' },
  'Which solid is a covalent network?': { 'Solid argon': 'Argon atoms are held by weak dispersion forces: an atomic solid.', 'NaCl crystal': 'NaCl is an ionic solid.', 'Solid methane': 'Methane molecules are held by dispersion forces: a molecular solid.' },
  'depend primarily on dissolved-particle count': { 'Chemical identity alone': 'Colligative properties depend on how many particles there are, not what they are.', 'Atomic number of the solvent': 'The solvent matters, but the change depends on the number of solute particles.', 'Oxidation state changes': 'Oxidation states have nothing to do with colligative properties.' },
  // ---------- Bridge to 1B: reactions in water
  'What best represents HCl(aq)?': { 'Intact HCl molecules only': 'HCl is a strong acid, so it ionizes completely in water.', 'H and Cl neutral atoms': 'HCl gives ions (H₃O⁺ and Cl⁻), not neutral atoms.', 'Solid HCl crystals': '(aq) means dissolved in water.' },
  'What best describes CH3COOH(aq) before adding base?': { 'Only free H+ and acetate ions': 'Acetic acid is weak, so only a small fraction ionizes.', 'No particles are present': 'The acid molecules are dissolved in the water.', 'Only neutral carbon atoms': 'Acetic acid stays as molecules; it doesn’t break into atoms.' },
  'Choose the net ionic reaction.': { 'Na+ + Cl− → NaCl(s)': 'NaCl is soluble, so it doesn’t precipitate. Na⁺ and Cl⁻ are spectators.', 'CH3COOH → C + H2': 'Acids don’t break down into elements in water.', 'H2O → H2 + O2': 'That is electrolysis, not an acid–base reaction.' },
  'A weak monoprotic acid is titrated exactly with NaOH': { 'Unreacted acid exclusively': 'At equivalence, the added OH⁻ has used up the acid.', 'Excess hydroxide from titrant': 'Exact titration means no extra OH⁻ was added.', 'Neutral metal atoms': 'Na⁺ stays as an ion; no metal atoms form.' },
  'NaNO3(aq) appears in a molecular precipitation equation': { 'Neutral NaNO3 molecules only': 'NaNO₃ is ionic and soluble, so it exists as separate ions.', 'Na metal and nitrogen gas': 'Dissolving doesn’t change ions into elements.', 'NaNO3 precipitate': 'All nitrates are soluble, so NaNO₃ doesn’t precipitate.' },
  'For HCl(aq) + NaOH(aq), which ions are spectators?': { 'H3O+ and OH−': 'These react to make water, so they aren’t spectators.', 'Na+ and OH−': 'OH⁻ reacts with H₃O⁺, so it isn’t a spectator.', 'Cl− and H3O+': 'H₃O⁺ reacts with OH⁻, so it isn’t a spectator.' },
  'Acid reacts with carbonate. Which products explain the bubbling?': { 'O2(g) only': 'No oxygen is made. The gas is CO₂ from H₂CO₃ breaking down.', 'H2(g) and O2(g)': 'That would be splitting water; acid + carbonate gives CO₂.', 'Solid elemental carbon': 'The carbon leaves as CO₂ gas.' },
  'Which statement is correct?': { 'They always mean exactly the same volume': 'The endpoint is where the indicator changes; it only approximates equivalence.', 'Endpoint means all ions disappear': 'Spectator ions remain at the endpoint.', 'Equivalence always means pH 7': 'Only strong acid + strong base gives pH 7 at equivalence; a weak acid gives a basic solution.' },
  'Which end of water points preferentially toward Ca2+?': { 'Hydrogen end': 'The H end is partly positive, so it is repelled by a cation.', 'Both ends equally': 'Water is polar, so one end is attracted more.', 'Water has no polarity': 'Water is polar: O is δ− and H is δ+.' },
  'forms AgCl(s). Which pair is removed into the solid?': { 'Na+ and NO3−': 'Na⁺ and NO₃⁻ stay dissolved: they are spectators.', 'Na+ and Cl−': 'NaCl is soluble; the solid is AgCl.', 'Ag+ and NO3−': 'AgNO₃ is soluble; the solid is AgCl.' },
  // ---------- Bridge to 1B: kinetics & equilibrium
  'A reaction has reached equilibrium. What is true?': { 'Both reactions have stopped': 'Equilibrium is dynamic: both reactions keep going, at equal rates.', 'Reactant and product concentrations must be equal': 'Concentrations are constant, not necessarily equal.', 'All reactants have been used up': 'At equilibrium reactants and products are both present.' },
  'what does [NO2] mean?': { 'The mass of NO2 in grams': 'Square brackets mean concentration in mol/L, not mass.', 'The number of NO2 molecules': 'Brackets mean molarity, not a count of molecules.', 'The partial pressure of NO2 in torr': 'Partial pressure is written P(NO₂). Brackets mean mol/L.' },
  'which species is a gas?': { 'CaCO3': 'CaCO₃ is marked (s): solid.', 'CaO': 'CaO is marked (s): solid.', 'None of them': 'CO₂ is marked (g).' },
  'Where does heat appear if you write it into the equation?': { 'As a reactant': 'A negative ΔH means heat is released, so heat is a product.', 'On both sides': 'Heat appears on one side only: products for exothermic.', 'Heat is not involved': 'ΔH = −92 kJ means heat is released.' },
  'ΔH = +57 kJ for N2O4(g) → 2 NO2(g)': { 'The reaction releases heat': 'A positive ΔH means heat is absorbed, not released.', 'The reaction is always fast': 'ΔH says nothing about speed.', 'The reaction cannot happen': 'Endothermic reactions happen all the time; they just take in heat.' },
  'What does a catalyst do?': { 'Changes the products that form': 'A catalyst speeds up the same reaction; the products are unchanged.', 'Is used up as a reactant': 'A catalyst is regenerated at the end.', 'Makes an exothermic reaction endothermic': 'A catalyst doesn’t change ΔH.' },
  'Why does raising the temperature usually speed up a reaction?': { 'Molecules get larger': 'Temperature doesn’t change molecular size.', 'The number of reactant molecules increases': 'Heating doesn’t create molecules; it makes them move faster.', 'Products stop forming': 'Products form faster, not slower.' },
  'Which acid is weak (only partly ionized in water)?': { 'HCl': 'HCl is one of the strong acids on the green sheet.', 'HNO3': 'HNO₃ is one of the strong acids on the green sheet.', 'HBr': 'HBr is one of the strong acids on the green sheet.' },
  'You double the concentration of a reactant in solution': { 'They decrease': 'More particles in the same space collide more often, not less.', 'They stay the same': 'More particles per liter means more collisions.', 'They stop': 'Adding reactant can’t stop collisions.' },
  'you double the moles of a gas. What happens to its pressure?': { 'It halves': 'P = nRT/V: pressure goes up with moles, not down.', 'It stays the same': 'More particles hit the walls, so pressure rises.', 'It becomes zero': 'More gas means more pressure.' },
  // ---------- Bridge to 1B: math gym
  'pH = −log[H⁺]. Which calculator key?': { 'ln (natural log)': 'ln is base e. pH uses base-10 log.', 'eˣ': 'eˣ undoes ln; it doesn’t take a log.', 'x²': 'Squaring isn’t a log.' },
  'You know ln K = 3.2. Which key gives K?': { '10ˣ (2nd + log)': '10ˣ undoes log (base 10). ln is undone by eˣ.', 'x²': 'Squaring doesn’t undo a log.', '1/x': 'The reciprocal doesn’t undo a log.' },
  'The log of a concentration like 2 × 10⁻⁵ M is': { 'Positive (about 4.7)': 'Numbers less than 1 have negative logs. −log gives +4.7, which is the pH-style value.', 'Zero': 'log 1 = 0; this number is much smaller than 1.', 'Undefined': 'Log is undefined only for zero or negative numbers.' },
  'Which plot is a straight line with slope −k?': { '[A] versus time': 'That is straight for zero order, with slope −k there.', '1/[A] versus time': 'That is straight for second order, with slope +k.', '[A]² versus time': 'No common rate law gives a straight line for [A]².' },
  'the slope has units of': { 's/M': 'Slope is y-units over x-units: M over s.', 'M': 'Slope divides by the x-axis units (s).', 'No units': 'Slope carries y-units over x-units.' },
  'A quadratic from an ICE table gives': { 'x = −0.52': 'A negative x would make a concentration negative here.', 'Both are valid': 'Only one root keeps every concentration positive.', 'Neither': 'x = 0.031 works: all concentrations stay positive.' },
  '(3.0 × 10⁻⁴)² equals': { '9.0 × 10⁻¹⁶': 'Squaring doubles the exponent: (10⁻⁴)² = 10⁻⁸, not 10⁻¹⁶.', '6.0 × 10⁻⁸': '3.0² is 9.0, not 6.0.', '3.0 × 10⁻⁸': 'Square the 3.0 too: 3.0² = 9.0.' },
  'Rate = k[A]². If [A] is doubled': { 'Doubles': 'Second order: rate goes with [A]², so doubling [A] gives 2² = 4 times.', 'Stays the same': 'The rate depends on [A], so it changes.', 'Halves': 'Raising [A] raises the rate.' },
  'ΔG° = −RT ln K with R = 8.314': { 'Convert R to kJ by dividing by 10': 'J to kJ is ÷1000, not ÷10.', 'Nothing; the units cancel': 'R is in J and ΔG° in kJ, so they don’t match yet.', 'Convert T to °C': 'Thermodynamics always uses kelvins.' },
  'You used x ≈ √(Kc) and found x is 2% of c': { 'No, it must be under 1%': 'The usual cutoff is 5%.', 'No, it must be exactly 0': 'x can’t be zero if the reaction happens at all.', 'Only if K > 1': 'The test is the 5% check, not K > 1; small K is when the shortcut works.' },
  // ---------- Bridge to 1B: picture items
  // ---------- enzymes leftovers
  'What happens to an enzyme at the end of the reaction it catalyzes?': { 'It becomes the product': 'The substrate becomes the product; the enzyme stays the same.', 'It is used up, like a reactant': 'Catalysts aren’t consumed.', 'It is broken down and rebuilt': 'The enzyme comes out unchanged, ready for the next substrate.' },
  'Most enzyme names end with which suffix?': { '-ose': '-ose marks sugars (glucose, sucrose).', '-ol': '-ol marks alcohols.', '-ine': '-ine is common in amino acids and amines.' },
  'About how much faster can an enzyme make a reaction go?': { 'It does not change the speed': 'Speeding reactions up is exactly what enzymes do.', 'About 2 times faster': 'Enzymes are far more powerful than that: about a million to a trillion times.', 'About 10 times faster': 'Enzymes speed reactions by about 10⁶ to 10¹² times.' },
  'How is an enzyme’s active site formed?': { 'By a covalent bond to the substrate': 'The active site exists before the substrate arrives; substrate binding is usually not covalent.', 'By a vitamin that sits on the surface': 'Some enzymes need coenzymes, but the pocket comes from the protein’s fold.', 'By the cell membrane around it': 'The active site is part of the enzyme itself.' },
  'How does an enzyme speed up a reaction?': { 'It adds energy to the reactants': 'Enzymes lower the energy barrier; they don’t add energy.', 'It is consumed and becomes part of the product': 'Enzymes aren’t used up.', 'It increases the number of reactant molecules': 'Enzymes don’t make more reactant.' },
  'With no enzyme, a reaction releases 30 kJ': { 'Less than 30 kJ': 'The enzyme doesn’t change the energies of reactants or products.', 'Zero, enzymes absorb the energy': 'Enzymes don’t absorb the energy released.', 'More than 30 kJ': 'Only the activation energy changes; ΔG stays the same.' },
  'What makes an irreversible inhibitor different': { 'It binds only at the allosteric site': 'Allosteric binding is usually reversible. Irreversible means a covalent bond.', 'It looks exactly like the substrate': 'That describes a competitive inhibitor.', 'It only works at high temperature': 'Irreversible inhibitors work at body temperature.' },
  'All except which statement describe a competitive inhibitor?': { 'It has a structure similar to the substrate': 'That is true of competitive inhibitors, so it isn’t the exception.', 'It competes with the substrate': 'That is true of competitive inhibitors.', 'Adding more substrate reverses the inhibition': 'That is true of competitive inhibitors.' },
  'All except which statement describe a noncompetitive inhibitor?': { 'It distorts the shape of the enzyme': 'That is true of noncompetitive inhibitors.', 'Adding more substrate does not reverse it': 'That is true of noncompetitive inhibitors.', 'It binds the enzyme away from the active site': 'That is true of noncompetitive inhibitors.' },
  'Pepsinogen, trypsinogen and chymotrypsinogen': { 'They have to be heated': 'They are switched on by cutting the chain, not by heat.', 'They are permanently denatured': 'Denatured proteins can’t be switched on; zymogens can.', 'They are missing their vitamins': 'They are activated by cutting off part of the chain, not by adding vitamins.' },
  'Which statement about allosteric enzymes is true?': { 'They only work in the stomach': 'Allosteric enzymes work all over the body.', 'Every enzyme has an allosteric site': 'Only some enzymes have allosteric sites.', 'The regulator always looks like the substrate': 'Regulators bind a different site and needn’t look like the substrate.' },
  'Why does a cell regulate its enzymes': { 'Regulated enzymes change the ΔG': 'Enzymes never change ΔG; regulation only changes rates.', 'Enzymes are used up if they run too fast': 'Enzymes aren’t consumed.', 'Unregulated enzymes become zymogens': 'Zymogens are made inactive on purpose; it isn’t caused by lack of regulation.' },
  // ---------- gas laws concepts
  'What causes gas pressure?': { 'Gas particles sticking': 'Ideal gas particles don’t stick; pressure comes from wall collisions.', 'The weight of the container': 'The container’s weight doesn’t push on the gas inside.', 'Gas particles slowing down': 'Slower particles would lower pressure.' },
  'The average kinetic energy of gas particles is proportional to the': { 'Volume of the container': 'Volume doesn’t set particle energy; temperature does.', 'Number of moles': 'More particles doesn’t change the average energy of each.', 'Molar mass of the gas': 'All gases at the same T have the same average KE.' },
  'He and Xe are in the same room at 25 °C': { 'Xe has more kinetic energy': 'Heavier Xe moves slower, but average KE depends only on T.', 'He has more kinetic energy': 'Lighter He moves faster, but average KE depends only on T.', 'Neither has kinetic energy': 'Any gas above 0 K has kinetic energy.' },
  'According to KMT, gas particles': { 'Are packed tightly together': 'That describes a solid or liquid.', 'Attract each other strongly': 'KMT assumes no attractions between gas particles.', 'Stay in one place and vibrate': 'That describes a solid; gas particles move freely.' },
  'Collisions between ideal gas particles are': { 'Sticky': 'Ideal gas particles bounce off; they don’t clump.', 'Rare': 'Gas particles collide constantly.', 'Explosive': 'Energy can’t be created.' },
  'Why does 1 mol of ANY gas occupy 22.4 L at STP?': { 'All gases have the same molar mass': 'Molar masses differ a lot (He 4, Xe 131).', 'All gas particles are the same size': 'Particles differ in size, but they are tiny compared with the space between them.', 'Gases have no mass': 'Gases do have mass.' },
  'What happens to air pressure as you climb a mountain?': { 'It increases': 'There is less air above you, so pressure drops.', 'It stays the same': 'Air pressure depends on altitude.', 'It doubles': 'Pressure drops with altitude.' },
  'Which pressure equals 1 atm?': { '76 mmHg': '1 atm = 760 mmHg, ten times this.', '100 mmHg': '1 atm = 760 mmHg.', '1 mmHg': '1 atm = 760 mmHg.' },
  'In gas-law calculations, temperature must be in': { 'Degrees Celsius': 'Celsius isn’t absolute (0 °C isn’t zero energy), so ratios break.', 'Degrees Fahrenheit': 'Fahrenheit isn’t an absolute scale.', 'Any unit, as long as both match': 'Matching units isn’t enough; the scale must start at absolute zero (K).' },
  'In a direct relationship between A and B': { 'When A goes up, B goes down': 'That is an inverse relationship.', 'A and B do not change': 'A relationship means one changes with the other.', 'B is always larger than A': 'Direct means they move together, not which is larger.' },
  'state of the gas is NOT changing': { 'Boyle’s law': 'Boyle’s law compares two states.', 'The combined gas law': 'The combined gas law compares two states.', 'Charles’s law': 'Charles’s law compares two states.' },
  'At the same temperature, which gas has the fastest average speed?': { 'O₂': 'O₂ (32 g/mol) is heavier than H₂, so it moves slower.', 'CO₂': 'CO₂ (44 g/mol) is heavier than H₂, so it moves slower.', 'Xe': 'Xe (131 g/mol) is the heaviest here, so it is slowest.' },
  'INCREASING rate of diffusion': { 'He < NO < O₂ < Kr': 'That is decreasing order. Heavier gases diffuse slower, so Kr comes first.', 'O₂ < NO < Kr < He': 'Kr is the heaviest (83.8), so it is slowest and comes first.', 'Kr < NO < O₂ < He': 'NO (30.0) is lighter than O₂ (32.0), so NO is faster and comes after O₂.' },
  'When temperature increases, the speed distribution': { 'Shifts to lower speeds': 'Hotter particles move faster.', 'Becomes narrower': 'Higher temperature spreads the speeds out.', 'Does not change': 'Temperature changes the speeds.' },
  'Graham’s law: the rate of effusion is': { 'Directly proportional to molar mass': 'Heavier gases are slower, so it is inverse, and with a square root.', 'Inversely proportional to temperature': 'Higher temperature makes effusion faster, not slower.', 'Independent of molar mass': 'Effusion rate depends strongly on molar mass.' },
  'Real gases behave LEAST ideally at': { 'Low pressure and high temperature': 'That is where gases behave most ideally.', 'STP only': 'Deviations grow at high P and low T, not only at STP.', 'Low pressure and low volume': 'At low pressure, particle volume matters least.' },
  'Because of attractive forces, the real pressure': { 'Higher than the ideal pressure': 'Attractions pull particles back, so they hit the walls less hard.', 'The same as the ideal pressure': 'Attractions lower the pressure.', 'Zero': 'Attractions lower pressure but don’t remove it.' },
  'Because gas particles take up space, the real volume': { 'Smaller than the ideal volume': 'Particles add their own volume, so the real volume is larger.', 'The same as the ideal volume': 'Particle volume makes it larger.', 'Zero': 'A gas always occupies volume.' },
  'Which gas behaves most like an ideal gas?': { 'NH₃': 'NH₃ hydrogen bonds, so attractions make it less ideal.', 'H₂O': 'H₂O hydrogen bonds strongly, so it is far from ideal.', 'Cl₂': 'Cl₂ is large and polarizable, with strong dispersion forces.' },
  'In the van der Waals equation, the constant a corrects for': { 'The volume of the particles': 'That is b.', 'The temperature': 'Neither constant corrects temperature.', 'The number of moles': 'n is a variable, not corrected by a.' },
  'LARGER van der Waals constant a': { 'He': 'He has very weak attractions, so a is tiny.', 'Ne': 'Ne has weak dispersion forces only.', 'H₂': 'H₂ has very weak attractions.' },
  // ---------- REDOX concepts
  'Oxidation is…': { 'the gain of electrons': 'Gaining electrons is reduction (GER).', 'the gain of protons': 'Redox is about electrons, not protons.', 'the loss of neutrons': 'Neutrons aren’t involved in chemical reactions.' },
  'Reduction is…': { 'the loss of electrons': 'Losing electrons is oxidation (LEO).', 'the loss of protons': 'Redox is about electrons, not protons.', 'the gain of neutrons': 'Neutrons aren’t involved in chemical reactions.' },
  'The reducing agent is the substance that…': { 'is reduced': 'The reducing agent causes reduction in something else, so it is oxidized.', 'gains electrons': 'The reducing agent gives electrons away.', 'is left unchanged': 'It is oxidized in the reaction.' },
  'The oxidizing agent is the substance that…': { 'is oxidized': 'The oxidizing agent causes oxidation in something else, so it is reduced.', 'loses electrons': 'The oxidizing agent takes electrons.', 'is left unchanged': 'It is reduced in the reaction.' },
  'When an atom is oxidized, its oxidation number…': { 'decreases': 'Losing negative electrons makes the number go up.', 'stays the same': 'Oxidation always changes the oxidation number.', 'becomes zero': 'It increases by however many electrons are lost.' },
  'When an atom is reduced, its oxidation number…': { 'increases': 'Gaining negative electrons makes the number go down.', 'stays the same': 'Reduction always changes the oxidation number.', 'becomes +1': 'It decreases by however many electrons are gained.' },
  'oxidation occurs at the…': { 'cathode': 'Reduction happens at the cathode (Red Cat).', 'salt bridge': 'Ions move through the salt bridge; no electrons are lost there.', 'wire': 'Electrons flow through the wire; oxidation happens at an electrode.' },
  'reduction occurs at the…': { 'anode': 'Oxidation happens at the anode (An Ox).', 'salt bridge': 'Ions move through the salt bridge; no electrons are gained there.', 'electrolyte only': 'Reduction happens at the cathode surface.' },
  'The purpose of a salt bridge is to…': { 'carry electrons between the electrodes': 'Electrons travel through the wire, not the salt bridge.', 'stop all current from flowing': 'Without the salt bridge, current stops.', 'supply the metal for the electrodes': 'The electrodes are separate pieces of metal.' },
  'Rusting of iron is an example of…': { 'reduction of iron by water': 'Iron loses electrons, so it is oxidized.', 'a precipitation reaction only': 'Electrons transfer, so it is redox.', 'a neutralization reaction': 'No acid and base react.' },
  'A sacrificial anode': { 'zinc is reduced more easily than iron': 'Zinc is oxidized more easily, which is why it corrodes instead of iron.', 'zinc blocks oxygen as paint does': 'It protects by corroding first, even where it doesn’t cover the iron.', 'zinc is a poorer reducing agent than iron': 'Zinc is the better reducing agent: it gives up electrons more easily.' },
  'Galvanizing steel means coating it with…': { 'copper': 'Copper is less active than iron, so it wouldn’t protect it.', 'gold': 'Gold is far too expensive and less active than iron.', 'lead': 'Lead isn’t used; zinc is.' },
  'A rechargeable battery can be recharged because…': { 'it contains no reactants': 'A battery contains reactants that react to make current.', 'its electrodes never change': 'The electrodes change during discharge; recharging restores them.', 'it works only by physical changes': 'A battery runs on a chemical (redox) reaction.' },
  'Which is a typical oxidizing agent?': { 'Na': 'Na gives up electrons easily, so it is a reducing agent.', 'Li': 'Li gives up electrons easily, so it is a reducing agent.', 'H₂ only in basic solution': 'H₂ usually acts as a reducing agent, giving up electrons.' },
  'Which is a typical reducing agent?': { 'O₂': 'O₂ takes electrons, so it is an oxidizing agent.', 'F₂': 'F₂ is the strongest oxidizing agent.', 'Cl₂': 'Cl₂ takes electrons, so it is an oxidizing agent.' },
  'A combustion reaction is always a…': { 'precipitation reaction': 'No solid forms from solution in combustion.', 'acid–base reaction': 'No H⁺ transfer happens; oxygen takes electrons.', 'decomposition with no electron transfer': 'Fuel loses electrons to O₂, so electrons transfer.' },
  // ---------- stereochemistry chiral drugs
  'Levobupivacaine': { 'It contains no amide group': 'Both enantiomers have the same groups, including the amide.', 'It has a different molecular formula': 'Enantiomers have the same formula.', 'It is achiral': 'A single enantiomer is still chiral.' },
  'Esomeprazole (Nexium)': { 'is a racemic mixture': 'The racemic mixture is omeprazole (Prilosec). Es- marks a single enantiomer.', 'is an ester': 'The prefix isn’t about functional groups.', 'is achiral': 'Single-enantiomer drugs are chiral.' },
  'Dextromethorphan is a cough suppressant': { 'Whether the drug is an acid or a base': 'Dextro- and levo- describe rotating light, not acidity.', 'Two constitutional isomers': 'They are enantiomers, with the same connections.', 'The': 'Dextro- and levo- name the two enantiomers by how they rotate light.' },
  'Which form of amino acids is used to build the proteins': { 'A racemic mixture of both': 'Proteins use only L-amino acids.', 'D-amino acids': 'D-amino acids are rare in the body; proteins use L.', 'Neither; amino acids are achiral': 'All amino acids except glycine are chiral.' },
  'Levothyroxine is prescribed': { 'The D form': 'The body makes the L form, like levothyroxine.', 'A racemic mixture': 'The body makes only one enantiomer.', 'An achiral molecule': 'Thyroxine has a chiral carbon (from tyrosine).' },
  'thalidomide': { 'The body cannot absorb': 'It is absorbed fine. The problem is that each enantiomer turns into the other in the body.', 'Enantiomers always have identical effects': 'Thalidomide itself shows they don’t: one enantiomer sedated, the other caused birth defects.', 'The safe enantiomer is not chiral': 'Both enantiomers are chiral; that is why they are a pair.' },
  'A polarimeter shows that a solution does not rotate': { 'an achiral solvent that blocks the light': 'Solvents don’t block rotation.', 'too concentrated': 'More concentrated chiral solution rotates more, not less.', 'made of a single enantiomer': 'A single enantiomer does rotate light.' },
  'A dental anesthetic cartridge contains epinephrine': { 'not be chiral': 'The mirror image of a chiral molecule is also chiral.', 'have a different molecular formula': 'Enantiomers have the same formula.', 'work exactly the same way': 'Receptors are chiral, so they fit one enantiomer better.' },
  'Why can two enantiomers of a drug have very different effects': { 'One enantiomer is always toxic': 'Sometimes both are safe, and one is just inactive.', 'Enantiomers have different molecular formulas': 'Enantiomers have identical formulas.', 'Enantiomers have different boiling points': 'Enantiomers have the same boiling point.' },
  'One enantiomer of carvone': { 'carvone is a meso compound': 'A meso compound is achiral and has no enantiomers.', 'only one carvone is chiral': 'Both enantiomers are chiral.', 'the two carvones have different formulas': 'Enantiomers have the same formula.' },
  'Levalbuterol': { 'Racemic drugs are always illegal': 'Many racemic drugs are legal and common (albuterol, ibuprofen).', 'Single enantiomers cannot': 'Single enantiomers can be inhaled; levalbuterol is.', 'The other enantiomer is a different compound': 'Enantiomers have the same formula; they differ only in 3-D arrangement.' },
  'Ibuprofen is sold as a racemic mixture': { 'It has no chiral carbon': 'Racemic means there are two enantiomers, so it is chiral.', 'It is a meso compound': 'A meso compound has no enantiomers.', 'It contains only one enantiomer': 'That would be a single-enantiomer drug.' },
  'Levodopa (L-DOPA)': { 'It is a lipid': 'L means the L enantiomer, not lipid.', 'It has no chiral carbon': 'L-DOPA has a chiral carbon.', 'It is a racemic mixture': 'A racemic mixture would be both forms.' },
  'Which form of glucose does the body use for energy?': { 'Both equally': 'Our enzymes are specific for D-sugars.', 'L-glucose': 'L-glucose can’t fit our enzymes, so it isn’t used.', 'Neither; glucose is achiral': 'Glucose has four chiral carbons.' },
  // ---------- pH & charge leftovers
  'Sodium benzoate is used as a food preservative': { 'is a stronger acid': 'Sodium benzoate is a salt, not a stronger acid.', 'has no taste at all': 'The main reason is solubility.', 'is not a salt': 'Sodium benzoate is a salt (Na⁺ + benzoate).' },
  'Which form of a drug crosses a cell membrane': { 'Both forms cross equally': 'Charged ions can’t dissolve in the nonpolar membrane.', 'The charged (ionized) form': 'Charged ions are repelled by the nonpolar membrane interior.', 'Neither form can cross': 'The neutral form crosses.' },
  'Which form of an amine dissolves better in water?': { 'The neutral amine': 'The ionic salt dissolves much better than the neutral amine.', 'Neither dissolves in water': 'The salt dissolves well.', 'Both dissolve equally': 'The ionic salt is much more soluble.' },
  'In gel electrophoresis': { 'Toward the negative electrode': 'Above the pI, the protein is negative, so it moves toward the positive electrode.', 'It does not move': 'It stays put only at its pI.', 'It moves randomly': 'A charged protein moves toward the opposite electrode.' },
  'Aspirin is a carboxylic acid. Why can some of it be absorbed in the stomach': { 'At pH 2 aspirin is a negative ion': 'At pH 2 it keeps its H⁺, and ions don’t cross membranes anyway.', 'Aspirin is absorbed only as its sodium salt': 'The neutral form is what crosses the membrane.', 'The stomach changes aspirin into an amine': 'Stomach acid doesn’t turn it into an amine.' },
  'Lactic acid is a carboxylic acid. In what form': { 'Neutral lactic acid': 'At pH 7.4 a carboxylic acid loses its H⁺.', 'Lactate with a + charge': 'Losing H⁺ makes it negative, not positive.', 'Half and half': 'pH 7.4 is far above its pKa, so almost all is the ion.' },
  'In an aspirin overdose, the urine is made more basic': { 'Bicarbonate destroys salicylate': 'Bicarbonate doesn’t destroy it; it keeps it ionized.', 'Basic urine makes salicylate neutral': 'Basic conditions keep the acid ionized, not neutral.', 'Bicarbonate turns aspirin into an amine': 'Bicarbonate doesn’t make amines.' },
  'Naproxen sodium (Aleve)': { 'It contains more naproxen per molecule': 'Each formula unit has one naproxen.', 'The salt is an amine': 'It is a carboxylate salt, not an amine.', 'Sodium salts are not absorbed': 'Sodium salts are absorbed; they dissolve faster.' },
  'arterial blood pH is 7.25': { 'Isoelectric point': 'The pI is a property of an amino acid or protein, not blood.', 'Normal blood pH': 'Normal is 7.35–7.45; 7.25 is too low.', 'Alkalosis': 'Alkalosis is above 7.45.' },
  'sodium bicarbonate to lidocaine': { 'It turns lidocaine into an acid': 'Bicarbonate is a base; it makes the solution less acidic.', 'It neutralizes the epinephrine': 'It changes the pH of the solution, not the epinephrine.', 'It makes lidocaine permanently charged': 'It does the opposite: more lidocaine becomes neutral.' },
  'works poorly in an infected, inflamed tooth area': { 'Acid makes the anesthetic a negative ion': 'An amine picks up H⁺ and becomes positive, not negative.', 'Inflamed tissue has no nerves': 'Inflamed tissue has nerves (it hurts!).', 'Acid destroys the anesthetic': 'The amide bond survives; the problem is protonation.' },
  'Lidocaine is supplied in dental cartridges as lidocaine hydrochloride': { 'Hydrochloride salts cannot be absorbed': 'The salt is absorbed; it is used because it dissolves.', 'The salt is a stronger acid than HCl': 'It is a weak acid, much weaker than HCl.', 'HCl makes lidocaine stronger': 'HCl doesn’t change how well it numbs; it makes it soluble.' },
  'Why do amino acids in the blood exist mainly as zwitterions?': { 'Amino acids have no acidic or basic groups': 'Every amino acid has –COOH (acidic) and –NH₂ (basic).', 'Blood is strongly acidic': 'Blood is slightly basic (pH 7.4).', 'Zwitterions are covalent molecules with no charges': 'Zwitterions carry both + and − charges.' },
  'Most amine drugs are absorbed mainly in the small intestine': { 'Amines are acids': 'Amines are bases.', 'Amines are destroyed by stomach acid': 'They aren’t destroyed; they are protonated.', 'The intestine has no membranes': 'The intestine is lined with membranes; that is how drugs are absorbed.' },
};
// ---------- metabolism diagram/exam leftovers (keyed by a piece of the question)
Object.assign(HAND, {
  'Why does everything in steps 6–10 happen twice per glucose?': { 'Each step needs two enzymes': 'One enzyme per step; there are two 3-carbon molecules.', 'Glycolysis runs twice for every glucose': 'It runs once, but the split gives two 3-carbon halves.', 'Two ATP were spent': 'Spending ATP doesn’t double anything; the split does.' },
  'a 2° alcohol becomes a ketone': { 'Step 1': 'Step 1 makes a C=C with FAD.', 'Step 2': 'Step 2 adds water (hydration).', 'Step 4': 'Step 4 cuts off acetyl CoA.' },
  'Per glucose, how many ATP is the net gain?': { '4': '4 ATP are made, but 2 were spent: net 2.', '6': 'Only 4 ATP are made in glycolysis.', '0': 'More ATP is made (4) than spent (2).' },
  'Which product of the urea cycle goes on to the citric acid cycle?': { 'Urea': 'Urea goes to the kidneys.', 'Ornithine': 'Ornithine stays in the urea cycle.', 'Citrulline': 'Citrulline is an intermediate inside the cycle.' },
  'Which complex does not pump H': { 'Complex III': 'Complex III pumps H⁺.', 'Complex IV': 'Complex IV pumps H⁺.', 'Complex I': 'Complex I pumps H⁺.' },
  'How many CO 2 does one turn of the citric acid cycle make?': { '1': 'Count the CO₂ arrows: steps 3 and 4 each release one.', '3': 'Only two steps release CO₂ (3 and 4).', '4': 'That is per glucose (two turns), not per turn.' },
  'how many NADH does the citric acid cycle make per glucose?': { '4': '3 NADH per turn × 2 turns = 6.', '3': 'That is per turn. One glucose gives two turns.', '8': 'Count only NADH: 3 per turn × 2 = 6.' },
  'Which molecule is both the first reactant and the final product?': { 'Succinate': 'Succinate is in the middle of the cycle.', 'Citrate': 'Citrate is made in step 1 and is used up in step 2.', 'Acetyl CoA': 'Acetyl CoA enters and is burned; it isn’t made again.' },
  'It is made when fumarate is hydrated': { 'Citrate': 'Citrate is made when acetyl CoA joins oxaloacetate.', 'Pyruvate': 'Pyruvate isn’t in the citric acid cycle.', 'Oxaloacetate': 'Oxaloacetate comes after malate is oxidized.' },
  'How many NADH does one turn of the citric acid cycle make?': { '2': 'Count the NAD⁺ → NADH arrows: steps 3, 4 and 8.', '6': 'That is per glucose (two turns).', '1': 'Three steps make NADH (3, 4 and 8).' },
  'How many FADH 2 does one turn': { '3': 'Only step 6 uses FAD.', '2': 'That is per glucose (two turns).', '0': 'Step 6 (succinate → fumarate) makes one FADH₂.' },
  'Why is this pathway called β -oxidation?': { 'It uses vitamin B': 'β is the Greek letter for the second carbon, not vitamin B.', 'It only works on β-glucose': 'It works on fatty acids, not glucose.', 'It is the second pathway after glycolysis': 'β refers to the β carbon of the fatty acid.' },
  'Which part of glycolysis spends ATP?': { 'Only step 10': 'Step 10 makes ATP.', 'Steps 6–10, the energy payoff phase': 'Steps 6–10 make ATP.', 'None of the steps': 'Steps 1 and 3 each spend one ATP.' },
  'Cyanide binds the complex marked': { 'NADH is made faster': 'If the chain stops, NADH piles up rather than being made faster.', 'Only glycolysis stops': 'Glycolysis keeps going; the chain stops.', 'H + pumping speeds up': 'With electrons stuck, pumping stops.' },
  'In what form does the toxic NH 4 + enter the cycle?': { 'Urea': 'Urea is what leaves the cycle.', 'Free NH 3 gas': 'Ammonia is packaged first as carbamoyl phosphate.', 'Fumarate': 'Fumarate leaves the cycle.' },
  'Per glucose, how many ATP are made?': { '2': '2 is the net gain. Made: 4.', '6': 'Steps 7 and 10 each make 2 ATP: 4 total.', '8': 'Steps 7 and 10 each make 2 ATP: 4 total.' },
  'Per glucose, how many NADH are made?': { '4': 'Only step 6 makes NADH: 2 per glucose.', '6': 'Only step 6 makes NADH: 2 per glucose.', '1': 'Step 6 happens twice (two halves), so 2 NADH.' },
  'it is the molecule acetyl CoA joins in step 1': { 'Fumarate': 'Fumarate comes before malate.', 'Malate': 'Malate is the alcohol that is oxidized to make this.', 'Citrate': 'Citrate is the product of step 1, not what acetyl CoA joins.' },
  'Which side of the inner membrane has the higher H': { 'The cytosol outside the cell': 'The gradient is across the inner membrane.', 'The matrix': 'H⁺ is pumped out of the matrix, so it is lower there.', 'Both sides are equal': 'Pumping makes the sides unequal; that gradient drives ATP synthase.' },
  'Which molecule is made again at the end, so the cycle can repeat?': { 'Arginine': 'Arginine is split into urea and ornithine.', 'Aspartate': 'Aspartate enters the cycle; it isn’t made again.', 'Urea': 'Urea leaves the body.' },
  'Where do electrons from FADH 2 enter the chain?': { 'Complex III': 'FADH₂ gives electrons to Q through complex II first.', 'Complex I': 'Complex I takes electrons from NADH.', 'Complex IV': 'Complex IV is the last stop, passing electrons to O₂.' },
  'What is the final electron acceptor of the chain?': { 'NAD +': 'NAD⁺ is made back from NADH at the start.', 'FAD': 'FAD is made back from FADH₂.', 'H 2 O': 'Water is the product; O₂ is the acceptor.' },
  'It is made when FAD removes 2 H from succinate': { 'Malate': 'Malate comes next, when fumarate is hydrated.', 'Pyruvate': 'Pyruvate isn’t in the citric acid cycle.', 'Lactate': 'Lactate isn’t in the citric acid cycle.' },
  'How many GTP does one turn': { '0': 'Step 5 (succinyl CoA → succinate) makes one GTP.', '2': 'That is per glucose (two turns).', '3': 'Only step 5 makes GTP.' },
  'What does the protein marked with ★ do?': { 'Passes electrons to O 2': 'That is complex IV.', 'Turns NADH into NAD +': 'That is complex I.', 'Pumps H + out of the matrix using ATP': 'ATP synthase runs the other way: H⁺ flows in and ATP is made.' },
  'When ATP levels in a cell are high, phosphofructokinase is': { 'inhibited; speeds up': 'An inhibited enzyme slows the pathway.', 'activated; speeds up': 'High ATP inhibits PFK.', 'activated; slows down': 'High ATP inhibits PFK; activating would speed glycolysis.', 'unaffected; continues': 'ATP is a regulator of PFK.' },
  'Oxaloacetate, ⁻OOC–CO–CH 2 –COO⁻, undergoes transamination': { 'lysine': 'Lysine’s skeleton doesn’t match oxaloacetate.', 'tyrosine': 'Tyrosine has an aromatic ring; oxaloacetate doesn’t.', 'glutamate': 'Glutamate comes from α-ketoglutarate (5 C).', 'alanine': 'Alanine comes from pyruvate (3 C).' },
  'How many electrons are passed along when one FADH 2': { '3': 'FADH₂ carries 2 H, so 2 electrons.', '1': 'FADH₂ carries 2 H, so 2 electrons.', '4': 'That would be two FADH₂.', '0': 'FADH₂ gives up its electrons; that is its job.' },
  'Palmitoleic acid has 16 carbons and one cis double bond': { '5': 'Only one FAD step is skipped: 7 − 1 = 6.', '8': '16 carbons give 8 acetyl CoA but only 7 turns.', '14': 'Count turns, not carbons: 7 turns, minus 1.', '7': 'The existing C=C skips one FAD step: 7 − 1.' },
  'one step splits a six-carbon sugar into two three-carbon sugars': { 'a dehydrogenase': 'No hydrogens are removed in this step.', 'hexokinase': 'Hexokinase adds a phosphate (step 1).', 'an isomerase': 'An isomerase rearranges one molecule; it doesn’t split it.', 'pyruvate kinase': 'Pyruvate kinase is step 10, making ATP.' },
  'the O 2 we breathe in ends up as': { 'CO 2': 'The CO₂ comes from carbon in the fuel, not from O₂.', 'ATP': 'O₂ doesn’t become ATP.', 'NADH': 'NADH carries electrons to the chain; O₂ is at the other end.', 'urea': 'Urea comes from amino acid nitrogen.' },
  'the complete oxidation of one glucose yields': { '36 ATP': '36 or 38 uses the older 3 and 2 values per NADH and FADH₂.', '2 ATP': '2 ATP is glycolysis alone.', '38 ATP': '38 uses the older values (3 per NADH, 2 per FADH₂).', '12 ATP': 'That counts only part of the yield.' },
  'Which process does NOT take place in the mitochondrial matrix?': { 'the citric acid cycle': 'The citric acid cycle is in the matrix.', 'ketogenesis': 'Ketogenesis is in liver mitochondria.', 'pyruvate → acetyl CoA': 'Pyruvate dehydrogenase is in the matrix.', 'β-oxidation': 'β-Oxidation is in the matrix.' },
  'fructose 1,6-bisphosphate + H 2 O → fructose 6-phosphate': { 'a mutase': 'A mutase moves a phosphate within one molecule.', 'a synthetase': 'A synthetase uses ATP to join molecules.', 'a kinase': 'A kinase adds a phosphate from ATP.', 'a dehydrogenase': 'No hydrogens are removed.' },
  'made from pantothenic acid': { 'thiamine pyrophosphate': 'TPP is made from thiamine (B1).', 'FAD': 'FAD is made from riboflavin (B2).', 'NAD +': 'NAD⁺ is made from niacin (B3).', 'pyridoxal phosphate': 'PLP is made from pyridoxine (B6).' },
  'degraded to acetyl CoA are called': { 'glucogenic': 'Glucogenic skeletons become pyruvate or cycle intermediates.', 'essential': 'Essential means we must eat them.', 'nonessential': 'Nonessential means we can make them.', 'none of the above': 'The term is ketogenic.' },
  'Lactate builds up in muscle during strenuous exercise because': { 'too much O 2': 'The problem is too little O₂.', 'glycogen stores are full': 'Glycogen is being used up.', 'the urea cycle stops': 'The urea cycle is in the liver and unrelated.', 'β-oxidation produces lactate': 'β-Oxidation makes acetyl CoA.' },
  'glycerol released from a triacylglycerol': { 'It is broken down by β-oxidation': 'β-Oxidation breaks down fatty acids.', 'It is converted directly to urea': 'Glycerol has no nitrogen.', 'It cannot be used for energy': 'Glycerol can enter glycolysis as DHAP.', 'It is turned into ketone bodies': 'Ketone bodies come from acetyl CoA.' },
  'FAD is reduced to FADH 2 when a': { 'C–O single; C=O double': 'That is NAD⁺’s job (alcohol → ketone).', 'C=C double; C–C single': 'That is a reduction (hydrogenation).', 'C–H; C–OH': 'That isn’t an FAD reaction.', 'none of the above': 'FAD makes a C=C from C–C.' },
  'Glycogenolysis is a(n)': { 'anabolic; catabolic': 'Reversed: glycogenolysis breaks down.', 'catabolic; catabolic': 'Glycogenesis builds glycogen, so it is anabolic.', 'anabolic; anabolic': 'Glycogenolysis breaks glycogen down.', 'none of the above': 'Catabolic; anabolic is right.' },
  'removes CO 2 from a substrate without using ATP': { 'ligase': 'Ligases join molecules using ATP.', 'isomerase': 'Isomerases rearrange one molecule.', 'oxidoreductase': 'No redox happens.', 'hydrolase': 'No water is used.' },
  'The positive charge in NAD + is located on the': { 'phosphate groups': 'Phosphates are negative.', 'adenine ring': 'Adenine isn’t charged in NAD⁺.', 'ribose sugar': 'Ribose isn’t charged.', 'none of the above': 'It is on the nicotinamide N.' },
  'malate (a 2° alcohol) is oxidized to oxaloacetate': { 'coenzyme A': 'CoA carries acyl groups.', 'FAD': 'FAD makes C=C bonds.', 'ATP': 'ATP carries phosphates.', 'NADPH': 'NADPH is a reducing agent for building.' },
  'Each turn of the citric acid cycle releases': { '1; 3': 'Two steps release CO₂.', '4; 6': 'That is per glucose.', '2; 2': 'Three steps make NADH.', '3; 2': 'Two CO₂ and three NADH.' },
  'CH 3 –CH(OH)–CH 2 –COO⁻ is oxidized by NAD': { 'CH 3 –CH 2 –CH 2 –COO⁻': 'That removed the –OH (reduction).', 'CH 3 –CO–CH 3': 'That is acetone, made by decarboxylating acetoacetate.', 'CH 3 –CH=CH–COO⁻': 'That is dehydration.', 'none of the above': 'The 2° alcohol becomes a ketone: acetoacetate.' },
  'Which statement about NADPH is TRUE?': { 'It is the final electron acceptor': 'O₂ is the final acceptor.', 'It is the oxidized form of NADP': 'NADPH is the reduced form.', 'It is the coenzyme used in β-oxidation': 'β-Oxidation uses FAD and NAD⁺.', 'It contains riboflavin': 'NADPH comes from niacin (B3).' },
  'Ketone bodies are made in the': { 'liver; pyruvate': 'Ketone bodies come from acetyl CoA.', 'muscle; lactate': 'The liver makes ketone bodies.', 'kidneys; urea': 'Urea is unrelated.', 'brain; glucose': 'The brain uses ketone bodies but doesn’t make them.' },
  'Which pathway converts acetyl CoA into fatty acids': { 'ketogenesis': 'Ketogenesis makes ketone bodies.', 'gluconeogenesis': 'Gluconeogenesis makes glucose.', 'β-oxidation': 'β-Oxidation breaks fatty acids down.', 'glycogenesis': 'Glycogenesis makes glycogen.' },
  'Which pair of molecules leaves the urea cycle as products?': { 'CO 2 and NH 3': 'These enter (as carbamoyl phosphate).', 'urea and aspartate': 'Aspartate enters.', 'ornithine and citrulline': 'These stay in the cycle.', 'NH 4 + and ornithine': 'NH₄⁺ enters; ornithine is recycled.' },
  'the substrate is ________ and FAD is': { 'hydrated; dehydrated': 'No water is involved.', 'reduced; oxidized': 'Reversed: the substrate loses H.', 'oxidized; oxidized': 'In redox, one is oxidized and one is reduced.', 'reduced; reduced': 'In redox, one is oxidized and one is reduced.' },
  'A saturated fatty acid with 12 carbons gives': { '12; 11': 'Each acetyl CoA has 2 carbons: 12 ÷ 2 = 6.', '12; 6': '12 carbons give 6 acetyl CoA.', '6; 6': 'The last turn releases two acetyl CoA: 5 turns.', '5; 6': 'Reversed: 6 acetyl CoA in 5 turns.' },
  'Hydrolysis of ATP to ADP': { 'exothermic; release': 'It is coupled to reactions that need energy.', 'endothermic; release': 'ATP hydrolysis releases energy.', 'endothermic; require': 'ATP hydrolysis is exothermic.', 'none of the above': 'Exothermic; require is right.' },
  'Which compound is NOT formed during β-oxidation': { 'trans-enoyl CoA': 'Made in step 1.', 'acetyl CoA': 'Made in step 4.', 'β-hydroxyacyl CoA': 'Made in step 2.', 'β-ketoacyl CoA': 'Made in step 3.' },
});

// ---------- rule tables
const SHAPES = { 'Linear': [[2, 0], [5, 3]], 'Bent': [[3, 1], [4, 2]], 'Trigonal planar': [[3, 0]], 'Tetrahedral': [[4, 0]], 'Trigonal pyramidal': [[4, 1]], 'Trigonal bipyramidal': [[5, 0]], 'Seesaw': [[5, 1]], 'T-shaped': [[5, 2]], 'Octahedral': [[6, 0]], 'Square pyramidal': [[6, 1]], 'Square planar': [[6, 2]] };
const HYB = { 'sp': 2, 'sp²': 3, 'sp³': 4, 'sp³d': 5, 'sp³d²': 6 };
const COENZ = { 'NAD +': 'NAD⁺ takes 2 H when an alcohol becomes a C=O (oxidation).', 'NADH': 'NADH gives 2 H in a reduction (C=O → alcohol).', 'NADPH': 'NADPH gives H in building pathways like lipogenesis.', 'FAD': 'FAD takes 2 H to make a C=C.', 'ATP / ADP': 'ATP gives a phosphate (phosphorylation) or pays for joining CO₂.', 'Coenzyme A': 'Coenzyme A carries acyl groups (thioesters).', 'PLP (vitamin B 6 )': 'PLP carries amino groups in transamination.', 'None': 'Some steps need no coenzyme, but this one shows a coenzyme change.' };
const ENZYME = { 'enoyl CoA hydratase': 'adds water across a C=C (β-oxidation step 2)', 'β-hydroxyacyl CoA dehydrogenase': 'oxidizes an alcohol to a ketone with NAD⁺ (β-oxidation step 3)', 'transaminase (PLP)': 'moves an amino group', 'aldolase': 'splits a 6-carbon sugar into two 3-carbon sugars', 'phosphoglycerate mutase': 'moves a phosphate from C3 to C2', 'glycerol kinase': 'adds a phosphate from ATP to glycerol', 'pyruvate decarboxylase (yeast)': 'removes CO₂ from pyruvate', 'enolase': 'removes water to make PEP', 'argininosuccinate synthetase': 'joins citrulline and aspartate using ATP', 'α-ketoglutarate dehydrogenase': 'oxidatively decarboxylates α-ketoglutarate', 'dehydratase (lipogenesis)': 'removes water to make a C=C', 'phosphoglucomutase': 'moves a phosphate between C1 and C6 of glucose', 'succinate dehydrogenase': 'oxidizes succinate to fumarate with FAD', 'pyruvate dehydrogenase': 'turns pyruvate into acetyl CoA', 'glutamate dehydrogenase': 'removes the amino group of glutamate as NH₄⁺', 'arginase': 'hydrolyzes arginine to urea and ornithine' };
const PART = { Oxidation: 'Oxidation means losing H (NAD⁺ or FAD takes them).', Reduction: 'Reduction means gaining H from NADH or NADPH. Here NAD⁺ is used up as a reactant, so the substrate is oxidized.', Decarboxylation: 'Decarboxylation means CO₂ leaves.', Carboxylation: 'Carboxylation means CO₂ is added. Here CO₂ leaves.', Deamination: 'Deamination means an amino group leaves as NH₄⁺.', Transamination: 'Transamination swaps an amino group onto a keto acid. Here NH₄⁺ is released instead.', Hydrolysis: 'Hydrolysis means water splits a bond (the thioester here).', Condensation: 'Condensation joins two molecules and releases a small one. Here a thioester is split.', Phosphorylation: 'Phosphorylation adds a phosphate (to GDP here).', 'Phosphate transfer': 'Phosphate transfer moves a phosphate from the substrate to ADP; here the substrate has no phosphate to give.' };
const RXT = { 'Hydration': 'H₂O adds across a C=C to make an alcohol.', 'Hydrogenation': 'H₂ adds across a C=C or C≡C.', 'Hydrohalogenation': 'HCl or HBr adds across a C=C.', 'Halogenation (addition)': 'Cl₂ or Br₂ adds across a C=C.', 'Halogenation (substitution)': 'A halogen replaces an H on an alkane (with light).', 'Hydrolysis': 'Water splits one molecule (an ester or amide) into two.', 'Esterification': 'An acid + an alcohol make an ester + water.', 'Amidation': 'An acid + an amine (or NH₃) make an amide + water.', 'Neutralization': 'An acid + a base make a salt.', 'Saponification': 'NaOH splits an ester into a carboxylate salt and an alcohol.', 'Dehydration': 'An alcohol loses H₂O to make an alkene.', 'Oxidation': 'A carbon gains O or loses H (alcohol → aldehyde/ketone → acid).', 'Reduction': 'A carbon gains H or loses O.', 'Combustion': 'A fuel burns in O₂ to make CO₂ and H₂O.', 'Hemiacetal formation': 'One alcohol adds to a C=O.', 'Acetal formation': 'Two alcohols react with a C=O and water is released.', 'Condensation': 'Two molecules join and release a small molecule (usually H₂O).', 'Addition': 'Atoms add across a double or triple bond, which becomes a single bond.', 'Elimination': 'A small molecule leaves and a double bond forms.', 'Substitution': 'One atom or group is swapped for another.', 'Acid–base': 'An H⁺ moves from an acid to a base.' };
const ORG = { 'Alkane': 'only C–C and C–H single bonds', 'Alkene': 'a C=C double bond', 'Alkyne': 'a C≡C triple bond', 'Aromatic (arene)': 'a benzene ring', 'Haloalkane (alkyl halide)': 'a halogen (F, Cl, Br, I) on a carbon', 'Alcohol': 'an –OH on a carbon with only single bonds', 'Ether': 'an O between two carbons (C–O–C)', 'Thiol': 'an –SH on a carbon', 'Sulfide (thioether)': 'an S between two carbons (C–S–C)', 'Disulfide': 'two S bonded to each other (C–S–S–C)', 'Aldehyde': 'a C=O at the end of a chain with an H on it', 'Ketone': 'a C=O with carbons on both sides', 'Carboxylic acid': 'a C=O and –OH on the same carbon (–COOH)', 'Ester': 'a C=O next to an O that leads to another carbon (–COO–C)', 'Amine': 'an N with only single bonds to C and H', 'Amide': 'a C=O bonded directly to N (–CON)' };
const STEREO = { 'Constitutional isomers': 'same formula, atoms bonded in a different order', 'Chiral carbon': 'a carbon bonded to four different groups', 'Achiral': 'superimposable on its mirror image', 'Epimers': 'diastereomers that differ at only one chiral carbon', 'Enantiomers': 'nonsuperimposable mirror images', 'Diastereomers': 'stereoisomers that are not mirror images', 'Fischer projection': 'a flat drawing where horizontal lines come toward you', 'Stereoisomers': 'same bonding order, different arrangement in space', 'Dash bond': 'a hashed bond pointing away from you', 'Racemic mixture': 'a 50:50 mixture of two enantiomers', 'Wedge bond': 'a solid bond pointing toward you', 'Chiral': 'not superimposable on its mirror image', 'Optically active': 'able to rotate plane-polarized light', 'Meso compound': 'a molecule with chiral carbons that is still achiral' };
const LAWS = { 'Boyle’s law': 'Boyle’s law: P and V, inverse (T, n constant).', 'Charles’s law': 'Charles’s law: V and T, direct (P, n constant).', 'Gay-Lussac’s law': 'Gay-Lussac’s law: P and T, direct (V, n constant).', 'Avogadro’s law': 'Avogadro’s law: V and n, direct (P, T constant).' };
const CHG = { '3−': -3, '2−': -2, '1−': -1, '1+': 1, '2+': 2 };

function hand(p) { for (const k of Object.keys(HAND)) if (HAND[k] && p.includes(k)) return HAND[k]; }
function fromHand(h, c) { const t = tight(c), pc = plain(c); const k = Object.keys(h).find(k => pc === k || pc.startsWith(k) || t === k || t.startsWith(k)); return k ? h[k] : ''; }

function rule(item) {
  const p = plain(item.prompt), ex = plain(item.explain), ans = plain(item.answer), ch = item.choices.map(plain), sk = item.skill.split('.').pop();
  const one = f => ch.map(c => c === ans ? '' : (f(c) || ''));
  let m;
  // Lewis/VSEPR (Bridge to 1B)
  if (/Find: Molecular geometry/.test(p) && (m = ex.match(/(\d) bonded groups? \+ (\d) lone pairs? = (\d) groups/))) { const [b, l, g] = [+m[1], +m[2], +m[3]];
    return one(c => SHAPES[c] ? `${c} needs ${SHAPES[c].map(([G, L]) => `${G} electron groups with ${L} lone pair${L === 1 ? '' : 's'}`).join(' or ')}. This atom has ${g} (${b} bonded + ${l} lone pair${l === 1 ? '' : 's'}).` : ''); }
  if (/Find: Central hybridization/.test(p) && (m = ex.match(/= (\d) groups/))) return one(c => HYB[c] ? `${c} goes with ${HYB[c]} electron groups. This atom has ${m[1]}.` : '');
  if (/Find: Molecule polarity/.test(p)) return one(c => c === 'Polar' ? 'Polar needs bond dipoles that don’t cancel. Here identical outer atoms sit symmetrically around the center, so they cancel.' : 'Nonpolar needs the bond dipoles to cancel. Here lone pairs or different outer atoms make the shape lopsided, so they don’t.');
  if (/Find: Magnetic behavior/.test(p)) { const occ = (ex.match(/Correct MO occupation: ([^.]*)/) || [])[1] || ''; const un = (occ.match(/↑(?!↓)/g) || []).length + (occ.match(/(?<!↑)↓/g) || []).length;
    return one(c => c === 'Paramagnetic' ? 'Paramagnetic needs at least one unpaired electron. Fill the MO diagram: every electron here ends up paired.' : `Diamagnetic needs every electron paired. Fill the MO diagram: ${un ? un + ' electron' + (un > 1 ? 's are' : ' is') : 'some electrons are'} left unpaired.`); }
  if (/Which metal is it\?/.test(p) && (m = ex.match(/([\d.]+) g\/cm³ is closest/))) { const d = {}; for (const x of p.matchAll(/(Iron|Copper|Silver|Lead|Gold) ([\d.]+) g\/cm³/g)) d[x[1]] = x[2];
    return one(c => d[c] ? `${c} has a density of ${d[c]} g/cm³. Your density is ${m[1]} g/cm³ (mass ÷ the volume the water rose).` : ''); }
  if (/Heat acts like a/.test(p)) return one(c => c === 'Reactant' ? 'Heat is a reactant only when ΔH is positive (endothermic). Here ΔH is negative.' : 'Heat is a product only when ΔH is negative (exothermic). Here ΔH is positive.');
  // carbohydrate labeled atoms
  if (/^Atom /.test(ch[0])) { const parts = {}; for (const x of ex.matchAll(/\b([a-d]) = ([^;]+?)(?=;|\. The answer)/g)) parts[x[1]] = x[2];
    return one(c => { const L = c.slice(-1); return parts[L] ? `Atom ${L} is ${parts[L]}.` : ''; }); }
  // functional groups: med labels
  if (/^Label /.test(ch[0]) && (m = ex.match(/Label ([A-C]) is the ([^:]+): it ([^💡]*)/))) return one(c => `${c} marks a different part of the molecule. The ${m[2]} ${m[3].trim().replace(/^has|^is/, x => x === 'has' ? 'has' : 'is')}`);
  // cofactor/coenzyme classification
  if (ch.some(c => /^Cofactor \(inorganic/.test(c))) return one(c => /^Cofactor/.test(c) ? 'A cofactor here means an inorganic metal ion. This is an organic molecule made from a vitamin.' : /^Coenzyme/.test(c) ? 'A coenzyme is an organic molecule made from a vitamin. This is a metal ion.' : c === 'Substrate' ? 'The substrate is the molecule the enzyme acts on. This helps the enzyme work.' : c === 'Inhibitor' ? 'An inhibitor slows an enzyme. The enzyme needs this to work.' : '');
  // enzyme regulation pictures
  if (/kind of control is shown|regulation called|This control is called|This is an example of/.test(p)) { const D = { 'Positive allosteric': 'Positive allosteric control makes the active site bind substrate better.', 'Negative allosteric': 'Negative allosteric control makes the active site bind substrate less well.', 'Competitive inhibition': 'A competitive inhibitor sits in the active site itself, not at another site.', 'Zymogen activation': 'Zymogen activation cuts a chain to switch an enzyme on; it isn’t reversible regulation.', 'Covalent modification': 'Covalent modification adds or removes a group (like phosphate) with a covalent bond.', 'Allosteric control': 'Allosteric control is a regulator binding another site, with no covalent bond.', 'Feedback': 'Feedback control is a product slowing an earlier step.', 'Denaturation': 'Denaturation destroys the shape; nothing is switched on.' };
    return one(c => { const k = Object.keys(D).find(k => c.startsWith(k)); return k ? D[k] + ' ' + ex.split('. ')[0] + '.' : ''; }); }
  // gas laws
  if ((m = p.match(/If the (pressure|volume|temperature|moles of gas) of a gas (increases|decreases) \(with (.+?) constant\), the (\w[\w ]*?) …/))) return one(c => c === 'stays the same' ? `${m[4].charAt(0).toUpperCase() + m[4].slice(1)} changes when ${m[1]} changes with ${m[3]} held constant. ` + ex.replace(/^Relationship: /, '') : `Check the relationship: ${ex.replace(/^Relationship: /, '').replace(/ : /g, ': ')}`);
  if (ch.every(c => LAWS[c])) return one(c => LAWS[c]);
  if (ch.length === 2 && /Boyle|Charles|Gay-Lussac|Avogadro/.test(ex)) return one(c => `That goes the wrong way. ${ex}`);
  if (/what is its identity\?/.test(p) && !(m = ex.match(/Molar mass: .*?= ([\d.]+) g\/mol/))) { const g = p.match(/A ([\d.]+) g sample of a gas occupies ([\d.]+) L at (STP|([\d.]+) (atm|mmHg|torr|kPa) and (-?[\d.]+) °C)/);
    if (g) { let n; if (g[3] === 'STP') n = +g[2] / 22.4; else { const P = +g[4] / ({ atm: 1, mmHg: 760, torr: 760, kPa: 101.325 })[g[5]]; n = P * +g[2] / (0.08206 * (+g[6] + 273.15)); } m = [0, (+g[1] / n).toPrecision(4)]; } }
  if (/what is its identity\?/.test(p) && m) return one(c => { const x = c.match(/\(([\d.]+)\)/); return x ? `${c.split(' (')[0].replace(/ /g, '')} has a molar mass of ${x[1]} g/mol. Your calculated molar mass is ${m[1]} g/mol (grams ÷ moles).` : ''; });
  // metabolism leftovers
  if (/it is really two reactions\. Which two\?/.test(p)) { const A = ans.split(' and '); return one(c => c.split(' and ').filter((x, i) => x !== A[i]).map(x => PART[x] || '').join(' ')); }
  if (/Which coenzyme does this step use\?/.test(p)) return one(c => COENZ[c] ? `${COENZ[c]} ${ex.split(' Coenzyme:')[0]}` : '');
  if (/Which enzyme catalyzes this step\?/.test(p)) return one(c => ENZYME[c] ? `${c.charAt(0).toUpperCase() + c.slice(1)} ${ENZYME[c]}. ${ex.split(' Enzyme:')[0]}` : '');
  if (/how many acetyl CoA , NADH and FADH 2/.test(p) && (m = ex.match(/= (\d+) \. Acetyl CoA = \d+ ÷ 2 = (\d+)\. Turns = \d+ − 1 = (\d+)/))) return one(c => { const [a, n] = c.split(', ').map(Number); return a !== +m[2] ? `${m[1]} carbons ÷ 2 = ${m[2]} acetyl CoA, not ${a}.` : `${m[2]} acetyl CoA come from ${m[3]} turns (one fewer, since the last turn releases two), and each turn makes 1 NADH and 1 FADH₂: ${m[3]}, not ${n}.`; });
  // moles sense
  if (/What went wrong\?/.test(p)) return one(c => /^Nothing/.test(c) ? 'A visible sample has a huge number of particles (10²² or more). A number like 10⁻²⁵ is far too small.' : 'The molar mass is fine; the tiny answer means they divided by Avogadro’s number instead of multiplying.');
  if (/About how many particles/.test(p)) return one(c => /100/.test(c) ? 'Even a tiny sample has trillions of trillions of particles, not 100.' : 'You can’t have less than one particle; a negative exponent this size is far too small.');
  if (/What do we call the individual particles/.test(p)) return one(c => c === 'atoms' ? 'Atoms is right only for elements made of single atoms (like metals or noble gases).' : c === 'molecules' ? 'Molecules are for covalent substances (nonmetals sharing electrons). A metal is made of atoms.' : 'Formula units are for ionic compounds (a metal with a nonmetal).');
  if (/Which has the greater mass/.test(p)) return one(c => /same mass/.test(c) ? 'One mole has the same number of particles, but not the same mass: each mole weighs its molar mass. ' + ex.split(' Same')[0] : 'One mole weighs its molar mass. ' + ex.split(' Same')[0]);
  if (/contains more moles/.test(p)) return one(c => /^Same/.test(c) ? 'Equal grams aren’t equal moles: moles = grams ÷ molar mass. ' + ex.split(' Lighter')[0] : 'Moles = grams ÷ molar mass. The bigger molar mass gives fewer moles. ' + ex.split(' Lighter')[0]);
  if (/contains the most atoms/.test(p)) return one(c => 'Equal moles means equal particles, so count atoms per formula. ' + ex.split('. ').slice(1, 2).join('') + '.');
  if (/contains more particles/.test(p)) return one(c => 'Equal moles always means equal numbers of particles. Only the masses differ.');
  if (/atoms are in [\d.]+ mol of \w+ 2 gas/.test(p)) return one(c => 'Each molecule is diatomic: 2 atoms per molecule. Multiply moles × 2 × 6.0221 × 10²³. ' + ex.split('. ').pop());
  // stoichiometry
  if (/Which conversion factor do you multiply by\?/.test(p) && (m = p.match(/moles of (.+?) and want moles of (.+?) \./))) { const [have, want] = [m[1].replace(/ /g, ''), m[2].replace(/ /g, '')];
    return one(c => { const mm = c.match(/^(\d+) (mol|g) (.+) (\d+) (mol|g) (.+)$/); if (!mm) return ''; mm[3] = mm[3].replace(/ /g, ''); mm[6] = mm[6].replace(/ /g, '');
      if (mm[2] === 'g') return 'Coefficients give mole ratios, not gram ratios.';
      if (mm[3] === have && mm[6] === want) return 'Upside down. Put what you want on top and what you have on the bottom so it cancels.';
      if (mm[3] !== want || mm[6] !== have) return `That ratio uses the wrong substance. You need mol ${m[2]} on top and mol ${m[1]} on the bottom.`;
      return 'Use the coefficients from the balanced equation, not 1:1.'; }); }
  if (/limiting reactant/.test(p)) return one(c => `${c} would make more product. The limiting reactant is the one that makes the least. ` + ex.split(' Compare')[0]);
  if (/Which ingredient limits/.test(p)) return one(c => { const x = ex.match(new RegExp('From ' + c.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ': .*? = (\\d+) waffles')); const prod = (p.match(/→ \d+ ([a-z][a-z ]*?)(?= You| \.|$)/) || [, 'products'])[1]; return x ? `${c} could make ${x[1]} ${prod}. The ingredient that makes the fewest ${prod} limits you.` : `Divide what you have of each ingredient by what the recipe needs. ${c} isn’t the one that runs out first; the ingredient that makes the fewest ${prod} limits you.`; });
  // polyatomic charges
  if ((m = p.match(/charge on the (.+?) ion/))) { const r = CHG[ans]; return one(c => CHG[c] == null ? '' : Math.sign(CHG[c]) !== Math.sign(r) ? (r > 0 ? `${m[1]} is one of the few positive polyatomic ions (with ammonium and hydronium).` : 'Almost all polyatomic ions are negative. The positive ones are ammonium, hydronium and mercury(I).') : `${m[1].charAt(0).toUpperCase() + m[1].slice(1)} has a ${ans} charge, not ${c}. Check the Green Sheet.`); }
  // intro organic
  if (ch.every(c => ORG[c])) return one(c => `${c} needs ${ORG[c]}. ${/is in this structure/.test(p) ? '' : 'This compound has ' + ORG[ans] + '.'}`.trim());
  if (/What type of reaction is this\?|Which general class of reaction is this\?/.test(p)) return one(c => RXT[c] ? `${c}: ${RXT[c].charAt(0).toLowerCase() + RXT[c].slice(1)} This reaction is ${/^[AEIOU]/.test(ans) ? 'an' : 'a'} ${ans.toLowerCase()} reaction.`.replace(/: h₂/i, ': H₂').replace(/: hCl/, ': HCl').replace(/: cl₂/, ': Cl₂').replace(/: nAOH/i, ': NaOH') : '');
  if (ch.every(c => STEREO[c])) return one(c => `${c} means ${STEREO[c]}.`);
  // galvanic cells
  if (/Which electrode is the (anode|cathode)/.test(p)) return one(c => /anode/.test(p) ? `${c} has the higher (more positive) E°, so it is reduced: it is the cathode.` : `${c} has the lower E°, so it is oxidized: it is the anode.`);
  if (/Which cell notation is written correctly\?/.test(p)) { const an = ans.split(' | ')[0]; return one(c => c.startsWith(an) ? 'Each half-cell is written solid | its own ion. Keep each metal next to its own ion.' : c.split(' ')[0].includes('(aq)') ? 'Each side starts with the electrode on the outside: solid | ion || ion | solid.' : 'Anode (oxidized, lower E°) goes on the left; cathode on the right.'); }
  if (/Which way do electrons flow/.test(p)) return one(c => 'Electrons leave the anode (oxidation) and flow to the cathode. ' + ex.split('. ')[0] + '.');
  if (/anions in the salt bridge move/.test(p)) return one(c => 'Anions move toward the anode, where positive ions are being made. ' + ex.split('. ')[0] + '.');
  if (/Which electrode gains mass/.test(p)) return one(c => 'The anode is oxidized and dissolves into ions, so it loses mass. Metal plates out at the cathode.');
  // REDOX concepts with equations
  if ((m = p.match(/Which species (is oxidized|is reduced|is the reducing agent|is the oxidizing agent)\? (.+)$/))) { const [L, R] = m[2].split('→'); const goes = {}; for (const x of ex.matchAll(/(\w+) goes ([^;.]+)/g)) goes[x[1]] = x[2];
    return one(c => { const el = (c.match(/^\d*\s*([A-Z][a-z]?)/) || [])[1]; if (R.includes(c)) return `${c} is a product. The ${/agent/.test(m[1]) ? 'agent' : 'species'} asked about is a reactant on the left side.`;
      const rolesO = /oxidized|reducing/.test(m[1]); return `${c}: ${el} goes ${goes[el] || '?'}, so it is ${rolesO ? 'reduced (the oxidizing agent)' : 'oxidized (the reducing agent)'}.`; }); }
  if (/contains \w+ with the (LOWEST|HIGHEST) oxidation number/.test(p)) { const ox = {}; for (const x of ex.matchAll(/([A-Za-z₀-₉⁺⁻²³⁴]+) = ([+−-]?\d+)/g)) ox[x[1]] = x[2]; return one(c => ox[c] != null ? `In ${c} the oxidation number is ${ox[c]}.` : ''); }
  if (/Will this reaction occur\?/.test(p)) return one(c => c === 'Yes' ? 'A metal (or halogen) can only displace one below it in the activity series. ' + ex : 'A metal higher in the activity series does displace the ions of a lower one. ' + ex);
}

module.exports = function fillWhy(item) {
  if (!item.choices || !item.choices.length || item.type === 'number' || item.type === 'text') return;
  const ans = plain(item.answer), ch = item.choices.map(plain);
  const have = Array.isArray(item.why) ? item.why.slice() : ch.map(() => '');
  if (ch.every((c, i) => c === ans || have[i])) return;
  const h = hand(plain(item.prompt)), r = rule(item) || [];
  const out = ch.map((c, i) => c === ans ? '' : (have[i] || (h && fromHand(h, c)) || r[i] || ''));
  if (out.some(Boolean)) item.why = out;
};

return module.exports; })();
M["quantum"] = (function () { const module = { exports: {} }; const exports = module.exports;
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

return module.exports; })();
M["thermo"] = (function () { const module = { exports: {} }; const exports = module.exports;
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

  if (ch.every(c => /=/.test(c)) && /Rearrangement|Equation|equation/.test(p)) return one(c => /nΔH/.test(c) && !/nΔH/.test(ans) ? 'q = nΔH is for a phase change at constant temperature. This step changes temperature, so start from q = mcΔT.'
    : /mcΔT|q\s*\/|cΔT/.test(c) && /nΔH/.test(ans) ? 'q = mcΔT is for a temperature change. This step is a phase change at constant temperature, so use q = nΔH.'
    : `That isn’t equal to ${ans}. Start from q = mcΔT with ΔT = Tf − Ti, then undo one operation at a time to get the unknown by itself.`);
  if (ch.every(c => /^(Absorbs|Releases) heat/.test(c))) return one(c => /^Absorbs/.test(c) ? 'Absorbing heat means energy is a reactant (endothermic). ' + ex : 'Releasing heat means energy is a product (exothermic). ' + ex);
  if (ch.every(c => /^(Positive|Negative)$/.test(c))) return one(c => c === 'Positive' ? 'q is positive only when heat flows into the system (endothermic). ' + ex : 'q is negative only when heat flows out of the system (exothermic). ' + ex);
  if (ch.every(c => /^q = (mcΔT|nΔH)$/.test(c))) return one(c => /nΔH/.test(c) ? 'q = nΔH is for a phase change, a flat plateau at constant temperature. This segment slopes, so the temperature is changing: q = mcΔT.' : 'q = mcΔT is for a temperature change, a sloped segment. This segment is flat (a phase change), so use q = nΔH.');
  if (ch.every(c => /^(Decreases|Remains constant|Increases)$/.test(c))) return one(c => c === 'Remains constant' ? 'Temperature stays constant only on a flat plateau (a phase change). This segment slopes.' : c === 'Increases' ? (/removed/.test(p) ? 'Heat is being removed, so the temperature can’t rise.' : 'Check the slope: on a heating curve, a sloped segment rises.') : (/added/.test(p) ? 'Heat is being added, so the temperature can’t fall.' : 'Check the slope of this segment.') + ' ' + ex);
  if (/Phases in equilibrium/.test(p)) return one(c => ex.replace(/^Identify point \w+: /, '') + ` ${c} would be a ${/only/.test(c) ? 'point on a single line or inside one region' : 'point away from all the lines'}.`);
  if (/Pressure-volume work/.test(p)) return one(c => 'Pressure–volume work needs a volume change (w = −PΔV). In a rigid bomb ΔV = 0, so w = 0.');
  if (ch.every(c => /^(Absorbed|Released) \((endo|exo)thermic\)$/.test(c))) return one(c => /Absorbed/.test(c) ? 'A negative ΔH means heat is released, not absorbed. ' + ex : 'A positive ΔH means heat is absorbed, not released. ' + ex);
};

return module.exports; })();
M["lewis"] = (function () { const module = { exports: {} }; const exports = module.exports;
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

return module.exports; })();
M["elements"] = (function () { const module = { exports: {} }; const exports = module.exports;
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

return module.exports; })();
M["carbs"] = (function () { const module = { exports: {} }; const exports = module.exports;
// Per-choice feedback rules for the carbohydrates game (used by tools/samplers/carbohydrates.js and, via whys.js, by the game itself).
// ---------- Per-choice feedback ("why"), built from the sugar table (SUG) and each item's own text ----------
const plainT = x => String(x == null ? '' : x).replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
const SIZE = { tri: 3, tetr: 4, pent: 5, hex: 6 }, SIZEW = { 3: 'triose', 4: 'tetrose', 5: 'pentose', 6: 'hexose' };
const DISACC = { maltose: ['glucose + glucose', 'α(1→4)'], cellobiose: ['glucose + glucose', 'β(1→4)'], lactose: ['galactose + glucose', 'β(1→4)'], sucrose: ['glucose + fructose', 'α(1→2)β'], isomaltose: ['glucose + glucose', 'α(1→6)'] };
const POLY = { amylose: 'Amylose is unbranched plant starch: glucose with α(1→4) links only.', amylopectin: 'Amylopectin is branched plant starch: α(1→4) chains with α(1→6) branches about every 25 glucose.',
  glycogen: 'Glycogen is the animal storage form (liver and muscle): like amylopectin but even more branched.', cellulose: 'Cellulose is the unbranched structural polymer of plant cell walls, with β(1→4) links.' };
const LINK = { 'α(1→4)': 'α(1→4) joins C1 (anomeric –OH down) to C4 of the next ring, as in maltose and starch.', 'β(1→4)': 'β(1→4) joins C1 (anomeric –OH up) to C4 of the next ring, as in lactose, cellobiose and cellulose.',
  'α(1→6)': 'α(1→6) joins C1 to the C6 (–CH2–) of the next unit: the branch points of amylopectin and glycogen.', 'α(1→2)β': 'α(1→2)β joins C1 of glucose to C2 of fructose, using both anomeric carbons: that is sucrose.' };
const SUFFIX = [[/itol\b/, 'An -itol (sugar alcohol) comes from reducing the C1 –CHO to –CH2OH.'], [/aric acid/, 'An -aric acid comes from strong oxidation (HNO3) of both ends: C1 and C6 become –COOH.'],
  [/uronic acid/, 'A -uronic acid comes from enzyme oxidation of C6 only; the –CHO at C1 stays.'], [/onic acid/, 'An -onic acid comes from mild oxidation of the C1 –CHO only (Benedict’s or Tollens’).']];
const RXN = { mild: 'Mild oxidation (Benedict’s or Tollens’) changes only C1: –CHO → –COOH. The bottom –CH2OH stays.', strong: 'Strong oxidation (HNO3) changes both ends: C1 and C6 both become –COOH.',
  enzyme: 'Enzyme oxidation changes only C6: –CH2OH → –COOH. The –CHO at C1 stays.', red: 'Reduction changes only C1: –CHO → –CH2OH, giving a sugar alcohol.' };
const rxnKey = c => /mild/.test(c) ? 'mild' : /strong/.test(c) ? 'strong' : /C6 only/.test(c) ? 'enzyme' : /reduction/.test(c) ? 'red' : '';
const REL = { 'Enantiomers': 'Enantiomers are mirror images: every chiral –OH flips (the same name, D vs L).', 'Epimers': 'Epimers have the same formula and differ at exactly one chiral carbon.',
  'Structural isomers': 'Structural isomers have the same formula but different connections, such as an aldose and a ketose.', 'Not isomers': 'Not isomers means the formulas differ, for example a different number of carbons.' };
function sugarWhy(it, SUG) {
  const p = plainT(it.prompt), ans = plainT(it.answer), ex = plainT(it.explain), ch = it.choices.map(plainT), sk = it.skill.split('.')[1];
  const cap = t => t && /^[a-z]/.test(t) ? t.charAt(0).toUpperCase() + t.slice(1) : (t || ''), one = f => ch.map(c => c === ans ? '' : cap(f(c) || ''));
  const parseSug = t => { const m = t.match(/^([DL])-(\w+)$/); return m && SUG[m[2]] ? { dl: m[1], name: m[2], ...SUG[m[2]] } : null; };
  const kind = (t, n) => (t === 'aldo' ? 'aldo' : 'keto') + SIZEW[n];
  if (sk === 'classify') {
    const m = ans.match(/^(aldo|keto)(tri|tetr|pent|hex)ose$/); if (!m) return;
    return one(c => { const w = c.match(/^(aldo|keto)(tri|tetr|pent|hex)ose$/); if (!w) return; const out = [];
      if (w[1] !== m[1]) out.push(w[1] === 'keto' ? 'A ketose has its C=O on C2, inside the chain. This sugar has an aldehyde (–CHO) at C1.' : 'An aldose has an aldehyde (–CHO) at C1. This sugar’s C=O is on C2, inside the chain, so it is a ketose.');
      if (w[2] !== m[2]) out.push(`-${w[2]}ose means ${SIZE[w[2]]} carbons; this sugar has ${SIZE[m[2]]}.`);
      return out.join(' '); });
  }
  if (sk === 'fischer') {
    if (/D-sugar or an L-sugar/.test(p)) return one(c => c === 'D-sugar' ? 'D means the –OH on the last chiral carbon (the one farthest from the C=O) is on the right. Here it is on the left.' : 'L means the –OH on the last chiral carbon (the one farthest from the C=O) is on the left. Here it is on the right.');
    const r = parseSug(ans); if (!r) return;
    return one(c => { const w = parseSug(c); if (!w) return;
      if (w.name === r.name) return `${c} is the mirror image: every –OH flips. Check the last chiral carbon: on the ${r.dl === 'D' ? 'right' : 'left'}, so this is ${r.dl}.`;
      if (w.n !== r.n) return `${c} is ${w.type === 'aldo' ? 'an' : 'a'} ${kind(w.type, w.n)} with ${w.n} carbons. Count the carbons here: ${r.n}.`;
      if (w.type !== r.type) return w.type === 'keto' ? `${c} is a ketose (C=O on C2). This sugar has –CHO at the top, so it is an aldose.` : `${c} is an aldose (–CHO at the top). This sugar has its C=O on C2, so it is a ketose.`;
      const flip = x => x === 'R' ? 'L' : 'R', rs = r.dl === 'D' ? r.sides : r.sides.map(flip), ws = w.dl === 'D' ? w.sides : w.sides.map(flip);
      const first = r.type === 'aldo' ? 2 : 3, diff = rs.map((v, i) => v !== ws[i] ? 'C' + (first + i) : '').filter(Boolean);
      return `${c} has a different –OH pattern${diff.length ? ` (it differs at ${diff.join(', ')})` : ''}. Read the –OH sides top to bottom and compare.`; });
  }
  if (sk === 'haworth') {
    if (/α or the β anomer/.test(p)) return one(c => /^α/.test(c) ? 'α has the anomeric –OH pointing down (opposite the –CH2OH). Here it points up.' : 'β has the anomeric –OH pointing up (same side as the –CH2OH). Here it points down.');
    const pr = t => { const m = t.match(/^([αβ])-D-(\w+?)(pyranose|furanose)$/); return m && { a: m[1], s: m[2].replace(/^gluco$/, 'glucose').replace(/^galacto$/, 'galactose').replace(/^fructo$/, 'fructose').replace(/^ribo$/, 'ribose'), ring: m[3] }; };
    const r = pr(ans); if (!r) return;
    return one(c => { const w = pr(c); if (!w) return; const out = [];
      if (w.ring !== r.ring) out.push(w.ring === 'pyranose' ? 'A pyranose is a six-membered ring (5 C + O). This ring has five atoms (a furanose).' : 'A furanose is a five-membered ring (4 C + O). This ring has six atoms (a pyranose).');
      else if (w.s !== r.s) out.push(w.s === 'galactose' && r.s === 'glucose' ? 'Galactose differs from glucose at C4: its C4 –OH points up in the ring. Here it points down.' : w.s === 'glucose' && r.s === 'galactose' ? 'Glucose has its C4 –OH pointing down in the ring. Here it points up, which is galactose.' : w.s === 'fructose' ? 'Fructose rings carry an extra –CH2OH on the anomeric carbon (C2). This ring doesn’t.' : w.s === 'ribose' ? 'Ribose has only one –CH2OH outside the ring and no extra carbon on the anomeric C. Compare the groups.' : `That is a ${w.s} ring. Compare the groups around this ring.`);
      if (w.a !== r.a) out.push(w.a === 'α' ? 'α means the anomeric –OH points down; here it points up (β).' : 'β means the anomeric –OH points up; here it points down (α).');
      return out.join(' '); });
  }
  if (sk === 'stereo') {
    if (/How many chiral carbons/.test(p)) { const n = +ans; return one(c => `Count again: this molecule has ${n} chiral carbon${n === 1 ? '' : 's'}. The –CHO, C=O and –CH2OH carbons are not chiral; only carbons with H and OH on the sides (four different groups) are.`); }
    return one(c => REL[c] ? `${REL[c]} ${ex}` : '');
  }
  if (sk === 'sugar-reactions') {
    if (/which reaction\?/.test(p)) return one(c => RXN[rxnKey(c)] ? `${RXN[rxnKey(c)]} Compare the top and bottom of the product with the starting sugar.` : '');
    if (/What do you observe\?/.test(p)) return one(c => /^Positive/.test(c) ? 'A positive test needs a free –CHO (a reducing sugar) to reduce blue Cu2+ to orange-red Cu2O. ' + ex : 'The solution stays blue only if there is no free –CHO to reduce the Cu2+. ' + ex);
    if (/ferments glucose/.test(p)) return one(c => /Lactic/.test(c) ? 'Lactic acid is what muscle (and some bacteria) make without O2. Yeast make ethanol.' : /Sorbitol/.test(c) ? 'Sorbitol comes from reducing glucose, not from fermentation.' : /Gluconic/.test(c) ? 'Gluconic acid comes from oxidizing glucose’s –CHO, not from fermentation.' : '');
    if (/What are the products\?/.test(p)) { const d = Object.entries(DISACC); return one(c => { const hit = d.filter(([n, v]) => v[0] === c).map(([n]) => n); return hit.length ? `${c} is what ${hit.join(' or ')} gives. ${ex}` : `No common disaccharide is made of ${c}. ${ex}`; }); }
    if (/disaccharide forms when/.test(p)) return one(c => DISACC[c] ? `${c} is ${DISACC[c][0]}.` : c === 'cellulose' ? 'Cellulose is a polysaccharide of many glucose units, not a disaccharide.' : '');
    const root = (ans.match(/^(\w+?)(itol|onic|aric|uronic|\b)/) || [])[1];
    return one(c => { const sf = SUFFIX.find(([re]) => re.test(c)); if (!sf) return; const wr = (c.match(/^(\w+?)(itol|onic|aric|uronic)/) || [])[1];
      return wr && root && wr !== root && !/sorbitol/.test(c) ? `${c} comes from a different sugar. Keep the same sugar name and change only the ending. ${sf[1]}` : sf[1]; });
  }
  if (sk === 'disaccharides') {
    if (/^Atom /.test(ch[0])) return;
    if (ch.every(c => LINK[c])) { const nm = (p.match(/monosaccharides in (\w+)/) || [])[1]; return one(c => LINK[c] + (nm ? '' : ' Look at which carbons the bridging O connects and which way the anomeric bond points.')); }
    if (ch.some(c => / • /.test(c))) return one(c => { const [n, l] = c.split(' • '); return DISACC[n] && DISACC[n][1] !== l ? `${n} always has a ${DISACC[n][1]} linkage, so “${c}” can’t be right.` : DISACC[n] ? `${n} is ${DISACC[n][0]}, ${DISACC[n][1]}. Check both ring types and the linkage here.` : ''; });
    if (ch.every(c => DISACC[c.split(' ')[0]] || POLY[c] || /^(glucose|galactose|fructose)$/.test(c))) return one(c => POLY[c] ? POLY[c] : DISACC[c] ? `${c} is ${DISACC[c][0]} joined ${DISACC[c][1]}${c === 'sucrose' ? ' (table sugar, from cane and beets)' : c === 'lactose' ? ' (milk sugar)' : c === 'maltose' ? ' (malt sugar, from starch digestion)' : ''}.` + (/NOT a reducing/.test(p) ? ' It has a free anomeric carbon, so it is reducing.' : '') : /NOT a reducing/.test(p) ? `${c} is a monosaccharide with a free anomeric carbon, so it is reducing.` : '');
    if (/Which monosaccharides are joined/.test(p)) { const d = Object.entries(DISACC); return one(c => { const hit = d.filter(([n, v]) => v[0] === c).map(([n]) => n); return hit.length ? `${c} makes ${hit.join(' or ')}.` : `No common disaccharide is ${c}.`; }); }
    if (/reducing sugar\?/.test(p)) return one(c => /^Yes/.test(c) ? 'A reducing sugar needs a free anomeric carbon (an –OH on C1 that can open the ring). ' + ex : 'Only when both anomeric carbons are tied up in the glycosidic bond, as in sucrose, is it non-reducing. ' + ex);
    if (/cannot digest cellulose/.test(p)) return one(c => /fructose/.test(c) ? 'Cellulose is made only of glucose.' : /α\(1→4\)/.test(c) ? 'Cellulose has β(1→4) bonds. α(1→4) bonds are the ones amylase can cut.' : /soluble/.test(c) ? 'Cellulose is insoluble fiber, not too soluble.' : '');
  }
}
module.exports = sugarWhy;

return module.exports; })();
M["fg"] = (function () { const module = { exports: {} }; const exports = module.exports;
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

return module.exports; })();
M["aminoacids"] = (function () { const module = { exports: {} }; const exports = module.exports;
// Per-choice feedback rules for the aminoacids game (used by tools/samplers/aminoacids.js and, via whys.js, by the game itself).
// ---------- Per-choice feedback ("why"), from the game's AA table and the rules of peptides, codons and protein structure ----------
const pT = x => String(x == null ? '' : x).replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/[​]/g, '').replace(/\s+/g, ' ').trim();
const CODE = (() => { const b = 'UCAG', aa = 'FFLLSSSSYY**CC*WLLLLPPPPHHQQRRRRIIIMTTTTNNKKSSRRVVVVAAAADDEEGGGG', t = {}; let k = 0; for (const x of b) for (const y of b) for (const z of b) t[x + y + z] = aa[k++]; return t; })();
const SIDE = { Gly: 'H', Ala: 'CH₃', Val: 'CH(CH₃)₂', Leu: 'CH₂–CH(CH₃)₂', Ile: 'CH(CH₃)–CH₂–CH₃', Pro: 'a ring that bonds back to the backbone N', Phe: 'CH₂– on a benzene ring', Met: 'CH₂–CH₂–S–CH₃', Trp: 'CH₂– on an indole (two fused rings with an N–H)',
  Ser: 'CH₂–OH', Thr: 'CH(OH)–CH₃', Cys: 'CH₂–SH', Asn: 'CH₂–C(=O)–NH₂', Gln: 'CH₂–CH₂–C(=O)–NH₂', Tyr: 'CH₂– on a benzene ring with an –OH', Asp: 'CH₂–COO⁻', Glu: 'CH₂–CH₂–COO⁻', Lys: '(CH₂)₄–NH₃⁺', Arg: '(CH₂)₃–NH–C(=NH₂⁺)–NH₂', His: 'CH₂– on an imidazole ring (a five-membered ring with two N)' };
const rTxt = k => SIDE[k].startsWith('a ring') ? SIDE[k] : '–' + SIDE[k];
const CLSN = { np: 'nonpolar', pn: 'polar neutral', ac: 'acidic', ba: 'basic' };
const CLSDEF = { Nonpolar: 'Nonpolar side chains are only C and H (or the –S–CH₃ of Met).', 'Polar neutral': 'Polar neutral side chains have an –OH, –SH or amide group but no charge.', Acidic: 'Acidic side chains have a second –COOH (–COO⁻ at pH 7.4): Asp and Glu.', Basic: 'Basic side chains have an extra N group that is positive at pH 7.4: Lys, Arg and His.' };
const LEVEL = { Primary: 'Primary structure is the amino acid sequence, held by peptide bonds.', Secondary: 'Secondary structure (α-helix, β-pleated sheet) is held by hydrogen bonds between backbone C=O and N–H groups.',
  Tertiary: 'Tertiary structure is the 3-D folding of one chain, held by R-group interactions (salt bridges, H bonds, disulfides, hydrophobic).', Quaternary: 'Quaternary structure is two or more chains packed together.' };
const INTER = { 'Hydrophobic interaction': 'A hydrophobic interaction is between two nonpolar side chains.', 'Hydrogen bond': 'A side-chain hydrogen bond is between two polar groups (–OH, –NH, amide) with no full charges.',
  'Disulfide bond (–S–S–)': 'A disulfide bond forms only between two cysteine –SH groups.', 'Salt bridge (ionic attraction)': 'A salt bridge is between a + side chain (Lys, Arg, His) and a − side chain (Asp, Glu).' };
const MUT = { Silent: 'Silent means the new codon still codes for the same amino acid.', Missense: 'Missense means the new codon codes for a different amino acid.', Nonsense: 'Nonsense means the new codon is a stop codon (UAA, UAG or UGA).', Frameshift: 'A frameshift comes from inserting or deleting a base, which shifts every codon after it. A single swapped base doesn’t do that.' };
function aaWhy(it, AA) {
  const p = pT(it.prompt), ans = pT(it.answer), ex = pT(it.explain), ch = it.choices.map(pT), sk = it.skill.split('.')[1];
  const cap = t => t && /^[a-z]/.test(t) ? t.charAt(0).toUpperCase() + t.slice(1) : (t || ''), one = f => ch.map(c => c === ans ? '' : cap(f(c) || ''));
  const key3 = t => { const m = t.match(/\((\w{3})\)$/); return m && AA[m[1]] ? m[1] : (AA[t] ? t : null); };
  const desc = k => `${AA[k].n} (${k}) has R = ${rTxt(k)}, ${AA[k].cls === 'ac' ? 'an' : 'a'} ${CLSN[AA[k].cls]} side chain`;
  const pairCls = t => t.split(' and ').map(x => AA[x] ? AA[x].cls : '?');
  if (sk === 'amino-acids') {
    if (/D or the L form/.test(p)) return one(c => /^D-/.test(c) ? 'D has the –NH₃⁺ on the right (with –COO⁻ at the top). Here it is on the left, so this is L.' : 'L has the –NH₃⁺ on the left (with –COO⁻ at the top). Here it is on the right, so this is D.');
    if (/essential/.test(p)) return one(c => { const k = key3(c); return k ? (AA[k].ess ? `${AA[k].n} is essential, but so is ${ans.split(' (')[0]}… check the question.` : `${AA[k].n} is nonessential: the body can make it.`) + ' The 9 essential ones are His, Ile, Leu, Lys, Met, Phe, Thr, Trp and Val.' : ''; });
    if (/side chain \(R group\) classified/.test(p)) return one(c => CLSDEF[c] ? `${CLSDEF[c]} ${ex}` : '');
    if (/net charge/.test(p)) return one(c => (/^Positive/.test(c) ? 'Positive needs extra H⁺: pH below the pI, or a basic side chain at pH 7.4.' : /^Negative/.test(c) ? 'Negative needs H⁺ removed: pH above the pI, or an acidic side chain at pH 7.4.' : 'Zero (a zwitterion) happens at the pI, or at pH 7.4 for a side chain with no charge.') + ' ' + ex);
    if (/one-letter code for/.test(p)) return one(c => { const k = Object.keys(AA).find(x => AA[x].one === c); return k ? `${c} is the code for ${AA[k].n} (${k}).` : ''; });
    if (/has the one-letter code/.test(p)) return one(c => { const k = key3(c); return k ? `${AA[k].n} is ${AA[k].one}.` : ''; });
    if (/Which amino acid is shown/.test(p) || /as it exists at pH/.test(p)) return one(c => { const k = key3(c); return k ? `${cap(desc(k))}. Compare the side chain drawn here.` : ''; });
    return one(c => { const k = key3(c); return k ? cap(desc(k)) + '.' : ''; });
  }
  if (sk === 'condense-hydrolyze') {
    const n = +((p.match(/(\d+) amino acids/) || [])[1] || { di: 2, tri: 3, tetra: 4, penta: 5, hexa: 6 }[(p.match(/(di|tri|tetra|penta|hexa)peptide/) || [])[1]] || 0);
    if (n && /peptide bonds|H₂O molecules/.test(p)) return one(c => `${n} amino acids in a row are joined by ${n} − 1 = ${n - 1} peptide bonds (one between each neighboring pair)${/H₂O/.test(p) ? `, and each bond means one H₂O (released when it forms, used when it is hydrolyzed)` : ''}.`);
    if (/small molecule is released/.test(p)) return one(c => `${c} isn’t formed. The –OH from one –COO⁻ and an H from the next –NH₃⁺ leave together as H₂O.`);
    if (/peptide bond joins which two atoms/.test(p)) return one(c => /O of the next/.test(c) ? 'C–O bonds link esters. A peptide (amide) bond is C–N: the carbonyl C to the next amino acid’s N.' : /S of/.test(c) ? 'That is a disulfide bond between cysteines, not a peptide bond.' : 'A peptide bond is C–N: the carbonyl C of one amino acid to the N of the next.');
    if (/complete hydrolysis of the (\w+)peptide/.test(p)) return one(c => /released/.test(c) ? 'Hydrolysis uses water to break bonds; it doesn’t release water. Water is released when peptide bonds form.' : /–/.test(c.split(',')[0]) ? 'Complete hydrolysis breaks every peptide bond, so no dipeptide is left.' : 'Count the peptide bonds: one fewer than the number of amino acids, and each uses one H₂O.');
    return;
  }
  if (sk === 'codons') {
    const aaOf = c => { const k = Object.keys(AA).find(x => AA[x].one === CODE[c]); return CODE[c] === '*' ? 'a stop codon' : k ? `${AA[k].n} (${k})` : '?'; };
    if (/Which mRNA codon codes for/.test(p) || /stop codon/.test(p)) return one(c => CODE[c] ? `${c} codes for ${aaOf(c)}. Use the chart: 1st base (left), 2nd base (top), 3rd base (right).` : '');
    if (/Which amino acid does the mRNA codon (\w{3})/.test(p)) { const cd = p.match(/codon (\w{3})/)[1]; return one(c => { const k = key3(c); const cods = k ? Object.keys(CODE).filter(x => CODE[x] === AA[k].one) : []; return k ? `${AA[k].n} is coded by ${cods.join(', ')}, not ${cd}. Find ${cd[0]} on the left, ${cd[1]} across the top, ${cd[2]} on the right.` : ''; }); }
    if (/kind of mutation/.test(p)) return one(c => MUT[c.split(':')[0]] ? `${MUT[c.split(':')[0]]} ${ex}` : '');
    if (/anticodon/.test(p)) return one(c => 'The anticodon pairs base by base with the codon (A–U, G–C). Written 3′→5′, its first base pairs with the codon’s first base. ' + ex);
    return one(c => { const k = key3(c); return k ? `${AA[k].n} is coded by ${Object.keys(CODE).filter(x => CODE[x] === AA[k].one).join(', ')}. Transcribe the DNA to mRNA first (A→U, T→A, G→C, C→G), then read the chart.` : ''; });
  }
  if (sk === 'name-peptides') {
    if (/How many different/.test(p)) { const n = (p.match(/from ([^?]*?) if/) || [])[1].split(',').length; const f = [1, 1, 2, 6, 24, 120][n]; return one(c => `Each order is a different peptide: ${[...Array(n)].map((_, i) => n - i).join(' × ')} = ${f}.`); }
    if (/full name of/.test(p)) return one(c => /yl$/.test(c) ? 'The last (C-terminal) amino acid keeps its full name. Only the ones before it change to -yl.' : !/yl/.test(c) ? 'Every amino acid except the last changes its ending to -yl (alanine → alanyl).' : 'Name in order from the N-terminus (the first residue written) to the C-terminus.');
    if (/N-terminal residue/.test(p)) return one(c => 'The N-terminal residue (free –NH₃⁺) is the one written first, at the left end of the chain.');
    if (/C-terminal residue/.test(p)) return one(c => 'The C-terminal residue (free –COO⁻) is the one written last, at the right end of the chain.');
    if (ch.every(c => /^\w{3}(–\w{3})+$/.test(c))) { const A = ans.split('–'); return one(c => { const C = c.split('–');
      if (C.slice().reverse().join('–') === ans) return 'That reads from the C-terminus. Name a peptide starting at the N-terminus (the free –NH₃⁺ end).';
      const i = C.findIndex((x, k) => x !== A[k]); if (i < 0) return '';
      if (C.slice().sort().join() === A.slice().sort().join()) return 'Right amino acids, wrong order. Start at the free –NH₃⁺ and identify each side chain in turn.';
      return AA[C[i]] && AA[A[i]] ? `Residue ${i + 1} is ${A[i]}, not ${C[i]}: ${AA[C[i]].n} has R = ${rTxt(C[i])}, but the side chain here is ${rTxt(A[i])}.` : ''; }); }
    return;
  }
  if (sk === 'protein-structure') {
    const lv = c => c.replace(/:.*$/, '').replace(/ only$/, '');
    if (/What mainly holds/.test(p)) return one(c => /separate chains/.test(c) ? 'Interactions between separate chains hold quaternary structure. ' + ex : /R groups of one chain/.test(c) ? 'R-group interactions in one chain hold tertiary structure. ' + ex : /[Pp]eptide bonds/.test(c) ? 'Peptide bonds hold the primary sequence. ' + ex : ex);
    if (/Denaturation/.test(p)) return one(c => /Primary/.test(c) ? 'Denaturation doesn’t break peptide bonds, so the primary sequence stays.' : 'Denaturation unfolds everything above the sequence: secondary, tertiary and quaternary.');
    return one(c => LEVEL[lv(c)] ? `${LEVEL[lv(c)]} ${ex}` : '');
  }
  if (sk === 'r-group-interactions') {
    if (ch.every(c => INTER[c])) return one(c => `${INTER[c]} ${ex}`);
    if (/Which interactions does it mainly disrupt/.test(p)) return one(c => ex);
    if (ch.every(c => / and /.test(c) && pairCls(c).every(x => x !== '?'))) {
      const want = /disulfide/.test(p) ? 'two Cys' : /salt bridge/.test(p) ? 'one + (Lys, Arg, His) and one − (Asp, Glu) side chain' : /hydrophobic/.test(p) ? 'two nonpolar side chains' : 'two polar side chains (–OH, –NH or amide)';
      return one(c => { const [a, b] = c.split(' and '); return `${a} is ${CLSN[AA[a].cls]} and ${b} is ${CLSN[AA[b].cls]}. This interaction needs ${want}.`; });
    }
    if (/outer surface|Buried/.test(ch.join())) return one(c => /Buried/.test(c) ? 'Polar and charged side chains stay on the surface, touching water. Only nonpolar ones are buried.' : 'Nonpolar side chains avoid water and are buried inside. Only polar and charged ones face water.');
    return one(c => { const k = key3(c); return k ? `${AA[k].n} (${k}) is ${CLSN[AA[k].cls]}. ` + (/lipids/.test(p) ? 'Only nonpolar side chains face the lipids.' : /salt bridge/.test(p) ? 'A salt bridge needs opposite charges.' : /hydrogen bonds with water/.test(p) ? 'Hydrogen bonding with water needs a polar group.' : '') : ''; });
  }
}
module.exports = aaWhy;

return module.exports; })();

const BY = [[/^lewisstructures\./, 'lewis'], [/^elements\./, 'elements'], [/^carbohydrates\./, 'carbs', 'SUG'], [/^functionalgroups\./, 'fg'], [/^aminoacids\./, 'aminoacids', 'AA'], [/^quantum\./, 'quantum'], [/^thermochemistry\./, 'thermo']];
const plain = x => String(x == null ? '' : x).replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
function reasons(item, ctx) {
  ctx = ctx || {};
  const it = Object.assign({ skill: '', explain: '' }, item);
  let w;
  for (const [re, mod, need] of BY) if (re.test(it.skill)) { try { w = need ? M[mod](it, ctx[need] || window[need]) : M[mod](it); } catch (e) { w = undefined; } break; }
  if (Array.isArray(w)) it.why = w;
  try { M.rest(it); } catch (e) {}
  return it.why;
}
function reason(item, picked, ctx) {
  const w = reasons(item, ctx); if (!w) return '';
  const p = plain(picked), i = (item.choices || []).findIndex(c => plain(c) === p);
  return i >= 0 ? (w[i] || '') : '';
}
window.QBWhy = { reasons, reason, version: "2026-11-14" };
})();
