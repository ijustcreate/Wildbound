import {drawParticleEffect,effects} from './particles.mjs';
import {itemKind} from './items.mjs';

export const hasHeldTorch = actor =>
  itemKind(actor.equipment?.hand1) === 'torch' || itemKind(actor.equipment?.hand2) === 'torch';

// Keep the real fixture/held torch; the imported effect supplies only flame, smoke and embers.
export function drawTorchFlame(c,x,y,time,seed=0,context){
 const e=effects.torch;
 drawParticleEffect(c,'torch',x,y+(e.pixelfx==='fire/torch'?16*e.pxScale:0),time,seed,context);
}

export function drawHeldTorchFlame(c,x,y,time,seed,scale,motion){
 const vx=motion?.vx??0,vy=motion?.vy??0;
 const factor=-42/Math.max(150,Math.hypot(vx,vy));
 const xTrail=vx*factor,yTrail=vy*factor*.65;
 const effect=effects.torch,angle=(effect.pxAngle||0)*Math.PI/180;
 const trailX=Math.round((xTrail*Math.cos(angle)+yTrail*Math.sin(angle))*(effect.pxFlip?-1:1));
 const trailY=Math.round(yTrail*Math.cos(angle)-xTrail*Math.sin(angle));
 c.save();
 c.translate(x,y);
 c.scale(scale,scale);
 drawTorchFlame(c,0,0,time,seed,{heldTorch:true,trailX,trailY});
 c.restore();
}
