// Sampler for the bondingtheories game ("Orbital Overlap", CHEM 1A Ch 8 + 1B review): valence bond theory,
// hybridization, sigma/pi bonds and MO theory. Runs the game's own generate(topic) with Math.random seeded,
// renders each question with the game's newQuestion(), inlines the rendered stem + question, and grades the right
// answer with the game's own checker (choose(i) for choices, checkCurrent() for typed numbers). Only questions with a
// single step are kept, so each bank item is one question. σ/π counting (two number boxes) becomes two items.
// Typed hybridization (Skill Check Prep: scHyb, scAtom) becomes `text` items with an accept list (sp3, sp³, sp^3, …).
// Skipped: interactive steps (MO diagram fill, orbital boxes, Hybrid Mixer, Ranker, atom tagger, Bond Labeler,
// tap-the-curve) and multi-step questions; those stay in the game.
const { installInliner } = require('../sampler-kit');
const GAME = 'bondingtheories';
const CH = { t1: ['1A-8'], t2: ['1A-7', '1A-8'], t3: ['1A-8'], t4: ['1A-8'] };
const TOPICS = ['whatbond', 'pecurve', 'gallery', 'which', 'strength', 'why', 'table', 'angle', 'label', 'pisource', 'rotation', 'resonance',
  'count', 'skelcount', 'boss', 'lcao', 'ordering', 'trends', 'theory', 'scBO',
  'howmany', 'reverse', 'paralist', 'moorder', 'moconcept',    // added with game v6
  'scHyb', 'scAtom',                                           // typed hybridization (skills groups, tagger), added with game v15
  'termhyb', 'bonddesc',
  'bequick'];                                                   // bond energies → ΔH (OpenStax §7.5, so chapter 1A-7), game v19                                      // end-atom hybridization (C=O oxygen, C≡N nitrogen) and whole-bond descriptions, game v16
const WANT = 24;

module.exports = async (page, ctx) => {
  await installInliner(page);
  const items = [];
  let seed = 8800;
  for (const t of TOPICS) {
    await ctx.seed(++seed);
    const raw = await page.evaluate(({ t, want }) => {
      const SUP = { 0: '⁰', 1: '¹', 2: '²', 3: '³', 4: '⁴', 5: '⁵', 6: '⁶', 7: '⁷', 8: '⁸', 9: '⁹', '+': '⁺', '-': '⁻', '−': '⁻' }, SUB = { 0: '₀', 1: '₁', 2: '₂', 3: '₃', 4: '₄', 5: '₅', 6: '₆', 7: '₇', 8: '₈', 9: '₉' };
      const uni = (t, map) => [...t].every(c => map[c]) ? [...t].map(c => map[c]).join('') : null;
      // sp<sup>3</sup> → sp³ and H<sub>2</sub>O → H₂O, so plain-text hints and explanations don't read "sp 3" or "H 2 O"
      const strip = s => String(s == null ? '' : s).replace(/<sup>([^<]*)<\/sup>/g, (m, t) => uni(t, SUP) || '^' + t).replace(/<sub>([^<]*)<\/sub>/g, (m, t) => uni(t, SUB) || '_' + t)
        .replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
      const inl = el => { const c = el.cloneNode(true); el.after(c); const h = window.__inline(c); c.remove(); return h; };
      const out = [], seen = new Set();
      let fixed = null; window.makeQuestion = () => fixed;          // newQuestion() shows the question we made
      for (let tries = 0; tries < 400 && out.length < want; tries++) {
        const q = generate(t);
        const keep = q.parts.length === 1 || (t === 'boss' && q.parts[0].kind === 'nums');
        const p = q.parts[0];
        if (!keep || !(p.kind === 'choice' || p.kind === 'nums' || p.kind === 'text')) continue;
        if (p.kind === 'choice' && (p.figure || p.choices.some(c => /<svg|<img/i.test(c.html)))) continue;
        fixed = q; state.ch = null; state.mode = 'practice';
        try { newQuestion(); } catch (e) { continue; }
        const stem = document.getElementById('stem'), ask = document.querySelector('#parts .part.current .ask');
        const prompt = (stem.innerHTML.trim() ? '<div>' + inl(stem) + '</div>' : '') + '<div>' + inl(ask) + '</div>';
        const key = strip(prompt) + '|' + (p.kind === 'choice' ? p.answer : p.kind === 'text' ? p.want : p.fields.map(f => f.answer).join(','));
        if (seen.has(key)) continue; seen.add(key);
        const label = TOPICS[q.topic] ? TOPICS[q.topic].tile : 't3';
        if (p.kind === 'choice') {
          const btns = [...document.querySelectorAll('#parts .part.current [data-choice]')];
          const choices = btns.map(b => strip(b.innerHTML) && /<su[bp]>/.test(b.innerHTML) ? inl(b) : strip(b.innerHTML));
          const right = p.choices.findIndex(c => c.ok);
          const whys = p.choices.map(c => c.ok ? '' : strip(c.why));
          choose(right);
          const ok = state.done && /\bgood\b/.test(document.getElementById('feedback').className);
          out.push({ type: 'mc', topic: q.topic, tile: label, prompt, choices, answer: choices[right], why: whys, hint: strip(p.hint), explain: strip(p.solution), ok });
        } else if (p.kind === 'text') {
          const inp = document.getElementById('in-t'); if (!inp) continue;
          inp.value = p.want; checkCurrent();
          const ok = state.done && /\bgood\b/.test(document.getElementById('feedback').className);
          const sup = { 2: '²', 3: '³' }, supForm = p.want.replace(/[23]/g, d => sup[d]), caret = p.want.replace(/(\d)/g, '^$1');
          const forms = [...new Set([p.want, supForm, caret, p.want.replace(/(\d)/g, ' $1')])];
          const accept = [...new Set(forms.concat(forms.map(f => f + ' hybridized'), forms.map(f => f + '-hybridized'), forms.map(f => f + ' hybrid')))].filter(f => f !== p.want);
          out.push({ type: 'text', topic: q.topic, tile: label, prompt: prompt + '<p><small>Type sp, sp2, sp3 (sp² and sp^2 work too).</small></p>', answer: p.want, accept, hint: strip(p.hint), explain: strip(p.solution), ok });
        } else {
          const vals = p.fields.map(f => f.answer);
          p.fields.forEach(f => { document.getElementById('in-' + f.key).value = String(f.answer); });
          checkCurrent();
          const ok = state.pi > 0 || state.done;
          p.fields.forEach(f => out.push({ type: 'number', topic: q.topic, tile: label, prompt: prompt + `<p><b>${strip(f.label)}?</b></p>`, answer: f.answer, hint: strip(p.hint), explain: strip(p.solution), ok }));
        }
      }
      return out;
    }, { t, want: WANT });
    raw.forEach((r, index) => {
      if (!r.ok) throw new Error(`${t}: the game did not accept its own answer (${String(r.answer).slice(0, 60)})`);
      const item = {
        skill: `${GAME}.${r.topic}`, courses: ['1A', '1B'], chapters: (r.topic === 'bequick' ? ['1A-7'] : CH[r.tile]).concat('1B-ready'), type: r.type, prompt: r.prompt,
        answer: r.answer, hint: r.hint, explain: r.explain, origin: 'original', from: { game: GAME, list: `sample:${t}`, index },
      };
      if (r.type === 'mc') { item.choices = r.choices; if (r.why.some(Boolean)) item.why = r.why; }
      if (r.type === 'number') item.tolerance = 1e-9;
      if (r.type === 'text') item.accept = r.accept;
      items.push(item);
    });
  }
  return items;
};
