// Bundles tools/whys/*.js into whys.js for the browser (served at itsdrdan.github.io/questionbank/whys.js).
// Games load it and call QBWhy.reason(item, picked, ctx) when a student picks a wrong multiple-choice answer:
//   item = { skill, prompt, choices, answer, explain } (HTML or plain text), picked = the chosen choice text,
//   ctx = optional game tables ({ SUG } for carbohydrates, { AA } for aminoacids).
// Run: node tools/build-whys.js   (tools/build.js runs it too)
const fs = require('fs'), path = require('path');
const DIR = path.join(__dirname, 'whys');
const MODS = ['rest', 'quantum', 'thermo', 'lewis', 'elements', 'carbs', 'fg', 'aminoacids'];
let out = '/* QBWhy: per-choice "why" feedback for Dr. Dan\'s study games. Built from questionbank/tools/whys by tools/build-whys.js. Do not edit by hand. */\n(function () {\nconst M = {};\n';
for (const m of MODS) out += `M[${JSON.stringify(m)}] = (function () { const module = { exports: {} }; const exports = module.exports;\n${fs.readFileSync(path.join(DIR, m + '.js'), 'utf8')}\nreturn module.exports; })();\n`;
out += `
const BY = [[/^lewisstructures\\./, 'lewis'], [/^elements\\./, 'elements'], [/^carbohydrates\\./, 'carbs', 'SUG'], [/^functionalgroups\\./, 'fg'], [/^aminoacids\\./, 'aminoacids', 'AA'], [/^quantum\\./, 'quantum'], [/^thermochemistry\\./, 'thermo']];
const plain = x => String(x == null ? '' : x).replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\\s+/g, ' ').trim();
function reasons(item, ctx) {
  ctx = ctx || {};
  const it = Object.assign({ skill: '', explain: '' }, item);
  let w;
  for (const [re, mod, need] of BY) if (re.test(it.skill)) { try { w = need ? M[mod](it, ctx[need] || window[need]) : M[mod](it); } catch (e) { w = undefined; } break; }
  if (Array.isArray(w)) it.why = w;
  try { M.rest(it); } catch (e) {}
  return it.why;
}
function reason(item, picked, ctx) {
  const w = reasons(item, ctx); if (!w) return '';
  const p = plain(picked), i = (item.choices || []).findIndex(c => plain(c) === p);
  return i >= 0 ? (w[i] || '') : '';
}
window.QBWhy = { reasons, reason, version: ${JSON.stringify(new Date().toISOString().slice(0, 10))} };
})();
`;
fs.writeFileSync(path.join(__dirname, '..', 'whys.js'), out);
console.log('whys.js', out.length, 'bytes');
