import {furnitureHeight,contains} from './house-design.mjs';
import {sectionBlocked} from './structure-destruction.mjs';
import {boardTableSupport} from './board-table.mjs';
import {terrainSupport} from './terrain-support.mjs';
export function supportHeight(g,a,offset=0){
 if(a.room)return 0;
 return Math.max(boardTableSupport(g,a.x,a.y),terrainSupport(g,a,offset),...(g?.house?.furniture||[]).filter(f=>!f.destroyed&&contains(f,a.x,a.y+offset)&&sectionBlocked(f,a.x,a.y+offset,.1)).map(furnitureHeight));
}
export function startJump(a){
 // Jumping is gated by contact with the ground/support, never by a timer.
 // jumpHeight > 0 is the single airborne guard, so a second jump cannot fire.
 if(a.hp<=0||a.jumpHeight>0||a.state==='snared'||a.rooted>0||a.stun>0)return false;
 const jumpRank = a.field?.skills?.long_jump || 0;
 if(!a.kind&&!a.groundHeight)a.trackImpulse={x:a.x,y:a.y,kind:'takeoff'};
 a.jumpHeight=(a.groundHeight||0)+.01;a.jumpLaunchHeight=a.jumpHeight;a.groundHeight=0;a.jumpVelocity=(a.jumpImpulse||125)*(1+jumpRank*.15);a.jumpLaunchVelocity=a.jumpVelocity;a.jumpAge=0;a.jumpHoldTime=0;a.jumpCut=false;a.jumpReleaseBlend=0;a.jumpFallAge=0;a.jumpPeakHeight=a.jumpHeight;a.jumpMoveInitialized=false;
 // Retained as telemetry for UI/debugging; startJump deliberately does not
 // consult it, so landing is the only gameplay gate.
 delete a.jumpAirStartVelocity;
 a.jumpCooldown=1.2;a.landTime=0;return true;
}
export function releaseJump(a){
 if(!a||a.jumpHeld!==true)return false;
 if(a.jumpHeight>0&&a.jumpVelocity>0&&!a.jumpCut)a.jumpCut=true;
 a.jumpHeld=false;return true;
}
export function tickJump(a,dt,g=null,offset=0){
 a.jumpCooldown=Math.max(0,(a.jumpCooldown||0)-dt);a.landTime=Math.max(0,(a.landTime||0)-dt);
 if(a.hp<=0){a.jumpHeight=0;a.groundHeight=0;a.jumpVelocity=0;return;}
 const support=supportHeight(g,a,offset);
 a.jumpSupportHeight=support;
 if(!(a.jumpHeight>0)){
  if(a.groundHeight>support){a.jumpHeight=a.groundHeight;a.groundHeight=0;a.jumpVelocity=0;a.jumpAge=.1;}
  else return;
 }
 const previous=a.jumpHeight,gravity=a.jumpGravity||360;
 // Small integration steps make short taps and apex transitions consistent.
 const steps=Math.max(1,Math.ceil(dt/(1/120))),step=dt/steps;
 for(let i=0;i<steps;i++){
  a.jumpAge=(a.jumpAge||0)+step;
  const rising=a.jumpVelocity>0;
  a.jumpHoldTime=(a.jumpHoldTime||0)+(rising&&a.jumpHeld&&!a.jumpCut?step:0);
  a.jumpReleaseBlend=(a.jumpReleaseBlend||0)+((a.jumpCut?1:0)-(a.jumpReleaseBlend||0))*(1-Math.exp(-24*step));
  const t=Math.min(1,(a.jumpHoldTime||0)/.18),fade=t*t*(3-2*t);
  const lift=rising&&a.jumpHeld&&!a.jumpCut?1-.55*(1-fade):1;
  const acceleration=gravity*(rising?lift+1.4*a.jumpReleaseBlend:1.25);
  const nextVelocity=a.jumpVelocity-acceleration*step;
  if(a.jumpAge>=.1&&a.jumpAirStartVelocity===undefined)a.jumpAirStartVelocity=Math.max(1,a.jumpVelocity);
  a.jumpHeight=Math.max(0,a.jumpHeight+(a.jumpVelocity+nextVelocity)*.5*step);a.jumpVelocity=nextVelocity;
  a.jumpPeakHeight=Math.max(a.jumpPeakHeight||0,a.jumpHeight);
  if(!rising)a.jumpFallAge=(a.jumpFallAge||0)+step;
 }
 const landed=a.jumpVelocity<=0&&previous>=support&&a.jumpHeight<=support;
 if(landed||!a.jumpHeight){a.groundHeight=landed?support:0;a.jumpHeight=0;a.jumpVelocity=0;a.jumpHoldTime=0;a.jumpCut=false;a.landTime=.22;a.jumpLandingVX=a.jumpAirVX;a.jumpLandingVY=a.jumpAirVY;if(!a.kind&&!a.groundHeight)a.trackImpulse={x:a.x,y:a.y,kind:'landing'};}
}

// A small, hold-independent range boost preserves the arc and gentle steering.
export function jumpMotion(a,mx,my,speed,dt){
 const vx=mx*speed,vy=my*speed;
 if(a.jumpHeight>0&&!a.wingHover){
  const reach=1.15;
  if(!a.jumpMoveInitialized){
   const moving=Math.hypot(a.jumpGroundVX||0,a.jumpGroundVY||0)>1;
   a.jumpAirVX=(moving?a.jumpGroundVX:vx)*reach;a.jumpAirVY=(moving?a.jumpGroundVY:vy)*reach;a.jumpMoveInitialized=true;
  }
  const steer=1-Math.exp(-5*dt);
  a.jumpAirVX+=(vx*reach-a.jumpAirVX)*steer;a.jumpAirVY+=(vy*reach-a.jumpAirVY)*steer;
  return {dx:a.jumpAirVX*dt,dy:a.jumpAirVY*dt};
 }
 a.jumpGroundVX=vx;a.jumpGroundVY=vy;
 if(a.landTime>0&&Number.isFinite(a.jumpLandingVX)){
  const settle=1-Math.exp(-22*dt);
  a.jumpLandingVX+=(vx-a.jumpLandingVX)*settle;a.jumpLandingVY+=(vy-(a.jumpLandingVY||0))*settle;
  return {dx:a.jumpLandingVX*dt,dy:a.jumpLandingVY*dt};
 }
 return null;
}
