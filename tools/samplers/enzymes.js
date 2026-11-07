// Sampler for the enzymes game ("Enzyme Engine"): enzymes, coenzymes and vitamins (CHEM 3B Unit 12). Runs the game's
// own generators (generate(topic)) with Math.random seeded, renders each question with newQuestion() and grades the
// right answer with the game's own choose(). The game's diagrams (energy diagrams, inhibitor cartoons, rate graphs,
// reaction structures) are its own SVG, inlined so they are self-contained.
// Skipped: "Label the enzyme" (parts) and the tap-the-diagram items in Activation energy and Regulation (the answer is
// a spot on the picture), graph items whose answer choices are pictures, and Exam Practice (Final Boss items, already
// in the bank).
const { mirrorFamily } = require('../sampler-kit');
const U12 = ['3B-12'];
const TOPICS = ['terms', 'models', 'energy', 'specific', 'six', 'names', 'structs', 'plot', 'predict', 'inhibit', 'regulate',
  'dental', 'nursing', 'labs', 'disorders', 'cofactor', 'bvit', 'deficiency', 'soluble'].map(key => ({ key, ch: U12 }));

module.exports = (page, ctx) => mirrorFamily(page, ctx, {
  game: 'enzymes', seed: 4400, topics: TOPICS,
  // The game shows the "Which enzyme?" scenario without its fm() formatting (CO_2, H_2O); format it the way the rest of
  // the game does so the bank shows CO₂ as CO<sub>2</sub>.
  prep: q => { if (q.scenario) q.scenario = fm(q.scenario); },
  roots: ['#equation', '#scenario', '#art', '#prompt'], drop: ['.tap-note'],
  choiceSel: '#choices [data-choice]',
});
