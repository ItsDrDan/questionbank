// Sampler for the redox game: only the GENERATED content (the static lists are already in bank/redox.json).
//  - Galvanic Cells: genCell() kinds pair/dg/k/nernst/notation/flow over CELL_COUPLES  -> redox.galvanic-cells (1A/1B, 1B-17)
//  - REDOX Concepts: genConcept() kinds agents/multiply/oxnum (kind 'fact' = CONCEPT_FACTS, already banked, skipped)
//                                                                                     -> redox.concepts (3A, 3A-10)
// Multi-field game questions are split into one item per field, with a question line naming that field.
// Every kept answer is graded by the game's own checkFields() (the same check() uses for these modes),
// and numeric answers are recomputed independently from CELL_COUPLES in Node.
const GAME = 'redox';

// question text that replaces the game's combined field list, per [kind, field id]
const ASK = {
  cellAnode: 'Which electrode is the anode (where oxidation happens)?',
  cellCathode: 'Which electrode is the cathode (where reduction happens)?',
  cellE: 'What is E°cell, in volts?',
  // cellDG / cellLogK: the game's own prompt already asks for the single quantity
  cellQ: 'What is the reaction quotient Q?',
  cellEn: 'What is Ecell, in volts?',
  cellNote: 'Which cell notation is written correctly?',
  cellFlow: 'Which way do electrons flow through the wire?',
  cellAnions: 'Toward which half-cell do anions in the salt bridge move?',
  cellMass: 'Which electrode gains mass?',
  cnM1: 'By what whole number must the oxidation half-reaction (first) be multiplied?',
  cnM2: 'By what whole number must the reduction half-reaction (second) be multiplied?',
};
// how many distinct items to keep per field (cells ~40, concepts ~32)
const CAP = {
  cellAnode: 2, cellCathode: 2, cellE: 5, cellDG: 6, cellLogK: 6, cellQ: 3, cellEn: 5, cellNote: 5,
  cellFlow: 2, cellAnions: 2, cellMass: 2,
  'agents:Which species is oxidized?': 3, 'agents:Which species is reduced?': 3,
  'agents:Which species is the reducing agent?': 3, 'agents:Which species is the oxidizing agent?': 3,
  cnM1: 4, cnM2: 4, oxnum: 12,
};
const strip = s => String(s).replace(/<[^>]+>/g, '');

module.exports = async (page, ctx) => {
  const items = [];
  const plan = [
    { mode: 'cells', gen: 'genCell', skill: 'redox.galvanic-cells', courses: ['1A', '1B'], chapters: ['1B-17'], seed: 7101 },
    { mode: 'concepts', gen: 'genConcept', skill: 'redox.concepts', courses: ['3A'], chapters: ['3A-10'], seed: 7202 },
  ];
  for (const m of plan) {
    await ctx.seed(m.seed);
    const raw = await page.evaluate(({ mode, gen, ASK, CAP }) => {
      state.mode = mode; state.stages = [];
      const out = [], seen = new Set(), count = {};
      for (let t = 0; t < 3000; t++) {
        const q = window[gen] ? window[gen]() : (gen === 'genCell' ? genCell() : genConcept());
        if (q.kind === 'fact') continue; // CONCEPT_FACTS: already banked
        // grade every field with the game's own checker: render the question, type the answer, run checkFields
        state.q = q;
        document.getElementById('questionArea').innerHTML = q.html + '<div class="cell-fields">' + q.fields.map(cellFieldHTML).join('') + '</div>';
        for (const f of q.fields) document.getElementById(f.id).value = String(f.answer);
        const graded = checkFields(q.fields).map(r => r.ok);
        q.fields.forEach((f, i) => {
          let key = f.id, ask = ASK[f.id];
          if (q.kind === 'agents') { const m = q.html.match(/<p class="prompt">(.*?)<\/p>/); key = 'agents:' + m[1]; ask = null; }
          if (q.kind === 'oxnum') { key = 'oxnum'; ask = null; }
          if ((count[key] || 0) >= (CAP[key] || 0)) return;
          let html = q.html;
          if (q.kind === 'pair') html = html.replace(/<p>Which electrode is the anode.*?<\/p>/, '');
          if (q.kind === 'notation') html = html.replace(' Which cell notation is written correctly?', '');
          if (ask) html += '<p><b>' + ask + '</b></p>';
          const sig = html + '|' + f.answer;
          if (seen.has(sig)) return;
          seen.add(sig); count[key] = (count[key] || 0) + 1;
          out.push({
            kind: q.kind, fid: f.id, html, type: f.type, answer: f.answer, tol: f.tol,
            choices: f.type === 'select' ? f.opts.map(o => typeof o === 'string' ? o : o.value) : null,
            hint: q.hint, why: q.why, ok: graded[i],
          });
        });
        const done = Object.keys(CAP).filter(k => mode === 'cells' ? k.startsWith('cell') : !k.startsWith('cell'))
          .every(k => (count[k] || 0) >= CAP[k]);
        if (done) break;
      }
      return out;
    }, { mode: m.mode, gen: m.gen, ASK, CAP });

    let index = 0;
    for (const r of raw) {
      if (!r.ok) throw new Error(`${m.mode}: game checker rejected its own answer ${r.answer} (${r.fid}) for ${strip(r.html).slice(0, 120)}`);
      verify(r);
      const item = { skill: m.skill, courses: [...m.courses], chapters: [...m.chapters], type: null, prompt: r.html };
      if (r.type === 'select') { item.type = 'mc'; item.choices = r.choices; item.answer = String(r.answer); }
      else {
        item.type = 'number'; item.answer = Number(r.answer);
        const unit = { cellE: 'V', cellEn: 'V', cellDG: 'kJ' }[r.fid]; if (unit) item.unit = unit;
        item.tolerance = Number(Math.max(r.tol / Math.abs(r.answer), 0.001).toPrecision(2));
      }
      item.hint = r.hint; item.explain = r.why; item.origin = 'original';
      item.from = { game: GAME, list: 'sample:' + m.mode, index: index++ };
      items.push(item);
    }
  }
  return items;
};

