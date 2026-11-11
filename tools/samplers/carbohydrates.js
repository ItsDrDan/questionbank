// Sampler for the carbohydrates game ("Sweet Structures"): runs the game's own generators (GEN[mode]) and
// converts them to the shared bank format. Fischer/Haworth drawings are the game's own inline SVG (fischerSVG /
// haworthSVG), which are self-contained. Every item is graded with the game's own check() before it is kept.
// Skipped: Haworth "match" sub-type (answer choices are pictures) and Exam Practice (Final Boss items, already in bank).
const GAME = 'carbohydrates';
const MODES = [
  { key: 'classify', slug: 'classify', ch: ['3B-9'] },
  { key: 'fischer', slug: 'fischer', ch: ['3B-9', '3B-6'] },
  { key: 'haworth', slug: 'haworth', ch: ['3B-9'] },
  { key: 'stereo', slug: 'stereo', ch: ['3B-6', '3B-9'] },
  { key: 'disacc', slug: 'disaccharides', ch: ['3B-9'] },
  { key: 'react', slug: 'sugar-reactions', ch: ['3B-9', '3B-5'] },
];
const WANT = 36;


// ---------- Per-choice feedback ("why"), built from the sugar table (SUG) and each item's own text ----------
const plainT = x => String(x == null ? '' : x).replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
const SIZE = { tri: 3, tetr: 4, pent: 5, hex: 6 }, SIZEW = { 3: 'triose', 4: 'tetrose', 5: 'pentose', 6: 'hexose' };
const DISACC = { maltose: ['glucose + glucose', 'α(1→4)'], cellobiose: ['glucose + glucose', 'β(1→4)'], lactose: ['galactose + glucose', 'β(1→4)'], sucrose: ['glucose + fructose', 'α(1→2)β'], isomaltose: ['glucose + glucose', 'α(1→6)'] };
const POLY = { amylose: 'Amylose is unbranched plant starch: glucose with α(1→4) links only.', amylopectin: 'Amylopectin is branched plant starch: α(1→4) chains with α(1→6) branches about every 25 glucose.',
  glycogen: 'Glycogen is the animal storage form (liver and muscle): like amylopectin but even more branched.', cellulose: 'Cellulose is the unbranched structural polymer of plant cell walls, with β(1→4) links.' };
const LINK = { 'α(1→4)': 'α(1→4) joins C1 (anomeric –OH down) to C4 of the next ring, as in maltose and starch.', 'β(1→4)': 'β(1→4) joins C1 (anomeric –OH up) to C4 of the next ring, as in lactose, cellobiose and cellulose.',
  'α(1→6)': 'α(1→6) joins C1 to the C6 (–CH2–) of the next unit: the branch points of amylopectin and glycogen.', 'α(1→2)β': 'α(1→2)β joins C1 of glucose to C2 of fructose, using both anomeric carbons: that is sucrose.' };
const SUFFIX = [[/itol\b/, 'An -itol (sugar alcohol) comes from reducing the C1 –CHO to –CH2OH.'], [/aric acid/, 'An -aric acid comes from strong oxidation (HNO3) of both ends: C1 and C6 become –COOH.'],
  [/uronic acid/, 'A -uronic acid comes from enzyme oxidation of C6 only; the –CHO at C1 stays.'], [/onic acid/, 'An -onic acid comes from mild oxidation of the C1 –CHO only (Benedict’s or Tollens’).']];
const RXN = { mild: 'Mild oxidation (Benedict’s or Tollens’) changes only C1: –CHO → –COOH. The bottom –CH2OH stays.', strong: 'Strong oxidation (HNO3) changes both ends: C1 and C6 both become –COOH.',
  enzyme: 'Enzyme oxidation changes only C6: –CH2OH → –COOH. The –CHO at C1 stays.', red: 'Reduction changes only C1: –CHO → –CH2OH, giving a sugar alcohol.' };
const rxnKey = c => /mild/.test(c) ? 'mild' : /strong/.test(c) ? 'strong' : /C6 only/.test(c) ? 'enzyme' : /reduction/.test(c) ? 'red' : '';
const REL = { 'Enantiomers': 'Enantiomers are mirror images: every chiral –OH flips (the same name, D vs L).', 'Epimers': 'Epimers have the same formula and differ at exactly one chiral carbon.',
  'Structural isomers': 'Structural isomers have the same formula but different connections, such as an aldose and a ketose.', 'Not isomers': 'Not isomers means the formulas differ, for example a different number of carbons.' };
