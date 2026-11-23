import {waterAt} from './environment.mjs';
import {drawWaterSurface} from './water-surface.mjs';
import {clipRiverTile,drawDepthCorners} from './river-edges.mjs';
import {drawForestBankBase,drawForestBankFlow} from './forest-art.mjs';
// One native-resolution atlas per bounded forest, shared by every camera.
// Four-pixel gutters retain bank overhangs and the original tile/depth order.
const layers=new WeakMap(),wet=new Set(['water','shallow','bridge','floodbridge']);
export function forestWaterLayer(g,bounds=null){
 const key=[g.seed,g.weather?.type||'',g.phase,!!g.house?.pools,g.terrain.join(',')].join(':');let layer=layers.get(g);
 if(!layer||layer.key!==key){const tiles=new Map();for(let i=0;i<2500;i++){const kind=waterAt(g,i%50*32+16,Math.floor(i/50)*32+16);if(wet.has(kind))tiles.set(i,{index:tiles.size,kind});}const columns=Math.max(1,Math.ceil(Math.sqrt(tiles.size))),canvas=document.createElement('canvas');canvas.width=columns*40;canvas.height=Math.max(1,Math.ceil(tiles.size/columns))*40;for(const slot of tiles.values()){slot.x=slot.index%columns*40;slot.y=Math.floor(slot.index/columns)*40;}const banks=document.createElement('canvas');banks.width=canvas.width;banks.height=canvas.height;const b=banks.getContext('2d');
 layer={key,canvas,banks,tiles,frame:-1};layers.set(g,layer);}
 const frame=Math.floor((g.time||0)*30);
 const c=layer.canvas.getContext('2d');c.imageSmoothingEnabled=false;let visible=layer.tiles;
 if(bounds){visible=[];for(let y=Math.max(0,bounds.sy);y<Math.min(50,bounds.ey);y++)for(let x=Math.max(0,bounds.sx);x<Math.min(50,bounds.ex);x++){const index=y*50+x,slot=layer.tiles.get(index);if(slot)visible.push([index,slot]);}}
 layer.updatedTiles=0;
 for(const [index,slot]of visible){if(slot.frame===frame)continue;const x=index%50*32,y=Math.floor(index/50)*32,kind=slot.kind;
 if(!slot.bankReady){const b=layer.banks.getContext('2d');b.save();b.beginPath();b.rect(slot.x,slot.y,40,40);b.clip();b.translate(slot.x+4-x,slot.y+4-y);if(kind==='shallow')clipRiverTile(b,g,x,y);if(kind==='water')drawDepthCorners(b,g,x,y);drawForestBankBase(b,g,x,y,kind);b.restore();slot.bankReady=true;}
 c.clearRect(slot.x,slot.y,40,40);c.save();c.beginPath();c.rect(slot.x,slot.y,40,40);c.clip();c.translate(slot.x+4-x,slot.y+4-y);if(kind==='shallow')clipRiverTile(c,g,x,y);drawWaterSurface(c,g,x,y,32,32);c.drawImage(layer.banks,slot.x,slot.y,40,40,x-4,y-4,40,40);drawForestBankFlow(c,g,x,y,kind);c.restore();slot.frame=frame;layer.updatedTiles++;}
 layer.frame=frame;return layer;
}
