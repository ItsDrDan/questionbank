// Sampler for the stereochemistry game ("Mirror Match"): runs the game's own generators (TOPICS[topic].gen via
// generate()) with Math.random seeded, renders each question with the game's newQuestion(), and grades the right
// answer with the game's own choose(). Skeletal structures are FBX.molSVG drawings (textbook/js/fbx.js, loaded from
// the local textbook clone) and Fischer projections are the game's fischerSVG(); both are inlined as self-contained SVG.
// Skipped: "Pick the enantiomer" (mirror: the answer choices are Fischer pictures) and Exam Practice (Final Boss items,
// already in the bank).
const { mirrorFamily, plainText } = require('../sampler-kit');
const GAME = 'stereochemistry';
// Health & clinic items: add the unit of the molecule they are about
const clinicCh = it => {
  const t = plainText(it.prompt + ' ' + it.answer).toLowerCase(), ch = ['3B-6'];
  if (/amino acid|protein|l-dopa|levodopa|thyroxine/.test(t)) ch.push('3B-11');
  if (/glucose|sugar/.test(t)) ch.push('3B-9');
  return ch;
};
const TOPICS = [
  { key: 'terms', slug: 'key-terms', ch: ['3B-6'] },
  { key: 'find', slug: 'spot-chiral-carbon', ch: ['3B-6'] },
  { key: 'count', slug: 'count-chiral-carbons', ch: ['3B-6'] },
  { key: 'nstereo', slug: 'number-of-stereoisomers', ch: ['3B-6'] },
  { key: 'relate', slug: 'enantiomers-diastereomers', ch: ['3B-6'] },
  { key: 'constit', slug: 'constitutional-isomers', ch: ['3B-6', '3B-2'] },
  { key: 'ct', slug: 'cis-trans-alkenes', ch: ['3B-2', '3B-6'] },
  { key: 'ringct', slug: 'cis-trans-rings', ch: ['3B-2', '3B-6'] },
  { key: 'dl', slug: 'd-l-sugars', ch: ['3B-6', '3B-9'] },
  { key: 'aa', slug: 'd-l-amino-acids', ch: ['3B-6', '3B-11'] },
  { key: 'fischrel', slug: 'compare-fischer', ch: ['3B-6', '3B-9'] },
  { key: 'clinic', slug: 'chiral-drugs', ch: clinicCh },
];

module.exports = (page, ctx) => mirrorFamily(page, ctx, {
  game: GAME, fbx: true, seed: 4200, topics: TOPICS,
  roots: ['#equation', '#scenario', '#art', '#prompt'], drop: ['.tap-note'],
  choiceSel: '#choices [data-choice]',
});
