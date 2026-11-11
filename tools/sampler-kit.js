// Shared helpers for the samplers (tools/samplers/<game>.js). Not a sampler itself, so it lives outside samplers/.
//  - loadFBX(page): some games draw their molecules with FBX.molSVG from the textbook repo (textbook/js/fbx.js),
//    which the sampler can't fetch (network is blocked). Load it from the local textbook clone next to the games.
//  - installInliner(page): adds window.__inline(el), which copies the game's CSS (computed styles) onto the markup
//    inside el as style="" attributes and drops class/data-* attributes, so question HTML is self-contained.
//  - mirrorFamily(page, ctx, cfg): sampler for the games built on the Mirror Match engine (TOPICS / generate(topic) /
//    newQuestion() / choose(i) / grade()): stereochemistry, enzymes, lipids, nucleicacids, metabolism, pHcharge.
//    It renders each question with the game's own newQuestion(), inlines the rendered prompt, then grades the right
//    answer with the game's own checker (choose(i), check() for typed answers, checkFields() for number boxes) and
//    keeps the item only if the game marks it correct.
const fs = require('fs'), path = require('path');

function reposDirOf(page) {               // the game is open at file://<repos>/<game>/index.html
  const u = new URL(page.url());
  return path.dirname(path.dirname(decodeURIComponent(u.pathname)));
}
async function loadFBX(page) {
  if (await page.evaluate(() => !!window.FBX)) return;
  const f = path.join(reposDirOf(page), 'textbook', 'js', 'fbx.js');
  if (!fs.existsSync(f)) throw new Error('needs the textbook repo (textbook/js/fbx.js) next to the games for its molecule drawings');
  await page.addScriptTag({ content: fs.readFileSync(f, 'utf8') });
}

