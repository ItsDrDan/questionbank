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


// ---------- Per-choice feedback ("why"), from the game's AA table and the rules of peptides, codons and protein structure ----------
const pT = x => String(x == null ? '' : x).replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/[​]/g, '').replace(/\s+/g, ' ').trim();
const CODE = (() => { const b = 'UCAG', aa = 'FFLLSSSSYY**CC*WLLLLPPPPHHQQRRRRIIIMTTTTNNKKSSRRVVVVAAAADDEEGGGG', t = {}; let k = 0; for (const x of b) for (const y of b) for (const z of b) t[x + y + z] = aa[k++]; return t; })();
const SIDE = { Gly: 'H', Ala: 'CH₃', Val: 'CH(CH₃)₂', Leu: 'CH₂–CH(CH₃)₂', Ile: 'CH(CH₃)–CH₂–CH₃', Pro: 'a ring that bonds back to the backbone N', Phe: 'CH₂– on a benzene ring', Met: 'CH₂–CH₂–S–CH₃', Trp: 'CH₂– on an indole (two fused rings with an N–H)',
  Ser: 'CH₂–OH', Thr: 'CH(OH)–CH₃', Cys: 'CH₂–SH', Asn: 'CH₂–C(=O)–NH₂', Gln: 'CH₂–CH₂–C(=O)–NH₂', Tyr: 'CH₂– on a benzene ring with an –OH', Asp: 'CH₂–COO⁻', Glu: 'CH₂–CH₂–COO⁻', Lys: '(CH₂)₄–NH₃⁺', Arg: '(CH₂)₃–NH–C(=NH₂⁺)–NH₂', His: 'CH₂– on an imidazole ring (a five-membered ring with two N)' };
const rTxt = k => SIDE[k].startsWith('a ring') ? SIDE[k] : '–' + SIDE[k];
const CLSN = { np: 'nonpolar', pn: 'polar neutral', ac: 'acidic', ba: 'basic' };
const CLSDEF = { Nonpolar: 'Nonpolar side chains are only C and H (or the –S–CH₃ of Met).', 'Polar neutral': 'Polar neutral side chains have an –OH, –SH or amide group but no charge.', Acidic: 'Acidic side chains have a second –COOH (–COO⁻ at pH 7.4): Asp and Glu.', Basic: 'Basic side chains have an extra N group that is positive at pH 7.4: Lys, Arg and His.' };
const LEVEL = { Primary: 'Primary structure is the amino acid sequence, held by peptide bonds.', Secondary: 'Secondary structure (α-helix, β-pleated sheet) is held by hydrogen bonds between backbone C=O and N–H groups.',
  Tertiary: 'Tertiary structure is the 3-D folding of one chain, held by R-group interactions (salt bridges, H bonds, disulfides, hydrophobic).', Quaternary: 'Quaternary structure is two or more chains packed together.' };
const INTER = { 'Hydrophobic interaction': 'A hydrophobic interaction is between two nonpolar side chains.', 'Hydrogen bond': 'A side-chain hydrogen bond is between two polar groups (–OH, –NH, amide) with no full charges.',
  'Disulfide bond (–S–S–)': 'A disulfide bond forms only between two cysteine –SH groups.', 'Salt bridge (ionic attraction)': 'A salt bridge is between a + side chain (Lys, Arg, His) and a − side chain (Asp, Glu).' };
