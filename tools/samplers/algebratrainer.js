// Sampler for algebratrainer ("Algebra for Chemistry"). Each EQ template becomes "plug-in-the-numbers" items:
// pick a target variable, rearrange with the game's own solver (trySolve/isoExpr), let the game's buildPlug()
// draw the given values (incl. its unit-conversion traps, e.g. °C given for a gas law) and compute the answer.
// The rearranging step itself is graded only through the tap-to-move tile UI, so it is not sampled as mc/text.
// Every item is checked (1) by the game's own plugVerdict() and (2) by an independent substitution of all values
// back into the ORIGINAL equation. Skill id = level (algebratrainer.md/as/mx/pw/lg); chapters = that template's q.ch.
const GAME = 'algebratrainer';
const LEVELS = ['md', 'as', 'mx', 'pw', 'lg'];
const DRAWS = 3; // numeric draws per template (cycling through its allowed targets)
const ORDER = ['3A', '1A', '1B'];

module.exports = async (page, ctx) => {
  const items = [];
  let seed = 7100;
  for (const lvl of LEVELS) {
    await ctx.seed(++seed);
    const raw = await page.evaluate(({ lvl, DRAWS }) => {
      S.chap = 'all';
      const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.random() * (i + 1) | 0; [a[i], a[j]] = [a[j], a[i]]; } return a; };
      // plain-HTML rendering of an expression tree (no game CSS needed)
      const fF = f => f.k === 'v' ? disp(f.name) : f.k === 'n' ? String(f.t != null ? f.t : f.v) : f.k === 'sum' ? '(' + fE(f.e) + ')'
        : f.k === 'log' ? 'log(' + fE(f.e) + ')' : f.k === 'ln' ? 'ln(' + fE(f.e) + ')' : f.k === 'p10' ? '10<sup>' + fE(f.e) + '</sup>'
        : f.k === 'exp' ? 'e<sup>' + fE(f.e) + '</sup>' : f.k === 'pw2' ? (f.e.length === 1 && f.e[0].s > 0 && f.e[0].n.length === 1 && !f.e[0].d.length ? fF(f.e[0].n[0]) : '(' + fE(f.e) + ')') + '<sup>2</sup>' : f.k === 'rt' ? '√(' + fE(f.e) + ')' : '?';
      const fT = t => { const n = t.n.length ? t.n.map(fF).join(' · ') : '1'; if (!t.d.length) return n;
        const d = t.d.map(fF).join(' · '); return (t.n.length > 1 ? '(' + n + ')' : n) + ' / ' + (t.d.length > 1 ? '(' + d + ')' : d); };
      const fE = e => e.length ? e.map((t, i) => (t.s < 0 ? (i ? ' − ' : '−') : (i ? ' + ' : '')) + fT(t)).join('') : '0';
      const eqHTML = q => { const [a, b] = q.f.split('=').map(parse); return fE(a) + ' = ' + fE(b); };
      const out = [];
      for (const q of EQ.filter(x => x.lvl === lvl)) {
        const [a0, b0] = q.f.split('=').map(parse);
        const tgs = targets(q, { L: a0, R: b0 });
        let order = shuffle(tgs), seenP = new Set(), made = 0;
        for (let k = 0, tries = 0; made < DRAWS && tries < 40; tries++, k++) {
          const g = order[k % order.length];
          SOLVE_OPS = opsOf(q);
          const s = trySolve({ L: a0, R: b0 }, g);
          if (!s) continue;
          const solvedSt = isT(s.st.L, g) ? s.st : { L: s.st.R, R: s.st.L };
          cur = { q, tg: g, st0: { L: a0, R: b0 }, moves: 0, hinted: false, shown: false, hintStep: 0, phase: 'solved' };
          TG = g; st = solvedSt;
          if (!buildPlug()) continue;
          const c = cur.plug;
          const givens = [...document.querySelectorAll('#plug .givens .given')].map(el => el.innerHTML);
          const prompt = '<p>' + esc(q.name) + ': <b>' + eqHTML(q) + '</b></p><p>Rearrange the equation for <b>' + disp(g) +
            '</b>, then plug in the numbers. Check the units: convert any value that needs it first.</p><p>' + givens.join('; ') + '</p>' +
            '<p>' + disp(g) + ' = ? ' + (c.unit ? esc(c.unit) : '(no unit)') + '</p>';
          if (seenP.has(prompt)) continue;
          // the game's own grader on its displayed answer text and on the value we store
          const stored = c.list ? Math.round(c.A) : +c.A.toPrecision(6);
          const r1 = readNum(c.ansTxt), ok1 = !!r1 && plugVerdict(c, r1).ok;
          const ok2 = plugVerdict(c, { v: stored, sf: 6 }).ok;
          // independent check: put every value (target = answer) back into the ORIGINAL equation
          const V = { ...c.W, [g]: c.A };
          const lhs = evalE(a0, V), rhs = evalE(b0, V);
          const ok3 = Math.abs(lhs - rhs) <= 1e-9 * Math.max(Math.abs(lhs), Math.abs(rhs), 1e-300);
          // tolerance the game actually allows
          const rel = q.lvl === 'lg' ? .02 : .01;
          let tol = rel;
          if (c.list) tol = Math.max(.06, .1 / Math.abs(c.A));
          else if (c.dpExp != null && c.A !== 0) tol = Math.max(rel, 1.01 * Math.pow(10, -c.dpExp) / Math.abs(c.A));
          seenP.add(prompt); made++;
          out.push({
            id: q.id, ch: q.ch, g, prompt, answer: stored, unit: c.unit, tol: +tol.toPrecision(3), sf: c.sfExp && !c.list ? c.sfExp : null,
            hint: 'Get ' + disp(g) + ' alone first: undo what is attached to it, in reverse order. Then substitute.' + (c.anyAlt ? ' One given is in a different unit than the equation needs.' : ''),
            explain: '<p>Rearranged: <b>' + disp(g) + ' = ' + fE(c.expr) + '</b></p>' + (c.convs.length ? '<p>Convert first: ' + c.convs.join('; ') + '</p>' : '') +
              '<p>TI-36X Pro keystrokes:</p>' + c.keys + '<p>' + disp(g) + ' = <b>' + c.ansTxt + (c.unit ? ' ' + esc(c.unit) : '') + '</b>' + (c.sfExp && !c.list ? ' (' + c.sfExp + ' sig figs)' : '') + '</p>',
            ok1, ok2, ok3, ansTxt: c.ansTxt, A: c.A,
          });
        }
      }
      return out;
    }, { lvl, DRAWS });
    let index = 0;
    for (const r of raw) {
      if (!r.ok1 || !r.ok2 || !r.ok3) throw new Error(`${r.id}/${r.g}: check failed (game ${r.ok1}/${r.ok2}, substitution ${r.ok3}) ans=${r.ansTxt} A=${r.A}`);
      const courses = ORDER.filter(c => r.ch[c] != null);
      const item = {
        skill: `${GAME}.${lvl}`, courses, chapters: courses.map(c => c + '-' + r.ch[c]), type: 'number', prompt: r.prompt,
        answer: r.answer, tolerance: r.tol,
      };
      if (r.unit) item.unit = r.unit;
      if (r.sf) item.sigfigs = r.sf;
      item.hint = r.hint; item.explain = r.explain; item.origin = 'original';
      item.from = { game: GAME, list: 'sample:' + lvl + ':' + r.id, index: index++ };
      items.push(item);
    }
  }
  return items;
};
