// Sampler for the metabolism game ("Metabolic Marathon"): CHEM 3B Units 14–17. Runs the game's own generators
// (generate(topic)) with Math.random seeded, renders each question with newQuestion() and grades the right answer with
// the game's own checker: choose(i) for choices, checkFields() for the number boxes (ATP and carbon counts; a question
// with several boxes becomes one number item per box). Pathway diagrams and reaction close-ups are the game's own SVG,
// inlined so they are self-contained.
// Chapters come from what each question is about: glycolysis, glycogen, gluconeogenesis and fermentation -> 3B-14;
// citric acid cycle, electron transport and ATP synthesis -> 3B-15; fatty acids, β-oxidation and ketone bodies -> 3B-16;
// amino acids, transamination and the urea cycle -> 3B-17.
// Skipped: "Put it in order" (order: tap the steps in sequence), the reaction-table and pick-one-per-row items (multi),
// Rosa's Case Files (shown only inside the CHEM 3B textbook, not on the hub), the "more exam-style items modeled on the
// Exam 4 item banks" (the second EXAMQ block; the first block, written new in the style of his exams, is kept) and the
// Final Boss questions (already in the bank).
const path = require('path');
const { mirrorFamily, plainText, reposDirOf } = require('../sampler-kit');
const { grab } = require('../grab');

const UNITS = [
  ['3B-14', /glycoly|glucose|glycogen|gluconeogen|pyruvate|lactate|lactic|ferment|pentose|hexokinase|phosphofructo|fructose|galactose|sucrose|lactose|starch|amylase|\bCori\b|insulin|glucagon|enolase|aldolase|glyceraldehyde|phosphoglycer|dihydroxyacetone/i],
  ['3B-15', /citric acid|Krebs|\bTCA\b|electron transport|complex (I|II|III|IV)\b|oxidative phosphorylation|ATP synthase|cytochrome|coenzyme Q|CoQ|oxaloacetate|succin|fumar|malate|citrate|isocitrate|ketoglutarate|proton gradient|H\+ gradient|intermembrane|chemiosmo|catabolism|anabolism|stages of metabolism|acetyl CoA/i],
  ['3B-16', /fatty acid|β-oxidation|beta-oxidation|ketone bod|ketogenesis|ketosis|ketoacidosis|acetoacet|hydroxybutyrate|acetone|lipogenesis|triacylglycerol|triglyceride|lipase|glycerol|acyl CoA|malonyl|carnitine|cholesterol|statin|HMG-CoA|bile|lipid/i],
  ['3B-17', /amino acid|transaminat|deaminat|\burea\b|ammoni|NH4|NH₄|glutamate|nitrogen|protein|PKU|phenylalanine|alanine|aspartate|creatinine|BUN/i],
];
// read the question and its answer (not the explanation: explanations often compare several pathways);
// when they name no pathway, use the mode's own unit
const unitsIn = t => UNITS.filter(([, re]) => re.test(plainText(t))).map(([u]) => u);
const byContent = fallback => (it) => {
  const ch = unitsIn(it.prompt + ' ' + it.answer);
  return ch.length ? ch : fallback;
};
const TOPICS = [
  ['big', ['3B-15']], ['glucose', ['3B-14']], ['where', ['3B-15']], ['diagram', ['3B-15']], ['count', ['3B-15']], ['fatty', ['3B-16']],
  ['carbon', ['3B-15']], ['energy', ['3B-15']], ['rxn', ['3B-15']], ['structq', ['3B-15']], ['coenz', ['3B-15']], ['predict', ['3B-15']],
  ['enzclass', ['3B-15']], ['vit', ['3B-15', '3B-12']], ['fates', ['3B-15']], ['reg', ['3B-14']], ['nitrogen', ['3B-17']], ['clinic', ['3B-15']],
  ['exam', ['3B-15']],
].map(([key, fb]) => ({ key, ch: key === 'vit' ? fb : byContent(fb) }));   // vitamins -> coenzymes: Unit 12 (vitamins) and 15

module.exports = async (page, ctx) => {
  // Exam-style items: keep only the first EXAMQ block ("written in the style of Dr. Dan's CHEM 3B exams; none are copied").
  const first = grab(path.join(reposDirOf(page), 'metabolism', 'index.html'), 'EXAMQ', { NOTA: 'none of the above' }).map(x => x.q);
  await page.evaluate(qs => { window.__examKeep = new Set(qs.map(x => f(x))); }, first);
  return mirrorFamily(page, ctx, {
    game: 'metabolism', seed: 5000, topics: TOPICS,
    skip: q => q.topic === 'exam' && !window.__examKeep.has(q.prompt) ? 'exam item modeled on the Exam 4 item banks' : '',
    roots: ['#qBox'], drop: ['.choices', '.fields', '.check-row', '.mrows', '.seq', '.tiles', '.order-tools', '.swipe'],
    choiceSel: '#qBox [data-choice]', choiceDrop: ['.lt'],
  });
};
