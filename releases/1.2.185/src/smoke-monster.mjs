import {defeatTrialMember} from './expedition-trials.mjs';

export const SMOKE_MONSTER_KIND = 'smoke_monster';
export const SMOKE_MONSTER_NAME = 'Cinder Wraith';
export const SMOKE_MONSTER_FORMATION = 3.65;

const LIMBS = [
  {angle:-1.05,reach:67,lift:13,unfold:.48},
  {angle:1.02,reach:73,lift:9,unfold:1.04},
  {angle:-2.02,reach:86,lift:17,unfold:1.36},
  {angle:2.15,reach:88,lift:12,unfold:1.62},
  {angle:-2.86,reach:97,lift:9,unfold:1.9},
  {angle:2.83,reach:106,lift:19,unfold:2.19},
];
const CORE_RADIUS = 7;
const WISP_RADIUS = 5;
const LINK_RADIUS = 3;
const FOLD_CLEARANCE = 7;
const BREAK_TIME = .52;
const PATH_STEP = 12;
const routes = new WeakMap();
const clearance = new WeakMap();
const distance = (a,b) => Math.hypot(a.x-b.x,a.y-b.y);
const clamp01 = n => Math.max(0,Math.min(1,n));
const lerp = (a,b,t) => a+(b-a)*t;

function blocked(g,from,x,y,radius){
  return g.blocked(x,y,radius,false,false,false,0,0,false,from);
}

function traceBlocked(g,from,x,y,radius){
  const design=g.trainTest?.design;
  if(!design?.wildLands||design.activeRoom||Math.max(x,from.x)>=15500)return blocked(g,from,x,y,radius);
  let cache=clearance.get(g);
  if(!cache||cache.design!==design){cache={design,points:new Map()};clearance.set(g,cache);}
  const cx=Math.round(x/8)*8,cy=Math.round(y/8)*8;
  const key=cx*32768+cy;
  let sample=cache.points.get(key);
  if(!sample||sample.expires<g.time){
    if(cache.points.size>=7000)cache.points.delete(cache.points.keys().next().value);
    sample={covered:blocked(g,from,cx,cy,CORE_RADIUS+6),expires:g.time+.45};
    cache.points.set(key,sample);
  }
  // The broad check reuses empty patches of woodland. Near cover, ask the
  // exact blocker so the wraith can still squeeze into a genuine opening.
  return sample.covered&&blocked(g,from,x,y,radius);
}

// Sample the same world collision used by explorers, including closed doors.
function clearPath(g,from,to,radius,exact=false,stride=exact?4:7){
  const sample=exact?blocked:traceBlocked;
  const steps=Math.ceil(distance(from,to)/stride);
  for(let i=1;i<=steps;i++){
    const t=i/steps;
    if(sample(g,from,lerp(from.x,to.x,t),lerp(from.y,to.y,t),radius))return false;
  }
  return true;
}

function stepToward(from,to,budget){
  const length=distance(from,to);
  const t=length?Math.min(1,budget/length):0;
  return {x:lerp(from.x,to.x,t),y:lerp(from.y,to.y,t)};
}

// The ordinary 32px navigation lattice can miss an open narrow doorway. This
// local lattice validates the whole edge at the wraith's compressed footprint.
const SEARCH_HALF = 38;
const SEARCH_SIDE = SEARCH_HALF*2+1;
const SEARCH_START = SEARCH_HALF*SEARCH_SIDE+SEARCH_HALF;
const NEIGHBORS = [[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]];

function startSearch(from,target){
  return {from:{x:from.x,y:from.y},goal:stepToward(from,target,PATH_STEP*(SEARCH_HALF-4)),
    frontier:[SEARCH_START],visited:new Set(),parents:new Map(),costs:new Map([[SEARCH_START,0]]),closest:SEARCH_START};
}

