// Sampler for the functionalgroups game ("Organic Origins"): runs the game's own generators (GEN[mode]) and
// converts them to the shared bank format. Structures are the game's own output (structHTML: skeletal SVG,
// condensed text, or branched-condensed SVG; drawMed for Med Molecules), which is self-contained inline markup.
// Every item is graded with the game's own check() before it is kept.
// Skipped: match "Draw It" (answer choices are pictures), react "Predict the Product" (answer choices are pictures),
// blitz (re-uses the Spot/Classify/Name/Med generators), Exam Practice (Final Boss items, already in bank).
// Properties "boiling point" and "solubility" show a picture + name in each choice; only the name is kept.
const GAME = 'functionalgroups';
const CH5 = ['3B-2', '3B-4', '3B-5', '3B-7', '3B-8'];
const MODES = [
  { key: 'spot', slug: 'spot-group', ch: ['3B-1'], want: 36 },
  { key: 'classify', slug: 'classify-degree', ch: ['3B-2', '3B-4', '3B-8'], want: 30 },
  { key: 'name', slug: 'name', ch: CH5, want: 36, level: 'basic' },
  { key: 'name', slug: 'name-branched', ch: CH5, want: 30, level: 'challenge' },
  { key: 'props', slug: 'properties', ch: CH5, want: 36 },
  { key: 'med', slug: 'med-molecules', ch: ['3B-1', '3B-3', '3B-14'], want: 40 },
];
const chip = (bg, L) => `<span style="display:inline-block;min-width:22px;padding:0 6px;border-radius:12px;background:${bg};color:#fff;font-weight:900;text-align:center">${L}</span>`;
const fix = s => String(s == null ? '' : s)
  .replace(/<span class="medchip" style="background:([^"]+)">([A-C])<\/span>/g, (m, bg, L) => chip(bg, L))
  .replace(/<p class="scrollnote">[\s\S]*?<\/p>/g, '')
  .replace(/<svg class="mol medmol([^"]*)"/g, '<svg class="mol medmol$1" style="max-width:100%;height:auto"')
  .replace(/<div class="medhead"><b>([\s\S]*?)<\/b><span>([\s\S]*?)<\/span><\/div>/g, '<div class="medhead"><b>$1</b>: <span>$2</span></div>');

module.exports = async (page, ctx) => {
  const items = [];
  let seed = 5300;
  for (const m of MODES) {
    await ctx.seed(++seed);
    const raw = await page.evaluate(({ key, want, level }) => {
      state.mode = key; state.style = 'mixed'; state.medFocus = 'all'; state.level = level || 'mixed';
      const out = [], seen = new Set();
      for (let tries = 0; tries < 4000 && out.length < want; tries++) {
        const q = GEN[key]();
        const txt = q.html.replace(/<svg[\s\S]*?<\/svg>|<div class="condensed"[\s\S]*?<\/div>/g, '');
        const sig = q.smi ? q.smi + '|' + txt + '|' + q.answer : q.html + '|' + q.answer;
        if (seen.has(sig)) continue; seen.add(sig);
        // choices: picture options keep only their name (props bp/sol); med label options -> "Label X"
        const ch = q.options.map(o => o.struct ? o.key : /class="medopt"/.test(o.html) ? 'Label ' + o.key : o.html);
        const ai = q.options.findIndex(o => o.key === q.answer);
        if (ai < 0 || new Set(ch).size !== ch.length) continue;
        state.q = q; state.done = false; state.revealed = false; state.selected = q.answer; fb('', '');
        check();
        const ok = state.done && /\bgood\b/.test($('feedback').className);
        out.push({ html: q.html, choices: ch, answer: ch[ai], hint: q.hint, why: q.why, ok });
      }
      return out;
    }, { key: m.key, want: m.want, level: m.level });
    raw.forEach((r, index) => {
      if (!r.ok) throw new Error(`${m.slug}: game checker rejected its own answer for ${r.html.slice(0, 120)}`);
      items.push({
        skill: `${GAME}.${m.slug}`, courses: ['3B'], chapters: m.ch, type: 'mc', prompt: fix(r.html),
        choices: r.choices, answer: r.answer, hint: r.hint, explain: fix(r.why),
        origin: 'original', from: { game: GAME, list: `sample:${m.key}${m.level ? '-' + m.level : ''}`, index },
      });
    });
  }
  return items;
};
