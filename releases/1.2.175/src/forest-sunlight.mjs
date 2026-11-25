import {forestNoise} from './forest-landscape.mjs';
// Broad, world-anchored pools of warm light. Small reusable tiles keep the
// pixel grid intact; neither camera motion nor animation rebuilds the texture.
const tiles=new Map(),forestColors=[[255,226,156,41],[255,226,156,18],[36,79,70,26]],marshColors=[[226,226,165,41],[196,212,141,18],[23,78,73,26]];
export function drawForestSunlight(c,g,{left,top,right,bottom},strength){
 if(!['forest','swamp'].includes(g.generatedEnvironment)||strength<=0)return;
 const marsh=g.generatedEnvironment==='swamp';
 c.save();c.globalAlpha=strength;c.imageSmoothingEnabled=false;
 for(let cy=Math.floor(top/512);cy<=Math.floor(bottom/512);cy++)for(let cx=Math.floor(left/512);cx<=Math.floor(right/512);cx++){
  const key=[g.generatedEnvironment,g.seed,cx,cy].join(':');let tile=tiles.get(key);
  if(!tile){tile=document.createElement('canvas');tile.width=tile.height=64;const p=tile.getContext('2d');
   const image=p.createImageData(64,64),pixels=image.data;
   for(let y=0;y<64;y++)for(let x=0;x<64;x++){
    const n=forestNoise((cx*512+x*8)/330,(cy*512+y*8)/330,(g.seed||0)+151),at=(y*64+x)*4;
    const color=marsh?(n>.65?marshColors[0]:n>.55?marshColors[1]:n<.35?marshColors[2]:null):(n>.61?forestColors[0]:n>.51?forestColors[1]:n<.36?forestColors[2]:null);
    if(color)pixels.set(color,at);
   }
   p.putImageData(image,0,0);
   if(tiles.size>=1024)tiles.delete(tiles.keys().next().value);tiles.set(key,tile);
  }
  c.drawImage(tile,cx*512,cy*512,512,512);
 }
 c.restore();
}
