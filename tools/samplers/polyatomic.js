// Sampler for "Polyatomic Posse" (polyatomic). Fixed lists, no randomness in the items themselves:
//   polyatomic.nametoformula  all 30 Green Sheet ions (`ions`), name -> formula with charge (game's makeQ('n2f', ion))
//   polyatomic.formulatoname  all 30 Green Sheet ions, formula -> name (makeQ('f2n', ion))
//   polyatomic.charge         all 30 Green Sheet ions, pick the charge (makeQ('charge', ion)), as mc
//   polyatomic.ate-ite-family every family pair the game asks (familyPairs(F)) that starts from the -ate parent or
//                             ends on it, written as "given X, write Y" (makeQ('family', {..., dir: 'formula'}))
// Skipped: family pairs between two non-parent members (same rules, many more items) and the family "name it"
//   direction (mirror of the formula direction).
// accept: formula answers list every plain-text form the game's formulaVariants() makes (SO4^2-, SO42-, SO4-2 ...;
//   acetate also CH3COO^-). Name answers list the game's name variants plus spaced-paren forms.
// Grading: every answer and accept string is passed through the game's own grader (isFormulaCorrect / isNameCorrect)
//   and must pass for its own ion; it is also checked (case-insensitively, as QB.check() compares) not to match any
//   other ion, including the rule-built family ions.
module.exports = async (page, ctx) => {
  await ctx.seed(31);
  const res = await page.evaluate(() => {
    const fails = [], out = [];
    const lc = s => s.toLowerCase();
    const fAccept = ion => { const a = []; ion.formulas.forEach(f => formulaVariants(f).forEach(v => a.push(v))); return a; };
    const nAccept = ion => { const a = [...ion.names]; ion.names.filter(n => /\(/.test(n)).forEach(n => a.push(n.replace('(', ' ('))); return a; };
    const verify = (kind, ion, list) => {
      for (const r of list) {
        const ok = kind === 'formula' ? isFormulaCorrect(r, ion) : isNameCorrect(r, ion);
        if (!ok) fails.push(ion.name + ' <- ' + r);
        for (const other of ALL) if (other !== ion) {
          const clash = kind === 'formula'
            ? other.formulas.some(f => [...formulaVariants(f)].some(v => lc(v) === lc(r)))
            : other.names.some(n => normalizeName(n) === normalizeName(r));
          if (clash) fails.push('clash ' + ion.name + ' / ' + other.name + ' <- ' + r);
        }
      }
    };
    ions.forEach((ion, i) => {
      const q1 = makeQ('n2f', ion), ans1 = plainFormula(ion.formulas[0]);
      const acc1 = [...new Set(fAccept(ion))].filter(a => a !== ans1); verify('formula', ion, [ans1, ...acc1]);
      out.push({ list: 'sample:nameToFormula', index: i, skill: 'polyatomic.nametoformula', kind: 'formula', name: ion.name, html: ion.html, answer: ans1, accept: acc1, note: ion.displayNoteHtml || '', shown: q1.eq });
      const q2 = makeQ('f2n', ion), ans2 = ion.name;
      const acc2 = [...new Set(nAccept(ion))].filter(a => a !== ans2); verify('name', ion, [ans2, ...acc2]);
      out.push({ list: 'sample:formulaToName', index: i, skill: 'polyatomic.formulatoname', kind: 'name', name: ion.name, html: ion.html, answer: ans2, accept: acc2, note: ion.displayNoteHtml || '', shown: q2.eq });
      const q3 = makeQ('charge', ion), right = q3.choices.find(c => c.ok);
      if (!right || q3.checkChoice(right).ok !== true) fails.push('charge ' + ion.name);
      out.push({ list: 'sample:charge', index: i, skill: 'polyatomic.charge', kind: 'charge', name: ion.name, html: ion.html, base: baseOf(ion), answer: right.html, choices: q3.choices.map(c => c.html) });
    });
    let k = 0;
    FAMILIES.forEach(F => familyPairs(F).filter(([g, t]) => g === F.parent || t === F.parent).forEach(([g, t]) => {
      const q = makeQ('family', { fam: F, given: g, target: t, dir: 'formula' }), ans = plainFormula(t.formulas[0]);
      const acc = [...new Set(fAccept(t))].filter(a => a !== ans); verify('formula', t, [ans, ...acc]);
      if (!q.check(ans).ok) fails.push('family ' + g.name + ' -> ' + t.name);
      out.push({ list: 'sample:family', index: k++, skill: 'polyatomic.ate-ite-family', kind: 'family', name: t.name, html: t.html, given: g.name, givenHtml: g.html, answer: ans, accept: acc, onSheet: ions.includes(t), why: relationText(g, t) });
    }));
    return { out, fails };
  });
  if (res.fails.length) throw new Error('polyatomic check failed:\n' + res.fails.join('\n'));
  return res.out.map(q => {
    const it = { skill: q.skill, courses: ['3A', '1A'], chapters: ['3A-4', '1A-2'] };
    if (q.kind === 'formula') {
      Object.assign(it, { type: 'text', prompt: `Write the formula, with its charge, for the <strong>${q.name}</strong> ion.<br>Type it like SO4^2- (element symbols are case-sensitive).`, answer: q.answer });
      it.explain = `${q.name} = ${q.html}` + (q.note ? `. ${q.note}.` : '');
    } else if (q.kind === 'name') {
      Object.assign(it, { type: 'text', prompt: `Name this ion: <strong>${q.html}</strong>`, answer: q.answer });
      it.explain = `${q.html} is ${q.name}` + (q.note ? `. ${q.note}.` : '');
    } else if (q.kind === 'charge') {
      Object.assign(it, { type: 'mc', prompt: `What is the charge on the <strong>${q.name}</strong> ion, ${q.base.replace(/([A-Za-z])(\d+)/g, '$1<sub>$2</sub>')}?`, choices: q.choices, answer: q.answer });
      it.explain = `${q.name} = ${q.html}`;
    } else {
      Object.assign(it, { type: 'text', prompt: `${q.given[0].toUpperCase() + q.given.slice(1)} is ${q.givenHtml}. Write the formula, with its charge, for <strong>${q.name}</strong>.<br>Type it like SO4^2- (element symbols are case-sensitive).`, answer: q.answer });
      it.explain = `Start from ${q.given} ${q.givenHtml}: ${q.why} So ${q.name} = ${q.html}.` + (q.onSheet ? '' : ' (Built with the Green Sheet naming rules.)');
    }
    if (q.accept && q.accept.length) it.accept = q.accept;
    Object.assign(it, { origin: 'original', from: { game: 'polyatomic', list: q.list, index: q.index } });
    return it;
  });
};
