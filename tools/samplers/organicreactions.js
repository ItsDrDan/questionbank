// Sampler for the organicreactions game ("Bond Voyage!"): runs the game's own buildQuestion() (genRxn over TPL)
// and converts the steps it produces to the shared bank format.
// - identify: mc reaction type / general class. Graded by the game's own check().
// - name: typed name of the product (or of the hidden starting material). Answer + every accepted alternate
//   is graded by the game's own checkName().
// Structures are the game's own structHTML() output: inline SVG (skeletal) or condensed text, alternating.
// The reaction layout is rebuilt with inline styles (the game's .rxn CSS is not available outside it).
// Skipped: product / reactant (drawing pad), full (drawing steps; its mc/name steps duplicate identify/name),
// Exam Practice (Final Boss items, already in bank).
const GAME = 'organicreactions';
const CH = ['3B-2', '3B-4', '3B-5', '3B-7', '3B-8'];
const MODES = [
  { key: 'identify', slug: 'reaction-type', want: 40 },
  { key: 'name', slug: 'name-product', want: 40 },
];

module.exports = async (page, ctx) => {
  const items = [];
  let seed = 4200;
  for (const m of MODES) {
    await ctx.seed(++seed);
    const raw = await page.evaluate(({ mode, want }) => {
      state.mode = mode; state.set = 'all';
      // the game's nameSets() but without its 5-name display cap, to list every accepted spelling
      const allNames = eval('(' + nameSets.toString().replace('.slice(0,5)', '') + ')');
      const box = 'display:inline-flex;flex-direction:column;align-items:center;vertical-align:middle;margin:0 4px';
      const part = (p, show, style) => {
        if (!p.smi) return `<span style="font-weight:bold">${esc(p.t)}</span>`;
        const coef = p.coef ? `<b>${p.coef}</b> ` : '';
        if (show === 'hidden') return '<span style="display:inline-block;border:2px dashed #888;border-radius:6px;padding:4px 12px;font-weight:bold">?</span>';
        if (show === 'name') return `${coef}<b>${esc(p.name)}</b>`;
        let s = structHTML(p.smi, style);
        s = s.replace(/^<div class="condensed">([\s\S]*)<\/div>$/, '<span style="font-size:1.15em;font-weight:bold">$1</span>');
        return `<span style="${box}"><span>${coef}${s}</span>${show === 'bare' ? '' : `<small>${esc(p.name)}</small>`}</span>`;
      };
      const arrow = cond => {
        const ps = String(cond || '').split(/,\s*/).filter(Boolean);
        const top = ps.length > 1 ? ps.slice(0, -1).join(', ') : (ps[0] || ''), bot = ps.length > 1 ? ps[ps.length - 1] : '';
        return `<span style="${box};margin:0 8px"><small>${esc(top) || '&nbsp;'}</small><span style="font-size:1.6em;line-height:1">⟶</span><small>${esc(bot) || '&nbsp;'}</small></span>`;
      };
      const rxn = (r, view, style) => {
        const hid = view.hideIdx || [];
        const plus = '<span style="margin:0 4px;font-weight:bold">+</span>';
        const re = r.reactants.map((p, i) => part(p, hid.includes(i) ? 'hidden' : (hid.length ? 'name' : view.re), style)).join(plus);
        const pr = view.pr === 'hidden' ? part({ smi: 'x' }, 'hidden') : r.products.map(p => part(p, view.pr, style)).join(plus);
        return `<div style="display:flex;align-items:center;flex-wrap:wrap;margin:8px 0">${re}${arrow(r.cond)}${pr}</div>`;
      };
      const out = [], seen = new Set();
      for (let tries = 0; tries < 4000 && out.length < want; tries++) {
        const q = buildQuestion(mode), st = q.steps[0];
        const style = out.length % 2 ? 'condensed' : 'skeletal';
        let html = '';
        if (st.typeLabel) html += `<p style="font-weight:bold">Reaction type: ${esc(q.r.type)}${q.r.cls.toLowerCase() !== q.r.type.toLowerCase() ? ' (' + esc(q.r.cls.toLowerCase()) + ')' : ''}</p>`;
        html += rxn(q.r, st.view, style);
        if (st.kind === 'mc') {
          const sig = q.r.reactants.map(p => p.name || p.t).join('+') + '>' + q.r.products.map(p => p.name || p.t).join('+') + '|' + st.prompt + '|' + st.answer;
          if (seen.has(sig)) continue; seen.add(sig);
          // grade with the game's own check()
          state.q = q; state.step = 0; state.stepDone = false; state.selected = st.answer; fb('', '');
          check();
          const ok = state.stepDone && !/\bbad\b/.test($('feedback').className);
          const opt = st.options.find(o => o.key === st.answer);
          out.push({ type: 'mc', prompt: html + `<p>${esc(st.prompt)}</p>`, choices: st.options.map(o => o.html), answer: opt && opt.html, hint: st.hint, why: st.why, ok, sig });
        } else if (st.kind === 'name') {
          const sig = q.r.reactants.map(p => p.name || p.t).join('+') + '>' + q.r.products.map(p => p.name || p.t).join('+') + '|' + st.prompt + '|' + st.comp.name;
          if (seen.has(sig)) continue; seen.add(sig);
          const S = allNames(st.comp.name);
          const answer = S.prim;
          const alts = [...new Set([...S.show])].filter(x => x !== answer && !/^n-|\bn-(prop|but|pent)/i.test(x));
          // the game also counts the locant-less form (e.g. propanol for 1-propanol) as correct, with a note
          const partForms = [];
          const mm = answer.match(/^(\d+)-(meth|eth|prop|but|pent|hex|hept|oct)(an)?(ol|one|ene|yne|amine)$/);
          if (mm && mm[1] === '1') partForms.push(`${mm[2]}${mm[3] || ''}${mm[4]}`);
          const accept = [...alts, ...partForms.filter(x => !alts.includes(x))];
          const bad = [answer, ...accept].filter(x => !checkName(x, st.comp).ok);
          out.push({ type: 'text', prompt: html + `<p>${st.prompt}</p><p><small>IUPAC or common names both count.</small></p>`, answer, accept, hint: st.hint + ' ' + r_hint(q.r), why: (st.why ? st.why + ' ' : '') + `Answer: <b>${esc(answer)}</b>.`, ok: !bad.length, bad, sig });
        }
      }
      return out;
    }, { mode: m.key, want: m.want });
    raw.forEach((r, index) => {
      if (!r.ok) throw new Error(`${m.key}: game checker rejected ${JSON.stringify(r.bad || r.answer)} for ${r.sig}`);
      const item = { skill: `${GAME}.${m.slug}`, courses: ['3B'], chapters: CH, type: r.type, prompt: r.prompt };
      if (r.type === 'mc') { item.choices = r.choices; item.answer = r.answer; }
      else { item.answer = r.answer; if (r.accept.length) item.accept = r.accept; }
      Object.assign(item, { hint: r.hint, explain: r.why, origin: 'original', from: { game: GAME, list: `sample:${m.key}`, index } });
      items.push(item);
    });
  }
  return items;
};
