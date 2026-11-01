import { writeFile } from 'node:fs/promises';
import { CREATURE_PACK } from '../../src/creature-packs/wildlife.mjs';

const kinds = Object.keys(CREATURE_PACK.subjects);
const dirs = Array.from({ length: 8 }, (_, i) => ['S','SW','W','NW','N','NE','E','SE'][i]);
const cellW = 76, cellH = 90, pad = 12, titleH = 22;
const width = pad * 2 + dirs.length * cellW;
const height = pad + kinds.length * (cellH + titleH + 8);
const rects = [];
for (let row = 0; row < kinds.length; row++) {
  const kind = kinds[row], subject = CREATURE_PACK.subjects[kind], model = subject.defaults();
  for (let facing = 0; facing < 8; facing++) {
    const pixels = [];
    const ctx = { fillStyle: '#000', save(){}, restore(){}, scale(){}, fillRect(x,y,w,h) { pixels.push([this.fillStyle,x,y,w,h]); } };
    const angle = facing * Math.PI / 4;
    subject.draw(ctx,{x:0,y:0,faceX:Math.sin(angle),faceY:-Math.cos(angle),state:'idle',moving:false,id:1},0,model);
    const minX = Math.min(...pixels.map(p=>p[1])), maxX = Math.max(...pixels.map(p=>p[1]+p[3]));
    const minY = Math.min(...pixels.map(p=>p[2])), maxY = Math.max(...pixels.map(p=>p[2]+p[4]));
    const scale = Math.min(3, (cellW-18)/Math.max(1,maxX-minX), (cellH-26)/Math.max(1,maxY-minY));
    const ox = pad + facing*cellW + (cellW-(maxX-minX)*scale)/2 - minX*scale;
    const oy = pad + row*(cellH+titleH+8) + titleH + (cellH-(maxY-minY)*scale)/2 - minY*scale;
    rects.push(`<g transform="translate(${ox} ${oy}) scale(${scale})">${pixels.map(([color,x,y,w,h])=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${color}"/>`).join('')}</g>`);
    if (row===0) rects.push(`<text x="${pad+facing*cellW+cellW/2}" y="${pad+12}" text-anchor="middle" class="dir">${dirs[facing]}</text>`);
  }
  const y = pad + row*(cellH+titleH+8) + titleH - 5;
  rects.push(`<text x="${pad}" y="${y}" class="label">${subject.name}</text>`);
}
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"><rect width="100%" height="100%" fill="#102d24"/><style>text{font:11px system-ui;fill:#e3d2a5}.label{font-weight:600}.dir{font-size:10px;fill:#9ed6b8}</style>${rects.join('')}</svg>`;
const out = new URL('./wildlife-contact-sheet.svg', import.meta.url);
await writeFile(out, svg, 'utf8');
console.log(`Wrote ${out.pathname} (${kinds.length} creatures × 8 facings)`);
