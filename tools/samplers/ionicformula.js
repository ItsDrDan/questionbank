// Sampler for "Naming & Formulas" (ionicformula). The game's code is wrapped in an IIFE, so it is driven through its
// own UI: click a practice button (its makeQuestion() draws the question), read the question from the page,
// press Show Answer to read the game's answer, then type the bank answer + every accept string into the game's
// answer box and press Check Answer: each one must be graded correct by checkQuizAnswer().
// Modes sampled: binaryionic, polyatomicionic, acids, covalent.
// Skipped: mixed, name, build (random mixtures of those same four pools); free builder (not scored);
//          every "Name -> Build" draw (drag-and-drop ion cards; the same name->formula items come from typed draws).
// Real ions only: the game derives rule-practice ions/acids that do not exist (borite, carbonite, silicite,
// carbonous acid ...). Kept only when every ion is in questionbank/data/ions.json (Green Sheet polyatomics,
// common monatomics, listed cations); acids only when their parent anion is. Also dropped:
//   - telluric acid "H2TeO4" (tellurate is on the Green Sheet but the real acid is Te(OH)6 / H6TeO6),
//   - hydronium with hydroxide/oxide/peroxide/nitride/sulfide and ammonium with oxide/peroxide/nitride
//     (acid + strong base: these "compounds" do not exist; hydronium hydroxide is just water).
// Covalent: the game pairs any two of its 12 nonmetals in either order (e.g. "fluorine dioxide" FO2). Only pairs
// written in the conventional order (B Si C P N Se S I Br Cl O F: less electronegative element first) are kept.
// Names: answer uses "iron(III)" / "hydrogen phosphate"; the game's "iron (III)" and fused "hydrogenphosphate"
// are in accept (the game accepts all of them).
const path = require('path');
const IONS = require(path.join(__dirname, '..', '..', 'data', 'ions.json'));

