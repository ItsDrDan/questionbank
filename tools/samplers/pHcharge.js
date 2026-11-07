// Sampler for the pHcharge game ("Proton Patrol"): acids, bases and charge at body pH. Runs the game's own generators
// (generate(topic)) with Math.random seeded, renders each question with newQuestion() and grades the right answer with
// the game's own choose(). Skeletal structures are FBX.molSVG drawings (textbook/js/fbx.js from the local textbook clone),
// inlined as self-contained SVG.
// Chapters are read from each question: amino acids, pI and peptides -> 3B-11; carboxylic acids, carboxylates and
// esters -> 3B-7; amines, ammonium ions and amides -> 3B-8.
// Skipped: "Pick the right form" (aaform: the answer choices are structure drawings) and Exam Practice (Final Boss
// items, already in the bank).
const { mirrorFamily, plainText } = require('../sampler-kit');
const GAME = 'pHcharge';

const AA = /amino acid|zwitterion|\bpI\b|isoelectric|protein|\bglycine\b/i;
const ACID = /carboxyl|carboxylate|\bester|benzoate|aspirin|naproxen|salicylic|lactic|lactate|\bphenol|\balcohol|ketone/i;
const AMINE = /\bamines?\b|ammonium|\bamides?\b|lidocaine|anesthetic/i;
const T = (it, r) => plainText([it.prompt, it.answer, it.explain].join(' '));
// the compound named in the prompt ("This is propylamine.", "Ethanamide is in blood ...", "Methylamine reacts with HCl")
const named = (it) => { const p = plainText(it.prompt); return /amide\b/i.test(p) || /amine\b/i.test(p) ? ['3B-8'] : ['3B-7']; };
// net charge: the explanation counts the acid groups and the N atoms ("1 carboxylic acid group ..., 2 amine N ... 1 amide N")
const netCh = (it) => {
  const w = plainText(it.explain), p = plainText(it.prompt), ch = [];
  if (/^[1-9]\d* carboxylic acid group/.test(w)) ch.push('3B-7');
  if (/[1-9]\d* (amine|amide) N/.test(w)) ch.push('3B-8');
  if (/amino acid|\bglycine\b/i.test(p)) ch.push('3B-11');
  return ch.length ? ch : ['3B-7'];
};
const byContent = (it, r) => {
  const t = T(it, r), ch = [];
  if (ACID.test(t)) ch.push('3B-7');
  if (AMINE.test(t)) ch.push('3B-8');
  if (AA.test(t)) ch.push('3B-11');
  return ch.length ? ch : ['3B-7', '3B-8'];      // general "charged vs neutral form of a drug" items
};
const aaOnly = () => ['3B-11'];
const TOPICS = [
  { key: 'groups', slug: 'acid-base-or-neither', ch: named },
  { key: 'strength', slug: 'acid-strength', ch: ['3B-7'] },
  { key: 'form74', slug: 'form-at-body-ph', ch: named },
  { key: 'net', slug: 'net-charge', ch: netCh },
  { key: 'aa74', slug: 'amino-acid-charge', ch: aaOnly },
  { key: 'pi', slug: 'above-below-pi', ch: aaOnly },
  { key: 'peptide', slug: 'peptide-charge', ch: aaOnly },
  { key: 'salt', slug: 'neutralization', ch: named },
  { key: 'solu', slug: 'salts-solubility', ch: byContent },
  { key: 'clinic', slug: 'drugs-blood-ph', ch: byContent },
];

module.exports = (page, ctx) => mirrorFamily(page, ctx, {
  game: GAME, fbx: true, seed: 4600, topics: TOPICS,
  roots: ['#equation', '#scenario', '#art', '#prompt'], drop: ['.tap-note'],
  choiceSel: '#choices [data-choice]',
});