function searchPath(g,search){
  const {from,goal,frontier,visited,parents,costs}=search;
  const point=id=>({x:from.x+(id%SEARCH_SIDE-SEARCH_HALF)*PATH_STEP,y:from.y+(Math.floor(id/SEARCH_SIDE)-SEARCH_HALF)*PATH_STEP});
  const heuristic=id=>distance(point(id),goal);
  const rank=id=>costs.get(id)+heuristic(id)*1.16;
  let done=false;
  for(let iter=0;frontier.length&&iter<24&&visited.size<780;iter++){
    let best=0;
    for(let i=1;i<frontier.length;i++)if(rank(frontier[i])<rank(frontier[best]))best=i;
    const [id]=frontier.splice(best,1);
    if(visited.has(id))continue;
    visited.add(id);
    const remaining=heuristic(id),position=point(id);
    if(remaining<heuristic(search.closest))search.closest=id;
    if(remaining<=PATH_STEP&&clearPath(g,position,goal,CORE_RADIUS,false,4)){search.closest=id;done=true;break;}
    const x=id%SEARCH_SIDE,y=Math.floor(id/SEARCH_SIDE);
    for(const [dx,dy] of NEIGHBORS){
      if(x+dx<0||x+dx>=SEARCH_SIDE||y+dy<0||y+dy>=SEARCH_SIDE)continue;
      const next=id+dy*SEARCH_SIDE+dx,cost=costs.get(id)+PATH_STEP*Math.hypot(dx,dy);
      if(visited.has(next)||cost>=(costs.get(next)??Infinity)||!clearPath(g,position,point(next),CORE_RADIUS,false,4))continue;
      parents.set(next,id);costs.set(next,cost);frontier.push(next);
    }
  }
  if(!done&&frontier.length&&visited.size<780)return null;
  const path=[];
  for(let id=search.closest;id!==SEARCH_START;id=parents.get(id))path.push(point(id));
  return path.reverse();
}

function chaseStep(g,core,target,dt){
  if(!target||distance(core,target)<6)return core;
  const lookAhead=stepToward(core,target,67);
  if(clearPath(g,core,lookAhead,CORE_RADIUS,false,4)){
    const next=stepToward(core,target,core.speed*dt);
    if(clearPath(g,core,next,CORE_RADIUS,true)){routes.delete(core);return next;}
  }
  let route=routes.get(core);
  if(!route||!route.search&&(g.time>=route.expires||distance(target,route.target)>34)){
    route={path:route?.path||[],target:{x:target.x,y:target.y},search:startSearch(core,target)};
    routes.set(core,route);
  }
  if(route.search){
    const path=searchPath(g,route.search);
    if(path){route.path=path;route.search=null;route.expires=g.time+.66;}
  }
  while(route.path.length>1&&clearPath(g,core,route.path[1],CORE_RADIUS,false,3))route.path.shift();
  const point=route.path[0];
  if(!point)return core;
  const next=stepToward(core,point,core.speed*dt);
  if(clearPath(g,core,next,CORE_RADIUS,true))return next;
  route.path=[];
  return core;
}

function coreNodes(g,core){
  return g.enemies.filter(e=>e.smokeMonsterCoreId===core.id);
}

function presentParts(core,nodes){
  const scale=core.smokeMonsterScale,growth=core.smokeMonsterGrowth;
  const crown={x:core.x,y:core.y,height:lerp(8,31,growth)*scale};
  core.smokeMonsterHeight=crown.height;
  core.smokeMonsterParts=[{...crown,id:core.id,role:'core',progress:growth,hidden:false,flash:core.flash}];
  for(const node of nodes){
    const limb=LIMBS[node.smokeMonsterSlot],progress=node.smokeMonsterProgress;
    const breakProgress=node.hp>0?0:clamp01((node.deathTimer||0)/BREAK_TIME);
    const end={x:node.x,y:node.y,height:limb.lift*scale*progress};
    node.smokeMonsterHeight=end.height;
    // The links bow above the ground while their footprint follows the safe cord.
    const elbow={x:lerp(crown.x,end.x,.49),y:lerp(crown.y,end.y,.49),height:(limb.lift+18)*scale*progress};
    core.smokeMonsterParts.push({...end,id:node.id,role:'wisp',progress,hidden:progress<=0||breakProgress>=1,
      flash:node.flash,breakProgress,link:node.hp>0?[crown,elbow,end]:null});
  }
}

