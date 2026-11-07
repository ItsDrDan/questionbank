// Sampler for the nucleic acids game ("Helix Hustle"): DNA/RNA structure, replication, transcription, the genetic
// code, translation and mutations (CHEM 3B Unit 13). Runs the game's own generators (generate(topic)) with Math.random
// seeded, renders each question with newQuestion() and grades the right answer with the game's own checker:
// choose(i) for choices, check() for typed answers (base sequences, amino acid sequences, counts, percents).
// Typed answers get extra accepted spellings (spaced or dashed letters, one-letter amino acid codes) only when the
// game's own checker accepts them too.
// Skipped: "tap the atom" items (sugars: tap a carbon in the drawing) and Final-exam review (Final Boss items, already
// in the bank).
const { mirrorFamily } = require('../sampler-kit');
const TOPICS = ['bases', 'sugars', 'nucleo', 'naming', 'backbone', 'pairing', 'hbonds', 'chargaff', 'helix', 'replication',
  'transcribe', 'splicing', 'transfacts', 'codons', 'anticodon', 'translation', 'mutations', 'viruses']
  .map(key => ({ key, ch: ['3B-13'] }));

module.exports = (page, ctx) => mirrorFamily(page, ctx, {
  game: 'nucleicacids', seed: 4800, topics: TOPICS,
  roots: ['#equation', '#art', '#prompt'],
  choiceSel: '#choices [data-choice]', choiceDrop: ['.letter'],
  // runs in the page: other ways to type the same answer (each is kept only if the game's checker accepts it)
  variants: (a) => {
    const v = [];
    // base sequences, however the game writes them ("GAAA", "T C T A", "3′–G–G–C–5′"): letters only, spaced, dashed,
    // and with the 5'/3' ends typed with a plain apostrophe
    const ends = a.match(/^\s*([35])\s*[′']/), letters = a.replace(/[35]\s*[′']/g, '').replace(/[\s–—-]/g, '');
    if (/^[ACGTU]+$/.test(letters)) {
      const e1 = ends ? ends[1] : '5', e2 = e1 === '5' ? '3' : '5';
      v.push(letters, letters.split('').join(' '), letters.split('').join('-'), e1 + "'-" + letters + '-' + e2 + "'", e1 + "' " + letters + ' ' + e2 + "'");
    }
    // amino acid sequences ("Asp–Ile–Lys"): plain hyphens, spaces, commas, run together, one-letter codes
    const toks = a.split(/\s*[–—-]\s*|\s*,\s*|\s+/).filter(Boolean);
    if (toks.length > 1 && toks.every(t => /^[A-Z][a-z]{2}$/.test(t))) {
      v.push(toks.join('-'), toks.join(' '), toks.join(', '), toks.join(''));
      if (typeof AA3 === 'object') { const one = toks.map(t => Object.keys(AA3).find(k => AA3[k] === t)); if (one.every(Boolean)) v.push(one.join(''), one.join('-')); }
    }
    return v;
  },
});
