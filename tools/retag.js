// One-off / repeatable: re-tag the chapters of every bank item with tools/refine3b.js and rebuild index.json.
// (build.js does the same on every full rebuild; run this when only the tagging rules changed.)
const fs = require('fs'), path = require('path');
const { refine } = require('./refine3b');
const OUT = path.join(__dirname, '..');
const index = { updated: new Date().toISOString().slice(0, 10), banks: {}, chapters: {}, skills: {} };
let changed = 0;
for (const f of fs.readdirSync(path.join(OUT, 'bank')).filter(f => f.endsWith('.json')).sort()) {
  const file = f.replace(/\.json$/, ''), items = JSON.parse(fs.readFileSync(path.join(OUT, 'bank', f), 'utf8'));
  for (const it of items) { const n = refine(it); if (n.join() !== it.chapters.join()) { it.chapters = n; changed++; } }
  fs.writeFileSync(path.join(OUT, 'bank', f), JSON.stringify(items, null, 1));
  index.banks[file] = items.length;
  for (const it of items) {
    index.skills[it.skill] = (index.skills[it.skill] || 0) + 1;
    for (const ch of it.chapters) (index.chapters[ch] = index.chapters[ch] || {})[file] = (index.chapters[ch][file] || 0) + 1;
  }
}
fs.writeFileSync(path.join(OUT, 'index.json'), JSON.stringify(index, null, 1));
console.log('retagged', changed, 'items');
