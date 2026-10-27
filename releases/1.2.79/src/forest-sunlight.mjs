import {forestNoise} from './forest-landscape.mjs';
// Broad, world-anchored pools of warm light. Small reusable tiles keep the
// pixel grid intact; neither camera motion nor animation rebuilds the texture.
const tiles=new Map();
export function drawForestSunlight(c,g,{left,top,right,bottom},strength){
 if(g.generatedEnvironment!=='forest'||strength<=0)return;
 c.save();c.globalAlpha=strength;c.imageSmoothingEnabled=false;
 for(let cy=Math.floor(top/512);cy<=Math.floor(bottom/512);cy++)for(let cx=Math.floor(left/512);cx<=Math.floor(right/512);cx++){
  const key=[g.seed,cx,cy].join(':');let tile=tiles.get(key);
  if(!tile){tile=document.createElement('canvas');tile.width=tile.height=64;const p=tile.getContext('2d');
   for(let y=0;y<64;y++)for(let x=0;x<64;x++){
    const n=forestNoise((cx*512+x*8)/330,(cy*512+y*8)/330,(g.seed||0)+151);
    p.fillStyle=n>.61?'#ffe29c29':n>.51?'#ffe29c12':n<.36?'#244f461a':'#0000';p.fillRect(x,y,1,1);
   }
   if(tiles.size>=64)tiles.delete(tiles.keys().next().value);tiles.set(key,tile);
  }
  c.drawImage(tile,cx*512,cy*512,512,512);
 }
 c.restore();
}
