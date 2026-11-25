import {clearShot} from './navigation.mjs';
import {nearbyEnemyTrap,triggerEnemyTrap} from './enemy-traps.mjs';
import {WILD_SLIME_HOLLOW} from './wild-slime-hollow-site.mjs';

export const WILD_SLIME_ARENA_RADIUS = WILD_SLIME_HOLLOW.radius;
export const WILD_SLIME_BOSS_SCALE = 2.55;
export const WILD_SLIME_ENTRY_TIME = 1.15;
const SLAM_RADIUS = 56;
const SLAM_REACH = 215;
const RECOVERY_TIME = 1.15;
const distance = (a,b) => Math.hypot(a.x-b.x,a.y-b.y);

export const wildSlimeInArena = (point,arena=WILD_SLIME_HOLLOW) => distance(point,arena)<=WILD_SLIME_ARENA_RADIUS;

export const isWildSlimeChallenger = p => p.hp>0&&!p.room&&!p.spectator&&!p.disconnected&&!p.lobbyDisconnected&&
  !p.unavailable&&!p.trainRide&&!p.trainDeck&&!p.pirateRide&&!p.vehicleId&&!p.broomMount&&!p.wingHover;

export function wildSlimeTargets(g,targets){
  if(!g.trainTest?.design.wildLands||g.trainTest.design.activeRoom)return [];
  return targets.filter(p=>g.players.includes(p)&&isWildSlimeChallenger(p)&&wildSlimeInArena(p));
}

function movePhase(boss,phase,duration,fields={}){
  boss.state=phase==='windup'?'windup':phase==='recover'?'recover':phase==='slam'?'attack':'hunt';
  boss.moving=false;
  return boss.wildSlimeMove={phase,duration,elapsed:0,...fields};
}

function face(boss,point){
  const length=distance(boss,point);
  if(length>1){boss.faceX=(point.x-boss.x)/length;boss.faceY=(point.y-boss.y)/length;}
}

function leap(g,boss,move,progress,height){
  const travel=Math.sin(progress*Math.PI/2);
  boss.jumpHeight=Math.sin(progress*Math.PI)*height;
  const x=move.from.x+(move.target.x-move.from.x)*travel;
  const y=move.from.y+(move.target.y-move.from.y)*travel;
  g.moveActor(boss,x-boss.x,y-boss.y);
}

export function tickWildSlimeBoss(g,boss,dt,targets){
  if(boss.hp<=0){boss.jumpHeight=0;return;}
  if(!g.trainTest?.design.wildLands||g.trainTest.design.activeRoom)return;
  boss.flash=Math.max(0,(boss.flash||0)-dt);
  const move=boss.wildSlimeMove??movePhase(boss,'entry',WILD_SLIME_ENTRY_TIME);

  if(move.phase==='entry'){
    // Tie the drop to the adds' release time, including the first partial frame.
    const elapsed=Number.isFinite(boss.wildSlimeReadyAt)?move.duration+g.time-boss.wildSlimeReadyAt:move.elapsed+dt;
    if(move.elapsed<.66&&elapsed>=.66)g.onSound?.('bossPhase',boss);
    move.elapsed=elapsed;
    const descent=Math.max(0,Math.min(1,elapsed/.66));
    boss.jumpHeight=148*(1-descent*descent);
    if(move.elapsed>=move.duration-1e-6){delete boss.unattackable;movePhase(boss,'ready',.16);}
    return;
  }

  const disabled=['frozen','stun','sleeping','rooted'].some(key=>boss[key]>0);
  for(const key of ['frozen','stun','sleeping','rooted','jumanjiVines'])
    boss[key]=Math.max(0,(boss[key]||0)-dt);
  if(disabled||!targets.length){
    boss.jumpHeight=0;
    if(move.phase!=='recover'&&move.phase!=='ready')movePhase(boss,'recover',.52);
    return;
  }

  const trap=boss.jumpHeight<12&&nearbyEnemyTrap(g,boss);
  if(trap){
    triggerEnemyTrap(g,boss,trap);
    boss.jumpHeight=0;
    movePhase(boss,'recover',RECOVERY_TIME);
    return;
  }

  move.elapsed=Math.min(move.duration,move.elapsed+dt);
  const progress=move.elapsed/move.duration, complete=progress>=1;
  switch(move.phase){
    case 'ready': {
      if(!complete)return;
      const target=targets.reduce((best,p)=>distance(boss,p)<distance(boss,best)?p:best);
      face(boss,target);
      const range=distance(boss,target);
      if((boss.wildSlimeHops||0)>=2&&range<=SLAM_REACH&&clearShot(g,boss,target)&&
        !g.blocked(target.x,target.y,14,false,false,false,0,0,false,boss)){
        movePhase(boss,'windup',.85,{target:{x:target.x,y:target.y},radius:SLAM_RADIUS});
        return;
      }
      const reach=Math.max(0,Math.min(56,range-36));
      movePhase(boss,'hop',.36,{from:{x:boss.x,y:boss.y},target:{x:boss.x+boss.faceX*reach,y:boss.y+boss.faceY*reach}});
      boss.wildSlimeHops=(boss.wildSlimeHops||0)+1;
      return;
    }
    case 'hop':
      leap(g,boss,move,progress,15);
      if(complete){boss.jumpHeight=0;movePhase(boss,'ready',.18);}
      return;
    case 'windup':
      if(complete)movePhase(boss,'slam',.42,{target:move.target,radius:move.radius,from:{x:boss.x,y:boss.y}});
      return;
    case 'slam': {
      leap(g,boss,move,progress,76);
      if(!complete)return;
      boss.jumpHeight=0;
      const landed=distance(boss,move.target)<=12;
      const impact=landed?move.target:{x:boss.x,y:boss.y};
      if(landed)for(const p of targets){
        if((p.jumpHeight||0)+(p.groundHeight||0)<16&&distance(impact,p)<=move.radius)g.hurt(p,boss.damage,boss);
      }
      g.onSound?.('bossPhase',boss);
      movePhase(boss,'recover',RECOVERY_TIME,{target:impact,radius:move.radius});
      boss.wildSlimeHops=0;
      return;
    }
    case 'recover':
      if(complete)movePhase(boss,'ready',.14);
  }
}
