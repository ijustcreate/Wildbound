import {ITEMS,itemKind,stat} from './items.mjs';
import {rangedLaunchOrigin} from './ranged-launch.mjs';
import {chargedProjectileRange,arrowFlightGravity} from './projectile-range.mjs';
import {rules} from './definitions.mjs';
import {drawHoldTelegraph} from './hold-telegraphs.mjs';
import {boomerangDirection,projectBoomerangTurn} from './boomerang-flight.mjs';
import {drawBoomerangReturnGuide} from './boomerang.mjs';
import {combatTuning} from './combat-workshop-settings.mjs';
// Project onto the ground collision plane; the projectile itself still launches from the real hand.
export function drawBowAim(ctx,actor,scale=1,time=0){
  const slots=['hand1','hand2'].filter(slot=>ITEMS[actor.equipment?.[slot]]?.magic);
  if((!actor.bowAiming&&!(slots.length&&actor.holdingPosition&&actor.charge>0))||actor.hp<=0||actor.room||actor.ui||actor.stun>0||actor.frozen>0||actor.sleeping>0||actor.swimming||actor.sink>18)return;
  const size=scale===1?43:48*scale,charge=actor.charge||0;
  for(const slot of slots.length?slots:['hand1']){
    const def=ITEMS[actor.equipment?.[slot]],kind=slots.length?'magic':itemKind(actor.equipment?.hand1)==='boomerang'?'boomerang':'bow';
    const origin=rangedLaunchOrigin(actor,time,kind,{slot,size});
    drawHoldTelegraph(ctx,{x:origin.x,y:origin.y,dx:actor.faceX,dy:actor.faceY,length:kind==='boomerang'?(def?.range||chargedProjectileRange(charge)):chargedProjectileRange(charge),width:slots.length?6+Math.round(Math.min(1,charge/1.2)*8):8,charge,time,color:def?.friendship?'#ef97bf':def?.healing?'#9cddff':slots.length?(def?.artColor||def?.color||'#b7dbef'):'#c9e7b0',kind:'spell',scale:Math.max(.75,scale)});
  }
}

export function projectedAimTrajectory(actor,{origin,direction,kind,charge=0,world=null,maxDistance=560}={}){
 if(!origin||!direction||!['bow','magic','boomerang'].includes(kind))return [];
 if(kind==='boomerang'){
  const range=Math.min(maxDistance,ITEMS[actor.equipment?.hand1]?.range||330);
  const blocked=world?.projectileBlocked?(x,y)=>world.projectileBlocked(x,y,1,false):null;
  const turn=projectBoomerangTurn(origin,direction,range,blocked),heading=boomerangDirection(direction.x,direction.y);
  const distance=Math.hypot(turn.x-origin.x,turn.y-origin.y),z=origin.z??16;
  const points=[];
  for(let d=16;d<distance;d+=20)points.push({x:origin.x+heading.x*d,y:origin.y+heading.y*d,z,distance:d});
  points.push({...turn,z,distance});
  return points;
 }
 const length=Math.hypot(direction.x,direction.y)||1,dx=direction.x/length,dy=direction.y/length;
 const distance=Math.min(maxDistance,chargedProjectileRange(charge));
 const strength=Math.max(0,Math.min(1,charge/1.2));
 const speed=kind==='bow'?(rules.bowSpeed+strength*rules.bowBonusSpeed)*(1+stat(actor,'arrowSpeed')):260;
 const gravity=kind==='bow'?arrowFlightGravity(speed,charge,origin.z??18):0;
 const vz=kind==='bow'?20+70*strength:0;
 const points=[];
 for(let d=16;d<=distance;d+=20){
  const t=d/speed,z=(origin.z??0)+vz*t-.5*gravity*t*t;
  const point={x:origin.x+dx*d,y:origin.y+dy*d,z:Math.max(0,z),distance:d};
  if(world?.projectileBlocked?.(point.x,point.y,1,false))break;
  points.push(point);
 }
 return points;
}

export function drawAimTrajectory(ctx,actor,scale=1,time=0,world=null){
 const slots=['hand1','hand2'].filter(slot=>ITEMS[actor.equipment?.[slot]]?.magic);
 const heldMagic=slots.length>0&&actor.holdingPosition&&actor.charge>0;
 if((!actor.bowAiming&&!heldMagic)||actor.hp<=0||actor.room||actor.ui||actor.stun>0||actor.frozen>0||actor.sleeping>0||actor.swimming||actor.sink>18)return [];
 const size=scale===1?43:48*scale,charge=actor.charge||0;
 const points=[];
 for(const slot of slots.length?slots:['hand1']){
  const def=ITEMS[actor.equipment?.[slot]],equipped=itemKind(actor.equipment?.hand1),kind=slots.length?'magic':equipped==='bow'?'bow':equipped==='boomerang'?'boomerang':null;
  if(!kind)continue;
  const origin=rangedLaunchOrigin(actor,time,kind,{slot,size}),direction={x:actor.faceX??0,y:actor.faceY??1};
  const path=projectedAimTrajectory(actor,{origin,direction,kind,charge,world});
  const color=def?.friendship?'#ef97bf':def?.healing?'#9cddff':def?.artColor||def?.color||'#c9e7b0';
  ctx.save();ctx.globalAlpha=.48;ctx.fillStyle=color;ctx.imageSmoothingEnabled=false;
  for(let i=0;i<path.length;i++){
   if(i%2)continue;const point=path[i],x=Math.round(point.x),y=Math.round(point.y-point.z);
   ctx.fillRect(x-1,y-1,2,2);
  }
  const end=path.at(-1);
  if(end){const x=Math.round(end.x),y=Math.round(end.y-end.z);ctx.strokeStyle=color;ctx.lineWidth=1;ctx.strokeRect(x-3,y-3,6,6);ctx.fillRect(x-1,y-1,2,2);}
  if(kind==='boomerang'&&end&&combatTuning.boomerangGuide){
   ctx.globalAlpha=1;
   drawBoomerangReturnGuide(ctx,end,origin,{height:0,color,alpha:.23});
  }
  ctx.restore();points.push(...path);
 }
 return points;
}

export function drawPounceAim(ctx,actor){
 const target=actor?.pounceAim;if(!target||actor.hp<=0)return;
 ctx.save();ctx.strokeStyle='#9ff5d7';ctx.globalAlpha=.92;ctx.lineWidth=1.5;ctx.setLineDash([3,3]);
 ctx.beginPath();ctx.moveTo(actor.x,actor.y);ctx.lineTo(target.x,target.y);ctx.stroke();ctx.setLineDash([]);
 const x=Math.round(target.x),y=Math.round(target.y);ctx.strokeRect(x-7,y-7,14,14);
 ctx.fillStyle='#bdf9e4';ctx.fillRect(x-1,y-1,2,2);ctx.restore();
}
