import {vegetationWind} from './vegetation-motion.mjs';
export const fernAccentVisible=p=>{const n=Math.sin(p.x*127.1+p.y*311.7+(p.seed||0))*43758.5453;return n-Math.floor(n)<.23;};
const fernGroups=new WeakMap();
export function fernAccentGroup(cover){
 let selected=fernGroups.get(cover);if(selected)return selected;
 selected=new Set();const cells=new Map(),span=40;
 for(const p of cover){
  if(p.kind!=='fern'||!fernAccentVisible(p))continue;
  const cx=Math.floor(p.x/span),cy=Math.floor(p.y/span);let crowded=false;
  for(let y=cy-1;y<=cy+1;y++)for(let x=cx-1;x<=cx+1;x++)for(const q of cells.get(x+','+y)||[])if(Math.hypot(p.x-q.x,p.y-q.y)<span)crowded=true;
  if(crowded)continue;
  selected.add(p);const key=cx+','+cy;if(!cells.has(key))cells.set(key,[]);cells.get(key).push(p);
 }
 fernGroups.set(cover,selected);return selected;
}
const sprites=new Map();
export const FERN_SIZE=32;
export function tickFern(p,players,dt){
  let tx=0,ty=0;
  for(const actor of players){
    if(!actor.moving||actor.room||actor.hp<=0||actor.jumpHeight>6)continue;
    const dx=p.x-actor.x,dy=p.y-actor.y;
    if(dx*dx+dy*dy<225){const d=Math.hypot(dx,dy),strength=(1-d/15)*4;tx+=(dx/(d||1)+(actor.faceX||0)*.35)*strength;ty+=(dy/(d||1)+(actor.faceY||0)*.35)*strength;}
  }
  if(!tx&&!ty&&Math.abs(p.fernX||0)+Math.abs(p.fernY||0)+Math.abs(p.fernVX||0)+Math.abs(p.fernVY||0)<.01){
    p.fernX=p.fernY=p.fernVX=p.fernVY=0;return;
  }
  // Damped spring lets the fronds return naturally after the player passes.
  p.fernVX=((p.fernVX||0)+(tx-(p.fernX||0))*65*dt)*Math.exp(-dt*8);
  p.fernVY=((p.fernVY||0)+(ty-(p.fernY||0))*65*dt)*Math.exp(-dt*8);
  p.fernX=Math.max(-13,Math.min(13,(p.fernX||0)+p.fernVX*dt));
  p.fernY=Math.max(-10,Math.min(10,(p.fernY||0)+p.fernVY*dt));
}
export function drawJungleFern(c,p,time=0,windStrength=1){
  // Eight shared, half-size silhouettes: no leaf geometry in the frame loop.
  const variant=Math.abs(Math.floor(p.seed||0))%8;
  let sprite=sprites.get(variant);
  if(!sprite){
    if(typeof document==='undefined')return;
    sprite=document.createElement('canvas');sprite.width=sprite.height=FERN_SIZE;
    const context=sprite.getContext('2d');context.translate(16,24);
    paintFern(context,{x:0,y:0,seed:variant*137});sprites.set(variant,sprite);
  }
  const bend=(p.fernX||0)+vegetationWind(p.x,p.y,time,windStrength)*.8;
  c.save();c.imageSmoothingEnabled=false;
  c.translate(Math.round(p.x),Math.round(p.y));
  c.transform(1,0,-bend/20,1-(p.fernY||0)/40,0,0);
  c.drawImage(sprite,-16,-24);c.restore();
}
function paintFern(c,p){
 const pixel=(x,y,w,h,color)=>{c.fillStyle=color;c.fillRect(Math.round(x),Math.round(y),w,h);};
 const fronds=[[-12,9],[-7,16],[0,21],[7,16],[12,10]];
 for(let i=0;i<fronds.length;i++){
  const [dx,height]=fronds[i];
  // Solid tapered frond masses survive gameplay scale. Tiny detached leaflet
  // dots were the source of the noisy fishbone pattern in overlapping groups.
  for(let n=0;n<=height;n+=2){
   const t=n/height,x=dx*t,leaf=Math.max(1,Math.round(3*Math.sin(t*Math.PI)));
   pixel(x-leaf,-n,leaf*2+1,3,'#315338');
  }
  for(let n=2;n<height-1;n+=2){
   const t=n/height,x=dx*t,leaf=Math.max(1,Math.round(3*Math.sin(t*Math.PI))-1);
   pixel(x-leaf,-n,leaf*2,3,'#527444');
  }
  if(i===1||i===2)pixel(dx*.65-1,-height*.65,2,4,'#78904d');
 }
 pixel(-2,-1,4,2,'#466d3b');
}