// Independent recomputation from the numbers shown in the prompt (throws on mismatch).
function verify(r) {
  const t = strip(r.html), num = re => { const m = t.match(re); if (!m) throw new Error('verify: no match ' + re + ' in ' + t); return m.slice(1).map(Number); };
  const close = (a, b, rel) => Math.abs(a - b) <= Math.abs(b) * rel + 1e-9;
  let expect = null;
  if (r.fid === 'cellE') { const v = [...t.matchAll(/→ [A-Z][a-z]?\(s\)(-?\d+\.\d\d)/g)].map(m => +m[1]); expect = Math.max(...v) - Math.min(...v); }
  if (r.fid === 'cellDG') { const [n, E] = num(/n = (\d+) electrons transfer and E°cell = (-?[\d.]+) V/); expect = -n * 96.485 * E; }
  if (r.fid === 'cellLogK') { const [n, E] = num(/Here n = (\d+) and E°cell = (-?[\d.]+) V/); expect = n * E / 0.0592; }
  if (r.fid === 'cellQ' || r.fid === 'cellEn') {
    const [an] = num(/anode in ([\d.]+) M/), [ca] = num(/cathode in ([\d.]+) M/), [E, n] = num(/E°cell = (-?[\d.]+) V and n = (\d+)/);
    expect = r.fid === 'cellQ' ? an / ca : E - 0.0592 / n * Math.log10(an / ca);
  }
  if (r.fid === 'cnM1' || r.fid === 'cnM2') {
    const [e1] = num(/\(aq\) \+ (\d) e⁻(?!\s*→)/), [e2] = num(/\+ (\d) e⁻ →/);
    const g = (a, b) => b ? g(b, a % b) : a, L = e1 * e2 / g(e1, e2); expect = r.fid === 'cnM1' ? L / e1 : L / e2;
  }
  if (expect !== null && !close(Number(r.answer), expect, 0.006)) throw new Error(`verify ${r.fid}: game ${r.answer} vs recomputed ${expect}: ${t.slice(0, 160)}`);
  if (r.kind === 'pair' && (r.fid === 'cellAnode' || r.fid === 'cellCathode')) {
    // anode = lower E° metal
    const rows = [...t.matchAll(/([A-Z][a-z]?)(?:[²³]?⁺)\(aq\) \+ \d e⁻ → [A-Z][a-z]?\(s\)(-?\d+\.\d\d)/g)].map(m => [m[1], +m[2]]);
    rows.sort((a, b) => a[1] - b[1]);
    const want = r.fid === 'cellAnode' ? rows[0][0] : rows[1][0];
    if (want !== r.answer) throw new Error(`verify ${r.fid}: ${r.answer} vs ${want}`);
  }
}
