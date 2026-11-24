import {GARDEN_BENCHES,GARDEN_PATHS} from './diagon-garden-layout.mjs';
import {activeGardenBench} from './diagon-garden-benches.mjs';

const cats=[
 {coat:'calico',seed:58,stops:[[7468,4012],[7414,3982],[7345,3985],[7295,4019]]},
 {coat:'silver-tabby',seed:18,stops:[[7454,4164],[7412,4185],[7350,4180],[7302,4150]]},
 {coat:'black',seed:7,stops:[[7487,4027],[7497,4054],[7483,4107],[7470,4150]]},
 {coat:'seal-point',seed:93,stops:[[7350,3867],[7380,3898],[7403,3937],[7415,3965]]},
];
const nocturneCat={id:'nocturne-black-cat',coat:'black',seed:107,
 stops:[[8982,5257],[9057,5243],[9118,5219],[9143,5138],[9134,5056],[9094,5107],[9097,5189],[9040,5211]]};
export const NOCTURNE_RAT_HOLES=[{x:9207,y:5026,side:1},{x:8978,y:5060,side:-1},
 {x:9207,y:5370,side:1},{x:8978,y:5358,side:-1},{x:9207,y:4810,side:1}];
const nocturneCats=new WeakMap();
const scenes=new WeakMap(),RADIUS=4,SPEED=39,MAX_VISITORS=2;
const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
const point=([x,y])=>({x,y});
const pace=index=>6.8+index*.6;
const between=(from,to,amount)=>from+(to-from)*amount;

function wanderingCat(info,index,time,offset){
 const period=pace(index),clock=time+index*5.8+offset,cycle=period*info.stops.length;
 const phase=((clock%cycle)+cycle)%cycle,segment=Math.floor(phase/period);
 const [x,y]=info.stops[segment],[toX,toY]=info.stops[(segment+1)%info.stops.length];
 const fraction=Math.min(1,(phase-segment*period)/(period-2.7)),moving=fraction<1;
 return {id:info.id||'diagon-garden-cat-'+index,catCoat:info.coat,catCoatSeed:info.seed,kind:'graveyard_cat',hp:20,
  x:between(x,toX,fraction),y:between(y,toY,fraction),faceX:toX-x,faceY:toY-y,
  moving,idle:moving?'walk':segment%2?'sleep':'sit'};
}

export function gardenCatsFor(g){
 const scene=scenes.get(g.trainTest),time=g.time||0;
 return cats.map((cat,index)=>scene?.visits.get(index)?.actor||wanderingCat(cat,index,time,scene?.offsets[index]||0));
}
export function nocturneCatFor(g){
 if(g.trainTest?.design.activeRoom!=='diagon')return null;
 return nocturneCats.get(g.trainTest)?.actor||wanderingCat(nocturneCat,0,g.time||0,0);
}

export function clearGardenCats(g){scenes.delete(g.trainTest);}

const paths=new Map();
function pathNode(coords){
 const key=coords.join(',');
 if(!paths.has(key))paths.set(key,{...point(coords),neighbors:new Set()});
 return paths.get(key);
}
function connect(a,b){a.neighbors.add(b);b.neighbors.add(a);}

for(const path of GARDEN_PATHS){
 let previous;
 for(const coords of path.points){
  const node=pathNode(coords);
  if(previous)connect(previous,node);
  previous=node;
 }
}
// Use each bench's corners to reach the seated side around its solid back.
for(const bench of GARDEN_BENCHES)for(const side of [-1,1])for(const depth of [-14,14]){
 const corner=pathNode([bench.x+side*(bench.w+5),bench.y+depth]);
 for(const node of paths.values())if(node!==corner&&distance(node,corner)<112)connect(node,corner);
}

function clearSegment(from,to,blocked){
 const samples=Math.ceil(distance(from,to)/7);
 for(let i=1;i<=samples;i++)if(blocked(between(from.x,to.x,i/samples),between(from.y,to.y,i/samples),RADIUS))return false;
 return !blocked(to.x,to.y,RADIUS);
}

