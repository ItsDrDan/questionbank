// Sampler for the stoichiometry game (CHEM 3A Ch 11 / CHEM 1A Ch 4).
// Runs the game's own generators; every item is graded by the game's own checker
// (checkAnswer / checkChoice / checkChallengeAnswer) before it is kept.
// Skipped: Mixed Practice (mix of the other quests). Mass Quest's 23% limiting/yield draws are
// sampled under Limiting Reactants / Yield Quest instead. 1A "reaction" Part 1 (predict/balance)
// needs the coefficient UI, so only the stoichiometry calculation is kept (balanced equation shown).
// 1A "challenge" is multi-step; kept as one item whose answer is the final stage.

const PER_MODE = 35, MAX_TRIES = 400;

// [skill slug, courses, chapters, course to set, generator expression, filter]
const ALL = ['3A', '1A'], CH = ['3A-11', '1A-4'];
const MODES = [
  ['learn-recipe', ALL, CH, '3A', "LEVELS.find(l=>l.id==='recipe').gen()"],
  ['learn-ratio', ALL, CH, '3A', "LEVELS.find(l=>l.id==='ratio').gen()"],
  ['learn-molmol', ALL, CH, '3A', "LEVELS.find(l=>l.id==='molmol').gen()"],
  ['learn-gmol', ALL, CH, '3A', "LEVELS.find(l=>l.id==='gmol').gen()"],
  ['learn-gg', ALL, CH, '3A', "LEVELS.find(l=>l.id==='gg').gen()"],
  ['learn-stp', ALL, CH, '3A', "LEVELS.find(l=>l.id==='stp').gen()"],
  ['learn-soln', ALL, CH, '3A', "LEVELS.find(l=>l.id==='soln').gen()"],
  ['learn-limit', ALL, CH, '3A', "LEVELS.find(l=>l.id==='limit').gen()"],
  ['learn-yield', ALL, CH, '3A', "LEVELS.find(l=>l.id==='yield').gen()"],
  // Mass Quest: same conversion types in both courses (1A only weights g→particles more)
  ['mass', ALL, CH, '3A', "makeMass('3A')"],
  // Solution Lab: 3A kinds (titration/molarity/massvol) appear in both courses
  ['solution', ALL, CH, '3A', "makeSolution('3A')"],
  // 1A-only extras: % (m/v), % (m/m), density + two-solution limiting/yield variant
  ['solution-1a', ['1A'], ['1A-4'], '1A', "(Math.random()<.28?solutionVariant():makeSolution('1A'))", 'q=>/% \\(m\\/[vm]\\)/.test(q.prompt)||/^Solution •/.test(q.mode)'],
  // Gas Explorer: 3A kinds (volume/mass/STP/identity) appear in both courses
  ['gas', ALL, ['3A-11', '1A-9', '1A-4'], '3A', "makeGas('3A')"],
  // 1A-only extras: gas→gas at two conditions + two-gas limiting/yield variant
  ['gas-1a', ['1A'], ['1A-9', '1A-4'], '1A', "(Math.random()<.28?gasVariant():makeGas('1A'))", "q=>/^Gas law •/.test(q.mode)||(q.steps&&q.steps.length&&q.steps[0].id.startsWith('ideal-in')&&q.steps.at(-1).id.startsWith('ideal-out'))"],
  ['limiting', ALL, CH, '3A', "makeLimiting('3A')"],
  ['yield', ALL, CH, '3A', 'makeYield()'],
  ['reaction', ['1A'], ['1A-4', '1B-ready'], '1A', 'makeReactionStoich()'],
  ['challenge', ['1A'], ['1A-4', '1B-ready'], '1A', 'makeChallenge()'],
];

// "NaNO3" would trip the bank's NaN check; write the N as an HTML entity (renders identically).
const noNaN = s => s; // (validator now allows NaNO3)

