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

// ---------- Per-choice feedback ("why"): one short reason for each wrong choice, built from the item's own numbers ----------
const SHAPES = { 'Linear': [[2, 0], [5, 3]], 'Bent or Angular': [[3, 1], [4, 2]], 'Trigonal planar': [[3, 0]], 'Tetrahedral': [[4, 0]],
  'Trigonal pyramidal': [[4, 1]], 'Trigonal bipyramidal': [[5, 0]], 'Sawhorse or Seesaw': [[5, 1]], 'T-shape': [[5, 2]],
  'Octahedral': [[6, 0]], 'Square pyramidal': [[6, 1]], 'Square planar': [[6, 2]] };
const BASIC = { 'Linear': 2, 'Trigonal planar': 3, 'Tetrahedral': 4, 'Trigonal bipyramidal': 5, 'Octahedral': 6 };
const strip = x => String(x == null ? '' : x).replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
const pl = (n, w) => n + ' ' + w + (n === 1 ? '' : 's');
const lpWord = n => n === 0 ? 'no lone pairs' : pl(n, 'lone pair');
function whyFor(it) {
  const ex = strip(it.explain), ans = strip(it.answer), skill = it.skill.split('.')[1];
  const one = (c, f) => strip(c) === ans ? '' : f(strip(c));
  if (/vsepr-(molecular-shape|electron-geometry)$/.test(skill)) {
    const m = ex.match(/(\d+) electron groups? \((\d+) bonded atoms? \+ (\d+) lone pairs?\)/); if (!m) return;
    const [g, b, l] = [+m[1], +m[2], +m[3]], here = `This atom has ${g} electron groups (${pl(b, 'bonded atom')} + ${lpWord(l)}).`;
    if (/molecular-shape/.test(skill)) return it.choices.map(c => one(c, c => {
      const need = SHAPES[c]; if (!need) return '';
      const sameG = need.find(([G]) => G === g);
      const desc = need.map(([G, L]) => `${G} electron groups with ${lpWord(L)}`).join(', or ');
      if (BASIC[c] === g && c !== ans && l > 0) return `${c} is the basic (electron-group) geometry here, not the molecular shape. The shape names only where the atoms are, so the ${lpWord(l)} change it. ${here}`;
      if (sameG) return `${c} needs ${desc}. The electron-group count matches, but the lone pairs don’t. ${here}`;
      return `${c} needs ${desc}. ${here}`;
    }));
    return it.choices.map(c => one(c, c => {
      const n = BASIC[c]; if (!n) return '';
      if (n === b && l > 0) return `${c} counts only the ${b} bonded atoms. Lone pairs are electron groups too, so count them. ${here}`;
      return `${c} is the basic geometry for ${n} electron groups. ${here}`;
    }));
  }
  if (/polarity$/.test(skill) && it.choices.length === 2 && /molecule/i.test(ans)) {
    const core = ex.replace(/\s*\(Bonds:[^)]*\)\s*$/, '');
    return it.choices.map(c => one(c, c => /^Polar/i.test(c)
      ? `Polar needs a net dipole, with one side of the molecule partly negative. This molecule has none. ${core}`
      : `Nonpolar would need no polar bonds, or bond dipoles that cancel perfectly. Here they don’t. ${core}`));
  }
  if (skill === 'bond-category') {
    const d = (ex.match(/ΔEN = ([\d.]+)/) || [])[1]; if (!d) return;
    return it.choices.map(c => one(c, c => /^Nonpolar/i.test(c) ? `Nonpolar covalent needs ΔEN of 0.4 or less. Here ΔEN = ${d}, so electrons are shared unevenly.`
      : /^Polar/i.test(c) ? `Polar covalent needs ΔEN greater than 0.4. Here ΔEN = ${d}, so the electrons are shared about equally.`
      : /^Ionic/i.test(c) ? `Ionic needs a very large ΔEN (a metal with a nonmetal). Here ΔEN = ${d}.` : ''));
  }
  if (skill === 'polarity-trends') {
    const p = strip(it.prompt), check = (ex.match(/Yellow-sheet check:\s*(.*)$/) || [])[1] || '';
    const tail = check ? ` Yellow-sheet check: ${check}` : '';
    if (/polar or nonpolar\?/.test(p)) return it.choices.map(c => one(c, c => /^Nonpolar/i.test(c)
      ? `The two atoms sit far enough apart on the trend that one pulls the shared electrons harder, so the bond isn’t nonpolar.${tail}`
      : `These atoms are close enough on the trend (ΔEN 0.4 or less) that the electrons are shared about equally, so the bond isn’t polar.${tail}`));
    if (/more polar/.test(p)) return it.choices.map(c => one(c, c => `The ${c} bond has the smaller electronegativity difference: its atoms are closer together on the trend, so it is less polar than ${ans}.${tail}`));
    if (/partial negative/.test(p)) return it.choices.map(c => one(c, c => /^Neither/.test(c)
      ? `Electrons are shared equally only between atoms with the same electronegativity. ${ans} is more electronegative, so it pulls the electrons closer and gets δ−.${tail}`
      : `${c} is farther from fluorine on the table, so it is less electronegative. It gets δ+, not δ−.${tail}`));
    if (/more electronegative|most electronegative/.test(p)) return it.choices.map(c => one(c, c => c === 'H'
      ? `H is an exception to the corner rule: its electronegativity (2.1) is lower than C, N, O and the halogens. ${ans} is closer to fluorine.${tail}`
      : `${c} is farther from fluorine (the upper right corner) than ${ans}, so it pulls electrons less strongly.${tail}`));
    return;
  }
  if (skill === 'octet-exception') {
    const ve = (ex.match(/^(\d+) valence electrons/) || [])[1], center = (ex.match(/central (\w+)/) || [])[1];
    const here = ve ? ` This species has ${ve} valence electrons${ve % 2 ? ' (an odd number)' : ' (an even number)'}${center ? ' and its central atom is ' + center : ''}.` : '';
    return it.choices.map(c => one(c, c => /^Electron-deficient/.test(c) ? `Electron-deficient means the central atom has fewer than 8 electrons (usually B or Be, or a carbocation).${here}`
      : /^Odd/.test(c) ? `An odd-electron radical needs an odd total number of valence electrons, leaving one unpaired.${here}`
      : /^Expanded/.test(c) ? `Expanded valence means more than 8 electrons on a central atom from period 3 or below.${here}` : ''));
  }
}

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
