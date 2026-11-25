import {ITEMS} from './items.mjs';
import {actionInputLabel} from './action-prompts.mjs';
import {drawMagicBolt} from './magic-bolt-render.mjs';
import {isNocturneDarkWizardLoot,nocturneDarkWizardActors} from './nocturne-dark-wizards.mjs';
import {nocturneBossActors} from './nocturne-boss.mjs';
import {drawNocturneBossSpeech,NOCTURNE_LORD_SIZE,paintNocturneDissolve} from './nocturne-boss-art.mjs';

function drawWizardHealth(c,w){
 const lord=w.nocturneBossRole==='lord',width=lord?66:28;
 const x=Math.round(w.x-width/2),y=Math.round(w.y)-(lord?61:51);
 if(lord){
  c.save();c.font='700 10px system-ui';c.textAlign='center';
  c.fillStyle='#d5e0c4';c.fillText(w.name,w.x,y-5);
  c.restore();
 }
 c.fillStyle='#241d2c';c.fillRect(x,y,width,5);
 c.fillStyle='#6c414c';c.fillRect(x+1,y+1,width-2,3);
 c.fillStyle=lord?'#90d498':'#d3a571';c.fillRect(x+1,y+1,Math.ceil((width-2)*w.hp/w.maxHp),2);
}

export function queueNocturneDarkWizards(c,g,visible,objects,animator,bounds){
 const boss=g.trainTest.nocturneBoss;
 const actors=[...nocturneDarkWizardActors(g),...nocturneBossActors(g)];
 for(const actor of actors){
  if(actor.nocturneBossRole&&actor.hp<=0)continue;
  if(!visible(actor.x,actor.y,65,90))continue;
  const player=actor.hp>0&&actor.attack>0?{...actor,animationAction:'cast'}:actor;
  const lord=actor.nocturneBossRole==='lord';
  objects.push({depth:actor.y,player,size:lord?NOCTURNE_LORD_SIZE:undefined});
  if((actor.darkWizardId||actor.nocturneBossRole&&actor.aggro)&&actor.hp>0){
   objects.push({depth:actor.y+.01,paint:()=>drawWizardHealth(c,actor)});
  }
  if(lord&&boss?.speech?.text&&boss.speech.until>g.time){
   objects.push({depth:actor.y+.05,paint:()=>drawNocturneBossSpeech(c,actor,boss.speech.text,bounds)});
  }
 }
 if(boss?.death&&g.time-boss.death.startedAt<2.6&&visible(boss.death.x,boss.death.y,80,130)){
  const actor=g.enemies.find(e=>e.id===boss.death.id);
  objects.push({depth:boss.death.y,paint:()=>paintNocturneDissolve(c,animator,actor,boss.death,g.time,g.time-boss.death.startedAt,true)});
 }
 for(const actor of g.enemies){
  if(actor.hp<=0&&actor.nocturneBossRole==='minion'&&actor.deathTimer<1.3&&visible(actor.x,actor.y,65,100)){
   objects.push({depth:actor.y,paint:()=>paintNocturneDissolve(c,animator,actor,actor,g.time,actor.deathTimer,false)});
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