module.exports = async (page, ctx) => {
  const items = [];
  let seed = 1100;
  for (const [slug, courses, chapters, course, gen, filter] of MODES) {
    await page.evaluate(c => { setCourse(c); }, course);
    await ctx.seed(seed++);
    const res = await page.evaluate(({ gen, filter, PER_MODE, MAX_TRIES }) => {
      const G = new Function('return ' + gen), F = filter ? new Function('return ' + filter)() : () => true;
      const sup = s => String(s).replace(/[0-9-]/g, c => ({ '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴', '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹', '-': '⁻' })[c]);
      const species = e => e ? [...e.lhs, ...e.rhs].map(x => x[0]) : [];
      const chart = (list, title) => '<table class="mm-chart"><tr><th>' + title + '</th><th>Molar mass (g mol⁻¹)</th></tr>' +
        list.map(f => '<tr><td>' + fhtml(f) + '</td><td>' + mmText(f) + '</td></tr>').join('') + '</table>';
      const usesMass = (q, text) => {
        const units = [q.unit, q.chainUnit, q.given && q.given.u, ...(q.steps || []).flatMap(s => [s.inU, s.outU])].filter(Boolean);
        if (units.some(u => /^g /.test(u))) return true;
        if (q.builderData && ['massTwo', 'yield'].includes(q.builderData.type)) return true;
        return /\d g<\/span>|\(in grams\)|% \(m\/|What mass|grams of|\d g<\/span>/.test(text) || /<span class="measure">[^<]* g<\/span>/.test(text);
      };
      function build(q) {
        // challenge: collapse to final stage
        let text, stage = null;
        if (q.challenge) {
          const c = q.challenge; stage = c.stages[c.stages.length - 1];
          text = '<b>' + c.story + '</b> ' + c.overview + '<br><br><strong>' + escape(stage.title) + ':</strong> ' + stage.prompt;
        } else text = q.prompt;
        const eqLine = q.e ? '<div class="eq">' + rxn(q.e) + '</div>' : q.equationHTML ? '<div class="eq">' + q.equationHTML + '</div>' : '';
        const allText = q.challenge ? text + q.challenge.stages.map(s => s.prompt).join(' ') : text;
        let data = '';
        if (q.kind === 'identity') data += chart(unknownGases, 'Candidate gas');
        else if (q.e && (usesMass(q, allText) || (q.challenge && q.challenge.stages.some(s => usesMass(s, s.prompt))))) data += chart(species(q.e), 'Substance');
        const consts = [];
        const flat = JSON.stringify([q.steps, q.challenge && q.challenge.stages.map(s => s.steps)]);
        if (/atm/.test(allText) || /PV = nRT/.test(flat)) consts.push('R = 0.082058 L atm mol⁻¹ K⁻¹');
        if (/STP/.test(allText)) consts.push('At STP, 1 mol of gas occupies 22.4 L');
        if (/\bparticles\b|\bions\b/.test(allText) || /Avogadro/.test(flat)) consts.push('N<sub>A</sub> = 6.0221 × 10²³ mol⁻¹');
        if (consts.length) data += '<div class="consts">' + consts.join('; ') + '</div>';
        const prompt = eqLine + '<div>' + text + '</div>' + data;
        // worked solution, same pieces as the game's solution()
        const src = stage || q;
        let explain = '';
        const guide = q.challenge ? null : buildGuide(q);
        if (guide && guide.length) explain += '<ol class="sol-steps">' + guide.map(s => '<li><b>' + escape(s.title) + ':</b> ' + s.explain + '</li>').join('') + '</ol>';
        if (src.steps && src.steps.length) explain += '<div class="solution-chain">' + amount(src.given) + src.steps.map(f => ' <b>×</b> ' + factHTML(f)).join('') + ' <b>=</b> ' + escape(fmt(src.chainAnswer ?? src.answer, src.chainAnswer != null ? 4 : src.sf || 4)) + ' ' + unitHTML(src.chainUnit || src.unit) + '</div>';
        if (src.solutionExtra) explain += '<div>' + src.solutionExtra + '</div>';
        if (q.kind === 'identity') explain += '<div>Answer: <b>' + fhtml(q.answer) + '</b></div>';
        else if (!q.challenge) explain += '<div>' + finalText(q) + '</div>';
        else explain += '<div>Round to 3 significant figures: <b>' + escape(fmt(stage.answer, 3)) + ' ' + unitHTML(stage.unit) + '</b></div>';
        const hint = (src.hints || []).join(' ');
        let item;
        if (q.kind === 'choice') {
          const opts = q.options;
          item = { type: 'mc', choices: opts.map(o => o.html), answer: opts.find(o => o.key === q.answer).html, check: { key: q.answer } };
        } else if (q.kind === 'identity') {
          const pretty = q.answer.replace(/\d/g, d => '₀₁₂₃₄₅₆₇₈₉'[d]);
          item = { type: 'text', answer: q.answer, accept: pretty !== q.answer ? [pretty, q.answer.toLowerCase()] : [q.answer.toLowerCase()].filter(x => x !== q.answer), check: { raw: q.answer } };
          if (!item.accept.length) delete item.accept;
        } else if (q.kind === 'integer') {
          item = { type: 'number', answer: q.answer, unit: q.unit, tolerance: 0, check: { raw: String(q.answer) } };
        } else {
          const sf = src.sf, a = src.answer;
          item = { type: 'number', answer: Number(a.toPrecision(sf)), unit: src.unit, tolerance: 0.005, sigfigs: sf, check: { raw: fmt(a, sf) } };
        }
        return { prompt, hint, explain, ...item };
      }
      function verify(q, chk) {
        state.q = q; q.attempted = false; q.scored = false;
        byId('feedback').className = 'feedback';
        if (q.challenge) {
          q.reactionTask.solved = true; q.challenge.index = q.challenge.stages.length - 1;
          byId('answer').value = chk.raw; checkChallengeAnswer(q);
          // advanceChallenge on the last stage reports "Challenge complete!"
          return /\bgood\b/.test(byId('feedback').className) && /Challenge complete/.test(byId('feedback').textContent);
        }
        if (q.reactionTask) q.reactionTask.solved = true;
        if (chk.key !== undefined) { checkChoice(chk.key); }
        else { byId('answer').value = chk.raw; checkAnswer(); }
        return /\bgood\b/.test(byId('feedback').className);
      }
      const out = [], seen = new Set(); let bad = 0, tries = 0;
      const qs = [];
      while (out.length < PER_MODE && tries++ < MAX_TRIES) {
        const q = G(); q.kind = q.kind || 'numeric';
        if (!F(q)) continue;
        const it = build(q);
        const key = it.prompt + '|' + JSON.stringify(it.answer);
        if (seen.has(key)) continue; seen.add(key);
        out.push(it); qs.push(q);
      }
      // verify after generation so the checker's random praise doesn't change the sample
      const kept = [];
      out.forEach((it, i) => { const ok = verify(qs[i], it.check); if (ok) { delete it.check; kept.push(it); } else bad++; });
      return { items: kept, bad, tries };
    }, { gen, filter, PER_MODE, MAX_TRIES });
    if (res.bad) console.warn(`stoichiometry ${slug}: ${res.bad} item(s) failed the game's checker and were dropped`);
    res.items.forEach((it, i) => items.push({
      skill: 'stoichiometry.' + slug, courses, chapters, type: it.type, prompt: noNaN(it.prompt),
      ...(it.choices ? { choices: it.choices.map(noNaN) } : {}), answer: noNaN(it.answer),
      ...(it.accept ? { accept: it.accept } : {}),
      ...(it.unit !== undefined ? { unit: it.unit } : {}),
      ...(it.tolerance !== undefined ? { tolerance: it.tolerance } : {}),
      ...(it.sigfigs ? { sigfigs: it.sigfigs } : {}),
      ...(it.hint ? { hint: it.hint } : {}), ...(it.explain ? { explain: noNaN(it.explain) } : {}),
      origin: 'original', from: { game: 'stoichiometry', list: 'sample:' + slug, index: i },
    }));
  }
  return items;
};
