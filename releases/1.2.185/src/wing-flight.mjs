import {ITEMS} from './items.mjs';
import {supportHeight} from './jumping.mjs';

export const WING_HOVER_HEIGHT=42,WING_LIFT_SPEED=90;
export const hasFlightWings=p=>ITEMS[p.equipment?.shoulders]?.wingFlight===true;

// Reuse real jump elevation for collision, shadows, water and ground hazards.
// Do not move the actor's ground anchor or use the wall-bypassing flying flag.
// Returning true means this frame's vertical motion replaces ordinary gravity.
export function tickWingFlight(g,p,input,dt,offset=0){
 if(g.paused||!(dt>0))return !!p.wingHover;
 const allowed=hasFlightWings(p)&&input.jump&&['play','won'].includes(g.phase)
  &&!g.openingBoard&&p.hp>0&&!p.room&&!p.ui&&!p.consumeInput
  &&!(p.stun>0)&&!(p.sleeping>0)&&!(p.frozen>0)&&!(p.rooted>0)
  &&p.state!=='snared'&&!(p.succubusCharm?.remaining>0);
 if(!allowed){
  if(p.wingHover){p.wingHover=false;p.jumpVelocity=Math.min(0,p.jumpVelocity||0);}
  return false;
 }
 dt=Math.min(.05,dt);
 if(!(p.jumpHeight>0)){
  if(!p.groundHeight)p.trackImpulse={x:p.x,y:p.y,kind:'takeoff'};
  p.jumpHeight=(p.groundHeight||0)+.01;p.groundHeight=0;p.jumpAge=0;
 }
 const target=supportHeight(g,p,offset)+WING_HOVER_HEIGHT,previous=p.jumpHeight;
 const step=Math.max(-WING_LIFT_SPEED*dt,Math.min(WING_LIFT_SPEED*dt,target-previous));
 p.jumpHeight=previous+step;p.jumpVelocity=step/dt;p.jumpAge=(p.jumpAge||0)+dt;
 p.wingHover=true;p.landTime=0;p.jumpCooldown=1.2;
 p.swimming=false;p.diveDepth=0;
 return true;
}
