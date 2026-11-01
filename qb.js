/* ItsDrDan shared question bank — loader for games.
   Add to a game:  <script src="https://itsdrdan.github.io/questionbank/qb.js"></script>
   Then:
     const items = await QB.get({ course: '3A', chapters: ['3A-10'], types: ['mc','number'], n: 10 });
     const ions  = await QB.data('polyatomic-ions');
   Works offline / in a downloaded copy if the game also defines window.QB_FALLBACK = { banks:{...}, data:{...} }
   (a snapshot the build script can paste in). Nothing here sends data anywhere. */
(function () {
  if (window.QB) return;
  var BASE = window.QB_BASE || 'https://itsdrdan.github.io/questionbank/';
  var cache = {};
  function fetchJSON(path) {
    if (!cache[path]) cache[path] = fetch(BASE + path, { cache: 'no-cache' })
      .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
      .catch(function () {
        var fb = window.QB_FALLBACK || {}, m = path.match(/^(bank|data)\/(.+)\.json$/);
        if (m && fb[m[1] === 'bank' ? 'banks' : 'data'] && fb[m[1] === 'bank' ? 'banks' : 'data'][m[2]]) return fb[m[1] === 'bank' ? 'banks' : 'data'][m[2]];
        if (path === 'index.json' && fb.index) return fb.index;
        delete cache[path]; return null;
      });
    return cache[path];
  }
  function shuffle(a) { a = a.slice(); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)), t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  function hasAny(list, wanted) { if (!wanted || !wanted.length) return true; for (var i = 0; i < wanted.length; i++) if (list.indexOf(wanted[i]) >= 0) return true; return false; }

  /* opts: course '3A'|'1A'|'1B'|'3B'; chapters ['3A-10']; skills ['redox.activity-series'] (or prefixes like 'redox.');
     types ['mc','number','text', ...]; banks ['redox'] (default: every bank that covers the chapters);
     exclude [ids]; game 'redox' to leave out that game's own questions; n how many (default all) */
  function get(opts) {
    opts = opts || {};
    return fetchJSON('index.json').then(function (index) {
      if (!index) return [];
      var files = opts.banks || Object.keys(index.banks).filter(function (b) {
        if (!opts.chapters) return true;
        return opts.chapters.some(function (c) { return index.chapters[c] && index.chapters[c][b]; });
      });
      return Promise.all(files.map(function (f) { return fetchJSON('bank/' + f + '.json'); })).then(function (lists) {
        var all = [].concat.apply([], lists.filter(Boolean)), ex = opts.exclude || [];
        var out = all.filter(function (q) {
          if (opts.course && q.courses.indexOf(opts.course) < 0) return false;
          if (!hasAny(q.chapters, opts.chapters)) return false;
          if (opts.types && opts.types.indexOf(q.type) < 0) return false;
          if (opts.game && q.from && q.from.game === opts.game) return false;
          if (ex.indexOf(q.id) >= 0) return false;
          if (opts.skills && !opts.skills.some(function (s) { return q.skill === s || (s.slice(-1) === '.' && q.skill.indexOf(s) === 0); })) return false;
          return true;
        });
        out = shuffle(out);
        return opts.n ? out.slice(0, opts.n) : out;
      });
    });
  }

  /* Simple checker for the shared types (mc, number, text). Games with special types grade those themselves. */
  function check(q, response) {
    var r = String(response == null ? '' : response).trim();
    if (q.type === 'mc' || q.type === 'text') {
      var ok = [q.answer].concat(q.accept || []).map(function (a) { return String(a).trim().toLowerCase(); });
      return ok.indexOf(r.toLowerCase()) >= 0;
    }
    if (q.type === 'number') {
      var x = parseFloat(r.replace(/[×x]\s*10\^?/i, 'e').replace(/\s/g, '')), a = parseFloat(q.answer);
      if (!isFinite(x) || !isFinite(a)) return false;
      return a === 0 ? Math.abs(x) < 1e-9 : Math.abs(x - a) / Math.abs(a) <= (q.tolerance || 0.01);
    }
    return null;
  }

  window.QB = { get: get, check: check, data: function (name) { return fetchJSON('data/' + name + '.json'); }, skills: function () { return fetchJSON('skills.json'); }, index: function () { return fetchJSON('index.json'); }, base: BASE };
})();