// ---------- in-page inliner ----------
const INLINER = String.raw`(() => {
  if (window.__inline) return;
  const H_INH = ['color', 'font-family', 'font-size', 'font-weight', 'font-style', 'text-align', 'white-space', 'letter-spacing', 'text-transform', 'line-height'];
  const H_OWN = ['display', 'background-color', 'background-image', 'border-top', 'border-right', 'border-bottom', 'border-left', 'border-radius', 'padding', 'margin', 'gap',
    'flex-direction', 'flex-wrap', 'justify-content', 'align-items', 'vertical-align', 'max-width', 'min-width', 'overflow-x', 'text-decoration-line', 'opacity', 'border-collapse', 'list-style-type', 'grid-template-columns'];
  const S_INH = ['fill', 'stroke', 'stroke-width', 'stroke-dasharray', 'stroke-linecap', 'stroke-linejoin', 'font-family', 'font-size', 'font-weight', 'font-style', 'text-anchor', 'dominant-baseline', 'paint-order', 'fill-opacity', 'stroke-opacity'];
  const S_OWN = ['opacity', 'display'];
  let sandbox = null; const base = {};
  function baseline(el) {
    const key = el.namespaceURI + '|' + el.localName;
    if (base[key]) return base[key];
    if (!sandbox) { sandbox = document.createElement('div'); sandbox.style.cssText = 'all:initial;position:absolute;left:-99999px;top:0'; document.body.appendChild(sandbox); }
    let probe = document.createElementNS(el.namespaceURI, el.localName), host = sandbox;
    if (el instanceof SVGElement && el.localName !== 'svg') { host = document.createElementNS('http://www.w3.org/2000/svg', 'svg'); sandbox.appendChild(host); }
    host.appendChild(probe);
    const cs = getComputedStyle(probe), o = {};
    for (const p of H_OWN.concat(S_OWN, H_INH, S_INH)) o[p] = cs.getPropertyValue(p);
    o.margin = marginOf(probe, cs);
    base[key] = o; return o;
  }
  // getComputedStyle gives used pixel values for auto margins (centering); the typed OM keeps "auto"
  function marginOf(el, cs) {
    try { const m = el.computedStyleMap(); return ['top', 'right', 'bottom', 'left'].map(k => String(m.get('margin-' + k))).join(' '); }
    catch (e) { return cs.getPropertyValue('margin'); }
  }
  const isSvgChild = el => el instanceof SVGElement && el.localName !== 'svg';
  // el: a live element already rendered by the game. Its descendants get inline styles; el itself is not changed.
  function inlineTree(root) {
    const els = [...root.querySelectorAll('*')];
    // read every computed style first (writing styles as we go would change what later elements inherit)
    const plan = els.map(el => {
      const cs = getComputedStyle(el), pcs = getComputedStyle(el.parentElement), b = baseline(el), out = [];
      if (cs.display === 'none' && !(el instanceof SVGElement)) return { el, drop: true };
      const svgc = isSvgChild(el);
      for (const p of svgc ? S_INH : H_INH.concat(el.localName === 'svg' ? [] : [])) {
        const v = cs.getPropertyValue(p);
        if (v === pcs.getPropertyValue(p)) continue;
        if (svgc && el.hasAttribute(p)) continue;              // already a presentation attribute
        out.push([p, v]);
      }
      if (el.localName === 'svg') for (const p of ['fill', 'stroke', 'font-family', 'font-size', 'font-weight']) { const v = cs.getPropertyValue(p); if (v !== b[p] && !el.hasAttribute(p)) out.push([p, v]); }
      for (const p of svgc ? S_OWN : H_OWN) {
        const v = p === 'margin' ? marginOf(el, cs) : cs.getPropertyValue(p);
        if (v === b[p]) continue;
        if (p === 'background-image' && /url\(/.test(v)) continue;
        if (/^border-(top|right|bottom|left)$/.test(p) && / none\b|^0px/.test(v)) continue;
        if ((p === 'max-width' || p === 'min-width') && (el.localName === 'svg' || v === 'auto')) continue;
        if (p === 'display' && (v === 'block' && el.localName === 'div' || v === 'inline' && !svgc)) continue;
        out.push([p, v]);
      }
      let size = null;
      if (el.localName === 'svg' && !el.getAttribute('width')) { const r = el.getBoundingClientRect(); if (r.width > 0) size = Math.round(r.width); }
      return { el, out, size };
    });
    for (const { el, drop, out, size } of plan) {
      if (drop) { el.remove(); continue; }
      let st = out.map(([p, v]) => p + ':' + v).join(';');
      if (el.localName === 'svg') st += (st ? ';' : '') + (size ? 'width:' + size + 'px;' : '') + 'max-width:100%;height:auto';
      const old = el.getAttribute('style');
      if (st) el.setAttribute('style', (old ? old.replace(/;?\s*$/, ';') : '') + st);
    }
    for (const el of root.querySelectorAll('*')) {
      for (const a of [...el.attributes]) if (a.name === 'class' || a.name.startsWith('data-') || a.name.startsWith('on') || a.name === 'tabindex' || (a.name === 'role' && a.value === 'button') || a.name === 'aria-pressed') el.removeAttribute(a.name);
      if (el.localName === 'svg' && !el.getAttribute('xmlns')) el.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    }
    // unwrap bare spans and drop empty ones
    for (const el of [...root.querySelectorAll('span')]) if (!el.attributes.length) { if (!el.childNodes.length) el.remove(); else el.replaceWith(...el.childNodes); }
    return root.innerHTML.replace(/\s+/g, ' ').trim();
  }
  // html string -> self-contained html, styled as it would be inside host (an element of the game)
  function inlineHTML(html, host) {
    if (!html) return '';
    const box = document.createElement('div'); (host || document.body).appendChild(box); box.innerHTML = html;
    const out = inlineTree(box); box.remove(); return out;
  }
  window.__inline = inlineTree; window.__inlineHTML = inlineHTML;
})();`;
async function installInliner(page) { await page.evaluate(INLINER); }

