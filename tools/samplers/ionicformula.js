// Sampler for "Naming & Formulas" (ionicformula, "Name That Compound!"). The game's data and generators are top-level
// globals, so the sampler calls the game's own generate(topic) and grades every bank answer with the question's own
// check(), the same function the game uses when a student presses Check.
// Skills (same ids as before the rebuild):
//   ionicformula.binaryionic      <- f2n-t1, f2n-t2, n2f-t1, n2f-t2   (Type I / Type II binary ionic, both directions)
//   ionicformula.polyatomicionic  <- f2n-poly, n2f-poly
//   ionicformula.acids            <- acid-bin, acid-oxy
//   ionicformula.covalent         <- f2n-cov, n2f-cov
// Skipped: "Build it" (ion pieces), "Ionic or Covalent?" sorter and acid-pair (multiple choice made for the game UI),
//          hydrates (CHEM 1A only; no bank skill for them yet).
// Real ions only: the game builds rule-practice ions from the Green Sheet patterns (hydrogen selenite, phosphite ...).
// Polyatomic items are kept only when the anion is in questionbank/data/ions.json (Green Sheet polyatomics and the
// common monatomics); acids only when their parent anion is. Cations come from the game's own CATIONS list
// (hydronium is never used: the game leaves it out of questions).
// Covalent: only pairs written in the conventional order (B Si C P N Se S I Br Cl O F) that are in REAL_COVALENT below.
// Names: answer uses "iron(III)" / "hydrogen phosphate"; "iron (III)" and fused "hydrogenphosphate" are in accept
// (the game accepts all of them).
const path = require('path');
const IONS = require(path.join(__dirname, '..', '..', 'data', 'ions.json'));

module.exports = async (page, ctx) => {
  const norm = s => s.toLowerCase().replace(/\s+/g, ' ').trim().replace(/\s+\(/g, '(');
  const fOf = a => a.formula || (a.formulas && a.formulas[0]) || '';
  const okAnion = new Set([...IONS.anions, ...IONS.polyatomic].filter(a => /-$/.test(fOf(a))).map(a => norm(a.name)));
  const anionFormulas = [...IONS.anions, ...IONS.polyatomic].map(fOf).filter(f => /-$/.test(f));
  const okAcid = new Set();
  for (const f of anionFormulas) {
    const m = f.match(/^(.*)\^(\d*)-$/); if (!m) continue;
    const n = Number(m[2] || 1);
    okAcid.add((n === 1 ? 'H' : 'H' + n) + m[1]);
  }
  okAcid.delete('H2TeO4');
  const NONSENSE = { ammonium: ['hydroxide', 'oxide', 'peroxide', 'nitride'] };
  const ORDER = ['B', 'Si', 'C', 'P', 'N', 'Se', 'S', 'I', 'Br', 'Cl', 'O', 'F'];
  const REAL_COVALENT = new Set(('CO CO2 N2O NO NO2 N2O3 N2O4 N2O5 SO2 SO3 SF4 SF6 SCl2 S2Cl2 PCl3 PCl5 PBr3 PBr5 PF3 PF5 PI3 P2O5 P4O10 P4O6 P4S3 ' +
    'BF3 BCl3 BBr3 BI3 B2O3 CCl4 CBr4 CF4 CI4 CS2 SiCl4 SiF4 SiBr4 SiI4 SiO2 Si3N4 NCl3 NF3 NBr3 NI3 N2F4 ' +
    'IF5 IF7 ICl ICl3 IBr I2O5 BrF BrF3 BrF5 BrCl ClF ClF3 ClF5 Cl2O Cl2O7 ClO2 OF2 SeO2 SeO3 SeF4 SeF6 SeCl4 SeS2').split(' '));

  const PLAN = [ // [skill, topics, seed, draws, cap]
    ['binaryionic', ['f2n-t1', 'f2n-t2', 'n2f-t1', 'n2f-t2'], 41, 600, 40],
    ['polyatomicionic', ['f2n-poly', 'n2f-poly'], 42, 1500, 40],
    ['acids', ['acid-bin', 'acid-oxy'], 43, 800, 60],
    ['covalent', ['f2n-cov', 'n2f-cov'], 44, 600, 40],
  ];
  const items = [];
  for (const [skill, topics, seed, draws, cap] of PLAN) {
    await ctx.seed(seed);
    const raw = await page.evaluate(({ topics, draws }) => {
      const out = [];
      const okCations = CATIONS.filter(c => c.id !== 'H3O').map(c => cationName(c));
      for (let t = 0; t < draws; t++) {
        const q = generate(topics[t % topics.length], { course: '1A' });
        const dir = q.kind;                        // 'name' (formula -> name) or 'formula' (name -> formula)
        let answer = q.plain, accept = [...(q.accept || [])];
        if (dir === 'name') {
          if (/(^| )(di)?hydrogen /.test(answer)) accept.push(answer.replace(/(^| )((di)?hydrogen) /, '$1$2'));
          if (/\(/.test(answer)) accept.push(answer.replace(/\(/g, ' ('));
        }
        accept = [...new Set(accept)].filter(a => a !== answer);
        const fails = [answer, ...accept].filter(r => !q.check(r).ok);
        out.push({ dir, topic: q.topic, prompt: q.prompt, eqHTML: q.eq, name: q.name, formula: q.formula, answer, accept, hint: q.hint.replace(/<[^>]+>/g, ''),
          cation: q.c ? cationName(q.c) : '', anion: q.a ? q.a.name : '', okCation: q.c ? okCations.includes(cationName(q.c)) : true, fails });
      }
      return out;
    }, { topics, draws });

    const seen = new Set();
    let idx = 0;
    for (const q of raw) {
      const key = q.dir + '|' + q.formula;
      if (seen.has(key)) continue;
      seen.add(key);
      if (q.fails.length) throw new Error(`game rejected ${q.fails.join(', ')} for ${q.name}`);
      if (skill === 'acids') {
        if (!okAcid.has(q.formula)) continue;
      } else if (skill === 'covalent') {
        const els = q.formula.match(/[A-Z][a-z]?/g);
        if (els.length !== 2 || ORDER.indexOf(els[0]) > ORDER.indexOf(els[1]) || !REAL_COVALENT.has(q.formula)) continue;
      } else {
        if (!q.okCation || !okAnion.has(norm(q.anion))) continue;
        if (NONSENSE[q.cation] && NONSENSE[q.cation].includes(q.anion)) continue;
      }
      if (items.filter(i => i.skill === 'ionicformula.' + skill).length >= cap) break;
      const it = { skill: 'ionicformula.' + skill, courses: ['3A', '1A'], chapters: ['3A-4', '1A-2'], type: 'text' };
      const fHTML = f => f.replace(/([A-Za-z)])(\d+)/g, '$1<sub>$2</sub>');
      if (q.dir === 'name') it.prompt = `${q.prompt}<br><strong>${q.eqHTML}</strong>`;
      else it.prompt = `${q.prompt}<br><strong>${q.name}</strong><br>Type the formula with plain numbers for subscripts, e.g. ${skill === 'acids' ? 'H2SO4' : skill === 'covalent' ? 'N2O4' : 'Ca(NO3)2'}.`;
      it.answer = q.answer;
      if (q.accept.length) it.accept = q.accept;
      it.hint = q.hint;
      it.explain = `<strong>${q.name}</strong> = ${fHTML(q.formula)}`;
      Object.assign(it, { origin: 'original', from: { game: 'ionicformula', list: 'sample:' + skill, index: idx++ } });
      items.push(it);
    }
  }
  return items;
};
