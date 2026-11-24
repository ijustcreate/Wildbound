import {PIRATE_CAVE_BERTH,syncPirateShipPlayer} from './pirate-ship.mjs';

const stations=[
 {name:'Saltbone lookout',x:-233,y:-44,hp:86,speed:51,damage:15,hat:'charcoal',size:46},
 {name:'Hollow deckhand',x:-62,y:41,hp:92,speed:55,damage:16,hat:'wine',size:47},
 {name:'Tideworn gunner',x:72,y:-48,hp:102,speed:52,damage:17,hat:'moss',size:50},
 {name:'Barnacle blade',x:172,y:25,hp:92,speed:59,damage:15,hat:'charcoal',size:46},
];

export const pirateWreckActors=g=>g.trainTest?.pirateWreckCrew?.actors||[];

export function tickPirateWreckCrew(g,ship){
 if(ship?.id!==PIRATE_CAVE_BERTH.id||!Array.isArray(g.enemies))return;
 let state=g.trainTest.pirateWreckCrew;
 if(!state){
  if(!g.players.some(p=>p.hp>0&&!p.room&&Math.hypot(p.x-ship.x,p.y-ship.y)<690))return;
  const actors=stations.map(({x,y,hp,name,hat,size,damage,speed},index)=>{
   const id=g.nextId++;
   return {id,hp,maxHp:hp,name,damage,speed,kind:'skeleton_deckhand',sprite:'skeleton_deckhand',
    pirateRole:'wreck-'+index,pirateWreckHat:hat,pirateSize:size,pirateHostile:true,faction:'enemy',state:'idle',
    pirateRide:{shipId:ship.id,level:'deck',x,y},faceX:.17,faceY:1,step:0,attack:0,flash:0,cooldown:.9+index*.18};
  });
  state=g.trainTest.pirateWreckCrew={actors,defeated:[]};
 }
 for(const [index,saved] of state.actors.entries()){
  const actor=g.enemies.find(a=>a.id===saved.id&&a.pirateRole===saved.pirateRole)||saved;
  state.actors[index]=actor;
  if(state.defeated.includes(actor.pirateRole)){
   if(!g.enemies.includes(actor))actor.deathTimer=3.5;
   continue;
  }
  g.nextId=Math.max(g.nextId,actor.id+1);
  if(!g.enemies.includes(actor))g.enemies.push(actor);
  syncPirateShipPlayer(g,actor);
 }
}

export function recordWreckDefeat(g,actor){
 const state=g.trainTest?.pirateWreckCrew;
 if(state&&!state.defeated.includes(actor.pirateRole)){
  state.defeated.push(actor.pirateRole);
  g.persist?.();
 }
}
