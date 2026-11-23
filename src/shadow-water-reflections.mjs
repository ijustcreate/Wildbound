// The twilight sky is visible only in water, implying an unseen sky overhead.
import {traceShadowWaterTile} from './shadow-ledge-art.mjs';

const skyCache=new Map(),reflectionCache=new Map(),LIMIT=32;
const hash=(x,y)=>{const n=Math.sin(x*127.1+y*311.7)*43758.5453;return n-Math.floor(n);};
const wet=k=>['water','shallow','shadow_void'].includes(k);
export function clipShadowWater(c,{sx,sy,ex,ey},at){
 c.beginPath();let tiles=0;
 for(let y=sy;y<=ey;y++)for(let x=sx;x<=ex;x++){
  if(traceShadowWaterTile(c,x,y,at))tiles++;
 }c.clip();return tiles;
}
function skyTile(cx,cy,seed){
 const key=cx+':'+cy+':'+seed;let canvas=skyCache.get(key);if(canvas)return canvas;
 canvas=document.createElement('canvas');canvas.width=canvas.height=128;const c=canvas.getContext('2d'),image=c.createImageData(128,128);
 for(let y=0;y<128;y++)for(let x=0;x<128;x++){
  const wx=cx*256+x*2,wy=cy*256+y*2,band=wy*.007-wx*.004+Math.sin(wx*.003)*1.3;
  const cloud=Math.pow(Math.max(0,1-Math.abs(Math.sin(band))),3),fold=.5+.5*Math.sin(wx*.019+Math.sin(wy*.012)*3),n=cloud*(.4+fold*.6),i=(y*128+x)*4;
  image.data[i]=18+n*62;image.data[i+1]=19+n*25;image.data[i+2]=43+n*87;image.data[i+3]=255;
 }c.putImageData(image,0,0);c.fillStyle='#cecae7';
 for(let gy=0;gy<16;gy++)for(let gx=0;gx<16;gx++){const h=hash(cx*16+gx+seed,cy*16+gy);if(h<.68)continue;const x=gx*8+Math.floor(h*6),y=gy*8+Math.floor(hash(gy+seed,gx+cx)*6);c.globalAlpha=.35+h*.6;c.fillRect(x,y,1,1);if(h>.985){c.globalAlpha=.3;c.fillRect(x-2,y,5,1);c.fillRect(x,y-2,1,5);}}
 if(skyCache.size>=LIMIT)skyCache.delete(skyCache.keys().next().value);skyCache.set(key,canvas);return canvas;
}
export function drawShadowSkyWater(c,g,bounds,at){
 c.save();const count=clipShadowWater(c,bounds,at);if(!count){c.restore();return 0;}c.imageSmoothingEnabled=false;c.globalAlpha=.86;
 for(let cy=Math.floor(bounds.sy/8);cy<=Math.floor(bounds.ey/8);cy++)for(let cx=Math.floor(bounds.sx/8);cx<=Math.floor(bounds.ex/8);cx++)c.drawImage(skyTile(cx,cy,g.seed||0),cx*256,cy*256,256,256);
 // Broad spiral galaxies sit at stable sky coordinates; the water gently ripples them.
 const ox=Math.floor(bounds.sx/50)*1600,oy=Math.floor(bounds.sy/50)*1600;
 for(let ry=oy;ry<=(bounds.ey+1)*32;ry+=1600)for(let rx=ox;rx<=(bounds.ex+1)*32;rx+=1600)for(const [cx,cy]of [[1240,440],[350,1140]]){
  const x=rx+cx,y=ry+cy;c.save();c.translate(x,y);c.rotate(-.38);c.scale(1,.52);
  for(let arm=0;arm<2;arm++)for(let i=0;i<65;i++){const a=i*.13+arm*Math.PI,r=3+i*.75,px=Math.cos(a)*r,py=Math.sin(a)*r;c.globalAlpha=.06+(1-i/65)*.1;c.fillStyle=i%3?'#aa8ed4':'#d9b4e0';c.fillRect(px-2+Math.sin((g.time||0)*.4+i)*.6,py-2,4,4);}
  c.globalAlpha=.7;c.fillStyle='#e8d1ed';c.fillRect(-3,-2,6,4);c.restore();
 }c.restore();return count;
}
export function drawShadowSceneryReflections(c,g,bounds,at,paintSprite){
 c.save();if(!clipShadowWater(c,bounds,at)){c.restore();return 0;}c.imageSmoothingEnabled=false;let count=0;
 for(const p of (g.scenery||[]).filter(p=>p.realm&&!p.depleted&&!p.fallen&&!p.falling&&!p.distant).sort((a,b)=>(a.rootY??a.y)-(b.rootY??b.y))){
  const y=p.rootY??p.y+p.size*.19;if(p.x<bounds.sx*32-120||p.x>(bounds.ex+1)*32+120||y<bounds.sy*32-240||y>(bounds.ey+1)*32+40)continue;
  const size=p.size||64;if(![0,32,64,96].some(dy=>[-32,0,32].some(dx=>wet(at(Math.floor((p.x+dx)/32),Math.floor((y+dy)/32))))))continue;
  if(count>=32)break;const source=g.spriteLibrary?.[p.kind],key=p.kind;let entry=reflectionCache.get(key);
  if(!entry||entry.source!==source){const canvas=document.createElement('canvas');canvas.width=canvas.height=128;paintSprite(canvas.getContext('2d'),p.kind,64,124,128,g.spriteLibrary);entry={canvas,source};if(reflectionCache.size>=LIMIT)reflectionCache.delete(reflectionCache.keys().next().value);reflectionCache.set(key,entry);}
  c.save();c.translate(p.x,y+3);c.scale(1,-.64);c.globalAlpha=.42;
  // Horizontal strip offsets distort the actual tree/prop artwork, not a generic shadow.
  for(let row=0;row<128;row+=8){const shift=Math.sin((g.time||0)*1.3+(y+(124-row)*size/128)*.08)*2;c.drawImage(entry.canvas,0,row,128,8,-size/2+shift,(row-124)*size/128,size,8*size/128);}
  c.restore();count++;
 }c.restore();return count;
}
export function shadowWaterCacheStats(){return {sky:skyCache.size,reflections:reflectionCache.size,limit:LIMIT};}
