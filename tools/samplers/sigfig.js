// Sampler for the sigfig game ("Sig Fig Sleuth", rebuilt Nov 2026): runs the game's own generate(topic, {course})
// and keeps the typed-number topics. Every answer is first graded with the question's own check().
// Rounding and calculation answers become 'number' items with a sigfigs field, so the Daily 5 grades
// both the value and the number of significant figures (qb.js sigFigs()).
// Skipped: tap-the-digits, glassware/digital readings (pictures that need the game's stylesheet), and the
// exact/precision/equipment picture or multiple-choice topics.
const GAME = 'sigfig';
const TOPICS = [
  { t: 'count', skill: 'sigfig.count' },
  { t: 'round', skill: 'sigfig.round-sigfigs' },
  { t: 'decimal', skill: 'sigfig.round-decimals' },
  { t: 'sci', skill: 'sigfig.scientific-notation' },
  { t: 'muldiv', skill: 'sigfig.multiply-divide' },
  { t: 'addsub', skill: 'sigfig.add-subtract' },
  { t: 'multi', skill: 'sigfig.multi-step' },
];
const WANT = 30;
const strip = s => String(s == null ? '' : s).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();

module.exports = async (page, ctx) => {
  const items = [], seenAll = new Set();
  let seed = 4400;
  for (const course of ['3A', '1A']) {
    for (const m of TOPICS) {
      await ctx.seed(++seed);
      const raw = await page.evaluate(({ t, course, want }) => {
        const toPlain = a => String(a).replace(/<sup>([^<]*)<\/sup>/g, '^$1').replace(/<[^>]+>/g, '').replace(/−/g, '-').trim();
        const out = [], seen = new Set();
        for (let tries = 0; tries < 800 && out.length < want; tries++) {
          const q = generate(t, { course });
          if (typeof q.check !== 'function' || q.art) continue;
          const key = q.eq + '|' + q.answer;
          if (seen.has(key)) continue; seen.add(key);
          // value without the unit, in plain E form for scientific notation
          let plain = toPlain(q.answer);
          if (q.unit) plain = plain.replace(new RegExp('\\s*' + q.unit.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&') + '$'), '').trim();
          const sci = plain.match(/^([-\d.]+)\s*×\s*10\^\(?(-?\d+)\)?$/);
          const num = sci ? sci[1] + 'e' + sci[2] : plain;
          const pass = a => { try { const r = q.check(a); return r === true || !!(r && r.ok === true); } catch (e) { return false; } };
          const ok = pass(num) && (!q.unit || pass(num + ' ' + q.unit));
          out.push({ eq: q.eq, prompt: q.prompt, unit: q.unit || '', answer: num, shown: plain, hint: q.hint, solution: q.solution, ok, sci: !!sci, mant: sci ? sci[1] : plain });
        }
        return out;
      }, { t: m.t, course, want: WANT });
      raw.forEach((r, index) => {
        if (!isFinite(Number(r.answer))) return;            // ∞ (exact numbers) and other non-numeric answers
        if (!r.ok) throw new Error(`${m.t}: game check() rejected its own answer ${r.answer} for ${r.eq}`);
        const sf = (() => { const s = r.mant.replace(/^[+-]/, ''); const pt = s.includes('.'); let d = s.replace('.', '').replace(/^0+/, ''); if (!pt) d = d.replace(/0+$/, ''); return d.length || 1; })();
        const isCount = m.t === 'count';
        const eq = String(r.eq).replace(/<span class="frac"><span>(.*?)<\/span><span>(.*?)<\/span><\/span>/g, (x, a, b) => `<span style="display:inline-flex;flex-direction:column;align-items:center;vertical-align:middle"><span style="padding:0 6px;border-bottom:2px solid currentColor">${a}</span><span style="padding:0 6px">${b}</span></span>`);
        if (/class=/.test(eq)) return;                       // anything else that needs the game's stylesheet
        const prompt = `${r.prompt}<div style="font-size:1.35em;font-weight:800;text-align:center;margin:10px 0">${eq}</div>`;
        const dup = m.skill + '|' + prompt + '|' + r.answer; if (seenAll.has(dup)) return; seenAll.add(dup);
        const item = {
          skill: m.skill, courses: [course], chapters: [course === '3A' ? '3A-1' : '1A-1'], type: 'number', prompt,
          answer: isCount ? Number(r.answer) : r.answer, hint: r.hint, explain: strip(r.solution),
          origin: 'original', from: { game: GAME, list: `sample:${m.t}:${course}`, index },
        };
        if (!isCount) { item.sigfigs = sf; item.tolerance = 1e-9; if (r.unit) item.unit = r.unit; }
        items.push(item);
      });
    }
  }
  return items;
};