function moveNocturneAnimal(actor,point,speed,dt,blocked,radius){
 const dx=point.x-actor.x,dy=point.y-actor.y,distance=Math.hypot(dx,dy);
 actor.moving=false;
 if(distance<.5)return true;
 const length=Math.min(distance,speed*dt),x=actor.x+dx/distance*length,y=actor.y+dy/distance*length;
 if(!blocked(x,y,radius)){actor.x=x;actor.y=y;}
 else if(Math.abs(dx)>.3&&!blocked(x,actor.y,radius))actor.x=x;
 else if(Math.abs(dy)>.3&&!blocked(actor.x,y,radius))actor.y=y;
 else return false;
 actor.faceX=dx/distance;actor.faceY=dy/distance;actor.moving=true;
 actor.step=(actor.step||0)+length*.24;
 return distance<=length+.5;
}

export function tickNocturneCatHunt(g,dt,animals,blocked,onHide){
 const t=g.trainTest;
 let scene=nocturneCats.get(t);
 if(!scene){scene={actor:wanderingCat(nocturneCat,0,g.time||0,0),next:0,watchAt:0};nocturneCats.set(t,scene);}
 const {actor}=scene;
 if(!g.players.some(p=>p.hp>0&&!p.room&&distance(actor,p)<650))return;
 let rat=scene.rat&&animals.get(scene.rat);
 if(!rat&&t.time>=scene.watchAt&&t.time>=(scene.watchUntil||0)){
  scene.watchAt=t.time+.24;
  rat=[...animals.values()].find(a=>a.kind==='gloamwhisker_rat'&&!a.released&&distance(actor,a)<105&&clearSegment(actor,a,blocked));
  if(rat){
   const holes=NOCTURNE_RAT_HOLES.filter(hole=>clearSegment(rat,hole,blocked)).sort((a,b)=>(distance(rat,a)-.5*distance(actor,a))-(distance(rat,b)-.5*distance(actor,b)));
   if(holes.length){scene.rat=rat.id;scene.hole=holes[0];scene.until=t.time+5;}
   else rat=null;
  }
 }
 if(rat&&scene.hole&&t.time<scene.until){
  rat.startled=true;rat.altitude=0;
  const hidden=moveNocturneAnimal(rat,scene.hole,148,dt,blocked,3);
  moveNocturneAnimal(actor,rat,120,dt,blocked,RADIUS);
  actor.idle=actor.moving?'walk':'sit';
  if(hidden){
   onHide(rat,scene.hole);scene.rat=null;scene.hole=null;scene.watchUntil=t.time+1.25;
  }
  return rat.id;
 }
 scene.rat=null;scene.hole=null;
 actor.idle='sit';actor.moving=false;
 if(t.time<(scene.watchUntil||0))return;
 const next=point(nocturneCat.stops[scene.next]);
 if(moveNocturneAnimal(actor,next,43,dt,blocked,RADIUS)){
  scene.next=(scene.next+1)%nocturneCat.stops.length;scene.watchUntil=t.time+.6;
 }else if(!actor.moving){
  const candidate=nocturneCat.stops.map(point).filter(p=>clearSegment(actor,p,blocked)).sort((a,b)=>distance(actor,a)-distance(actor,b))[0];
  if(candidate)scene.next=nocturneCat.stops.findIndex(([x,y])=>x===candidate.x&&y===candidate.y);
 }
 if(actor.moving)actor.idle='walk';
}

function catRoute(from,to,blocked){
 if(clearSegment(from,to,blocked))return [to];
 const open=[],goal=new Set(),costs=new Map();
 for(const node of paths.values()){
  const start=distance(from,node);
  if(start<145&&clearSegment(from,node,blocked)){open.push({node,path:[node],cost:start});costs.set(node,start);}
  if(distance(node,to)<108&&clearSegment(node,to,blocked))goal.add(node);
 }
 while(open.length&&goal.size){
  open.sort((a,b)=>(b.cost+distance(b.node,to))-(a.cost+distance(a.node,to)));
  const {node,path,cost}=open.pop();
  if(cost!==costs.get(node))continue;
  if(goal.has(node))return [...path,to];
  for(const next of node.neighbors){
   const step=cost+distance(node,next);
   if(step>=(costs.get(next)??Infinity)||!clearSegment(node,next,blocked))continue;
   costs.set(next,step);open.push({node:next,path:[...path,next],cost:step});
  }
 }
 return null;
}

function lookAt(actor,target){
 const span=distance(actor,target);
 if(span>.01){actor.faceX=(target.x-actor.x)/span;actor.faceY=(target.y-actor.y)/span;}
}