module.exports = async (page, ctx) => {
  const norm = s => s.toLowerCase().replace(/\s+/g, ' ').trim().replace(/\s+\(/g, '(');
  const okCation = new Set(IONS.cations.map(c => norm(c.name)));
  const fOf = a => a.formula || (a.formulas && a.formulas[0]) || '';
  const okAnion = new Set([...IONS.anions, ...IONS.polyatomic].filter(a => /-$/.test(fOf(a))).map(a => norm(a.name)));
  // parent anion formula -> acid formula
  const anionFormulas = [...IONS.anions, ...IONS.polyatomic].map(fOf).filter(f => /-$/.test(f));
  const okAcid = new Set();
  for (const f of anionFormulas) {
    const m = f.match(/^(.*)\^(\d*)-$/); if (!m) continue;
    const n = Number(m[2] || 1);
    okAcid.add((n === 1 ? 'H' : 'H' + n) + m[1]);
  }
  okAcid.delete('H2TeO4');
  // real ions, but the "compound" would just react (acid + strong base) or is not a real substance
  const NONSENSE = {
    hydronium: ['hydroxide', 'oxide', 'peroxide', 'nitride', 'sulfide'],
    ammonium: ['oxide', 'peroxide', 'nitride'],
  };
  const ORDER = ['B', 'Si', 'C', 'P', 'N', 'Se', 'S', 'I', 'Br', 'Cl', 'O', 'F'];
  // Covalent: keep only compounds that really exist (the game pairs any two nonmetals with any prefixes).
  const REAL_COVALENT = new Set(('CO CO2 N2O NO NO2 N2O3 N2O4 N2O5 SO2 SO3 SF4 SF6 SCl2 S2Cl2 PCl3 PCl5 PBr3 PBr5 PF3 PF5 PI3 P2O5 P4O10 P4O6 P4S3 ' +
    'BF3 BCl3 BBr3 BI3 B2O3 CCl4 CBr4 CF4 CI4 CS2 SiCl4 SiF4 SiBr4 SiI4 SiO2 Si3N4 NCl3 NF3 NBr3 NI3 N2F4 ' +
    'IF5 IF7 ICl ICl3 IBr I2O5 BrF BrF3 BrF5 BrCl ClF ClF3 ClF5 Cl2O Cl2O7 ClO2 OF2 SeO2 SeO3 SeF4 SeF6 SeCl4 SeS2').split(' '));
  NONSENSE.hydronium = ['*'];   // hydronium salts are not stable compounds students should write

  const PLAN = [ // [practice key, seed, draws, cap]
    ['binaryionic', 41, 400, 40],
    ['polyatomicionic', 42, 1500, 40],
    ['acids', 43, 800, 60],
    ['covalent', 44, 6000, 40],
  ];
  const items = [];
  for (const [mode, seed, draws, cap] of PLAN) {
    await ctx.seed(seed);
    const raw = await page.evaluate(({ mode, draws }) => {
      const $ = id => document.getElementById(id);
      const shown = id => $(id).style.display !== 'none';
      document.querySelector(`.practice-btn[data-practice="${mode}"]`).click();
      const out = [];
      for (let t = 0; t < draws; t++) {
        if (t) $('quizNextBtn').click();
        if (shown('quizBuildArea')) continue;
        const q = {
          kicker: $('questionKicker').textContent, prompt: $('questionPrompt').textContent,
          targetHTML: $('questionTarget').innerHTML, targetText: $('questionTarget').textContent,
          hint: $('quizHint').textContent, dir: shown('quizNameArea') ? 'name' : 'formula',
        };
        $('quizRevealBtn').click();
        const fb = $('quizFeedback');
        q.name = fb.querySelector('strong').textContent;
        const mono = fb.querySelector('.mono');
        q.formula = mono ? mono.textContent : q.targetText;
        q.formulaHTML = mono ? mono.innerHTML : q.targetHTML;
        // candidate responses
        let answer, accept = [];
        if (q.dir === 'name') {
          answer = q.name.replace(/\s+\(/g, '(');
          if (/(^| )(di)?hydrogen\S/.test(answer)) { accept.push(answer); answer = answer.replace(/(^| )((di)?hydrogen)(\S)/, '$1$2 $4'); }
          if (q.name !== answer) accept.push(q.name);
          if (/\(/.test(answer)) accept.push(answer.replace(/\(/g, ' ('));
        } else {
          answer = q.formula;
          if (/C2H3O2/.test(answer)) accept.push(answer.replace('C2H3O2', 'CH3COO'));
        }
        accept = [...new Set(accept)].filter(a => a !== answer);
        q.answer = answer; q.accept = accept; q.fails = [];
        for (const r of [answer, ...accept]) {
          if (q.dir === 'name') $('quizNameInput').value = r; else $('quizFormulaInput').textContent = r;
          $('quizCheckBtn').click();
          if (!/\bok\b/.test(fb.className)) q.fails.push(r);
        }
        out.push(q);
      }
      return out;
    }, { mode, draws });

    const seen = new Set();
    let idx = 0;
    for (const q of raw) {
      const key = q.dir + '|' + q.formula;
      if (seen.has(key)) continue;
      seen.add(key);
      if (q.fails.length) throw new Error(`game rejected ${q.fails.join(', ')} for ${q.name}`);
      // realness / convention filters
      if (mode === 'acids') {
        if (!okAcid.has(q.formula)) continue;
      } else if (mode === 'covalent') {
        const els = q.formula.match(/[A-Z][a-z]?/g);
        if (els.length !== 2 || ORDER.indexOf(els[0]) > ORDER.indexOf(els[1]) || !REAL_COVALENT.has(q.formula)) continue;
      } else {
        const words = norm(q.name).split(' ');
        const an = words.pop(), cat = words.join(' ');
        if (!okCation.has(cat) || !okAnion.has(an)) continue;
        if (NONSENSE[cat] && (NONSENSE[cat].includes(an) || NONSENSE[cat].includes('*'))) continue;
      }
      if (items.filter(i => i.skill === 'ionicformula.' + mode).length >= cap) break;
      const it = { skill: 'ionicformula.' + mode, courses: ['3A', '1A'], chapters: ['3A-4', '1A-2'], type: 'text' };
      if (q.dir === 'name') {
        it.prompt = `${q.prompt}<br><strong>${q.targetHTML}</strong>`;
      } else {
        it.prompt = `${q.prompt}<br><strong>${q.targetText.replace(/\s+\(/g, '(')}</strong><br>Type the formula with plain numbers for subscripts, e.g. ${mode === 'acids' ? 'H2SO4' : mode === 'covalent' ? 'N2O4' : 'Ca(NO3)2'}.`;
      }
      it.answer = q.answer;
      if (q.accept.length) it.accept = q.accept;
      it.hint = q.hint;
      it.explain = `<strong>${q.name.replace(/\s+\(/g, '(')}</strong> = ${q.formulaHTML}`;
      Object.assign(it, { origin: 'original', from: { game: 'ionicformula', list: 'sample:' + mode, index: idx++ } });
      items.push(it);
    }
  }
  return items;
};
