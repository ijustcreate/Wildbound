import {furnitureHeight,contains} from './house-design.mjs';
import {boardTableSupport} from './board-table.mjs';
import {terrainSupport} from './terrain-support.mjs';
export function supportHeight(g,a,offset=0){
 if(a.room)return 0;
 return Math.max(boardTableSupport(g,a.x,a.y),terrainSupport(g,a,offset),...(g?.house?.furniture||[]).filter(f=>contains(f,a.x,a.y+offset)).map(furnitureHeight));
}
export function startJump(a){
 // Jumping is gated by contact with the ground/support, never by a timer.
 // jumpHeight > 0 is the single airborne guard, so a second jump cannot fire.
 if(a.hp<=0||a.jumpHeight>0||a.state==='snared'||a.rooted>0||a.stun>0)return false;
 const jumpRank = a.field?.skills?.long_jump || 0;
 a.jumpHeight=(a.groundHeight||0)+.01;a.groundHeight=0;a.jumpVelocity=(a.jumpImpulse||125)*(1+jumpRank*.15);a.jumpAge=0;
 // Retained as telemetry for UI/debugging; startJump deliberately does not
 // consult it, so landing is the only gameplay gate.
 a.jumpCooldown=1.2;a.landTime=0;return true;
}
export function tickJump(a,dt,g=null,offset=0){
 a.jumpCooldown=Math.max(0,(a.jumpCooldown||0)-dt);a.landTime=Math.max(0,(a.landTime||0)-dt);
 if(a.hp<=0){a.jumpHeight=0;a.groundHeight=0;a.jumpVelocity=0;return;}
 const support=supportHeight(g,a,offset);
 if(!(a.jumpHeight>0)){
  if(a.groundHeight>support){a.jumpHeight=a.groundHeight;a.groundHeight=0;a.jumpVelocity=0;a.jumpAge=.1;}
  else return;
 }
 const previous=a.jumpHeight;
 a.jumpAge=(a.jumpAge||0)+dt;a.jumpVelocity-=360*dt;a.jumpHeight=Math.max(0,a.jumpHeight+a.jumpVelocity*dt);
 const landed=a.jumpVelocity<=0&&previous>=support&&a.jumpHeight<=support;
 if(landed||!a.jumpHeight){a.groundHeight=landed?support:0;a.jumpHeight=0;a.jumpVelocity=0;a.landTime=.22;}
}