function walk(visit,dt){
 const {actor,route}=visit;
 let remaining=SPEED*dt;
 while(route.length&&remaining>0){
  const next=route[0],span=distance(actor,next);
  lookAt(actor,next);
  if(span<=remaining){actor.x=next.x;actor.y=next.y;route.shift();remaining-=span;}
  else{
   actor.x=between(actor.x,next.x,remaining/span);actor.y=between(actor.y,next.y,remaining/span);remaining=0;
  }
 }
 actor.moving=route.length>0;
 actor.idle=actor.moving?'walk':'sit';
 return !actor.moving;
}

function returnToWander(scene,index,visit,time,blocked){
 const options=cats[index].stops.map((coordinates,stop)=>({stop,...point(coordinates)})).sort((a,b)=>distance(visit.actor,a)-distance(visit.actor,b));
 for(const destination of options){
  const route=catRoute(visit.actor,destination,blocked);
  if(!route)continue;
  Object.assign(visit,{phase:'returning',stop:destination.stop,route});
  return;
 }
 // Authored garden routes are always reachable from the visit endpoints.
 // If a saved layout changes the blockers, retire this transient visit.
 scene.visits.delete(index);
}

function beginVisit(scene,request,bench,player,time,blocked){
 const side=request.seat;
 const targets=[[bench.w+5,20],[bench.w*.74,28],[bench.w+10,31]]
  .map(([x,y])=>({x:bench.x+side*x,y:bench.y+y}))
  .filter(target=>!blocked(target.x,target.y,RADIUS));
 const candidates=cats.map((cat,index)=>({index,actor:wanderingCat(cat,index,time,scene.offsets[index]||0)}))
  .filter(({index,actor})=>!scene.visits.has(index)&&distance(actor,bench)<275&&!blocked(actor.x,actor.y,RADIUS))
  .sort((a,b)=>distance(a.actor,player)-distance(b.actor,player));
 for(const {index,actor} of candidates)for(const target of targets){
  const route=catRoute(actor,target,blocked);
  if(!route)continue;
  Object.assign(actor,{gardenVisit:true,moving:true,idle:'walk'});
  lookAt(actor,route[0]);
  scene.visits.set(index,{actor,route,player:player.id,request,phase:'approaching'});
  return true;
 }
 return false;
}

export function tickGardenCats(g,dt,blocked){
 const world=g.trainTest;
 if(world?.design?.activeRoom!=='diagon'){clearGardenCats(g);return;}
 const seated=g.players.filter(p=>activeGardenBench(g,p));
 let scene=scenes.get(world);
 if(!scene){
  if(!seated.length)return;
  scene={visits:new Map(),requests:new Map(),offsets:[]};scenes.set(world,scene);
 }
 const time=g.time||0,random=()=>g.random?.()??.5;
 const riders=new Map(seated.map(p=>[p.id,p]));
 for(const [id] of scene.requests)if(!riders.has(id))scene.requests.delete(id);
 for(const player of seated){
  const {benchId,seat}=player.gardenBench;
  const request=scene.requests.get(player.id);
  if(!request||request.benchId!==benchId||request.seat!==seat){
   scene.requests.set(player.id,{benchId,seat,nextAt:time+5+random()*7});
  }
 }
 for(const [index,visit] of scene.visits){
  const player=riders.get(visit.player);
  if(visit.phase!=='returning'&&(!player||scene.requests.get(visit.player)!==visit.request||time>=(visit.until??Infinity))){
   returnToWander(scene,index,visit,time,blocked);
   if(!scene.visits.has(index))continue;
  }
  if(visit.phase==='sitting'||!walk(visit,dt))continue;
  if(visit.phase==='returning'){
   scene.offsets[index]=visit.stop*pace(index)-time-index*5.8;
   scene.visits.delete(index);
  }else{
   visit.phase='sitting';visit.until=time+13+random()*10;
   lookAt(visit.actor,player);
  }
 }
 for(const player of seated){
  const request=scene.requests.get(player.id);
  if(time<request.nextAt||scene.visits.size>=MAX_VISITORS||[...scene.visits.values()].some(visit=>visit.player===player.id))continue;
  const bench=GARDEN_BENCHES.find(b=>b.id===request.benchId);
  if(!bench)continue;
  if(random()>.76){request.nextAt=time+20+random()*16;continue;}
  request.nextAt=time+(beginVisit(scene,request,bench,player,time,blocked)?42:5)+random()*6;
 }
}