function sugarWhy(it, SUG) {
  const p = plainT(it.prompt), ans = plainT(it.answer), ex = plainT(it.explain), ch = it.choices.map(plainT), sk = it.skill.split('.')[1];
  const cap = t => t ? t.charAt(0).toUpperCase() + t.slice(1) : '', one = f => ch.map(c => c === ans ? '' : cap(f(c) || ''));
  const parseSug = t => { const m = t.match(/^([DL])-(\w+)$/); return m && SUG[m[2]] ? { dl: m[1], name: m[2], ...SUG[m[2]] } : null; };
  const kind = (t, n) => (t === 'aldo' ? 'aldo' : 'keto') + SIZEW[n];
  if (sk === 'classify') {
    const m = ans.match(/^(aldo|keto)(tri|tetr|pent|hex)ose$/); if (!m) return;
    return one(c => { const w = c.match(/^(aldo|keto)(tri|tetr|pent|hex)ose$/); if (!w) return; const out = [];
      if (w[1] !== m[1]) out.push(w[1] === 'keto' ? 'A ketose has its C=O on C2, inside the chain. This sugar has an aldehyde (–CHO) at C1.' : 'An aldose has an aldehyde (–CHO) at C1. This sugar’s C=O is on C2, inside the chain, so it is a ketose.');
      if (w[2] !== m[2]) out.push(`-${w[2]}ose means ${SIZE[w[2]]} carbons; this sugar has ${SIZE[m[2]]}.`);
      return out.join(' '); });
  }
  if (sk === 'fischer') {
    if (/D-sugar or an L-sugar/.test(p)) return one(c => c === 'D-sugar' ? 'D means the –OH on the last chiral carbon (the one farthest from the C=O) is on the right. Here it is on the left.' : 'L means the –OH on the last chiral carbon (the one farthest from the C=O) is on the left. Here it is on the right.');
    const r = parseSug(ans); if (!r) return;
    return one(c => { const w = parseSug(c); if (!w) return;
      if (w.name === r.name) return `${c} is the mirror image: every –OH flips. Check the last chiral carbon: on the ${r.dl === 'D' ? 'right' : 'left'}, so this is ${r.dl}.`;
      if (w.n !== r.n) return `${c} is ${w.type === 'aldo' ? 'an' : 'a'} ${kind(w.type, w.n)} with ${w.n} carbons. Count the carbons here: ${r.n}.`;
      if (w.type !== r.type) return w.type === 'keto' ? `${c} is a ketose (C=O on C2). This sugar has –CHO at the top, so it is an aldose.` : `${c} is an aldose (–CHO at the top). This sugar has its C=O on C2, so it is a ketose.`;
      const flip = x => x === 'R' ? 'L' : 'R', rs = r.dl === 'D' ? r.sides : r.sides.map(flip), ws = w.dl === 'D' ? w.sides : w.sides.map(flip);
      const first = r.type === 'aldo' ? 2 : 3, diff = rs.map((v, i) => v !== ws[i] ? 'C' + (first + i) : '').filter(Boolean);
      return `${c} has a different –OH pattern${diff.length ? ` (it differs at ${diff.join(', ')})` : ''}. Read the –OH sides top to bottom and compare.`; });
  }
  if (sk === 'haworth') {
    if (/α or the β anomer/.test(p)) return one(c => /^α/.test(c) ? 'α has the anomeric –OH pointing down (opposite the –CH2OH). Here it points up.' : 'β has the anomeric –OH pointing up (same side as the –CH2OH). Here it points down.');
    const pr = t => { const m = t.match(/^([αβ])-D-(\w+?)(pyranose|furanose)$/); return m && { a: m[1], s: m[2].replace(/^gluco$/, 'glucose').replace(/^galacto$/, 'galactose').replace(/^fructo$/, 'fructose').replace(/^ribo$/, 'ribose'), ring: m[3] }; };
    const r = pr(ans); if (!r) return;
    return one(c => { const w = pr(c); if (!w) return; const out = [];
      if (w.ring !== r.ring) out.push(w.ring === 'pyranose' ? 'A pyranose is a six-membered ring (5 C + O). This ring has five atoms (a furanose).' : 'A furanose is a five-membered ring (4 C + O). This ring has six atoms (a pyranose).');
      else if (w.s !== r.s) out.push(w.s === 'galactose' && r.s === 'glucose' ? 'Galactose differs from glucose at C4: its C4 –OH points up in the ring. Here it points down.' : w.s === 'glucose' && r.s === 'galactose' ? 'Glucose has its C4 –OH pointing down in the ring. Here it points up, which is galactose.' : w.s === 'fructose' ? 'Fructose rings carry an extra –CH2OH on the anomeric carbon (C2). This ring doesn’t.' : w.s === 'ribose' ? 'Ribose has only one –CH2OH outside the ring and no extra carbon on the anomeric C. Compare the groups.' : `That is a ${w.s} ring. Compare the groups around this ring.`);
      if (w.a !== r.a) out.push(w.a === 'α' ? 'α means the anomeric –OH points down; here it points up (β).' : 'β means the anomeric –OH points up; here it points down (α).');
      return out.join(' '); });
  }
  if (sk === 'stereo') {
    if (/How many chiral carbons/.test(p)) { const n = +ans; return one(c => `Count again: this molecule has ${n} chiral carbon${n === 1 ? '' : 's'}. The –CHO, C=O and –CH2OH carbons are not chiral; only carbons with H and OH on the sides (four different groups) are.`); }
    return one(c => REL[c] ? `${REL[c]} ${ex}` : '');
  }
  if (sk === 'sugar-reactions') {
    if (/which reaction\?/.test(p)) return one(c => RXN[rxnKey(c)] ? `${RXN[rxnKey(c)]} Compare the top and bottom of the product with the starting sugar.` : '');
    if (/What do you observe\?/.test(p)) return one(c => /^Positive/.test(c) ? 'A positive test needs a free –CHO (a reducing sugar) to reduce blue Cu2+ to orange-red Cu2O. ' + ex : 'The solution stays blue only if there is no free –CHO to reduce the Cu2+. ' + ex);
    if (/ferments glucose/.test(p)) return one(c => /Lactic/.test(c) ? 'Lactic acid is what muscle (and some bacteria) make without O2. Yeast make ethanol.' : /Sorbitol/.test(c) ? 'Sorbitol comes from reducing glucose, not from fermentation.' : /Gluconic/.test(c) ? 'Gluconic acid comes from oxidizing glucose’s –CHO, not from fermentation.' : '');
    if (/What are the products\?/.test(p)) { const d = Object.entries(DISACC); return one(c => { const hit = d.filter(([n, v]) => v[0] === c).map(([n]) => n); return hit.length ? `${c} is what ${hit.join(' or ')} gives. ${ex}` : `No common disaccharide is made of ${c}. ${ex}`; }); }
    if (/disaccharide forms when/.test(p)) return one(c => DISACC[c] ? `${c} is ${DISACC[c][0]}.` : c === 'cellulose' ? 'Cellulose is a polysaccharide of many glucose units, not a disaccharide.' : '');
    const root = (ans.match(/^(\w+?)(itol|onic|aric|uronic|\b)/) || [])[1];
    return one(c => { const sf = SUFFIX.find(([re]) => re.test(c)); if (!sf) return; const wr = (c.match(/^(\w+?)(itol|onic|aric|uronic)/) || [])[1];
      return wr && root && wr !== root && !/sorbitol/.test(c) ? `${c} comes from a different sugar. Keep the same sugar name and change only the ending. ${sf[1]}` : sf[1]; });
  }
  if (sk === 'disaccharides') {
    if (/^Atom /.test(ch[0])) return;
    if (ch.every(c => LINK[c])) { const nm = (p.match(/monosaccharides in (\w+)/) || [])[1]; return one(c => LINK[c] + (nm ? '' : ' Look at which carbons the bridging O connects and which way the anomeric bond points.')); }
    if (ch.some(c => / • /.test(c))) return one(c => { const [n, l] = c.split(' • '); return DISACC[n] && DISACC[n][1] !== l ? `${n} always has a ${DISACC[n][1]} linkage, so “${c}” can’t be right.` : DISACC[n] ? `${n} is ${DISACC[n][0]}, ${DISACC[n][1]}. Check both ring types and the linkage here.` : ''; });
    if (ch.every(c => DISACC[c.split(' ')[0]] || POLY[c] || /^(glucose|galactose|fructose)$/.test(c))) return one(c => POLY[c] ? POLY[c] : DISACC[c] ? `${c} is ${DISACC[c][0]} joined ${DISACC[c][1]}${c === 'sucrose' ? ' (table sugar, from cane and beets)' : c === 'lactose' ? ' (milk sugar)' : c === 'maltose' ? ' (malt sugar, from starch digestion)' : ''}.` + (/NOT a reducing/.test(p) ? ' It has a free anomeric carbon, so it is reducing.' : '') : /NOT a reducing/.test(p) ? `${c} is a monosaccharide with a free anomeric carbon, so it is reducing.` : '');
    if (/Which monosaccharides are joined/.test(p)) { const d = Object.entries(DISACC); return one(c => { const hit = d.filter(([n, v]) => v[0] === c).map(([n]) => n); return hit.length ? `${c} makes ${hit.join(' or ')}.` : `No common disaccharide is ${c}.`; }); }
    if (/reducing sugar\?/.test(p)) return one(c => /^Yes/.test(c) ? 'A reducing sugar needs a free anomeric carbon (an –OH on C1 that can open the ring). ' + ex : 'Only when both anomeric carbons are tied up in the glycosidic bond, as in sucrose, is it non-reducing. ' + ex);
    if (/cannot digest cellulose/.test(p)) return one(c => /fructose/.test(c) ? 'Cellulose is made only of glucose.' : /α\(1→4\)/.test(c) ? 'Cellulose has β(1→4) bonds. α(1→4) bonds are the ones amylase can cut.' : /soluble/.test(c) ? 'Cellulose is insoluble fiber, not too soluble.' : '');
  }
}

