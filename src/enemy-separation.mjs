import {actorRadius,flies} from './navigation.mjs';
import {enemyCanSeeTarget} from './enemy-sight.mjs';

// Separate living bodies after their independent AI steps. Movement still goes
// through moveActor, so terrain and world bounds remain authoritative.
export function separateActorBodies(game,dt){
  const players=(game.players||[]).filter(a=>a.hp>0&&!a.room&&!a.controlledFollowerId),enemies=(game.enemies||[]).filter(a=>a.hp>0&&!a.room&&!a.graveEmergence&&!a.controlledBy);
  const actors=[...players,...enemies];
  for(let pass=0;pass<2;pass++)for(let i=0;i<actors.length;i++)for(let j=i+1;j<actors.length;j++){
    const a=actors[i],b=actors[j];
    if((a.room||null)!==(b.room||null))continue;
    if(players.includes(a)&&enemies.includes(b)&&!enemyCanSeeTarget(b,a))continue;
    if(players.includes(b)&&enemies.includes(a)&&!enemyCanSeeTarget(a,b))continue;
    if(Math.abs((a.groundHeight||0)+(a.jumpHeight||0)-(b.groundHeight||0)-(b.jumpHeight||0))>26)continue;
    const dx=b.x-a.x,dy=b.y-a.y,d=Math.hypot(dx,dy),minimum=actorRadius(a)+actorRadius(b)+5;
    if(d>=minimum)continue;
    const angle=d>1e-5?Math.atan2(dy,dx):(((a.id||i)*37+(b.id||j)*19)%360)*Math.PI/180;
    const push=Math.min((minimum-d)*.52,Math.max(1,dt*110)),ux=Math.cos(angle),uy=Math.sin(angle);
    if(players.includes(a)&&enemies.includes(b))game.moveActor(b,ux*push*2,uy*push*2,flies(b));
    else if(players.includes(b)&&enemies.includes(a))game.moveActor(a,-ux*push*2,-uy*push*2,flies(a));
    else {game.moveActor(a,-ux*push,-uy*push,flies(a));game.moveActor(b,ux*push,uy*push,flies(b));}
  }
}
