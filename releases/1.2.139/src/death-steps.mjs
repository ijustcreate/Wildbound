import {stat} from './items.mjs';

export const DEATH_STEP_LIMIT=48,DEATH_STEP_LIFE=2.2;
const scenes=new WeakMap();
// Render-local cosmetics also work on network snapshots and never enter saves,
// collision terrain, particle actors, damage, or simulation state.
export function sampleDeathSteps(g,{room=null,time=g.time||0,spacing=10}={}){
 let scene=scenes.get(g);if(!scene){scene={steps:[],positions:new Map()};scenes.set(g,scene);}
 scene.steps=scene.steps.filter(s=>time>=s.time&&time-s.time<DEATH_STEP_LIFE);
 const actors=[...(g.players||[]),...(g.enemies||[]).filter(e=>e.kind==='grim_reaper'&&e.hp>0)];
 for(const p of actors){
  if((p.room||null)!==room)continue;
  const key=String(room)+':'+(p.kind==='grim_reaper'?'queen:'+p.id:p.id),x=room?p.roomX:p.x,y=room?p.roomY:p.y;
  if(!Number.isFinite(x)||!Number.isFinite(y))continue;
  const last=scene.positions.get(key),distance=last?Math.hypot(x-last.x,y-last.y):0;
  const eligible=p.hp>0&&!(p.jumpHeight>2)&&((p.kind==='grim_reaper'&&p.moving)||stat(p,'deathSteps')>0);
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
 if(scene.steps.length>DEATH_STEP_LIMIT)scene.steps.splice(0,scene.steps.length-DEATH_STEP_LIMIT);
 return scene.steps.filter(s=>s.room===room);
}
export function drawDeathSteps(c,g,options={}){
 const time=options.time??g.time??0;
 const steps=sampleDeathSteps(g,{...options,time});
 if(!steps.length)return;
 c.save();
 for(const s of steps){
  c.globalAlpha=Math.min(.65,(1-(time-s.time)/DEATH_STEP_LIFE)*.8);
  const age=time-s.time;
  for(let i=0;i<7;i++){const angle=i*2.4+age*1.4,r=1+age*2+(i%3);c.fillStyle=i%3===0?'#34323e':'#080911';c.fillRect(Math.round(s.x+Math.cos(angle)*r),Math.round(s.y+Math.sin(angle)*r*.45),i%2?2:1,1.5);}

 }
 c.restore();
}