export function smokeMonsterProjectileHit(target,shot,lift,padding=0){
  if(target.hp<=0||target.unattackable)return false;
  const dy=shot.y-target.y;
  return Math.abs(dy)<target.hitRadius+26&&
    Math.hypot(shot.x-target.x,dy-lift+target.smokeMonsterHeight)<target.hitRadius+padding;
}

export function spawnSmokeMonster(g,{x,y},{source='board'}={}){
  const hp=165+30*Math.min(3,Math.max(0,g.players.filter(p=>p.hp>0&&!p.room).length-1));
  const body={kind:SMOKE_MONSTER_KIND,faction:'enemy',state:'hunt',stationary:true,
    x,y,faceX:0,faceY:1,moving:false,step:0,attack:0,flash:0,unattackable:true,smokeMonsterSource:source};
  const core={...body,id:g.nextId++,name:SMOKE_MONSTER_NAME,smokeMonsterRole:'core',boss:true,hp,maxHp:hp,
    speed:79,damage:18,hitRadius:17,smokeMonsterAge:0,smokeMonsterGrowth:0,smokeMonsterScale:1,smokeMonsterContact:{}};
  const nodes=LIMBS.map((limb,i)=>({...body,id:g.nextId++,name:'Ember Wisp',smokeMonsterRole:'wisp',
    smokeMonsterCoreId:core.id,smokeMonsterSlot:i,smokeMonsterProgress:0,hp:22,maxHp:22,hitRadius:12}));
  g.enemies.push(core,...nodes);
  presentParts(core,nodes);
  return core;
}

function stretchNode(g,core,node,next,dt,squeeze){
  const {angle,reach,unfold}=LIMBS[node.smokeMonsterSlot],age=core.smokeMonsterAge;
  const progress=clamp01((age-unfold)/1.12);
  node.smokeMonsterProgress=progress;
  if(progress===0)return true;
  const phase=age*4+node.smokeMonsterSlot*1.58;
  const facing=Math.atan2(core.faceY,core.faceX)+angle+Math.sin(phase)*.14;
  const span=(reach+Math.sin(phase+.4)*7)*core.smokeMonsterScale*progress*squeeze;
  const spread={x:next.x+Math.cos(facing)*span,y:next.y+Math.sin(facing)*span};
  const extended=stepToward(node,spread,164*dt);
  if(clearPath(g,next,extended,FOLD_CLEARANCE)&&clearPath(g,node,extended,WISP_RADIUS,true)&&
    (next===core||clearPath(g,core,extended,FOLD_CLEARANCE))){
    node.x=extended.x;
    node.y=extended.y;
    return true;
  }
  // Retraction stays on the old cord. Its extra clearance leaves space to
  // pull a wisp around a jamb even when the fully extended cord grazes it.
  const inward=stepToward(node,core,214*dt);
  if(clearPath(g,node,inward,WISP_RADIUS,true)&&clearPath(g,core,inward,WISP_RADIUS)){
    node.x=inward.x;
    node.y=inward.y;
  }
  return next===core||clearPath(g,next,node,FOLD_CLEARANCE);
}

function closestOnLink(position,a,b){
  const x=b.x-a.x,y=b.y-a.y,length=x*x+y*y;
  const t=length?clamp01(((position.x-a.x)*x+(position.y-a.y)*y)/length):0;
  return {x:lerp(a.x,b.x,t),y:lerp(a.y,b.y,t)};
}

function damageThroughSmoke(g,core,players){
  for(const player of players){
    if((player.jumpHeight||0)>24||core.smokeMonsterContact[player.id]>g.time)continue;
    let origin=null;
    if(distance(core,player)<20*core.smokeMonsterScale+5&&clearPath(g,player,core,LINK_RADIUS,true))origin=core;
    if(!origin)for(const part of core.smokeMonsterParts){
      if(!part.link||part.hidden||part.breakProgress)continue;
      for(let i=1;i<part.link.length;i++){
        const point=closestOnLink(player,part.link[i-1],part.link[i]);
        if(distance(point,player)<11&&clearPath(g,player,point,LINK_RADIUS,true)){origin=point;break;}
      }
      if(origin)break;
    }
    if(!origin)continue;
    core.smokeMonsterContact[player.id]=g.time+.78;
    g.hurt(player,core.damage,{x:origin.x,y:origin.y,kind:core.kind,hostile:true});
  }
}

