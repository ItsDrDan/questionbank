// Sampler for the lipids game ("Lipid Lab"): fatty acids, fats, soaps, steroids and membranes (CHEM 3B Unit 10).
// Runs the game's own generators (generate(topic)) with Math.random seeded, renders each question with newQuestion()
// and grades the right answer with the game's own checker: choose(i) for choices, check() for typed answers (the
// shorthand like 18:2 and the water/NaOH/H2 counts). The game's fatty-acid and triglyceride drawings are inlined SVG.
// Skipped: "Find α, β and ω" (locate: tap a carbon in the drawing), "Hands-on: build and break fats" (lab: an
// interactive builder), choice items whose answers are drawings, and Final-exam review (Final Boss items, already in
// the bank).
const { mirrorFamily } = require('../sampler-kit');
const U10 = ['3B-10'];
const TOPICS = ['satur', 'cistrans', 'omega', 'melt', 'names', 'build', 'hydro', 'sapon', 'hydrog', 'rancid',
  'classify', 'hydrolyzable', 'steroid', 'eico', 'vitamin', 'bilayer', 'transport', 'clinic']
  .map(key => ({ key, ch: key === 'vitamin' ? ['3B-10', '3B-12'] : U10 }));   // fat-soluble vitamins: also Unit 12 (vitamins)

module.exports = (page, ctx) => mirrorFamily(page, ctx, {
  game: 'lipids', seed: 4500, topics: TOPICS,
  roots: ['#equation', '#art', '#prompt'],
  choiceSel: '#choices [data-choice]', choiceDrop: ['.letter'],
  variants: (a) => [a.replace(/\s+/g, ''), a.replace(/:/g, ' : ')],
});