const MUT = { Silent: 'Silent means the new codon still codes for the same amino acid.', Missense: 'Missense means the new codon codes for a different amino acid.', Nonsense: 'Nonsense means the new codon is a stop codon (UAA, UAG or UGA).', Frameshift: 'A frameshift comes from inserting or deleting a base, which shifts every codon after it. A single swapped base doesn’t do that.' };
function aaWhy(it, AA) {
  const p = pT(it.prompt), ans = pT(it.answer), ex = pT(it.explain), ch = it.choices.map(pT), sk = it.skill.split('.')[1];
  const cap = t => t ? t.charAt(0).toUpperCase() + t.slice(1) : '', one = f => ch.map(c => c === ans ? '' : cap(f(c) || ''));
  const key3 = t => { const m = t.match(/\((\w{3})\)$/); return m && AA[m[1]] ? m[1] : (AA[t] ? t : null); };
  const desc = k => `${AA[k].n} (${k}) has R = ${rTxt(k)}, ${AA[k].cls === 'ac' ? 'an' : 'a'} ${CLSN[AA[k].cls]} side chain`;
  const pairCls = t => t.split(' and ').map(x => AA[x] ? AA[x].cls : '?');
  if (sk === 'amino-acids') {
    if (/D or the L form/.test(p)) return one(c => /^D-/.test(c) ? 'D has the –NH₃⁺ on the right (with –COO⁻ at the top). Here it is on the left, so this is L.' : 'L has the –NH₃⁺ on the left (with –COO⁻ at the top). Here it is on the right, so this is D.');
    if (/essential/.test(p)) return one(c => { const k = key3(c); return k ? (AA[k].ess ? `${AA[k].n} is essential, but so is ${ans.split(' (')[0]}… check the question.` : `${AA[k].n} is nonessential: the body can make it.`) + ' The 9 essential ones are His, Ile, Leu, Lys, Met, Phe, Thr, Trp and Val.' : ''; });
    if (/side chain \(R group\) classified/.test(p)) return one(c => CLSDEF[c] ? `${CLSDEF[c]} ${ex}` : '');
    if (/net charge/.test(p)) return one(c => (/^Positive/.test(c) ? 'Positive needs extra H⁺: pH below the pI, or a basic side chain at pH 7.4.' : /^Negative/.test(c) ? 'Negative needs H⁺ removed: pH above the pI, or an acidic side chain at pH 7.4.' : 'Zero (a zwitterion) happens at the pI, or at pH 7.4 for a side chain with no charge.') + ' ' + ex);
    if (/one-letter code for/.test(p)) return one(c => { const k = Object.keys(AA).find(x => AA[x].one === c); return k ? `${c} is the code for ${AA[k].n} (${k}).` : ''; });
    if (/has the one-letter code/.test(p)) return one(c => { const k = key3(c); return k ? `${AA[k].n} is ${AA[k].one}.` : ''; });
    if (/Which amino acid is shown/.test(p) || /as it exists at pH/.test(p)) return one(c => { const k = key3(c); return k ? `${cap(desc(k))}. Compare the side chain drawn here.` : ''; });
    return one(c => { const k = key3(c); return k ? cap(desc(k)) + '.' : ''; });
  }
  if (sk === 'condense-hydrolyze') {
    const n = +((p.match(/(\d+) amino acids/) || [])[1] || { di: 2, tri: 3, tetra: 4, penta: 5, hexa: 6 }[(p.match(/(di|tri|tetra|penta|hexa)peptide/) || [])[1]] || 0);
    if (n && /peptide bonds|H₂O molecules/.test(p)) return one(c => `${n} amino acids in a row are joined by ${n} − 1 = ${n - 1} peptide bonds (one between each neighboring pair)${/H₂O/.test(p) ? `, and each bond means one H₂O (released when it forms, used when it is hydrolyzed)` : ''}.`);
    if (/small molecule is released/.test(p)) return one(c => `${c} isn’t formed. The –OH from one –COO⁻ and an H from the next –NH₃⁺ leave together as H₂O.`);
    if (/peptide bond joins which two atoms/.test(p)) return one(c => /O of the next/.test(c) ? 'C–O bonds link esters. A peptide (amide) bond is C–N: the carbonyl C to the next amino acid’s N.' : /S of/.test(c) ? 'That is a disulfide bond between cysteines, not a peptide bond.' : 'A peptide bond is C–N: the carbonyl C of one amino acid to the N of the next.');
    if (/complete hydrolysis of the (\w+)peptide/.test(p)) return one(c => /released/.test(c) ? 'Hydrolysis uses water to break bonds; it doesn’t release water. Water is released when peptide bonds form.' : /–/.test(c.split(',')[0]) ? 'Complete hydrolysis breaks every peptide bond, so no dipeptide is left.' : 'Count the peptide bonds: one fewer than the number of amino acids, and each uses one H₂O.');
    return;
  }
  if (sk === 'codons') {
    const aaOf = c => { const k = Object.keys(AA).find(x => AA[x].one === CODE[c]); return CODE[c] === '*' ? 'a stop codon' : k ? `${AA[k].n} (${k})` : '?'; };
    if (/Which mRNA codon codes for/.test(p) || /stop codon/.test(p)) return one(c => CODE[c] ? `${c} codes for ${aaOf(c)}. Use the chart: 1st base (left), 2nd base (top), 3rd base (right).` : '');
    if (/Which amino acid does the mRNA codon (\w{3})/.test(p)) { const cd = p.match(/codon (\w{3})/)[1]; return one(c => { const k = key3(c); const cods = k ? Object.keys(CODE).filter(x => CODE[x] === AA[k].one) : []; return k ? `${AA[k].n} is coded by ${cods.join(', ')}, not ${cd}. Find ${cd[0]} on the left, ${cd[1]} across the top, ${cd[2]} on the right.` : ''; }); }
    if (/kind of mutation/.test(p)) return one(c => MUT[c.split(':')[0]] ? `${MUT[c.split(':')[0]]} ${ex}` : '');
    if (/anticodon/.test(p)) return one(c => 'The anticodon pairs base by base with the codon (A–U, G–C). Written 3′→5′, its first base pairs with the codon’s first base. ' + ex);
    return one(c => { const k = key3(c); return k ? `${AA[k].n} is coded by ${Object.keys(CODE).filter(x => CODE[x] === AA[k].one).join(', ')}. Transcribe the DNA to mRNA first (A→U, T→A, G→C, C→G), then read the chart.` : ''; });
  }
  if (sk === 'name-peptides') {
    if (/How many different/.test(p)) { const n = (p.match(/from ([^?]*?) if/) || [])[1].split(',').length; const f = [1, 1, 2, 6, 24, 120][n]; return one(c => `Each order is a different peptide: ${[...Array(n)].map((_, i) => n - i).join(' × ')} = ${f}.`); }
    if (/full name of/.test(p)) return one(c => /yl$/.test(c) ? 'The last (C-terminal) amino acid keeps its full name. Only the ones before it change to -yl.' : !/yl/.test(c) ? 'Every amino acid except the last changes its ending to -yl (alanine → alanyl).' : 'Name in order from the N-terminus (the first residue written) to the C-terminus.');
    if (/N-terminal residue/.test(p)) return one(c => 'The N-terminal residue (free –NH₃⁺) is the one written first, at the left end of the chain.');
    if (/C-terminal residue/.test(p)) return one(c => 'The C-terminal residue (free –COO⁻) is the one written last, at the right end of the chain.');
    if (ch.every(c => /^\w{3}(–\w{3})+$/.test(c))) { const A = ans.split('–'); return one(c => { const C = c.split('–');
      if (C.slice().reverse().join('–') === ans) return 'That reads from the C-terminus. Name a peptide starting at the N-terminus (the free –NH₃⁺ end).';
      const i = C.findIndex((x, k) => x !== A[k]); if (i < 0) return '';
      if (C.slice().sort().join() === A.slice().sort().join()) return 'Right amino acids, wrong order. Start at the free –NH₃⁺ and identify each side chain in turn.';
      return AA[C[i]] && AA[A[i]] ? `Residue ${i + 1} is ${A[i]}, not ${C[i]}: ${AA[C[i]].n} has R = ${rTxt(C[i])}, but the side chain here is ${rTxt(A[i])}.` : ''; }); }
    return;
  }
  if (sk === 'protein-structure') {
    const lv = c => c.replace(/:.*$/, '').replace(/ only$/, '');
    if (/What mainly holds/.test(p)) return one(c => /separate chains/.test(c) ? 'Interactions between separate chains hold quaternary structure. ' + ex : /R groups of one chain/.test(c) ? 'R-group interactions in one chain hold tertiary structure. ' + ex : /[Pp]eptide bonds/.test(c) ? 'Peptide bonds hold the primary sequence. ' + ex : ex);
    if (/Denaturation/.test(p)) return one(c => /Primary/.test(c) ? 'Denaturation doesn’t break peptide bonds, so the primary sequence stays.' : 'Denaturation unfolds everything above the sequence: secondary, tertiary and quaternary.');
    return one(c => LEVEL[lv(c)] ? `${LEVEL[lv(c)]} ${ex}` : '');
  }
  if (sk === 'r-group-interactions') {
    if (ch.every(c => INTER[c])) return one(c => `${INTER[c]} ${ex}`);
    if (/Which interactions does it mainly disrupt/.test(p)) return one(c => ex);
    if (ch.every(c => / and /.test(c) && pairCls(c).every(x => x !== '?'))) {
      const want = /disulfide/.test(p) ? 'two Cys' : /salt bridge/.test(p) ? 'one + (Lys, Arg, His) and one − (Asp, Glu) side chain' : /hydrophobic/.test(p) ? 'two nonpolar side chains' : 'two polar side chains (–OH, –NH or amide)';
      return one(c => { const [a, b] = c.split(' and '); return `${a} is ${CLSN[AA[a].cls]} and ${b} is ${CLSN[AA[b].cls]}. This interaction needs ${want}.`; });
    }
    if (/outer surface|Buried/.test(ch.join())) return one(c => /Buried/.test(c) ? 'Polar and charged side chains stay on the surface, touching water. Only nonpolar ones are buried.' : 'Nonpolar side chains avoid water and are buried inside. Only polar and charged ones face water.');
    return one(c => { const k = key3(c); return k ? `${AA[k].n} (${k}) is ${CLSN[AA[k].cls]}. ` + (/lipids/.test(p) ? 'Only nonpolar side chains face the lipids.' : /salt bridge/.test(p) ? 'A salt bridge needs opposite charges.' : /hydrogen bonds with water/.test(p) ? 'Hydrogen bonding with water needs a polar group.' : '') : ''; });
  }
}

module.exports = async (page, ctx) => {
  const AAT = await page.evaluate(() => JSON.parse(JSON.stringify(AA)));
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
      if (it.type === 'mc') { const w = aaWhy(it, AAT); if (w && w.some(Boolean)) it.why = w; }
      it.chapters = typeof m.ch === 'function' ? m.ch(it) : m.ch;
      items.push(it);
    });
  }
  return items;
};
