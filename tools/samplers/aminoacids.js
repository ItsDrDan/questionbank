// Sampler for the amino acids game ("Peptide Party"): amino acids, peptides, the genetic code and protein structure.
// Runs the game's own generators (GEN[mode]) with Math.random seeded, renders each question with the game's nextQ(),
// and grades the right answer with the game's own check() (choices; typed peptide names; codon translation, where the
// game's answer is the chain of amino acids). Structures are the game's own SVG (chainSVG / aaSVG and the Fischer and
// interaction diagrams), inlined so they are self-contained; codon questions carry the game's codon chart.
// Skipped: questions whose answer choices are structures, the drag-to-match items (match), the build-a-peptide and
// cut-the-peptide puzzles (build, cut), and Exam Practice (Final Boss items, already in the bank).
const { installInliner, plainText } = require('../sampler-kit');
const GAME = 'aminoacids';
const MODES = [
  { key: 'aa', slug: 'amino-acids', ch: it => /Fischer|D or the L form/.test(plainText(it.prompt)) ? ['3B-11', '3B-6'] : ['3B-11'] },
  { key: 'build', slug: 'condense-hydrolyze', ch: ['3B-11'] },
  { key: 'codon', slug: 'codons', ch: ['3B-13'] },
  { key: 'name', slug: 'name-peptides', ch: ['3B-11'] },
  { key: 'levels', slug: 'protein-structure', ch: ['3B-11'] },
  { key: 'interact', slug: 'r-group-interactions', ch: ['3B-11'] },
];
const WANT = 36;

module.exports = async (page, ctx) => {
  await installInliner(page);
  const items = [];
  let seed = 3600;
  for (const m of MODES) {
    await ctx.seed(++seed);
    const { out, why } = await page.evaluate(({ key, want }) => {
      const strip = s => String(s == null ? '' : s).replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
      const out = [], seen = new Set(), why = {}, same = {};
      const no = r => { why[r] = (why[r] || 0) + 1; };
      const real = GEN[key];
      state.mode = key;
      for (let tries = 0; tries < 800 && out.length < want; tries++) {
        const q = real();
        if (q.kind !== 'mc' && q.kind !== 'text' && q.kind !== 'seq') { no('kind ' + q.kind); continue; }
        if (q.kind === 'mc' && (q.struct || q.options.some(o => /<svg|<img/i.test(o.html)))) { no('picture choices'); continue; }
        GEN[key] = () => q; try { nextQ(); } finally { GEN[key] = real; }
        const area = document.getElementById('questionArea');
        // prompt: the rendered question without its answer widgets; the codon chart stays (folded) because it is needed
        const clone = area.cloneNode(true); area.after(clone);
        clone.querySelectorAll('.options, .tin, .istatus, .chainout, .palette').forEach(x => x.remove());
        clone.querySelectorAll('details').forEach(d => d.removeAttribute('open'));
        if (q.kind === 'seq') { const p = clone.querySelector('.prompt'); if (p) p.innerHTML = 'Translate this mRNA. Write the amino acids in order using three-letter codes (like Met–Gly–Ser).'; }
        const prompt = window.__inline(clone); clone.remove();
        let choices, answer, accept = [];
        if (q.kind === 'mc') {
          const btns = [...area.querySelectorAll('.option')];
          choices = btns.map(b => { const c = (b.querySelector('.opt-body') || b).cloneNode(true); b.appendChild(c); const h = window.__inline(c); c.remove(); return h; });
          answer = choices[q.options.findIndex(o => o.key === q.answer)];
          state.selected = q.answer;
        } else if (q.kind === 'text') {
          answer = q.shown; area.querySelector('.tinput').value = answer;
          const toks = answer.split(/[-–]/);
          const vs = [answer.replace(/-/g, '–'), toks.join(' '), toks.join(', '), toks.join('')];
          if (toks.length > 1 && toks.every(t => AA[t])) vs.push(toks.map(t => AA[t].one).join(''));
          accept = vs.filter(v => v !== answer && q.grade(v).ok);
        } else {   // seq: the game's answer is the chain the student taps; written out as three-letter codes
          q.revealI();
          const ans = [...area.querySelectorAll('.chainout .cpill')].map(x => x.textContent.trim());
          answer = ans.join('–');
          const vs = [ans.join('-'), ans.join(' '), ans.join(', '), ans.join(''), ans.map(t => AA[t].one).join('')];
          accept = vs.filter(v => v !== answer);
        }
        const sig = prompt + '|' + answer;
        if (seen.has(sig)) { no('duplicate'); continue; }
        const k = strip(prompt).replace(/\d+/g, '#').slice(0, 60) + '|' + strip(answer);
        if ((same[k] = (same[k] || 0) + 1) > 8) { no('same question + answer'); continue; }
        seen.add(sig);
        // grade with the game's own checker
        state.done = false; state.revealed = false;
        document.getElementById('feedback').className = '';
        check();
        const ok = state.done && !state.revealed && /\bgood\b/.test(document.getElementById('feedback').className);
        const fb = document.getElementById('feedback');
        out.push({ kind: q.kind === 'mc' ? 'mc' : 'text', prompt, choices, answer, accept, hint: q.hint ? window.__inlineHTML(q.hint, document.getElementById('hintBox')) : '', explain: q.why ? window.__inlineHTML(q.why, fb) : '', ok });
      }
      return { out, why };
    }, { key: m.key, want: WANT });
    if (Object.keys(why).length) console.log(`  ${GAME}/${m.key}: kept ${out.length}; left out`, JSON.stringify(why));
    out.forEach((r, index) => {
      if (!r.ok) throw new Error(`${m.key}: game checker rejected its own answer for ${plainText(r.prompt).slice(0, 100)}`);
      const it = {
        skill: `${GAME}.${m.slug}`, courses: ['3B'], chapters: null, type: r.kind, prompt: r.prompt,
        choices: r.choices, answer: r.answer, hint: r.hint || undefined, explain: r.explain || undefined,
        origin: 'original', from: { game: GAME, list: `sample:${m.key}`, index },
      };
      if (r.kind === 'text') { it.caseSensitive = false; if (r.accept.length) it.accept = [...new Set(r.accept)]; }
      it.chapters = typeof m.ch === 'function' ? m.ch(it) : m.ch;
      items.push(it);
    });
  }
  return items;
};
