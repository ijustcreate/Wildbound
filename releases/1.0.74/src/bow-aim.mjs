import {ITEMS} from './items.mjs';
import {wandTipWorld,bowHandleWorld,playerMotion} from './player-motion.mjs';
// Direction aids use the same facing and visible origin as their projectiles.
export function drawBowAim(ctx,actor,scale=1,time=0){
  if(!actor.bowAiming||actor.hp<=0||actor.swimming||actor.sink>18)return;
  const length=Math.hypot(actor.faceX||0,actor.faceY||0)||1;
  const dx=(actor.faceX||0)/length,dy=(actor.faceY||0)/length;
  const slots=['hand1','hand2'].filter(slot=>ITEMS[actor.equipment?.[slot]]?.magic);
  const origins=slots.length?slots.map(slot=>wandTipWorld(actor,slot,time,playerMotion,scale===1?43:48*scale)):
    [bowHandleWorld(actor,time,playerMotion,scale===1?43:48*scale)];
  ctx.save();ctx.strokeStyle='#b7f5dc';ctx.globalAlpha=.8;ctx.lineWidth=1.5;
  for(const {x,y} of origins){
  ctx.setLineDash([4,4]);ctx.beginPath();ctx.moveTo(x,y);
  ctx.lineTo(x+dx*64*scale,y+dy*64*scale);ctx.stroke();ctx.setLineDash([]);
  ctx.beginPath();ctx.arc(x+dx*64*scale,y+dy*64*scale,2,0,Math.PI*2);ctx.stroke();}ctx.restore();
}
