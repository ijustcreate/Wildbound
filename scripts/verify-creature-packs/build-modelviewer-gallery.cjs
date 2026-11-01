const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '../..');
const folder = path.join(root, 'test-output/modelviewer-references');
const names = fs.readdirSync(folder).filter(name => /\.png$/i.test(name));
const entries = new Map();
for (const file of names) {
  const match = file.match(/^(\d+)-(.+?)-(front|side|rear3q|rear|opposite-side)(?:-idle|-stand)?\.png$/i);
  if (!match) continue;
  const [, id, slug, angle] = match;
  const key = `${id}-${slug}`;
  if (!entries.has(key)) entries.set(key, { id, slug, views: {} });
  entries.get(key).views[angle] = file;
}
const escape = value => String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
const cards = [...entries.values()].sort((a, b) => Number(a.id) - Number(b.id)).map(entry => {
  const complete = ['front', 'side', 'rear', 'opposite-side'].every(angle => entry.views[angle]);
  const cells = ['front', 'side', 'rear3q', 'rear', 'opposite-side'].map(angle => {
    const image = entry.views[angle];
    return `<figure>${image ? `<a href="${escape(image)}"><img loading="lazy" src="${escape(image)}" alt="${escape(entry.slug)} ${angle}"></a>` : '<div class="missing">Not captured</div>'}<figcaption>${angle}</figcaption></figure>`;
  }).join('');
  return `<article><h2>${escape(entry.slug)} <small>NPC ${escape(entry.id)}</small></h2><p class="status ${complete ? 'complete' : 'partial'}">${complete ? '4-view idle turnaround captured' : `${Object.keys(entry.views).length}-view partial capture`}</p><div class="views">${cells}</div></article>`;
}).join('\n');
const html = `<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Wildbound creature source turnarounds</title><style>
*{box-sizing:border-box}body{margin:0;padding:24px;background:#10271f;color:#eadbb5;font:14px system-ui}h1{margin:0 0 8px}p{color:#b4c5b6}article{max-width:1200px;margin:24px auto;padding:16px;border:1px solid #52685b;border-radius:8px;background:#17352a}article h2{margin:0 0 5px;font-size:18px}small{color:#9eb8a6;font-weight:400}.status{margin:0 0 12px}.complete{color:#7fdfb4}.partial{color:#e4b875}.views{display:grid;grid-template-columns:repeat(5,minmax(130px,1fr));gap:8px}figure{margin:0;background:#263d35;border:1px solid #40584c}img{display:block;width:100%;aspect-ratio:840/550;object-fit:contain;background:#151515}figcaption{padding:4px 7px;color:#c6d4c8}.missing{display:grid;place-items:center;aspect-ratio:840/550;color:#778c80;background:#142820}@media(max-width:760px){.views{grid-template-columns:repeat(2,minmax(120px,1fr))}}
</style><h1>Wildbound creature source turnarounds</h1><p>Original Wowhead modelviewer stills, set to Stand/idle. Each captured angle is saved separately at native screenshot resolution. Partial rows identify any missing angles.</p><p>${entries.size} models indexed · capture status shown per row</p>${cards}`;
const dest = path.join(folder, 'index.html');
fs.writeFileSync(dest, html);
console.log(JSON.stringify({ dest, models: entries.size, screenshots: names.length }));
