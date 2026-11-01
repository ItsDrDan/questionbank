// Build the shared question bank from the games.
// Run from the questionbank folder:  node tools/build.js ../   (path to the folder holding the game repos)
// It opens each game in headless Chromium, reads its question lists, converts them to the
// shared format, and writes bank/*.json, data/*.json and index.json.
// Lists that cite publisher test banks, ACS exams, or Dr. Dan's own quizzes are skipped on purpose.
const fs = require('fs'), path = require('path'), crypto = require('crypto');
const { chromium } = require('playwright');
const { grab } = require('./grab');

const REPOS = path.resolve(process.argv[2] || '../');
const OUT = path.resolve(__dirname, '..');
const strip = s => String(s ?? '').replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
const hid = (...parts) => crypto.createHash('sha1').update(parts.map(p => JSON.stringify(p)).join('|')).digest('hex').slice(0, 8);
const shuffle = a => a; // games shuffle choices themselves; keep the answer first-free order as written

async function pull(page, game, vars) {
  await page.goto('file://' + path.join(REPOS, game, 'index.html'), { waitUntil: 'load' });
  await page.waitForTimeout(400);
  const out = {};
  for (const v of vars) {
    try { out[v] = await page.evaluate(`JSON.parse(JSON.stringify(${v}))`); }
    catch (e) { out[v] = grab(path.join(REPOS, game, 'index.html'), v); } // list lives inside a function wrapper: read it from the source
  }
  return out;
}

