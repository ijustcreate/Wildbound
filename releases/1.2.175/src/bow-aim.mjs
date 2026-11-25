import {ITEMS,itemKind,stat} from './items.mjs';
import {rangedLaunchOrigin} from './ranged-launch.mjs';
import {chargedProjectileRange,arrowFlightGravity,arrowBeyondWorld,chargedSpellDiameter} from './projectile-range.mjs';
import {rules} from './definitions.mjs';
import {drawProjectileHoldPath} from './hold-telegraphs.mjs';
import {boomerangDirection,boomerangRange,equippedGlaiveSlot,projectBoomerangTurn} from './boomerang-flight.mjs';
import {drawBoomerangReturnGuide} from './boomerang.mjs';
import {combatTuning} from './combat-workshop-settings.mjs';
import {magicBoltColor} from './magic-bolt-render.mjs';
export function projectedAimTrajectory(actor,{origin,direction,kind,slot='hand1',charge=0,world=null,maxDistance=560}={}){
 if(!origin||!direction||!['bow','magic','boomerang'].includes(kind))return [];
 if(kind==='boomerang'){
  const range=Math.min(maxDistance,boomerangRange(ITEMS[actor.equipment?.[slot]],charge));
  const blocked=world?.projectileBlocked?(x,y)=>world.projectileBlocked(x,y,1,false,actor):null;
  const turn=projectBoomerangTurn(origin,direction,range,blocked),heading=boomerangDirection(direction.x,direction.y);
  const distance=Math.hypot(turn.x-origin.x,turn.y-origin.y),z=16;
  const points=[];
  for(let d=0;d<distance;d+=16)points.push({x:origin.x+heading.x*d,y:origin.y+heading.y*d,z,distance:d});
  points.push({...turn,z,distance});
  return points;
 }
 const length=Math.hypot(direction.x,direction.y),dx=length?direction.x/length:0,dy=length?direction.y/length:1;
 const distance=Math.min(maxDistance,chargedProjectileRange(charge));
 const strength=Math.max(0,Math.min(1,charge/1.2));
 const speed=kind==='bow'?(rules.bowSpeed+strength*rules.bowBonusSpeed)*(1+stat(actor,'arrowSpeed')):260;
 const height=kind==='bow'?(origin.z??18):16;
 const gravity=kind==='bow'?arrowFlightGravity(speed,charge,height):0;
 const vz=kind==='bow'?20+70*strength:0;
 const radius=kind==='magic'?chargedSpellDiameter(strength)/2:1;
 const step=kind==='magic'?4:2;
 const pointAt=d=>{
  const t=d/speed;
  return {x:origin.x+dx*d,y:origin.y+dy*d,z:Math.max(0,height+vz*t-.5*gravity*t*t),distance:d};
 };
 // Collision probes use the flight plane and radius. Display projection happens after clipping.
 const blocked=({x,y})=>world?.projectileBlocked?.(x,y,radius,false,actor)||
  kind==='bow'&&world&&arrowBeyondWorld(world,x,y);
 const points=[pointAt(0)];
 let clear=0;
 for(let d=step;clear<distance;d+=step){
  const next=Math.min(d,distance),point=pointAt(next);
  if(blocked(point)){
   let edge=next;
   while(edge-clear>.25){
    const midpoint=(clear+edge)/2;
    if(blocked(pointAt(midpoint)))edge=midpoint;else clear=midpoint;
   }
   if(clear>points.at(-1).distance)points.push(pointAt(clear));
   return points;
  }
  clear=next;
  if(d%16===0||clear===distance)points.push(point);
 }
 return points;
}

export function drawBowAim(ctx,actor,scale=1,time=0,world=null,visualLift=actor.trainVisualLift||0){
 const glaive=actor.glaiveInFlight?null:equippedGlaiveSlot(actor);
 const slots=glaive?[]:['hand1','hand2'].filter(slot=>ITEMS[actor.equipment?.[slot]]?.magic);
 const heldMagic=slots.length>0&&actor.holdingPosition&&actor.charge>0;
 if((!actor.bowAiming&&!heldMagic)||actor.hp<=0||actor.room||actor.ui||actor.stun>0||actor.frozen>0||actor.sleeping>0||actor.swimming||actor.sink>18)return [];
 const size=scale===1?43:48*scale,charge=actor.charge||0;
 const points=[];
 for(const slot of glaive?[glaive]:slots.length?slots:['hand1']){
  const def=ITEMS[actor.equipment?.[slot]],equipped=itemKind(actor.equipment?.[slot]);
  const kind=slots.length?'magic':equipped==='bow'?'bow':equipped==='boomerang'&&(!def?.glaive||glaive)?'boomerang':null;
  if(!kind)continue;
  const origin=rangedLaunchOrigin(actor,time,kind,{slot,size}),direction={x:actor.faceX??0,y:actor.faceY??1};
  const path=projectedAimTrajectory(actor,{origin,direction,kind,slot,charge,world});
  const color=kind==='magic'?magicBoltColor(def):kind==='boomerang'?(def?.artColor||def?.color||'#c9e7b0'):'#c9e7b0';
  const lift=visualLift-(kind==='bow'?(actor.trainVisualLift||0):0);
  drawProjectileHoldPath(ctx,path,{color,charge,lift});
  const end=path.at(-1);
  if(kind==='boomerang'&&end&&combatTuning.boomerangGuide){
   drawBoomerangReturnGuide(ctx,end,origin,{height:16+lift,color,alpha:.23});
  }
  points.push(...path);
 }
 return points;
}
export const drawAimTrajectory=drawBowAim;

export function drawPounceAim(ctx,actor){
 const target=actor?.pounceAim;if(!target||actor.hp<=0)return;
 ctx.save();ctx.strokeStyle='#9ff5d7';ctx.globalAlpha=.92;ctx.lineWidth=1.5;ctx.setLineDash([3,3]);
 ctx.beginPath();ctx.moveTo(actor.x,actor.y);ctx.lineTo(target.x,target.y);ctx.stroke();ctx.setLineDash([]);
 const x=Math.round(target.x),y=Math.round(target.y);ctx.strokeRect(x-7,y-7,14,14);
 ctx.fillStyle='#bdf9e4';ctx.fillRect(x-1,y-1,2,2);ctx.restore();
}