// ---------- Mirror Match family ----------
// cfg: { game, fbx, topics: [{ key, slug, ch: [...] | (item) => [...], want }], skip: in-page filter source (q) => reason|'',
//        prep: in-page source (q) => void, run on each question before it is shown,
//        roots: selectors whose rendered content makes up the prompt (in this order), drop: selectors to remove from it,
//        choiceSel, choiceDrop, hintHost, explainHost }
async function mirrorFamily(page, ctx, cfg) {
  if (cfg.fbx) await loadFBX(page);
  await installInliner(page);
  const items = [];
  let seed = cfg.seed || 7000;
  for (const t of cfg.topics) {
    await ctx.seed(++seed);
    const raw = await page.evaluate(({ t, cfg }) => {
      const skipFn = cfg.skip ? (0, eval)('(' + cfg.skip + ')') : () => '';
      const prepFn = cfg.prep ? (0, eval)('(' + cfg.prep + ')') : null;
      const fx = typeof scripts === 'function' ? scripts : (s => s);   // lipids/nucleicacids render sub/superscripts with scripts()
      const strip = s => String(s == null ? '' : s).replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
      const out = [], seen = new Set(), why = {}, sameCount = {};
      const want = t.want || 36;
      const gen = cfg.gen === 'GENERATORS' ? () => GENERATORS[t.key]() : () => generate(t.key);
      window.makeQuestion = () => gen.q;
      for (let tries = 0; tries < (t.tries || 600) && out.length < want; tries++) {
        let q; try { q = gen(); } catch (e) { why['error: ' + e.message] = (why['error: ' + e.message] || 0) + 1; continue; }
        if (!q) continue;
        q.topic = q.topic || t.key;
        const bad = q.kind !== 'choice' && q.kind !== 'input' && q.kind !== 'fields' ? 'kind ' + q.kind
          : q.kind === 'choice' && q.choices.some(c => /<svg|<img/i.test(c.html)) ? 'picture choices'
          : q.kind === 'choice' && q.choices.filter(c => c.ok).length !== 1 ? 'not exactly one right choice'
          : /<img/i.test([q.art, q.eq, q.scenario, q.prompt].join(' ')) ? 'image file in prompt'
          : skipFn(q);
        if (bad) { why[bad] = (why[bad] || 0) + 1; continue; }
        if (prepFn) prepFn(q);
        gen.q = q; state.quiz = null; state.guideOn = false;
        try { newQuestion(); } catch (e) { why['render error: ' + e.message] = (why['render error: ' + e.message] || 0) + 1; continue; }
        // ---- prompt: the rendered question, inlined ----
        const parts = [];
        for (const sel of cfg.roots) {
          const live = document.querySelector(sel); if (!live || live.hidden) continue;
          const el = live.cloneNode(true); live.after(el);          // same id and place, so the game's CSS applies; the live one stays for grading
          for (const d of cfg.drop || []) el.querySelectorAll(d).forEach(x => x.remove());
          const h = window.__inline(el); el.remove();
          if (strip(h) || /<svg|<table/.test(h)) parts.push('<div>' + h + '</div>');
        }
        let prompt = parts.join('');
        if (q.kind === 'input' && q.note) prompt += '<p style="font-size:0.9em;color:#5b5670">' + fx(q.note) + '</p>';
        let choices, answer, whys, typed = [];
        if (q.kind === 'choice') {
          const btns = [...document.querySelectorAll(cfg.choiceSel)];
          if (btns.length !== q.choices.length) { why['choice buttons not found'] = (why['choice buttons not found'] || 0) + 1; continue; }
          choices = btns.map(b => { const c = b.cloneNode(true); for (const d of cfg.choiceDrop || []) c.querySelectorAll(d).forEach(x => x.remove()); b.parentElement.appendChild(c); c.hidden = false; const h = window.__inline(c); c.remove(); return h; });
          answer = choices[q.choices.findIndex(c => c.ok)];
          // each wrong choice's own "why" from the game (shown when a student picks it); '' for the right answer
          const fb = document.getElementById(cfg.explainHost || 'feedback');
          whys = q.choices.map(c => c.ok || !c.why ? '' : window.__inlineHTML(fx(c.why), fb));
          if (!whys.some(Boolean)) whys = undefined;
        }
        // ---- grade with the game's own checker ----
        let ok = false;
        if (q.kind === 'choice') {
          const i = q.choices.findIndex(c => c.ok); choose(i);
          ok = state.done && /\bgood\b/.test(document.getElementById('feedback').className);
        } else if (q.kind === 'input') {
          const inp = document.getElementById('answer');
          inp.value = strip(q.answer); check();
          ok = state.done && /\bgood\b/.test(document.getElementById('feedback').className);
          // other ways a student might type it, kept only if the game's checker also accepts them
          for (const v of cfg.variants ? (0, eval)('(' + cfg.variants + ')')(strip(q.answer), q) : []) { if (v && v !== strip(q.answer) && q.check(v).ok) typed.push(v); }
        } else if (q.kind === 'fields') {
          q.fields.forEach((fd, i) => { document.getElementById('fd' + i).value = String(fd.value); });
          checkFields();
          ok = state.done && /\bgood\b/.test(document.getElementById('feedback').className);
        }
        const fbHost = document.getElementById(cfg.explainHost || 'feedback'), hHost = document.getElementById(cfg.hintHost || 'hintBox');
        const wasHidden = hHost.hidden; hHost.hidden = false;
        const hint = q.hint ? window.__inlineHTML(fx(q.hint), hHost) : '';
        hHost.hidden = wasHidden;
        const explain = q.solution ? window.__inlineHTML(fx(q.solution), fbHost) : '';
        const sig = prompt + '|' + (answer || q.answer);
        if (seen.has(sig)) { why.duplicate = (why.duplicate || 0) + 1; continue; }
        // near-copies (same sub-type and same answer, only the drawing differs): keep a few, not dozens
        const same = (q.tag || '') + '|' + strip(answer || q.answer);
        if ((sameCount[same] = (sameCount[same] || 0) + 1) > (cfg.maxSame || 8)) { why['same tag+answer'] = (why['same tag+answer'] || 0) + 1; continue; }
        seen.add(sig);
        if (q.kind === 'fields') {
          const one = q.fields.length === 1;
          q.fields.forEach((fd, i) => {
            const lab = window.__inlineHTML(fd.label, document.body);
            out.push({ kind: 'number', topic: q.topic, tag: q.tag || '', prompt: one ? prompt + '<p><b>' + lab + '</b></p>' : prompt + '<p>Answer this part: <b>' + lab + '</b></p>', answer: fd.value, hint, explain, ok, part: i });
          });
        } else if (q.kind === 'input') {
          let a = strip(q.answer); const unit = q.unit ? strip(q.unit) : '';
          if (unit && a.endsWith(unit) && /^-?\d+(\.\d+)?$/.test(a.slice(0, -unit.length).trim())) a = a.slice(0, -unit.length).trim();   // "16%" with unit % -> 16
          out.push({ kind: /^-?\d+(\.\d+)?$/.test(a) ? 'number' : 'text', topic: q.topic, tag: q.tag || '', prompt, answer: a, accept: typed, unit: q.unit ? strip(q.unit) : undefined, hint, explain, ok });
        } else out.push({ kind: 'mc', topic: q.topic, tag: q.tag || '', prompt, choices, answer, why: whys, hint, explain, ok });
      }
      return { out, why };
    }, { t: { key: t.key, want: t.want, tries: t.tries }, cfg: { ...cfg, topics: undefined, skip: cfg.skip && String(cfg.skip), prep: cfg.prep && String(cfg.prep), variants: cfg.variants && String(cfg.variants) } });
    if (ctx.log !== false && Object.keys(raw.why).length) console.log(`  ${cfg.game}/${t.key}: kept ${raw.out.length}; left out`, JSON.stringify(raw.why));
    raw.out.forEach((r, index) => {
      if (!r.ok) throw new Error(`${t.key}: game checker rejected its own answer for ${r.prompt.replace(/<[^>]+>/g, '').slice(0, 100)}`);
      const it = {
        skill: `${cfg.game}.${t.slug || t.key}`, courses: ['3B'], chapters: null, type: r.kind, prompt: r.prompt,
        choices: r.choices, answer: r.answer, why: r.why, hint: r.hint || undefined, explain: r.explain || undefined,
        origin: 'original', from: { game: cfg.game, list: `sample:${t.key}`, index },
      };
      if (r.kind === 'text') { it.caseSensitive = false; if (r.accept && r.accept.length) it.accept = [...new Set(r.accept)]; }
      if (r.unit) it.unit = r.unit;
      it.chapters = typeof t.ch === 'function' ? t.ch(it, r) : t.ch;
      if (!it.chapters || !it.chapters.length) throw new Error(`${t.key}: no chapters for ${r.prompt.replace(/<[^>]+>/g, '').slice(0, 80)}`);
      items.push(it);
    });
  }
  return items;
}

const plainText = s => String(s == null ? '' : s).replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
module.exports = { loadFBX, installInliner, mirrorFamily, reposDirOf, plainText };
