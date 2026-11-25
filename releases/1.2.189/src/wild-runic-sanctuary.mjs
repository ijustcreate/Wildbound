import {spawnSmokeMonster} from './smoke-monster.mjs';
import {MOONVEIL_CIRCLE as circle,moonveilCatOutside} from './wild-runic-sanctuary-site.mjs';

const launch=globalThis.crypto?.randomUUID?.()??Math.random().toString(36).slice(2);
const CAT_RADIUS=8;
const SUMMON_DELAY=1.08;
const WATCH_RANGE=750;
const inSurface=t=>t?.design.wildLands&&!t.design.activeRoom&&!t.wildLandsOverview;
const playerOnGround=p=>p.hp>0&&!p.room&&!p.trainRide&&!p.pirateRide&&!p.disconnected&&!p.spectator;
const between=(g,a,b)=>a+(b-a)*g.random();

export function restoreMoonveilSanctuary(g){
 const t=g.trainTest;
 if(t.moonveilSanctuary?.launch===launch)return;
 delete t.moonveilSanctuary;
 for(const layer of [g,t.alleyActors,t.hollowSurfaceActors,t.wildBiomeRoomActors?.surface]){
  if(!layer?.enemies?.some(isSanctuaryActor))continue;
  layer.enemies=layer.enemies.filter(e=>!isSanctuaryActor(e));
 }
}

function isSanctuaryActor(actor){
 return actor.runeboundCat||actor.smokeMonsterSource==='sanctuary';
}

export function tickMoonveilSanctuary(g){
 const t=g.trainTest;
 if(!inSurface(t))return;
 const state=t.moonveilSanctuary;
 if(state?.death){
  if(!state.summoned&&t.time-state.death.at>=SUMMON_DELAY){
   const monster=spawnSmokeMonster(g,state.death,{source:'sanctuary'});
   if(monster){
    state.summoned=true;
    g.message('A Cinder Wraith is taking shape.');
    g.onSound?.('magic',state.death);
    g.persist?.();
   }
  }
  return;
 }
 if(state||!g.players.some(p=>playerOnGround(p)&&Math.hypot(p.x-circle.x,p.y-circle.y)<WATCH_RANGE))return;
 const id=g.nextId++;
 t.moonveilSanctuary={launch,catId:id};
 g.enemies.push({
  id,kind:'runebound_cat',sprite:'graveyard_cat',runeboundCat:true,name:'Moonveil Cat',
  x:circle.x,y:circle.y,faceX:0,faceY:1,step:0,moving:false,hp:52,maxHp:52,
  faction:'neutral',damage:0,speed:23,state:'idle',idle:'sit',previousHp:52,actAt:g.time+1.5,
 });
}

function localPoint(angle,reach){
 return {x:circle.x+Math.cos(angle)*(circle.radiusX-CAT_RADIUS)*reach,
  y:circle.y+Math.sin(angle)*(circle.radiusY-CAT_RADIUS)*reach};
}

function keepCatInside(cat){
 if(!moonveilCatOutside(cat.x,cat.y,CAT_RADIUS))return;
 const angle=Math.atan2((cat.y-circle.y)/(circle.radiusY-CAT_RADIUS),(cat.x-circle.x)/(circle.radiusX-CAT_RADIUS));
 Object.assign(cat,localPoint(angle,.993));
}

function runFrom(cat,threat){
 const heading=Math.atan2(cat.y-threat.y,cat.x-threat.x);
 let best=null,score=-Infinity;
 for(let i=0;i<12;i++){
  const point=localPoint(heading+i*Math.PI/6,.92);
  const stride=Math.hypot(point.x-cat.x,point.y-cat.y);
  if(stride<19)continue;
  const value=Math.hypot(point.x-threat.x,point.y-threat.y)+Math.min(70,stride)*.21;
  if(value>score){best=point;score=value;}
 }
 return best;
}

function moveCat(g,cat,dt,speed){
 const dx=cat.goal.x-cat.x,dy=cat.goal.y-cat.y,distance=Math.hypot(dx,dy);
 if(distance<2){cat.goal=null;return;}
 const x=cat.x,y=cat.y,travel=Math.min(distance,speed*dt);
 if(g.moveActor(cat,dx/distance*travel,dy/distance*travel)>.01){
  const actual=Math.hypot(cat.x-x,cat.y-y);
  cat.faceX=(cat.x-x)/actual;
  cat.faceY=(cat.y-y)/actual;
 }
}

export function tickRuneboundCat(g,cat,dt){
 keepCatInside(cat);
 if(cat.hp<=0){
  cat.animationProgress=Math.min(1,(cat.deathTimer||0)/.76);
  return;
 }
 const wounded=cat.hp<cat.previousHp;
 cat.previousHp=cat.hp;
 if(wounded){
  cat.fleeUntil=g.time+5;
  cat.actAt=0;
 }
 const wasFleeing=cat.state==='flee';
 const attacker=g.players.find(p=>p.id===cat.killedBy&&playerOnGround(p));
 const threat=attacker??{x:cat.x-cat.faceX*40,y:cat.y-cat.faceY*40};
 const flee=cat.fleeUntil>g.time||(wasFleeing&&attacker&&Math.hypot(attacker.x-cat.x,attacker.y-cat.y)<145);
 cat.moving=false;
 cat.aggro=false;
 cat.attack=0;
 for(const key of ['flash','hit','frozen','stun','swordHitPause'])cat[key]=Math.max(0,(cat[key]||0)-dt);
 if(flee){
  cat.state='flee';
  cat.idle='run';
  if(!cat.goal||cat.actAt<=g.time){
   cat.goal=runFrom(cat,threat);
   cat.actAt=g.time+.52;
  }
  if(cat.goal&&!cat.frozen&&!cat.stun&&!cat.swordHitPause)moveCat(g,cat,dt,84);
  return;
 }
 if(wasFleeing){cat.goal=null;cat.actAt=g.time;}
 if(cat.actAt<=g.time){
  if(cat.goal||cat.state==='walk'){
   cat.goal=null;
   cat.state='idle';
   cat.idle=g.random()<.38?'sleep':'sit';
   cat.actAt=g.time+(cat.idle==='sleep'?between(g,3.2,4.8):between(g,1.8,3.1));
  }else{
   cat.goal=localPoint(g.random()*Math.PI*2,between(g,.31,.84));
   cat.state='walk';
   cat.idle='walk';
   cat.actAt=g.time+4.4;
  }
 }
 if(cat.goal&&!cat.frozen&&!cat.stun&&!cat.swordHitPause){
  moveCat(g,cat,dt,cat.speed);
  if(!cat.goal)cat.actAt=g.time;
 }
}

export function settleRuneboundCatDeath(g,cat){
 if(!cat.runeboundCat)return false;
 keepCatInside(cat);
 Object.assign(cat,{defeated:true,deathTimer:0,state:'death',animationAction:'death',
  animationProgress:0,moving:false,aggro:false,corpseCleanup:true});
 const t=g.trainTest,state=t?.moonveilSanctuary;
 if(!state||state.catId!==cat.id||state.death)return true;
 state.death={x:cat.x,y:cat.y,at:t.time};
 g.message('The runes of Moonveil Circle darken.');
 g.onSound?.('magic',cat);
 g.persist?.();
 return true;
}
