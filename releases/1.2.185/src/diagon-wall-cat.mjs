import {NOCTURNE_CONNECTOR_WALL} from './diagon-wayfinding.mjs';

const {start,end,baseY,capY}=NOCTURNE_CONNECTOR_WALL;
const stops=[start+110,start+252,start+436,end-62,start+523,start+315];
const rests=[5.8,7.4,4.6,8.5,5.2,6.4];
const pace=35;
const ease=t=>t*t*(3-2*t);
let duration=0;
const legs=stops.map((from,i)=>{
 const to=stops[(i+1)%stops.length],walk=Math.abs(to-from)/pace,rest=rests[i],at=duration;
 duration+=walk+rest;
 return {from,to,walk,rest,at,end:duration};
});

export function nocturneWallCat(time=0){
 const clock=((time%duration)+duration)%duration;
 const leg=legs.find(({end})=>clock<end);
 const phase=clock-leg.at;
 const moving=phase<leg.walk;
 const restAge=phase-leg.walk;
 return {id:'nocturne-wall-cat',kind:'graveyard_cat',catCoat:'ginger-tabby',hp:20,
  x:leg.from+(leg.to-leg.from)*Math.min(1,phase/leg.walk),y:capY,
  faceX:Math.sign(leg.to-leg.from),faceY:0,moving,idle:moving?'walk':'sleep',
  ...(moving?{}:{restBlend:ease(Math.max(0,Math.min(1,restAge/.55,(leg.rest-restAge)/.43))),playerFrame:Math.max(0,restAge-.5)*8%24})};
}

export function queueNocturneWallCat(c,time,visible,objects){
 const cat=nocturneWallCat(time);
 if(!visible(cat.x,cat.y,36,42))return;
 objects.push({depth:baseY+.1,player:cat,size:34,paint:()=>{
  const x=Math.round(cat.x),y=Math.round(cat.y);
  c.fillStyle='#22262b45';
  c.fillRect(x-12,y-2,22,4);
  c.fillRect(x-9,y-3,17,6);
 }});
}