module.exports = async (page, ctx) => {
  const items = [];
  let seed = 3100;
  const SUG = await page.evaluate(() => JSON.parse(JSON.stringify(Array.isArray(SUG) ? Object.fromEntries(SUG) : SUG)));
  for (const m of MODES) {
    await ctx.seed(++seed);
    const raw = await page.evaluate(({ key, want }) => {
      state.mode = key;
      const out = [], seen = new Set();
      for (let tries = 0; tries < 3000 && out.length < want; tries++) {
        const q = GEN[key]();
        if (q.struct) continue; // pictures as answer choices
        const opt = q.options.find(o => o.key === q.answer);
        const sig = q.html + '|' + q.answer;
        if (!opt || seen.has(sig)) continue;
        seen.add(sig);
        // grade with the game's own checker
        state.q = q; state.done = false; state.revealed = false; state.selected = q.answer;
        $('feedback').className = '';
        check();
        const ok = /\bgood\b/.test($('feedback').className) && state.done;
        out.push({ html: q.html, choices: q.options.map(o => o.html), answer: opt.html, hint: q.hint, why: q.why, ok });
      }
      return out;
    }, { key: m.key, want: WANT });
    raw.forEach((r, index) => {
      if (!r.ok) throw new Error(`${m.key}: game checker rejected its own answer for ${r.html.slice(0, 100)}`);
      const prompt = r.html
        .replace(/<div class="struct pair">/g, '<div class="struct pair" style="display:flex;gap:16px;flex-wrap:wrap">')
        .replace(/<span class="optname">/g, '<span class="optname" style="display:block;text-align:center;font-weight:bold">');
      items.push({
        skill: `${GAME}.${m.slug}`, courses: ['3B'], chapters: m.ch, type: 'mc', prompt,
        choices: r.choices, answer: r.answer, hint: r.hint, explain: r.why,
        origin: 'original', from: { game: GAME, list: `sample:${m.key}`, index },
      });
      const it = items[items.length - 1], w = sugarWhy(it, SUG);
      if (w && w.some(Boolean)) it.why = w;
    });
  }
  return items;
};
