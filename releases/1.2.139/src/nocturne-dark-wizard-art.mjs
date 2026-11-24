import {drawItem} from './item-art.mjs';
import {ITEMS} from './items.mjs';
import {actionInputLabel} from './action-prompts.mjs';
import {drawMagicBolt} from './magic-bolt-render.mjs';
import {isNocturneDarkWizardLoot,nocturneDarkWizardActors} from './nocturne-dark-wizards.mjs';

function drawWizardHealth(c,w){
 const x=Math.round(w.x)-14,y=Math.round(w.y)-51;
 c.fillStyle='#241d2c';c.fillRect(x,y,28,5);
 c.fillStyle='#6c414c';c.fillRect(x+1,y+1,26,3);
 c.fillStyle='#d3a571';c.fillRect(x+1,y+1,Math.ceil(26*w.hp/w.maxHp),2);
}

function drawDuelLoot(c,l,time){
 const x=Math.round(l.x),y=Math.round(l.y),lift=Math.round(Math.sin(time*4+l.id)*1.5);
 c.fillStyle='#241c2b99';c.fillRect(x-7,y-1,14,3);
 drawItem(c,l.type,x,y-11+lift,22);
}

export function queueNocturneDarkWizards(c,g,visible,objects){
 for(const actor of nocturneDarkWizardActors(g)){
  if(!visible(actor.x,actor.y,65,90))continue;
  const player=actor.hp>0&&actor.attack>0?{...actor,animationAction:'cast'}:actor;
  objects.push({depth:actor.y,player});
  if(actor.darkWizardId&&actor.hp>0)objects.push({depth:actor.y+.01,paint:()=>drawWizardHealth(c,actor)});
 }
 for(const l of g.loot){
  if(isNocturneDarkWizardLoot(l)&&visible(l.x,l.y,38,42)){
   objects.push({depth:l.y,paint:()=>drawDuelLoot(c,l,g.time)});
  }
 }
 for(const bolt of g.spells){
  if(visible(bolt.x,bolt.y,50,50))objects.push({depth:bolt.y,paint:()=>drawMagicBolt(c,bolt)});
 }
 for(const a of g.arrows){
  if(a.hostile&&a.ice&&!a.stuck&&visible(a.x,a.y,50,50)){
   objects.push({depth:a.y,paint:()=>drawMagicBolt(c,{
    x:a.x,y:a.y-(a.z||0)+16,vx:a.vx,vy:a.vy,age:a.age??.25,size:7,ice:true,color:'#b381ed',visualSeed:a.id,
   })});
  }
 }
}

export function nocturneDuelLootHint(g,p){
 if(p.hp<=0||p.ui)return '';
 const loot=g.nearbyLoot?.(p);
 if(!isNocturneDarkWizardLoot(loot))return '';
 return `${actionInputLabel(g,p,'loot')} · Collect ${ITEMS[loot.type].name}`;
}