function item(game, list, i, fields) {
  const id = game + '-' + hid(game, list, fields.prompt, fields.answer ?? fields.data);
  return Object.assign({ id }, fields, { from: { game, list, index: i } });
}
// [title?, question, answer, wrong1, wrong2, wrong3, why] or [q, answer, [wrongs], why]
function mcFromArray(a, hasTitle) {
  const r = hasTitle ? a.slice(1) : a.slice();
  const title = hasTitle ? a[0] : undefined;
  if (Array.isArray(r[2])) { // [q, ans, [wrongs], why, tag?]
    const wrongs = r[2].filter(w => w !== r[1]);
    return { title, prompt: r[0], answer: r[1], choices: [r[1], ...wrongs], explain: r[3], tag: typeof r[4] === 'string' ? r[4] : undefined };
  }
  // [q, ans, w1, w2, w3, why]
  return { title, prompt: r[0], answer: r[1], choices: r.slice(1, 5), explain: r[5] };
}

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.route(/^https?:/, r => r.abort());
  page.on('pageerror', () => {});
  const banks = {};   // file -> items
  const add = (file, items) => (banks[file] = (banks[file] || []).concat(items));

  // ---------- Significant figures (sigfig) ----------
  {
    const g = 'sigfig', d = await pull(page, g, ['countBank', 'countedBank', 'sigRoundBank', 'decimalBank']);
    const base = { skill: 'sigfig.count', courses: ['3A', '1A'], chapters: ['3A-1', '1A-1'], origin: 'original' };
    add('sig-figs', d.countBank.map((q, i) => item(g, 'countBank', i, { ...base, type: 'number', prompt: `How many significant figures are in ${q.display}?`, answer: q.answer, hint: q.hint, explain: q.reason })));
    add('sig-figs', d.countedBank.map((q, i) => item(g, 'countedBank', i, { ...base, type: 'text', prompt: `How many significant figures are in ${q.display}?`, answer: q.answer, accept: ['oo', 'infinite', '∞'], hint: q.hint, explain: q.reason })));
    add('sig-figs', d.sigRoundBank.map((q, i) => item(g, 'sigRoundBank', i, { ...base, skill: 'sigfig.round-sigfigs', type: 'text', prompt: `Round ${q.shown} to ${q.places} significant figure${q.places > 1 ? 's' : ''}.`, answer: q.answer, hint: q.hint, explain: q.reason })));
    add('sig-figs', d.decimalBank.map((q, i) => item(g, 'decimalBank', i, { ...base, skill: 'sigfig.round-decimals', type: 'text', prompt: `Round ${q.shown} to ${q.places} decimal place${q.places > 1 ? 's' : ''}.`, answer: q.answer, hint: q.hint, explain: q.reason })));
  }

  // ---------- REDOX (master copy; Bridge to 1B holds an older subset) ----------
  {
    const g = 'redox', d = await pull(page, g, ['oxQuestions', 'chartQuestions', 'activityQuestions', 'halfMeta', 'acidMeta', 'baseMeta', 'identificationMeta', 'CONCEPT_FACTS', 'metalSeries', 'halogenSeries']);
    const c = { courses: ['3A', '1A'], chapters: ['3A-10', '1A-4'], origin: 'original' };
    add('redox', d.oxQuestions.map((q, i) => item(g, 'oxQuestions', i, { ...c, skill: 'redox.oxidation-numbers', type: 'number', prompt: `What is the oxidation number of ${q.target} in ${q.f}?`, answer: q.ans, hint: q.hint, explain: q.why, data: q })));
    add('redox', d.chartQuestions.map((q, i) => item(g, 'chartQuestions', i, { ...c, skill: 'redox.oxidation-numbers', type: 'oxidation-chart', prompt: `Assign an oxidation number to every element in ${q.f}.`, answer: q.states, data: q })));
    add('redox', d.activityQuestions.map((q, i) => item(g, 'activityQuestions', i, { ...c, skill: 'redox.activity-series', type: 'mc', prompt: `Will this reaction occur? ${q.rxn}`, choices: ['Yes', 'No'], answer: q.yes ? 'Yes' : 'No', products: q.prod, explain: q.why, data: q })));
    add('redox', d.identificationMeta.map((q, i) => item(g, 'identificationMeta', i, { ...c, skill: 'redox.identify', type: 'redox-identify', prompt: 'Identify what is oxidized and what is reduced.', answer: { oxidized: q.ox.from, reduced: q.red.from }, data: q })));
    const bal = (list, arr, skill, courses, chapters, cond) => arr.map((q, i) => item(g, list, i, { skill, courses, chapters, origin: 'original', type: 'redox-balance', prompt: `Balance this REDOX reaction${cond}: ${q.reactants.join(' + ')} → ${q.products.join(' + ')}`, data: q }));
    add('redox', bal('halfMeta', d.halfMeta, 'redox.half-reactions', ['1A', '1B'], ['1A-4', '1B-17'], ''));
    add('redox', bal('acidMeta', d.acidMeta, 'redox.acidic', ['1A', '1B'], ['1A-4', '1B-17'], ' in acidic solution'));
    add('redox', bal('baseMeta', d.baseMeta, 'redox.basic', ['1A', '1B'], ['1A-4', '1B-17'], ' in basic solution'));
    add('redox', d.CONCEPT_FACTS.map((a, i) => item(g, 'CONCEPT_FACTS', i, { skill: 'redox.concepts', courses: ['3A', '1A'], chapters: ['3A-10', '1A-4'], origin: 'original', type: 'mc', ...mcFromArray(a, false) })));
    fs.mkdirSync(path.join(OUT, 'data'), { recursive: true });
    fs.writeFileSync(path.join(OUT, 'data/activity-series.json'), JSON.stringify({ from: 'redox', metals: d.metalSeries, halogens: d.halogenSeries }, null, 1));
  }

  // ---------- Gas laws concept questions ----------
  {
    const g = 'gaslaws', d = await pull(page, g, ['CONCEPTS']);
    add('gas-laws', d.CONCEPTS.map((a, i) => {
      const f = mcFromArray(a, false);
      const only1A = f.tag === 'speed' || f.tag === 'real';
      return item(g, 'CONCEPTS', i, { skill: 'gaslaws.' + (f.tag || 'kmt'), courses: only1A ? ['1A'] : ['3A', '1A'], chapters: only1A ? ['1A-9'] : ['3A-8', '1A-9'], origin: 'original', type: 'mc', ...f });
    }));
  }

  // ---------- Thermochemistry concept questions + OpenStax formation table ----------
  {
    const g = 'thermochemistry', d = await pull(page, g, ['concepts', 'FORMATION']);
    add('thermochemistry', d.concepts.map((a, i) => {
      const [title, q, ans, choices, why] = a;
      return item(g, 'concepts', i, { skill: 'thermo.phase-energy', courses: ['3A', '1A'], chapters: ['3A-7', '1A-10'], origin: 'original', type: 'mc', title, prompt: q, answer: ans, choices, explain: why });
    }));
    fs.writeFileSync(path.join(OUT, 'data/formation-enthalpies.json'), JSON.stringify({ from: 'thermochemistry', source: 'OpenStax Chemistry 2e, Appendix G', units: 'kJ/mol', values: d.FORMATION }, null, 1));
  }

  // ---------- Bridge to 1B concept sets (Tro-aligned BRIDGE_CONCEPTS left out) ----------
  {
    const g = 'chem1bready', d = await pull(page, g, ['CORE', 'PHYSICAL', 'WATER_CONCEPTS', 'KE_CONCEPTS']);
    const sets = { CORE: ['bridge.core-toolkit', ['1A-1', '1A-2', '1A-3', '1B-ready']], PHYSICAL: ['bridge.matter-energy', ['1A-5', '1A-9', '1A-10', '1B-ready']], WATER_CONCEPTS: ['bridge.reactions-in-water', ['1A-4', '1B-ready', '1B-14']], KE_CONCEPTS: ['bridge.kinetics-equilibrium', ['1B-12', '1B-13', '1B-ready']] };
    for (const [list, [skill, chapters]] of Object.entries(sets))
      add('chem-1b-readiness', d[list].map((a, i) => item(g, list, i, { skill, courses: ['1A', '1B'], chapters, origin: 'original', type: 'mc', ...mcFromArray(a, true) })));
  }

  // ---------- Quantum Quest: Dr. Dan's own items, his Unit 6 worksheet set and the 3A config set ----------
  {
    const g = 'quantumchemistry', d = await pull(page, g, ['bank']);
    const chapters = { '3A': '3A-3', '1A': '1A-6' };
    const keep = d.bank.map((q, i) => [q, i]).filter(([q]) => !q.src || q.src === 'unit6' || q.src === '3A'); // publisher (tro) and ACS-style items stay out
    add('quantum', keep.map(([q, i]) => {
      const courses = q.c3a ? ['3A', '1A'] : ['1A'];
      const t = q.type === 'number' ? 'number' : q.type === 'choice' ? 'mc' : 'quantum-' + q.type;
      const f = { skill: 'quantum.' + q.mode, courses, chapters: courses.map(c => chapters[c]), origin: 'original', type: t, prompt: q.q, hint: q.hint, explain: q.why };
      if (t === 'number') Object.assign(f, { answer: q.value, unit: q.unit || undefined });
      else if (t === 'mc') Object.assign(f, { answer: q.answer, choices: q.choices });
      else f.data = q;
      return item(g, 'bank', i, f);
    }));
  }


  // ---------- Reaction Rumble: all 222 reactions with balanced coefficients and phases ----------
  {
    const g = 'reactions';
    await page.goto('file://' + path.join(REPOS, g, 'index.html'), { waitUntil: 'load' });
    await page.waitForTimeout(400);
    const D = await page.evaluate(() => D.map(d => ({ cat: d.cat, r: d.r, p: d.p, coef: d.coef, hint: d.hint, states: Object.fromEntries([...d.r, ...d.p].map(f => [f, stateOf(f, d)])) })));
    const side = (fs, cs, st) => fs.map((f, i) => (cs[i] === 1 ? '' : cs[i] + ' ') + f + '(' + st[f] + ')').join(' + ');
    add('reactions', D.map((d, i) => item(g, 'D', i, {
      skill: 'reactions.' + d.cat.toLowerCase().replace(/\s+/g, '-'), courses: ['3A', '1A'], chapters: ['3A-10', '1A-4'], origin: 'original',
      type: 'reaction', prompt: 'Predict the products and balance: ' + d.r.join(' + ') + ' →',
      answer: side(d.r, d.coef.slice(0, d.r.length), d.states) + ' → ' + side(d.p, d.coef.slice(d.r.length), d.states),
      hint: d.hint, data: d })));
  }

  // ---------- Final Boss! (finalexam): standardized-final-style multiple choice for 3A, 3B, 1A, 1B ----------
  // Every item is original. Items modeled on Dr. Dan's Canvas quizzes carry src:'canvas-quiz' and are left out.
  // Items with drawings (Lewis/skeletal structures, figures, picture choices) get type 'finalboss-mc'
  // with the raw drawing data in `data`; Final Boss!'s renderer (also used by Exam Practice in
  // functionalgroups / organicreactions / carbohydrates) draws them. Text-only items are plain 'mc'.
  {
    const g = 'finalexam', d = await pull(page, g, ['BANK']);
    const SUB = '₀₁₂₃₄₅₆₇₈₉', SUP = { 0: '⁰', 1: '¹', 2: '²', 3: '³', 4: '⁴', 5: '⁵', 6: '⁶', 7: '⁷', 8: '⁸', 9: '⁹', '+': '⁺', '-': '⁻', '−': '⁻', n: 'ⁿ' };
    const plain = h => strip(String(h ?? '')
      .replace(/<sub>([^<]*)<\/sub>/g, (m, t) => /^[0-9]+$/.test(t) ? [...t].map(c => SUB[c]).join('') : '_' + t)
      .replace(/<sup>([^<]*)<\/sup>/g, (m, t) => [...t].every(c => SUP[c]) ? [...t].map(c => SUP[c]).join('') : '^' + t)
      .replace(/<br\s*\/?>/g, ' ').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&'));
    const CH = {
      '3A': { measure: ['1'], atoms: ['2'], electrons: ['3'], matter: ['1', '7'], naming: ['4'], moles: ['5'], bonding: ['6'], energy: ['7'], gases: ['8'], solutions: ['9'], reactions: ['10'], stoich: ['11'], acids: ['12'], equilibrium: ['13'], nuclear: ['14'] },
      '3B': { structure: ['1'], properties: ['1'], hydrocarbons: ['2'], isomers: ['2', '6'], aromatic: ['3'], alcohols: ['4'], carbonyls: ['5'], chirality: ['6'], acids_esters: ['7'], amines: ['8'], carbs: ['9'], lipids: ['10'], proteins: ['11'], enzymes: ['12'], nucleic: ['13'], metabolism: ['14', '15', '16', '17'] },
      '1A': { measure: ['1'], atoms: ['2'], composition: ['3'], reactions: ['4'], thermo: ['5'], quantum: ['6'], periodic: ['6'], bonding: ['7'], advanced: ['8'], gases: ['9'], liquids: ['10'], solutions: ['11'] },
      '1B': { kinetics: ['12'], equilibrium: ['13'], acidbase: ['14'], buffers: ['15'], solubility: ['15'], thermo: ['16'], electro: ['17'], coordination: ['19'], nuclear: ['21'] } };
    const MID = ['structure', 'properties', 'hydrocarbons', 'isomers', 'aromatic', 'alcohols', 'carbonyls', 'chirality', 'acids_esters', 'amines'];
    let skipped = 0;
    for (const course of ['3A', '3B', '1A', '1B']) {
      const list = 'BANK.' + course;
      add('final-exam-' + course.toLowerCase(), (d.BANK[course] || []).map((q, i) => {
        if (q.src === 'canvas-quiz') { skipped++; return null; }
        const drawn = !!(q.s || q.cs || q.f) || q.c.some(c => String(c).startsWith('§'));
        const chapters = (CH[course][q.t] || []).map(n => course + '-' + n).concat(course === '3A' ? ['3A-review'] : []);
        return item(g, list, i, {
          skill: 'finalexam.' + course.toLowerCase() + '.' + q.t, courses: [course], chapters, origin: 'original',
          made: q.src || 'original', exam: course === '3B' ? (MID.includes(q.t) ? 'midterm' : 'final') : 'final',
          type: drawn ? 'finalboss-mc' : 'mc', difficulty: q.d, calc: !!q.k,
          prompt: plain(q.q), choices: q.c.map(plain), answer: plain(q.c[0]), hint: plain(q.h), explain: plain(q.w),
          html: { prompt: q.q, choices: q.c, hint: q.h, explain: q.w },
          data: drawn ? { s: q.s, cs: q.cs, f: q.f } : undefined });
      }).filter(Boolean));
    }
    console.log('finalexam: skipped', skipped, 'canvas-quiz items');
  }

  // ---------- Ion table: Green Sheet polyatomics (polyatomic game) + cations and monatomic anions (Naming & Formulas) ----------
  {
    const src = path.join(REPOS, 'ionicformula', 'index.html');
    const CAT = grab(src, 'CATIONS'), MONO = grab(src, 'MONATOMIC_ANIONS');
    const poly = (await pull(page, 'polyatomic', ['ions'])).ions;
    const sup = q => (Math.abs(q) === 1 ? '' : Math.abs(q)) + (q > 0 ? '+' : '-');
    const cations = CAT.map(c => ({ formula: c.sym + '^' + sup(c.charge), symbol: c.sym, charge: c.charge, name: c.type === 2 ? c.name.toLowerCase() + '(' + ['', 'I', 'II', 'III', 'IV'][c.charge] + ')' : c.name.toLowerCase(), typeII: c.type === 2, polyatomic: /[A-Z].*[A-Z0-9]/.test(c.sym) }));
    for (const c of cations) if (c.symbol === 'Hg2') c.name = 'mercury(I)';          // Hg2^2+ is mercury(I)
    for (const c of grab(path.join(REPOS, 'reactions', 'index.html'), 'CATS'))       // add Reaction Rumble's extra cations (Pb2+, Sr2+)
      if (c.n && !cations.some(x => x.symbol === c.s && x.charge === c.q)) cations.push({ formula: c.s + '^' + sup(c.q), symbol: c.s, charge: c.q, name: c.n, typeII: /\(/.test(c.n), polyatomic: false });
    const anions = MONO.map(a => ({ formula: a.sym + '^' + sup(-a.charge), symbol: a.sym, charge: -a.charge, name: a.name, polyatomic: false }));
    const polyatomic = poly.map(i => { const m = i.formulas[0].match(/^(.*)\^(\d*)([+-])$/); return { formula: i.formulas[0], symbol: m[1], charge: (m[3] === '-' ? -1 : 1) * +(m[2] || 1), name: i.name, alsoCalled: i.names.filter(n => n !== i.name), greenSheetGroup: i.group, polyatomic: true }; });
    fs.writeFileSync(path.join(OUT, 'data/ions.json'), JSON.stringify({ from: ['ionicformula', 'polyatomic'], note: 'Real ions only. Rule-practice names that Naming & Formulas builds (e.g. carbonite) are not listed. Polyatomic ions follow the Green Sheet.', cations, anions, polyatomic }, null, 1));
  }
  // ---------- Shared reference data ----------
  {
    const p = await pull(page, 'polyatomic', ['ions']);
    fs.writeFileSync(path.join(OUT, 'data/polyatomic-ions.json'), JSON.stringify({ from: 'polyatomic', source: 'Green Sheet', ions: p.ions }, null, 1));
    const e = await pull(page, 'elements', ['ELEMENTS']);
    const m = await pull(page, 'moles', ['masses', 'ELEMENT_NAMES']);
    const q = await pull(page, 'quantumchemistry', ['IE1', 'EA', 'EN']);
    const map = {};
    for (const el of e.ELEMENTS) map[el.symbol] = { z: el.z, symbol: el.symbol, name: el.name, core20: !!el.core };
    for (const [s, v] of (Array.isArray(m.masses) ? m.masses : Object.entries(m.masses))) (map[s] = map[s] || { symbol: s }).mass = +v;
    for (const [k, prop] of [['IE1', 'ie1_kJmol'], ['EA', 'ea_kJmol'], ['EN', 'en_pauling']]) for (const [s, v] of (Array.isArray(q[k]) ? q[k] : Object.entries(q[k]))) (map[s] = map[s] || { symbol: s })[prop] = v;
    const PT = 'H Hydrogen,He Helium,Li Lithium,Be Beryllium,B Boron,C Carbon,N Nitrogen,O Oxygen,F Fluorine,Ne Neon,Na Sodium,Mg Magnesium,Al Aluminum,Si Silicon,P Phosphorus,S Sulfur,Cl Chlorine,Ar Argon,K Potassium,Ca Calcium,Sc Scandium,Ti Titanium,V Vanadium,Cr Chromium,Mn Manganese,Fe Iron,Co Cobalt,Ni Nickel,Cu Copper,Zn Zinc,Ga Gallium,Ge Germanium,As Arsenic,Se Selenium,Br Bromine,Kr Krypton,Rb Rubidium,Sr Strontium,Y Yttrium,Zr Zirconium,Nb Niobium,Mo Molybdenum,Tc Technetium,Ru Ruthenium,Rh Rhodium,Pd Palladium,Ag Silver,Cd Cadmium,In Indium,Sn Tin,Sb Antimony,Te Tellurium,I Iodine,Xe Xenon,Cs Cesium,Ba Barium,La Lanthanum,Ce Cerium,Pr Praseodymium,Nd Neodymium,Pm Promethium,Sm Samarium,Eu Europium,Gd Gadolinium,Tb Terbium,Dy Dysprosium,Ho Holmium,Er Erbium,Tm Thulium,Yb Ytterbium,Lu Lutetium,Hf Hafnium,Ta Tantalum,W Tungsten,Re Rhenium,Os Osmium,Ir Iridium,Pt Platinum,Au Gold,Hg Mercury,Tl Thallium,Pb Lead,Bi Bismuth,Po Polonium,At Astatine,Rn Radon'.split(',').map(x => x.split(' '));
    PT.forEach(([s, n], i) => { if (map[s]) { map[s].z = map[s].z || i + 1; map[s].name = map[s].name || n; } });
    fs.writeFileSync(path.join(OUT, 'data/elements.json'), JSON.stringify({ from: ['elements', 'moles', 'quantumchemistry'], massSource: 'Yellow Sheet', elements: Object.values(map).sort((a, b) => (a.z || 999) - (b.z || 999)) }, null, 1));
    const f = await pull(page, 'functionalgroups', ['MEDLIB']);
    fs.writeFileSync(path.join(OUT, 'data/med-molecules.json'), JSON.stringify({ from: 'functionalgroups', molecules: f.MEDLIB }, null, 1));
    const s = await pull(page, 'carbohydrates', ['SUG']);
    fs.writeFileSync(path.join(OUT, 'data/sugars.json'), JSON.stringify({ from: 'carbohydrates', sugars: Array.isArray(s.SUG) ? Object.fromEntries(s.SUG) : s.SUG }, null, 1));
  }
  await browser.close();

  // ---------- Write banks + index ----------
  fs.mkdirSync(path.join(OUT, 'bank'), { recursive: true });
  const index = { updated: new Date().toISOString().slice(0, 10), banks: {}, chapters: {}, skills: {} };
  for (const [file, items] of Object.entries(banks)) {
    const clean = JSON.parse(JSON.stringify(items));            // drops undefined fields
    const ids = new Set(); for (const it of clean) { if (ids.has(it.id)) it.id += '-' + it.from.index; ids.add(it.id); }
    fs.writeFileSync(path.join(OUT, 'bank', file + '.json'), JSON.stringify(clean, null, 1));
    index.banks[file] = clean.length;
    for (const it of clean) {
      index.skills[it.skill] = (index.skills[it.skill] || 0) + 1;
      for (const ch of it.chapters) (index.chapters[ch] = index.chapters[ch] || {})[file] = (index.chapters[ch][file] || 0) + 1;
    }
  }
  fs.writeFileSync(path.join(OUT, 'index.json'), JSON.stringify(index, null, 1));
  console.log(JSON.stringify(index.banks), 'total', Object.values(index.banks).reduce((a, b) => a + b, 0));
})();
