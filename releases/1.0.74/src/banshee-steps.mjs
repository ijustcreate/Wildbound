import {stat} from './items.mjs';

export const BANSHEE_STEP_LIMIT=48,BANSHEE_STEP_LIFE=2.2;
const scenes=new WeakMap();
// Render-local cosmetics also work on network snapshots and never enter saves,
// collision terrain, particle actors, damage, or simulation state.
export function sampleBansheeSteps(g,{room=null,time=g.time||0,spacing=10}={}){
 let scene=scenes.get(g);if(!scene){scene={steps:[],positions:new Map()};scenes.set(g,scene);}
 scene.steps=scene.steps.filter(s=>time>=s.time&&time-s.time<BANSHEE_STEP_LIFE);
 for(const p of g.players||[]){
  if((p.room||null)!==room)continue;
  const key=String(room)+':'+p.id,x=room?p.roomX:p.x,y=room?p.roomY:p.y;
  if(!Number.isFinite(x)||!Number.isFinite(y))continue;
  const last=scene.positions.get(key),distance=last?Math.hypot(x-last.x,y-last.y):0;
  const eligible=p.hp>0&&!(p.jumpHeight>2)&&stat(p,'icySteps')>0;
  const current={x,y,time,remainder:eligible&&last?.eligible?last.remainder:0,side:last?.side||1,eligible};
  if(eligible&&last?.eligible&&distance>0&&distance<80&&time-last.time<.5){
   const dx=(x-last.x)/distance,dy=(y-last.y)/distance;
   let along=spacing-current.remainder,emitted=0;
   while(along<=distance&&emitted++<8){
    scene.steps.push({x:last.x+dx*along-dy*current.side*2,y:last.y+dy*along+dx*current.side*2-(p.groundHeight||0),dx,dy,time,room,owner:p.id});
    current.side=-current.side;along+=spacing;
   }
   current.remainder=(current.remainder+distance)%spacing;
  }
  scene.positions.set(key,current);
 }
 for(const [key,p]of scene.positions)if(time<p.time||time-p.time>3)scene.positions.delete(key);
 while(scene.positions.size>48)scene.positions.delete(scene.positions.keys().next().value);
 if(scene.steps.length>BANSHEE_STEP_LIMIT)scene.steps.splice(0,scene.steps.length-BANSHEE_STEP_LIMIT);
 return scene.steps.filter(s=>s.room===room);
}
export function drawBansheeSteps(c,g,options={}){
 const time=options.time??g.time??0;
 const steps=sampleBansheeSteps(g,{...options,time});
 if(!steps.length)return;
 c.save();
 for(const s of steps){
  c.globalAlpha=Math.min(.65,(1-(time-s.time)/BANSHEE_STEP_LIFE)*.8);
  const r=(across,along,w,color)=>{c.fillStyle=color;c.fillRect(Math.round(s.x-s.dy*across+s.dx*along),Math.round(s.y+s.dx*across+s.dy*along),w,1);};
  for(let n=-2;n<=2;n++)r(-1,n,3,'#79bdd9');
  r(0,-2,1,'#e0ffff');r(0,0,1,'#c6f4ff');r(0,2,1,'#b4efff');
  r(-3,0,1,'#a3e0f2');r(3,0,1,'#a3e0f2');
 }
 c.restore();
}
