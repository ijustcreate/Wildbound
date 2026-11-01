import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { PNG } from 'pngjs';
import { CREATURE_PACK, renderEldritchPreview } from '../../src/creature-packs/eldritch.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const output = path.dirname(fileURLToPath(import.meta.url));
fs.mkdirSync(output, { recursive: true });
const kinds = Object.keys(CREATURE_PACK.subjects);
const cols = 3, cellW = 224, cellH = 116, rows = Math.ceil(kinds.length / cols);
const png = new PNG({ width: cols * cellW, height: rows * cellH });
for (let i = 0; i < png.width * png.height; i++) {
  const j = i * 4; png.data[j] = 14; png.data[j + 1] = 43; png.data[j + 2] = 36; png.data[j + 3] = 255;
}
const colors = new Map();
const rgba = hex => {
  if (!colors.has(hex)) colors.set(hex, hex.match(/[a-f\d]{2}/gi).map(s => parseInt(s, 16)));
  return colors.get(hex);
};
const views = Array.from({ length: 8 }, (_, d) => [Math.sin(d * Math.PI / 4), Math.cos(d * Math.PI / 4)]);
for (let index = 0; index < kinds.length; index++) {
  const kind = kinds[index], ox = (index % cols) * cellW, oy = Math.floor(index / cols) * cellH;
  for (let d = 0; d < 8; d++) {
    const baseX = ox + 24 + (d % 4) * 52, baseY = oy + 28 + Math.floor(d / 4) * 46;
    const c = { _fillStyle: '#000000', get fillStyle() { return this._fillStyle; }, set fillStyle(value) { this._fillStyle = value || '#000000'; }, fillRect(x, y, w, h) {
      const [r,g,b] = rgba(this.fillStyle);
      for (let py = Math.max(oy, Math.floor(baseY + y)); py < Math.min(oy + cellH, Math.floor(baseY + y + h)); py++)
        for (let px = Math.max(ox, Math.floor(baseX + x)); px < Math.min(ox + cellW, Math.floor(baseX + x + w)); px++) {
          const at = (py * png.width + px) * 4; png.data[at] = r; png.data[at+1] = g; png.data[at+2] = b; png.data[at+3] = 255;
        }
    } };
    renderEldritchPreview(c, kind, { kind, faceX: views[d][0], faceY: views[d][1], state: 'idle' }, .2);
  }
}
const pngPath = path.join(output, 'eldritch-eight-facing.png');
const labelsPath = path.join(output, 'eldritch-eight-facing.json');
fs.writeFileSync(pngPath, PNG.sync.write(png));
fs.writeFileSync(labelsPath, JSON.stringify({ title: 'Eldritch creature pack — native Wildbound pixel art', columns: cols, cellSize: [cellW, cellH], facings: ['S','SW','W','NW','N','NE','E','SE'], rows: kinds.map((kind, i) => ({ kind, label: CREATURE_PACK.subjects[kind].name, x: i % cols, y: Math.floor(i / cols) })) }, null, 2));
console.log(`${pngPath}\n${labelsPath}`);
