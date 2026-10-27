import {actorRadius,flies} from './navigation.mjs';
import {enemyCanSeeTarget} from './enemy-sight.mjs';
import {stationaryCreature} from './stationary-creatures.mjs';
import {meleeBodyRadius} from './melee-geometry.mjs';
const spacingRadius=a=>Math.max(actorRadius(a),meleeBodyRadius(a)*.75);

// Separate living bodies after their independent AI steps. Movement still goes
// through moveActor, so terrain and world bounds remain authoritative.
export function separateActorBodies(game,dt){
  const players=(game.players||[]).filter(a=>a.hp>0&&!a.room&&!a.controlledFollowerId),enemies=[...(game.enemies||[]),...(game.ghosts||[]).filter(a=>a.wildTiger)].filter(a=>a.hp>0&&!a.room&&!a.graveEmergence&&!a.controlledBy);
  const actors=[...players,...enemies];
  for(let pass=0;pass<2;pass++)for(let i=0;i<actors.length;i++)for(let j=i+1;j<actors.length;j++){
    const a=actors[i],b=actors[j];
    if((a.room||null)!==(b.room||null))continue;
    if(players.includes(a)&&enemies.includes(b)&&!enemyCanSeeTarget(b,a))continue;
    if(players.includes(b)&&enemies.includes(a)&&!enemyCanSeeTarget(a,b))continue;
    if(Math.abs((a.groundHeight||0)+(a.jumpHeight||0)-(b.groundHeight||0)-(b.jumpHeight||0))>26)continue;
    const dx=b.x-a.x,dy=b.y-a.y,d=Math.hypot(dx,dy),minimum=spacingRadius(a)+spacingRadius(b)+5;
    if(d>=minimum)continue;
    const angle=d>1e-5?Math.atan2(dy,dx):(((a.id||i)*37+(b.id||j)*19)%360)*Math.PI/180;
    const push=Math.min((minimum-d)*.52,Math.max(1,dt*110)),ux=Math.cos(angle),uy=Math.sin(angle);
    if(stationaryCreature(a)&&stationaryCreature(b))continue;
    if(stationaryCreature(b))game.moveActor(a,-ux*push*2,-uy*push*2,flies(a));
    else if(stationaryCreature(a))game.moveActor(b,ux*push*2,uy*push*2,flies(b));
    else if(players.includes(a)&&enemies.includes(b))game.moveActor(b,ux*push*2,uy*push*2,flies(b));
    else if(players.includes(b)&&enemies.includes(a))game.moveActor(a,-ux*push*2,-uy*push*2,flies(a));
    else {game.moveActor(a,-ux*push,-uy*push,flies(a));game.moveActor(b,ux*push,uy*push,flies(b));}
  }
}
export function separateRoomEnemyBodies(game,room,dt){
 const enemies=[...(game.enemies||[]),...(game.ghosts||[])].filter(a=>a.hp>0&&a.room===room),players=(game.players||[]).filter(a=>a.hp>0&&a.room===room),actors=[...players,...enemies];
 for(let pass=0;pass<3;pass++)for(let i=0;i<actors.length;i++)for(let j=i+1;j<actors.length;j++){
  const a=actors[i],b=actors[j];if(players.includes(a)&&players.includes(b))continue;
  const dx=b.roomX-a.roomX,dy=b.roomY-a.roomY,d=Math.hypot(dx,dy),minimum=spacingRadius(a)+spacingRadius(b)+5;if(d>=minimum)continue;
  const angle=d>1e-5?Math.atan2(dy,dx):((a.id*37+b.id*19)%360)*Math.PI/180,push=Math.min((minimum-d)*.52,Math.max(1,dt*130));
  for(const [actor,sign]of [[a,-1],[b,1]]){if(players.includes(actor)||stationaryCreature(actor))continue;const factor=players.includes(actor===a?b:a)?2:1;actor.roomX=Math.max(26,Math.min(294,actor.roomX+Math.cos(angle)*push*sign*factor));actor.roomY=Math.max(44,Math.min(216,actor.roomY+Math.sin(angle)*push*sign*factor));}
 }
}
