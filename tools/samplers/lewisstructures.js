// Sampler for lewisstructures (Lewis Structure Studio). The game's practice items are molecule records in
// BANK / ORGANIC_BANK plus generated periodic-trend questions (TREND_GEN via makeTrendQuestion()). Drawing a
// Lewis structure can't be a bank item, so this sampler keeps the sub-questions the game actually asks and grades:
//   - Step 1 of the builder: total valence electrons (3A/1A) or usual number of bonds (3B organic)
//   - VSEPR mode: electron groups, lone pairs on the center, basic (electron) geometry, molecular shape
//   - Polarity Lab (EN values style): bond ΔEN, bond category, polar/nonpolar molecule
//   - Polarity Lab (periodic trends style): the quick trend questions and polar/nonpolar molecule
//   - Octet Exceptions: which exception the species shows
// Every item is graded correct by the game's own check() before it is kept (see verify* below).
// Items whose data cite a Tro (publisher) source are excluded; OpenStax-cited and uncited items are kept.

const whyFor = require('../whys/lewis');
const GAME = 'lewisstructures';
const CH = { '3A': ['3A-6'], '1A': ['1A-7'], '3B': ['3B-1'] };
module.exports = async (page, ctx) => {
  const items = [];
  const push = (list, base) => list.forEach((r, i) => {
    if (!r.ok) throw new Error(`${base}: game checker rejected its own answer for ${r.prompt.slice(0, 120)}`);
    const it = { skill: `${GAME}.${r.slug}`, courses: r.courses, chapters: r.chapters, type: r.type, prompt: r.prompt };
    if (r.type === 'mc') it.choices = r.choices;
    it.answer = r.answer;
    if (r.type === 'text' && r.accept) it.accept = r.accept;
    if (r.type === 'number') { if (r.unit) it.unit = r.unit; it.tolerance = r.tolerance; }
    if (r.hint) it.hint = r.hint;
    if (r.explain) it.explain = r.explain;
    if (r.type === 'mc') { const w = whyFor({ ...it, explain: r.explain }); if (w && w.some(Boolean)) it.why = w; }
    it.origin = 'original';
    it.from = { game: GAME, list: 'sample:' + r.list, index: r.index };
    items.push(it);
  });

  // Shared in-page helpers (installed once).
  await page.evaluate(() => {
    const W = window;
    // The game's randomIndex() draws from crypto.getRandomValues; route it through the seeded Math.random
    // so sampling is reproducible (runtime-only; the game file is not changed).
    crypto.getRandomValues = arr => { for (let i = 0; i < arr.length; i++) arr[i] = Math.floor(Math.random() * 4294967296) >>> 0; return arr; };
    W.__lx = {};
    const L = W.__lx;
    L.isPublisher = x => /tro|pearson|cengage|mcgraw|zumdahl|silberberg|test ?bank|acs/i.test(String(x.sourceBank || '')) || /^tro-/.test(x.id);
    L.ok = () => /\bgood\b/.test($('feedback').className);
    L.setup = (c, m, x, style) => {
      course = c; mode = m; if (style) polarPref[c] = style; q = x; stage = 0; atoms = []; bonds = []; saved = []; resMap = null;
      assistance = false; awarded = false; hintLevel = 0; ddLogged = 0; $('feedback').className = ''; $('feedback').textContent = '';
    };
    L.fhtml = x => { q = x; return displayPracticeFormula(); };
    L.label = x => '<b>' + x.name + '</b> (' + L.fhtml(x) + ')';
    // Describe a center so a text prompt can point at it without the game's highlighted drawing.
    L.centerText = (x, id) => {
      const g = x.g, a = g.atoms.find(z => z.id === id);
      const same = g.atoms.filter(z => z.s === a.s).length;
      if (same === 1) return (x.centers.length === 1 ? 'the central ' : 'the ') + a.s + ' atom';
      const parts = {}, ord = ['', '', ' (double bond)', ' (triple bond)'];
      neighbors(g, id).forEach(b => { const o = g.atoms.find(z => z.id === (b.a === id ? b.b : b.a)); const k = o.s + ord[b.order]; parts[k] = (parts[k] || 0) + 1; });
      const keys = Object.keys(parts).sort((p, r) => (p[0] === 'H') - (r[0] === 'H') || p.localeCompare(r));
      const words = ['', 'one', 'two', 'three', 'four', 'five', 'six'];
      const list = keys.map(k => words[parts[k]] + ' ' + k.replace(/^(\w+)/, '$1'));
      const joined = list.length === 1 ? list[0] : list.slice(0, -1).join(', ') + (list.length > 2 ? ',' : '') + ' and ' + list[list.length - 1];
      return 'the ' + a.s + ' atom that is bonded to ' + joined;
    };
    L.shuffled = arr => shuffle(arr.slice());
  });

  // ---------- 1. Total valence electrons (Lewis Builder step 1), 3A and 1A ----------
  await ctx.seed(7101);
  {
    const raw = await page.evaluate(() => {
      const L = window.__lx, out = [];
      const pools = {
        '3A': BANK.filter(x => !x.organic && x.level === '3A' && x.tags.includes('lewis') && !L.isPublisher(x)),
        '1A': BANK.filter(x => !x.organic && x.level === '1A' && ['lewis', 'large', 'exceptions', 'resonance'].some(t => x.tags.includes(t)) && !L.isPublisher(x)),
      };
      for (const lvl of ['3A', '1A']) {
        L.shuffled(pools[lvl]).slice(0, 40).forEach(x => {
          const m = ['lewis', 'large', 'exceptions', 'resonance'].find(t => x.tags.includes(t));
          L.setup(lvl === '3A' ? '3A' : '1A', m, x); renderQuestion();
          const c = counts(x.g), ans = valTotal(x.g);
          Object.keys(c).forEach(s => { $('val-' + s).value = VAL[s]; });
          $('electronTotal').value = ans; check();
          const ok = L.ok();
          const brk = Object.entries(c).map(([s, n]) => s + ': ' + n + ' × ' + VAL[s] + ' = ' + n * VAL[s]).join('; ');
          const adj = x.charge < 0 ? ' Add ' + (-x.charge) + ' electron(s) for the ' + (-x.charge) + '− charge.' : x.charge > 0 ? ' Subtract ' + x.charge + ' electron(s) for the ' + x.charge + '+ charge.' : '';
          out.push({ slug: 'valence-electrons', list: 'valence-' + lvl, courses: lvl === '3A' ? ['3A', '1A'] : ['1A'],
            chapters: lvl === '3A' ? ['3A-6', '1A-7', '1B-ready'] : ['1A-7', '1B-ready'], type: 'number',
            prompt: 'How many total valence electrons are available for the Lewis structure of ' + L.label(x) + '?',
            answer: ans, tolerance: 0, ok,
            hint: 'Add the valence electrons of every atom (its main-group A number). Add electrons for a negative charge; subtract for a positive charge.',
            explain: brk + '.' + adj + ' Total = <b>' + ans + '</b> valence electrons.' });
        });
      }
      return out;
    });
    push(raw.map((r, i) => ({ ...r, index: i })), 'valence');
  }

  // ---------- 2. VSEPR (geometry mode): 3A/1A and 3B ----------
  await ctx.seed(7202);
  {
    const raw = await page.evaluate(() => {
      const L = window.__lx, out = [];
      const egeoms = ['Linear', 'Trigonal planar', 'Tetrahedral', 'Trigonal bipyramidal', 'Octahedral'];
      const mgeoms = ['Linear', 'Bent', 'Trigonal planar', 'Tetrahedral', 'Trigonal pyramidal', 'Trigonal bipyramidal', 'Seesaw', 'T-shaped', 'Octahedral', 'Square pyramidal', 'Square planar'];
      const verify = (c, x) => {
        L.setup(c, 'geometry', x); renderQuestion();
        x.centers.forEach(id => { const v = geometryFor(x.g, id); $('domains-' + id).value = v.domains; $('lone-' + id).value = v.lp; $('eg-' + id).value = v.shape[0]; $('mg-' + id).value = v.shape[1]; });
        check(); return L.ok();
      };
      const groups = [
        ['3A', BANK.filter(x => !x.organic && x.level === '3A' && x.tags.includes('geometry') && !L.isPublisher(x)), ['3A', '1A'], ['3A-6', '1A-7', '1B-ready'], 'vsepr'],
        ['1A', BANK.filter(x => !x.organic && x.level === '1A' && x.tags.includes('geometry') && !L.isPublisher(x)), ['1A'], ['1A-7', '1B-ready'], 'vsepr'],
        ['3B', ORGANIC_BANK.filter(x => x.tags.includes('geometry') && !x.challenge && !L.isPublisher(x)), ['3B'], ['3B-1'], 'organic-vsepr'],
      ];
      for (const [c, pool, courses, chapters, pre] of groups) {
        const ok = {}; pool.forEach(x => { ok[x.id] = verify(c, x); });
        // candidate (molecule, center) pairs; for organics prefer one center per distinct local shape
        const cands = [];
        pool.forEach(x => {
          const seen = new Set();
          L.shuffled(x.centers).forEach(id => { const v = geometryFor(x.g, id), key = v.n + ',' + v.lp; if (seen.has(key)) return; seen.add(key); cands.push([x, id]); });
        });
        const kinds = ['shape', 'egeom', 'groups'];
        const per = { shape: 40, egeom: 30, groups: 30 };
        for (const kind of kinds) {
          const seenP = new Set(); let n = 0;
          for (const [x, id] of L.shuffled(cands)) {
            if (n >= per[kind]) break;
            const v = geometryFor(x.g, id), where = L.centerText(x, id), lab = L.label(x);
            const angle = v.shape[2], ex = v.domains + ' electron groups (' + v.n + ' bonded atom' + (v.n === 1 ? '' : 's') + ' + ' + v.lp + ' lone pair' + (v.lp === 1 ? '' : 's') + ') → basic geometry <b>' + shapeLabel(v.shape[0]) + '</b>; molecular shape <b>' + shapeLabel(v.shape[1]) + '</b> (ideal angles ' + angle + ').';
            const hint = 'Electron groups = bonded atoms + lone pairs on that atom; a double or triple bond counts as one group.';
            let r;
            if (kind === 'shape') r = { type: 'mc', prompt: 'Using VSEPR theory, what is the <b>molecular shape</b> around ' + where + ' in ' + lab + '?', choices: mgeoms.map(shapeLabel), answer: shapeLabel(v.shape[1]) };
            else if (kind === 'egeom') r = { type: 'mc', prompt: 'Using VSEPR theory, what is the <b>electron-group (basic) geometry</b> around ' + where + ' in ' + lab + '?', choices: egeoms.map(shapeLabel), answer: shapeLabel(v.shape[0]) };
            else {
              const lone = Math.random() < 0.5;
              r = lone ? { type: 'number', prompt: 'In the Lewis structure of ' + lab + ', how many <b>lone pairs</b> are on ' + where + '?', answer: v.lp, tolerance: 0 }
                : { type: 'number', prompt: 'In the Lewis structure of ' + lab + ', how many <b>electron groups</b> (bonded atoms plus lone pairs) surround ' + where + '?', answer: v.domains, tolerance: 0 };
            }
            if (seenP.has(r.prompt)) continue; seenP.add(r.prompt); n++;
            const slug = pre + '-' + (kind === 'shape' ? 'molecular-shape' : kind === 'egeom' ? 'electron-geometry' : 'electron-groups');
            out.push({ ...r, slug, list: slug + '-' + c, courses, chapters, ok: ok[x.id], hint, explain: ex + (x.organic && x.note ? ' ' + x.note : '') });
          }
        }
      }
      return out;
    });
    push(raw.map((r, i) => ({ ...r, index: i })), 'geometry');
  }

  // ---------- 3. Polarity Lab, EN-values style (3A/1A): molecule polarity, bond ΔEN, bond category ----------
  await ctx.seed(7303);
  {
    const raw = await page.evaluate(() => {
      const L = window.__lx, out = [];
      const groups = [
        ['3A', BANK.filter(x => !x.organic && x.level === '3A' && x.tags.includes('polarity') && typeof x.polar === 'boolean' && !L.isPublisher(x)), ['3A', '1A'], ['3A-6', '1A-7']],
        ['1A', BANK.filter(x => !x.organic && x.level === '1A' && x.tags.includes('polarity') && typeof x.polar === 'boolean' && !L.isPublisher(x)), ['1A'], ['1A-7']],
      ];
      const bondSeen = new Set();
      for (const [c, pool, courses, chapters] of groups) {
        const okm = {};
        pool.forEach(x => {
          L.setup(c, 'polarity', x, 'values'); renderQuestion();
          bondTypes().forEach((b, i) => { $('delta-' + i).value = b.delta.toFixed(1); $('bc-' + i).value = bondCategory(b.delta); $('end-' + i).value = higher(b); });
          $('moleculePolarity').value = x.polar ? 'Polar molecule' : 'Nonpolar molecule'; check(); okm[x.id] = L.ok();
        });
        L.shuffled(pool).slice(0, 40).forEach(x => {
          q = x;
          const shapes = x.centers.map(id => { const a = x.g.atoms.find(z => z.id === id); return a.s + ': ' + shapeLabel(geometryFor(x.g, id).shape[1]).toLowerCase(); });
          const bs = bondTypes().map(b => b.a + '–' + b.b + ' ΔEN ' + b.delta.toFixed(1)).join('; ');
          out.push({ slug: 'molecular-polarity', list: 'polarity-molecule-' + c, courses, chapters, type: 'mc',
            prompt: 'Is ' + L.label(x) + ' a polar or a nonpolar molecule?' + (shapes.length ? ' (Molecular shape at ' + shapes.join(', ') + '.)' : ''),
            choices: ['Polar molecule', 'Nonpolar molecule'], answer: x.polar ? 'Polar molecule' : 'Nonpolar molecule', ok: okm[x.id],
            hint: 'A polar bond is not enough: equal bond dipoles arranged symmetrically in 3D cancel. Unequal atoms or lone pairs on the center usually break the symmetry.',
            explain: (x.reason || '') + ' (Bonds: ' + bs + '.)' });
        });
        // unique heteronuclear bonds in this level's pool
        pool.forEach(x => {
          q = x;
          bondTypes().forEach(b => {
            if (b.a === b.b) return;
            const key = [b.a, b.b].sort().join('-'); if (bondSeen.has(key)) return; bondSeen.add(key);
            const ea = ELEMENTS[b.a].en.toFixed(1), eb = ELEMENTS[b.b].en.toFixed(1), d = b.delta;
            const given = 'Electronegativities: ' + b.a + ' = ' + ea + ', ' + b.b + ' = ' + eb + '.';
            out.push({ slug: 'bond-delta-en', list: 'bond-delta-' + c, courses, chapters, type: 'number', tolerance: 0.03, ok: okm[x.id],
              prompt: given + ' What is the electronegativity difference (ΔEN) for the ' + b.a + '–' + b.b + ' bond?', answer: d,
              hint: 'Subtract the smaller electronegativity from the larger one.',
              explain: '|' + ea + ' − ' + eb + '| = <b>' + d.toFixed(1) + '</b>; ' + higher(b) + ' is the more electronegative (δ−) end.' });
            out.push({ slug: 'bond-category', list: 'bond-category-' + c, courses, chapters, type: 'mc', ok: okm[x.id],
              prompt: given + ' Using the rule that a bond with ΔEN of 0.4 or less is nonpolar covalent, classify the ' + b.a + '–' + b.b + ' bond.',
              choices: ['Nonpolar covalent', 'Polar covalent'], answer: bondCategory(d),
              hint: 'Find ΔEN = larger EN − smaller EN, then compare it with 0.4.',
              explain: 'ΔEN = ' + d.toFixed(1) + (d <= 0.4 ? ' ≤ 0.4, so the bond is <b>nonpolar covalent</b>.' : ' > 0.4, so the bond is <b>polar covalent</b>; ' + higher(b) + ' is δ−.') });
          });
        });
      }
      return out;
    });
    push(raw.map((r, i) => ({ ...r, index: i })), 'polarity-values');
  }

  // ---------- 4. Polarity Lab, periodic-trends style: generated quick questions (3A, 1A, 3B) ----------
  {
    const merged = new Map(); let idx = 0;
    let seed = 7400;
    for (const c of ['3A', '1A', '3B']) {
      await ctx.seed(++seed);
      const raw = await page.evaluate(c => {
        const L = window.__lx, out = [], seen = new Set();
        course = c; mode = 'polarity'; polarPref[c] = 'trends'; lastTrendId = '';
        for (let k = 0; k < 600 && out.length < 35; k++) {
          const t = makeTrendQuestion();
          if (seen.has(t.id)) continue; seen.add(t.id);
          L.setup(c, 'polarity', t, 'trends'); renderQuestion();
          const r = [...document.querySelectorAll('input[name="trendChoice"]')].find(i => i.value === t.answer);
          if (r) r.checked = true; check();
          const ok = L.ok() && !!r;
          const lab = t.options.find(o => o[0] === t.answer)[1];
          out.push({ id: t.id, kind: t.kind, prompt: t.prompt, choices: t.options.map(o => o[1]), answer: lab, ok,
            hint: t.hint1, explain: (t.why ? t.why + ' ' : '') + 'Yellow-sheet check: ' + t.numbers });
        }
        return out;
      }, c);
      for (const r of raw) {
        if (!r.ok) throw new Error('trend ' + c + ': game rejected its own answer for ' + r.prompt);
        const key = r.id;
        if (merged.has(key)) { const m = merged.get(key); if (!m.courses.includes(c)) { m.courses.push(c); m.chapters.push(...CH[c]); } continue; }
        merged.set(key, { slug: 'polarity-trends', list: 'trends', courses: [c], chapters: [...CH[c]], type: 'mc', prompt: r.prompt,
          choices: r.choices, answer: r.answer, ok: true, hint: r.hint, explain: r.explain, index: idx++ });
      }
    }
    push([...merged.values()], 'trends');
  }

  // ---------- 5. 3B organic molecule polarity (Polarity Lab, trends style is the 3B default) ----------
  await ctx.seed(7505);
  {
    const raw = await page.evaluate(() => {
      const L = window.__lx, out = [];
      const pool = ORGANIC_BANK.filter(x => x.tags.includes('polarity') && !x.challenge && typeof x.polar === 'boolean' && !L.isPublisher(x) && trendFriendly(x));
      L.shuffled(pool).slice(0, 40).forEach(x => {
        L.setup('3B', 'polarity', x, 'trends'); renderQuestion();
        bondTypes().forEach((b, i) => { $('tend-' + i).value = trendMoleculeAnswer(b); });
        $('moleculePolarity').value = x.polar ? 'Polar molecule' : 'Nonpolar molecule'; check();
        out.push({ slug: 'organic-polarity', list: 'organic-polarity', courses: ['3B'], chapters: ['3B-1'], type: 'mc',
          prompt: 'Is ' + L.label(x) + ' a polar or a nonpolar molecule?', choices: ['Polar molecule', 'Nonpolar molecule'],
          answer: x.polar ? 'Polar molecule' : 'Nonpolar molecule', ok: L.ok(),
          hint: 'C–C and C–H bonds are essentially nonpolar; bonds from carbon to O, N, F or Cl are polar. Then ask whether the 3D shape cancels the bond dipoles.',
          explain: x.reason || '' });
      });
      return out;
    });
    push(raw.map((r, i) => ({ ...r, index: i })), 'organic-polarity');
  }

  // ---------- 6. Octet exceptions (1A) ----------
  await ctx.seed(7606);
  {
    const raw = await page.evaluate(() => {
      const L = window.__lx, out = [];
      const pool = BANK.filter(x => !x.organic && x.tags.includes('exceptions') && x.exception && !L.isPublisher(x));
      const choices = ['Electron-deficient', 'Odd-electron radical', 'Expanded valence'];
      L.shuffled(pool).forEach(x => {
        L.setup('1A', 'exceptions', x); stage = 1; renderQuestion();
        atoms = arrange(x.g).atoms; bonds = copy(x.g.bonds); draw();
        $('exceptionChoice').value = x.exception; check();
        q = x;
        const centre = x.g.atoms[x.centers[0]] || x.g.atoms[0];
        const why = x.exception === 'Electron-deficient' ? 'the central ' + centre.s + ' has fewer than eight electrons around it'
          : x.exception === 'Odd-electron radical' ? 'the species has an odd number of valence electrons (' + valTotal(x.g) + '), so one electron is unpaired'
          : 'the central ' + centre.s + ' holds more than eight electrons';
        out.push({ slug: 'octet-exception', list: 'exceptions', courses: ['1A'], chapters: ['1A-7'], type: 'mc',
          prompt: 'Which octet-rule exception does ' + L.label(x) + ' show?', choices, answer: x.exception, ok: L.ok(),
          hint: 'Count the valence electrons, then look at the central atom: fewer than 8, an odd total, or more than 8 (period 3 or below)?',
          explain: valTotal(x.g) + ' valence electrons; ' + why + ', so it is <b>' + x.exception.toLowerCase() + '</b>.' });
      });
      return out;
    });
    push(raw.map((r, i) => ({ ...r, index: i })), 'exceptions');
  }

  // ---------- 7. 3B Lewis builder step 1: usual number of bonds per element ----------
  await ctx.seed(7707);
  {
    const raw = await page.evaluate(() => {
      const L = window.__lx, out = [], done = new Set();
      ORGANIC_BANK.filter(x => x.tags.includes('lewis') && !x.challenge && !L.isPublisher(x)).forEach(x => {
        const els = Object.keys(counts(x.g)).filter(s => !done.has(s)); if (!els.length) return;
        L.setup('3B', 'lewis', x); renderQuestion();
        Object.keys(counts(x.g)).forEach(s => { $('trend-' + s).value = ORGANIC_VALENCE[s] || 1; }); check();
        const ok = L.ok();
        const lp = { C: 0, N: 1, O: 2, S: 2, F: 3, Cl: 3, Br: 3, I: 3, H: 0 };
        els.forEach(s => {
          done.add(s); const n = ORGANIC_VALENCE[s] || 1;
          out.push({ slug: 'organic-bonding-trends', list: 'bonding-trends', courses: ['3B'], chapters: ['3B-1'], type: 'number', tolerance: 0,
            prompt: 'In a neutral organic molecule, how many total bonds does a <b>' + s + '</b> atom usually make? (Count a double bond as 2 and a triple bond as 3.)',
            answer: n, ok, hint: 'H 1 • C 4 • N 3 • O 2. Sulfur usually makes 2 in these examples; halogens make 1.',
            explain: 'Neutral ' + s + ' usually makes <b>' + n + '</b> bond' + (n === 1 ? '' : 's') + ' and carries ' + lp[s] + ' lone pair' + (lp[s] === 1 ? '' : 's') + '.' });
        });
      });
      return out;
    });
    push(raw.map((r, i) => ({ ...r, index: i })), 'bonding-trends');
  }

  return items;
};
