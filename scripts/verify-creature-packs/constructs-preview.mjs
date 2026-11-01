import { writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { CREATURE_PACK } from '../../src/creature-packs/constructs.mjs';

const directions=['S','SW','W','NW','N','NE','E','SE'];
const kinds=Object.keys(CREATURE_PACK.subjects);
const cellW=78,cellH=100,left=22,top=28,rowH=138,width=left+cellW*8+18,height=top+rowH*kinds.length+20;
const esc=s=>String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
const rects=[];
for(let row=0;row<kinds.length;row++){
  const kind=kinds[row],subject=CREATURE_PACK.subjects[kind],model=subject.defaults();
  const y=top+row*rowH;
  rects.push(`<text x="${left}" y="${y-8}" class="name">${esc(subject.name)}  ·  native-authored pixel draft</text>`);
  for(let d=0;d<8;d++){
    const cx=left+d*cellW+cellW/2,cy=y+51,pixels=[];
    const canvas={fillStyle:'#000',fillRect(x,yy,w,h){pixels.push({x:Math.round(x+cx),y:Math.round(yy+cy),w:Math.max(1,Math.ceil(w)),h:Math.max(1,Math.ceil(h)),color:this.fillStyle});}};
    const angle=d*Math.PI/4,actor={kind,x:0,y:0,faceX:-Math.sin(angle),faceY:Math.cos(angle),animationAction:'idle'};
    subject.draw(canvas,actor,0,model);
    for(const p of pixels)rects.push(`<rect x="${p.x}" y="${p.y}" width="${p.w}" height="${p.h}" fill="${esc(p.color)}"/>`);
    rects.push(`<text x="${cx}" y="${y+105}" text-anchor="middle" class="dir">${directions[d]}</text>`);
  }
  rects.push(`<path d="M${left} ${y+rowH-8}H${width-18}" class="rule"/>`);
}
const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
<rect width="100%" height="100%" fill="#102c26"/>
<text x="${left}" y="19" class="title">WILDBOUND · CONSTRUCTS CREATURE PACK · 8-FACING STUDIO PREVIEW</text>
<style>.title{font: bold 12px sans-serif;fill:#d7c596;letter-spacing:.8px}.name{font:bold 13px sans-serif;fill:#e5d7b4}.dir{font:10px sans-serif;fill:#a4b7a7}.rule{stroke:#2c4940;stroke-width:1}</style>
${rects.join('\n')}
</svg>`;
const output=resolve('scripts/verify-creature-packs/constructs-preview.svg');
await writeFile(output,svg,'utf8');
console.log(`Wrote ${output} (${kinds.length} creatures × 8 directions)`);
