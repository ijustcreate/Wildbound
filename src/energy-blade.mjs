import {ITEMS} from './items.mjs';
import {ignite} from './hazards.mjs';
import {damageEnemy} from './enemy-damage.mjs';
import {waterAt} from './environment.mjs';
import {heatGround} from './terrain-fire.mjs';
import {facingIndex,heldItemWorld,projectPoint} from './player-motion.mjs';
import {spawnParticleEffect} from './particles.mjs';
import {tickTallGrass} from './tall-grass.mjs';
import {drawEnergyScorch} from './energy-blade-art.mjs';
import {shrinkingScale} from './shrinking-candy.mjs';

const hands=['hand1','hand2'];
const worldLayer=g=>g.trainTest?'railway:'+(g.trainTest.design.activeRoom||'surface'):'classic';
export const energyBladeAt=p=>hands.find(slot=>ITEMS[p.equipment?.[slot]]?.energyBlade);
export const ENERGY_SCORCH_LIMIT=72;
export const ENERGY_SCORCH_LIFE=38;

export function activateEnergyBlade(g,p,slot=energyBladeAt(p)){
 if(!slot)return false;
 const item=p.equipment[slot];
 if(p.energyBladeItem!==item||p.energyBladeActive===false)g.onSound?.('energyBladeIgnite',p);
 p.energyBladeItem=item;p.energyBladeActive=true;p.energyBladeIdle=0;
 return true;
}

export function tickEnergyBlade(g,p,dt){
 const slot=energyBladeAt(p);
 if(!slot){
  if(p.energyBladeItem){delete p.energyBladeItem;delete p.energyBladeIdle;delete p.energyBladeActive;delete p.energyBladeTip;}
  return;
 }
 if(p.hp<=0||p.room||p.swimming||p.ui){delete p.energyBladeTip;return;}
 if(p.energyBladeItem!==p.equipment[slot])activateEnergyBlade(g,p,slot);
 p.energyBladeIdle=(p.energyBladeIdle||0)+dt;
 if(p.energyBladeIdle>=10){p.energyBladeActive=false;delete p.energyBladeTip;}
}

export function tickEnergyMotionTail(g,p,dt){
 const slot=energyBladeAt(p);
 if(!slot||!p.energyBladeActive||!p.moving||p.attack>0||p.ui||p.swimming||p.controlledFollowerId){delete p.energyBladeTip;return;}
 p.energyBladeTrailCooldown=Math.max(0,(p.energyBladeTrailCooldown||0)-dt);
 if(p.energyBladeTrailCooldown>0)return;
 p.energyBladeTrailCooldown=.065;
 const size=43*shrinkingScale(p),hand=heldItemWorld(p,slot,g.time,undefined,size),d=facingIndex(p.faceX,p.faceY),v=projectPoint([slot==='hand1'?3:-3,13,6],d);
 const to={x:hand.x+v.x*size/48,y:hand.y+v.y*size/48-(p.pirateVisualLift||p.trainVisualLift||0)};
 const layer=worldLayer(g),previous=p.energyBladeTip;
 p.energyBladeTip={...to,layer};
 if(previous?.layer!==layer)return;
 const distance=Math.hypot(to.x-previous.x,to.y-previous.y);
 if(distance<1||distance>36)return;
 g.effects.push({type:'energyMotionTail',from:previous,to,x:to.x,y:to.y,layer,color:ITEMS[p.equipment[slot]].bladeColor,life:.25,duration:.25});
}

function markGround(g,p,point){
 const layer=worldLayer(g),marks=g.energyBladeMarks??=[],time=g.time;
 while(marks.length&&marks[0].expires<=time)marks.shift();
 if(marks.some(mark=>mark.layer===layer&&Math.hypot(mark.x-point.x,mark.y-point.y)<7))return;
 if(marks.length>=ENERGY_SCORCH_LIMIT)marks.shift();
 marks.push({x:point.x,y:point.y,layer,angle:Math.atan2(p.faceY||0,p.faceX||0),born:time,expires:time+ENERGY_SCORCH_LIFE});
}

export function energyBladeContact(g,p,target,{body=false}={}){
 if(!energyBladeAt(p)||p.energyBladeActive===false)return false;
 if(body&&target.hp>0){
  ignite(target,1.9,2);target.burnOwner=p.id;
  if(g.trainTest){target.energyBladeBurnUntil=g.time+1.9;g.energyBladeBurnUntil=g.time+1.95;}
 }
 const x=target.x,y=target.rootY??target.y;
 if(g.trainTest&&target.kind==='tall_grass')g.energyGrassUntil=g.time+5.5;
 if(!p.pirateRide&&!p.trainRide&&!p.swimming&&!(p.jumpHeight>15)&&!['water','shallow','floodbridge'].includes(waterAt(g,x,y))){
  heatGround(g,x,y,{trail:true});
  markGround(g,p,{x,y});
 }
 const lift=target.pirateVisualLift||target.trainVisualLift||0;
 spawnParticleEffect(g,'blade-spark',x,y-lift-(body?15:6),(p.id||0)+Math.round(g.time*120));
 g.onSound?.('energyBladeHit',p);
 return true;
}

export function tickRailwayEnergyBurns(g,dt){
 if(g.energyGrassUntil>g.time||g.grassBurnDirty)tickTallGrass(g,dt);
 if(!(g.energyBladeBurnUntil>g.time))return;
 for(const actor of g.enemies){
  if(!actor.energyBladeBurnUntil||actor.hp<=0)continue;
  if(g.time>=actor.energyBladeBurnUntil){actor.burning=0;delete actor.energyBladeBurnUntil;continue;}
  actor.burning=Math.max(0,actor.energyBladeBurnUntil-g.time);
  actor.burnTick-=dt;
  if(actor.burnTick<=0){actor.burnTick=.5;damageEnemy(actor,2,'fire');}
 }
}

export const energyEffectOnLayer=(g,fx)=>fx.layer===worldLayer(g);

export function drawEnergyBladeMarks(c,g,visible){
 for(const mark of g.energyBladeMarks||[]){
  if(mark.expires>g.time&&energyEffectOnLayer(g,mark)&&visible(mark,24))drawEnergyScorch(c,mark,g.time);
 }
}
