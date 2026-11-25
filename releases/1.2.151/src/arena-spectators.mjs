import {ARENA_SEATING,arenaFighter} from './diagon-arena-layout.mjs';
import {facingIndex} from './player-motion.mjs';
import {drawPitchSpectator} from './quidditch-spectators.mjs';

const trackers=new WeakMap();
const withinView=(p,b)=>p.x+12>=b.left&&p.x-12<=b.right&&p.y+3>=b.top&&p.y-29<=b.bottom;

function seatsOn(bench,bounds){
 const xAxis=bench.axis==='x',size=xAxis?bench.w:bench.h,step=size/(bench.seats+1);
 const points=[];
 for(let i=0;i<bench.seats;i++){
  const offset=step*(i+1)-size/2;
  const p={x:bench.x+(xAxis?offset:0),y:bench.y+(xAxis?0:offset),i};
  if(withinView(p,bounds))points.push(p);
 }
 return points;
}

function closestFighter(bench,fighters,stats){
 let closest=null,distance=Infinity;
 for(const p of fighters){
  stats.comparisons++;
  const d=(p.x-bench.x)**2+(p.y-bench.y)**2;
  if(d<distance){closest=p;distance=d;}
 }
 return closest;
}

function nearbyAction(events,now,bench){
 for(let i=events.length-1;i>=0;i--){
  const event=events[i],age=now-event.at;
  if(age>1.2)break;
  if((event.x-bench.x)**2+(event.y-bench.y)**2<315**2)return {event,age};
 }
 return null;
}

export function drawArenaSpectators(renderer,g,bounds,queue=null){
 const arena=g.trainTest?.arena;
 const stats={benches:0,painted:0,samples:0,comparisons:0,cheering:0};
 renderer.arenaSpectatorStats=stats;
 if(!arena)return;
 let tracker=trackers.get(renderer);
 if(!tracker||tracker.arena!==arena){tracker={arena,benches:new Map()};trackers.set(renderer,tracker);}
 let fighters;
 for(const [index,bench] of ARENA_SEATING.entries()){
  if(bench.x+bench.w/2+12<bounds.left||bench.x-bench.w/2-12>bounds.right||
   bench.y+bench.h/2+3<bounds.top||bench.y-bench.h/2-29>bounds.bottom)continue;
  const seats=seatsOn(bench,bounds);
  if(!seats.length)continue;
  stats.benches++;
  fighters??=g.players.filter(p=>arenaFighter(g,p)&&withinView({x:p.x,y:p.y-(p.jumpHeight||0)},bounds));
  const bucket=Math.floor((g.time+index*.11)/.48);
  let view=tracker.benches.get(bench.id);
  if(!view||view.bucket!==bucket||(view.target!=null?!fighters.some(p=>p.id===view.target):fighters.length>0)){
   const fighter=closestFighter(bench,fighters,stats);
   stats.samples++;
   view={bucket,target:fighter?.id??null,direction:fighter?facingIndex(fighter.x-bench.x,fighter.y-(fighter.jumpHeight||0)-bench.y):bench.face};
   tracker.benches.set(bench.id,view);
  }
  const action=nearbyAction(arena.combatEvents||[],g.time,bench);
  for(const seat of seats){
   const seed=seat.i*3+index*5,delay=.09+(seed%5)*.045;
   const cheering=!!action&&(seed+action.event.id)%5<(action.event.kind==='knockout'?3:2)&&action.age>=delay&&action.age<=delay+.56;
   const paint=()=>drawPitchSpectator(renderer.ctx,seat.x,seat.y-(cheering?2:0),view.direction,seed%6,index===1?'violet':'gold',cheering);
   stats.painted++;if(cheering)stats.cheering++;
   if(queue)queue.push({depth:seat.y,paint});else paint();
  }
 }
}
