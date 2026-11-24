import {clearShot} from './navigation.mjs';
export const PUMPKIN_WAKE_CHANCE=.32;
export function awakenCemeteryPumpkins(g){
 if(g.phase!=='play'||g.paused)return 0;
 let active=(g.enemies||[]).filter(e=>e.kind==='squashling'&&e.hp>0).length,spawned=0;
 for(const crop of g.scenery||[]){
  if(active>=4)break;
  if(crop.kind!=='pumpkin_crop'||crop.picked||crop.depleted||crop.awakeningChecked)continue;
  const near=(g.players||[]).find(p=>p.hp>0&&!p.room&&Math.hypot(p.x-crop.x,p.y-(crop.rootY??crop.y))<78&&clearShot(g,p,crop,3));if(!near)continue;
  crop.awakeningChecked=true;
  if(g.random()>=PUMPKIN_WAKE_CHANCE)continue;
  crop.picked=true;crop.awakened=true;
  const e={id:g.nextId++,kind:'squashling',skin:'squashling',name:'Sinister pumpkin',x:crop.x,y:crop.rootY??crop.y,hp:72,maxHp:72,speed:48,damage:13,faction:'enemy',aggro:true,state:'emerging',pumpkinAwaken:.85,cooldown:1,attack:0,step:0,moving:false,faceX:0,faceY:1};
  g.configureCreature?.(e,false);g.enemies.push(e);g.effects?.push({x:e.x,y:e.y,particle:'leaf-burst',duration:.55,life:.55,seed:e.id});g.onSound?.('harvest',e);spawned++;active++;
 }
 if(spawned){g.message?.('The pumpkin grins. Tangled roots pull free of the soil!');g.persist?.();}return spawned;
}
