// Sampler for the organic game ("Functional Group Flashcards"): the 16 generic functional-group structures and
// the real example compounds built into the game (GROUPS). Structures are the game's own drawGroup() SVG with the
// game's stylesheet inlined, so they are self-contained markup. Distractors come from the game's pickDistractors()
// (same-family look-alikes first), with Math.random seeded.
// - picture-to-name: structure -> group name (mc)
// - real-molecules:  condensed formula of a real compound -> group name (mc)
// Skipped: Name -> Picture (answer choices are pictures), Study cards (not questions).
const GAME = 'organic';
const CSS = {
  C: '#3a3157', O: '#d9534f', N: '#3b6fd6', S: '#c98a00', X: '#3a9d4a', R: '#7d7399',
};

module.exports = async (page, ctx) => {
  await ctx.seed(6100);
  const raw = await page.evaluate((CSS) => {
    const inlineSvg = (svg) => {
      svg.removeAttribute('class');
      svg.setAttribute('style', 'width:min(260px,80vw);height:auto;display:block;margin:6px auto');
      svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
      for (const el of svg.querySelectorAll('line,polyline,polygon,path')) { el.setAttribute('stroke', CSS.C); el.setAttribute('stroke-width', '3.2'); el.setAttribute('stroke-linecap', 'round'); el.setAttribute('stroke-linejoin', 'round'); el.setAttribute('fill', 'none'); }
      for (const t of svg.querySelectorAll('text')) {
        const cls = (t.getAttribute('class') || '').split(/\s+/);
        const col = ['O', 'N', 'S', 'X', 'R'].find(k => cls.includes(k));
        const note = /font-size:15px/.test(t.getAttribute('style') || '');
        t.setAttribute('fill', col ? CSS[col] : CSS.C);
        t.setAttribute('font-family', 'Nunito,"Segoe UI",system-ui,sans-serif'); t.setAttribute('font-weight', note ? '800' : '900'); if (!note) t.setAttribute('font-size', '26');
        t.removeAttribute('class');
        for (const ts of t.querySelectorAll('tspan')) { if ((ts.getAttribute('class') || '') === 'sub') ts.setAttribute('font-size', '16'); ts.removeAttribute('class'); }
      }
      return svg.outerHTML;
    };
    const out = [];
    for (const g of GROUPS) {
      const names = shuffle([g, ...pickDistractors(g, 3)]).map(x => x.name);
      out.push({ kind: 'picture-to-name', id: g.id, prompt: `Which functional group is in this structure?${inlineSvg(drawGroup(g, { hideName: true }))}`, choices: names, answer: g.name, hint: g.spot, explain: `${g.name}: ${g.key} Where you’ll meet it: ${g.meet}` });
      g.ex.forEach((ex, j) => {
        const names2 = shuffle([g, ...pickDistractors(g, 3)]).map(x => x.name);
        out.push({ kind: 'real-molecules', id: g.id + '-' + j, prompt: `Which functional group does this compound contain?<div style="font-size:1.6em;font-weight:900;text-align:center;margin:8px 0">${fmt(ex[0])}</div>`, choices: names2, answer: g.name, hint: `This compound is ${ex[1]}. ${g.spot}`, explain: `${fmt(ex[0])} is ${ex[1]}${ex[2] ? ' (' + ex[2] + ')' : ''}: ${g.key}` });
      });
    }
    return out;
  }, CSS);
  const counts = {};
  return raw.map(r => {
    const index = counts[r.kind] = (counts[r.kind] || 0);
    counts[r.kind]++;
    return {
      skill: `${GAME}.${r.kind}`, courses: ['3B'], chapters: ['3B-1'], type: 'mc',
      prompt: r.prompt, choices: r.choices, answer: r.answer, hint: r.hint, explain: r.explain,
      origin: 'original', from: { game: GAME, list: 'sample:' + r.kind, index },
    };
  });
};