export function tickSmokeMonster(g,actor,dt){
  actor.flash=Math.max(0,(actor.flash||0)-dt);
  if(actor.smokeMonsterRole!=='core'||actor.hp<=0)return;
  const core=actor,nodes=coreNodes(g,core),living=nodes.filter(node=>node.hp>0);
  const wasForming=core.smokeMonsterAge<SMOKE_MONSTER_FORMATION;
  core.smokeMonsterAge+=dt;
  core.smokeMonsterGrowth=clamp01(core.smokeMonsterAge/SMOKE_MONSTER_FORMATION);
  const forming=core.smokeMonsterGrowth<1;
  if(wasForming&&!forming){
    delete core.unattackable;
    for(const node of living)delete node.unattackable;
    g.onSound?.('bossPhase',core);
  }
  const scale=lerp(.43,1,living.length/LIMBS.length);
  core.smokeMonsterScale=lerp(core.smokeMonsterScale,scale,Math.min(1,dt*6));
  core.hitRadius=lerp(9,20,core.smokeMonsterScale);
  const immobilized=core.frozen>0||core.rooted>0||core.stun>0||core.sleeping>0;
  for(const key of ['frozen','rooted','stun','sleeping','jumanjiVines'])core[key]=Math.max(0,(core[key]||0)-dt);
  const players=g.players.filter(p=>p.hp>0&&!p.room&&!p.spectator&&!p.disconnected&&!p.lobbyDisconnected&&
    !p.unavailable&&!p.trainRide&&!p.pirateRide&&!p.vehicleId&&!p.broomMount&&!p.wingHover);
  const target=players.reduce((best,p)=>!best||distance(core,p)<distance(core,best)?p:best,null);
  const next=forming||immobilized?core:chaseStep(g,core,target,dt);
  const length=distance(core,next);
  if(length>.01){
    const x=lerp(core.faceX,(next.x-core.x)/length,Math.min(1,dt*5));
    const y=lerp(core.faceY,(next.y-core.y)/length,Math.min(1,dt*5));
    const norm=Math.hypot(x,y)||1;
    core.faceX=x/norm;
    core.faceY=y/norm;
  }
  const sideX=-core.faceY*21,sideY=core.faceX*21;
  const squeezed=clearPath(g,next,{x:next.x+sideX,y:next.y+sideY},CORE_RADIUS)&&
    clearPath(g,next,{x:next.x-sideX,y:next.y-sideY},CORE_RADIUS)?1:.65;
  let canMove=true;
  for(const node of living)canMove=stretchNode(g,core,node,next,dt,squeezed)&&canMove;
  core.moving=length>.01&&canMove;
  if(core.moving){core.x=next.x;core.y=next.y;}
  presentParts(core,nodes);
  if(!forming&&!immobilized)damageThroughSmoke(g,core,players);
}

export function settleSmokeMonsterDefeat(g,actor){
  if(!actor.smokeMonsterRole)return false;
  if(actor.defeated)return true;
  actor.defeated=true;
  actor.state='death';
  actor.deathTimer=0;
  actor.moving=false;
  if(actor.smokeMonsterRole==='wisp'){
    g.onSound?.('hit',actor);
    return true;
  }
  for(const node of coreNodes(g,actor)){
    node.hp=0;
    node.defeated=true;
    node.state='death';
    node.deathTimer??=0;
  }
  delete actor.smokeMonsterContact;
  g.arrows=(g.arrows||[]).filter(arrow=>!g.enemies.some(e=>arrow.enemy===e.id&&(e===actor||e.smokeMonsterCoreId===actor.id)));
  g.dropLoot(actor.x,actor.y,'dark_essence',3,SMOKE_MONSTER_NAME,true);
  if(actor.trialId!=null)defeatTrialMember(g,actor);
  g.cleared=(g.cleared||0)+1;
  g.killedCreatures??={};
  g.killedCreatures[actor.kind]=(g.killedCreatures[actor.kind]||0)+1;
  g.onSound?.('bossPhase',actor);
  g.persist?.();
  return true;
}
