import {ITEMS, itemKind} from './items.mjs';

// Radial dead zone preserves the ratio of both axes, including tiny angles
// near the cardinal directions. Axis-by-axis clipping made those angles sticky.
export function aimStick(x=0,y=0,deadZone=.18){
 x=Number.isFinite(x)?x:0;y=Number.isFinite(y)?y:0;
 const length=Math.hypot(x,y);if(length<=deadZone)return {x:0,y:0};
 return {x:x/Math.max(1,length),y:y/Math.max(1,length)};
}

export const hasAimWeapon = actor => ['bow','boomerang'].includes(itemKind(actor.equipment?.hand1)) ||
  ['hand1','hand2'].some(slot => ITEMS[actor.equipment?.[slot]]?.magic);

// Visual-only blend: never delays aim direction, firing or damage.
export function updateBowAimBlend(actor,input,dt){
 if(itemKind(actor.equipment?.hand1)!=='bow'){delete actor.bowAimBlend;delete actor.bowVisualAngle;return;}
 const angle=Math.atan2(-(actor.faceX||0),actor.faceY??1),previous=actor.bowVisualAngle??angle;
 const delta=Math.atan2(Math.sin(angle-previous),Math.cos(angle-previous));
 actor.bowVisualAngle=previous+delta*(1-Math.exp(-Math.max(0,dt)*22));
 const target=!actor.swimming&&!actor.sleeping&&actor.hp>0&&!!(actor.bowAiming||input.attack||actor.attack>0)?1:0;
 const current=actor.bowAimBlend??0;
 actor.bowAimBlend=current+(target-current)*(1-Math.exp(-Math.max(0,dt)*18));
 if(Math.abs(actor.bowAimBlend-target)<.001)actor.bowAimBlend=target;
}

export function updateAimFacing(actor, input) {
  const ax = input.aimX || 0, ay = input.aimY || 0;
  const mx = input.x || 0, my = input.y || 0;
  const aim = Math.hypot(ax, ay), move = Math.hypot(mx, my);
  if (aim > .2) { actor.faceX = ax / aim; actor.faceY = ay / aim; }
  else if (move > .15) { actor.faceX = mx / move; actor.faceY = my / move; }
}
