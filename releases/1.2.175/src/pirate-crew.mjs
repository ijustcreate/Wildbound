import {HOOK_LOOT,PARROT_CAGE,PARROT_CAGE_CHANCE,PIRATE_CREW} from './pirate-crew-data.mjs';
import {PIRATE_CAVE_BERTH,PIRATE_SHIP_BERTH,PIRATE_SHIP_LAYOUT,movePirateShipPlayer,pirateShip,pirateShipLocal,syncPirateShipPlayer} from './pirate-ship.mjs';
import {railwayLootAnchor} from './railway-loot.mjs';
import {clearShot} from './navigation.mjs';
import {samePirateCombatFloor} from './pirate-combat-floor.mjs';
import {pirateWreckActors,recordWreckDefeat,tickPirateWreckCrew} from './pirate-wreck-crew.mjs';

const byKey=new Map(PIRATE_CREW.map(spec=>[spec.key,spec]));
const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
const captainWin='Young Pan wins again… but tell him the sea has a long memory.';
const farewell={label:'I’ll leave you to it.',action:'close'};

function canTalk(p){return p.hp>0&&!p.room&&p.pirateRide&&['deck','hold','nest'].includes(p.pirateRide.level);}
const crewFor=g=>g.trainTest?.pirateCrew;
const atSea=ship=>ship?.id===PIRATE_SHIP_BERTH.id;
export function pirateCrewActors(g){
 const ship=pirateShip(g);
 if(atSea(ship))return crewFor(g)?.actors||[];
 return ship?.id===PIRATE_CAVE_BERTH.id?pirateWreckActors(g):[];
}

function createCrew(g,ship){
 const actors=PIRATE_CREW.map(spec=>{
  const id=g.nextId++,hp=spec.hp||1;
  const actor={id,pirateRole:spec.key,name:spec.name,title:spec.role,pirateSize:spec.size,
   hp,maxHp:hp,damage:spec.damage||0,speed:spec.speed||0,sprite:'player',kind:'player',
   appearance:{...spec.appearance},equipment:{...spec.equipment},faction:'neutral',
   step:0,attack:0,flash:0,faceX:.16,faceY:1,pathIndex:1,waitUntil:g.time+2+(id%3)*.7,
   pirateRide:{shipId:ship.id,...spec.route[0]}};
  if(spec.dye)actor.field={cosmetics:{dye:spec.dye}};
  syncPirateShipPlayer(g,actor);
  return actor;
 });
 return (g.trainTest.pirateCrew={actors,defeated:[],challenge:false,nextTalkAt:g.time+3.2});
}

function toward(g,ship,actor,{x,y},speed,dt){
 const ride=actor.pirateRide,dx=x-ride.x,dy=y-ride.y,range=Math.hypot(dx,dy);
 if(range<.1){actor.moving=false;return 0;}
 const c=Math.cos(ship.a),s=Math.sin(ship.a),xWorld=(dx*c-dy*s)/range,yWorld=(dx*s+dy*c)/range;
 actor.faceX=xWorld;actor.faceY=yWorld;
 const travel=Math.min(range,speed*dt),moved=movePirateShipPlayer(g,actor,xWorld*travel,yWorld*travel);
 actor.moving=moved>.018;actor.walking=true;actor.movementGait=actor.moving?'walk':'idle';
 actor.moveSpeed=actor.moving?speed:0;actor.step=(actor.step||0)+moved*.13;
 return moved;
}

function followDuty(g,ship,actor,spec,dt){
 actor.moving=false;actor.moveSpeed=0;actor.movementGait='idle';
 if(spec.route.length===1||g.time<(actor.waitUntil||0))return;
 if(g.players.some(p=>p.ui?.pirateCrew===actor.pirateRole&&samePirateCombatFloor(p,actor)&&distance(p,actor)<68))return;
 const ride=actor.pirateRide,target=spec.route[actor.pathIndex];
 const wantsFloor=target.level!==ride.level;
 if(wantsFloor&&distance(ride,PIRATE_SHIP_LAYOUT.hatch)<32){
  Object.assign(ride,{x:target.x,y:target.y,level:target.level});
  syncPirateShipPlayer(g,actor);
 }else toward(g,ship,actor,wantsFloor?{x:PIRATE_SHIP_LAYOUT.hatch.x,y:PIRATE_SHIP_LAYOUT.hatch.y+18}:target,spec.speed,dt);
 if(actor.pirateRide.level===target.level&&distance(actor.pirateRide,target)<.5){
  actor.pathIndex=(actor.pathIndex+1)%spec.route.length;
  actor.waitUntil=g.time+(wantsFloor?.85:2.2+(actor.pathIndex%3)*.54);
 }
}

const crewExchanges=[
 {pairs:['hook','smee'],lines:['Smee, report on the stores.','Everything accounted for, Captain. Except the things I’m still counting.']},
 {pairs:['smee','rook'],lines:['Did I count this barrel already?','You counted the same barrel twice. I moved it just to be sure.']},
 {pairs:['smee','orla'],lines:['Three barrels in the forward hold?','Four. The little one with your lunch in it counts.']},
 {pairs:['nell','bram'],lines:['Keep an eye on the swell, Bram.','You watch the sea. I’ll watch what comes out of it.']},
];

function exchange(g,state){
 const say=state.speech;
 if(say?.switchAt>g.time||say?.until>g.time)return;
 if(g.time<state.nextTalkAt)return;
 for(const {pairs,lines} of crewExchanges){
  const [a,b]=pairs.map(key=>state.actors.find(actor=>actor.pirateRole===key&&actor.hp>0&&!actor.pirateHostile));
  if(!a||!b||!samePirateCombatFloor(a,b)||distance(a,b)>100||!g.players.some(p=>samePirateCombatFloor(p,a)&&distance(p,a)<142))continue;
  state.speech={first:a.id,second:b.id,lines,switchAt:g.time+2.6,until:g.time+5.9};
  state.nextTalkAt=g.time+14;return;
 }
 state.nextTalkAt=g.time+1.3;
}

export function pirateCrewSpeech(g){
 const speech=crewFor(g)?.speech;
 if(!speech||g.time>=speech.until)return null;
 const first=g.time<speech.switchAt;
 return {actorId:first?speech.first:speech.second,text:speech.lines[first?0:1]};
}

export function tickPirateCrew(g,ship,dt){
 if(!atSea(ship)){tickPirateWreckCrew(g,ship);return;}
 if(!Array.isArray(g.enemies))return;
 let state=crewFor(g);
 const nearby=g.players.some(p=>p.hp>0&&!p.room&&distance(p,ship)<720);
 if(!state){if(!nearby)return;state=createCrew(g,ship);}
 for(const [index,saved] of state.actors.entries()){
  const actor=g.enemies.find(e=>e.id===saved.id&&e.pirateRole===saved.pirateRole)||saved;
  state.actors[index]=actor;
  if(state.defeated.includes(actor.pirateRole)){
   if(!g.enemies.includes(actor))actor.deathTimer=3.5;
   continue;
  }
  g.nextId=Math.max(g.nextId,actor.id+1);
  if(actor.pirateHostile&&!g.enemies.includes(actor))g.enemies.push(actor);
  if(!nearby&&!actor.pirateHostile)continue;
  syncPirateShipPlayer(g,actor);
  if(nearby&&!actor.pirateHostile){
   const speaking=state.speech?.until>g.time&&[state.speech.first,state.speech.second].includes(actor.id);
   if(speaking){actor.moving=false;actor.moveSpeed=0;actor.movementGait='idle';}
   else followDuty(g,ship,actor,byKey.get(actor.pirateRole),dt);
  }
 }
 if(nearby)exchange(g,state);
 for(const p of g.players)if(p.ui?.pirateCrew&&!activeTalk(g,p)){p.ui=null;p.consumeInput=true;}
}

function nearbyPirate(g,p,reach=39){
 if(!canTalk(p))return null;
 return pirateCrewActors(g).filter(a=>a.hp>0&&!a.pirateHostile&&samePirateCombatFloor(p,a)&&distance(a,p)<=reach&&clearShot(g,p,a,1))
  .sort((a,b)=>distance(a,p)-distance(b,p))[0]||null;
}

export function pirateCrewPrompt(g,p){
 const actor=nearbyPirate(g,p,p.pirateRide?.level==='nest'?28:37);
 return actor?'TALK TO '+actor.name.toUpperCase():'';
}

export function interactPirateCrew(g,p){
 if(p.ui)return false;
 const actor=nearbyPirate(g,p,p.pirateRide?.level==='nest'?28:37);
 if(!actor)return false;
 p.ui={shop:'npc-dialogue',pirateCrew:actor.pirateRole,ownerDevice:p.device,node:'hello',index:0};
 p.consumeInput=true;p.charge=0;
 return true;
}

function activeTalk(g,p){
 if(p.ui?.ownerDevice!==p.device||!canTalk(p))return null;
 return pirateCrewActors(g).find(actor=>actor.pirateRole===p.ui.pirateCrew&&actor.hp>0&&!actor.pirateHostile&&
  distance(p,actor)<65&&samePirateCombatFloor(p,actor)&&clearShot(g,p,actor,1));
}

export function pirateCrewDialogue(g,p){
 const npc=activeTalk(g,p);
 if(!npc)return {text:'The conversation has ended.',choices:[farewell]};
 const spec=byKey.get(npc.pirateRole),node=p.ui.node;
 if(node==='pan')return {npc,text:'You’ve heard of Peter Pan, then. Tell me plainly: whose side are you on?',choices:[
  {label:'I’m just here to see the ship.',action:'deck'},
  {label:'I’m with Peter Pan.',action:'pan-alliance',detail:'Captain Hook takes this as a challenge.'},farewell,
 ]};
 const question=npc.pirateRole==='lazy'?'How do I find the cave harbor?':npc.pirateRole==='hook'?'What do you make of Peter Pan?':'How do you keep this ship running?';
 return {npc,text:node==='duty'?spec.reply:node==='deck'?spec.reply:spec.line,choices:[
  {label:question,action:npc.pirateRole==='hook'?'pan':'duty'},farewell,
 ]};
}

function drawBlades(g,p){
 const state=crewFor(g);
 if(state.challenge)return;
 state.challenge=true;delete state.speech;
 for(const actor of state.actors){
  if(actor.pirateRole==='lazy'||actor.hp<=0)continue;
  actor.pirateHostile=true;actor.faction='enemy';actor.cooldown=.55+(actor.id%3)*.27;
  actor.aggro=true;
  g.enemies.push(actor);
 }
 for(const hero of g.players)if(hero.ui?.pirateCrew&&hero.ui.pirateCrew!=='lazy'){hero.ui=null;hero.consumeInput=true;}
 g.message?.('Captain Hook draws his rapier. “Pan’s friend is my enemy!”');
 g.onSound?.('swing',p);
 g.persist?.();
}

export function pirateCrewDialogueAction(g,p,action){
 const {npc,choices}=pirateCrewDialogue(g,p),ui=p.ui;
 if(!npc||action==='close'){p.ui=null;p.consumeInput=true;return true;}
 if(['next','prev','up','down'].includes(action)){
  ui.index=(ui.index+choices.length+(['next','down'].includes(action)?1:-1))%choices.length;
  return true;
 }
 if(action==='use')action=choices[ui.index]?.action;
 if(action?.startsWith('choice:'))action=choices[Number(action.slice(7))]?.action;
 if(!choices.some(choice=>choice.action===action))return true;
 if(action==='close'){p.ui=null;p.consumeInput=true;}
 else if(action==='pan-alliance'&&npc.pirateRole==='hook'&&ui.node==='pan')drawBlades(g,p);
 else {ui.node=action;ui.index=0;ui.revision=(ui.revision||0)+1;}
 return true;
}

function pursuePoint(ship,actor,player){
 const ride=actor.pirateRide,goal=pirateShipLocal(ship,player),part=PIRATE_SHIP_LAYOUT.hold.partitionX;
 if(ride.level==='hold'&&(ride.x-part)*(goal.x-part)<0){
  return {x:Math.abs(ride.y)>13?part+Math.sign(ride.x-part)*19:part+Math.sign(goal.x-part)*18,y:0};
 }
 return goal;
}

export function tickPirateFighter(g,e,dt){
 if(e.hp<=0)return;
 const ship=pirateShip(g);
 if(ship?.id!==e.pirateRide?.shipId)return;
 e.moving=false;e.moveSpeed=0;
 const range=e.pirateRole==='hook'?57:e.pirateWreckHat?52:44;
 e.attack=Math.max(0,(e.attack||0)-dt);e.flash=Math.max(0,(e.flash||0)-dt);
 e.cooldown=Math.max(0,(e.cooldown||0)-dt);
 for(const key of ['stun','frozen','sleeping'])e[key]=Math.max(0,(e[key]||0)-dt);
 if(e.stun>0||e.frozen>0||e.sleeping>0){delete e.pirateWindup;return;}
 const targets=g.players.filter(p=>p.hp>0&&!p.room&&samePirateCombatFloor(e,p));
 const windup=e.pirateWindup;
 if(windup){
  if(g.time<windup.at)return;
  delete e.pirateWindup;
  const target=targets.find(p=>p.id===windup.id);
  const d=target?distance(e,target):Infinity;
  if(target&&d<=range+6&&(d<1||((target.x-e.x)*e.faceX+(target.y-e.y)*e.faceY)/d>.44)&&clearShot(g,e,target,1)){
   if(!g.shieldBlocks?.(target,e))g.hurt(target,e.damage,e);
  }
  e.cooldown=e.pirateRole==='hook'?.8:1.05;
  return;
 }
 if(e.attack>0)return;
 const target=targets.sort((a,b)=>distance(e,a)-distance(e,b))[0];
 if(!target)return;
 const d=distance(e,target);
 if(d<=range-5&&clearShot(g,e,target,1)){
  if(e.cooldown>0)return;
  if(d>.1){e.faceX=(target.x-e.x)/d;e.faceY=(target.y-e.y)/d;}
  e.attack=e.attackDuration=.54;e.attackClip=e.pirateRole==='hook'?'swipe_big':'swipe_one';
  e.pirateWindup={id:target.id,at:g.time+.28};
  g.onSound?.('swing',e);
  return;
 }
 toward(g,ship,e,pursuePoint(ship,e,target),e.speed,dt);
}

export function settlePirateDefeat(g,e){
 if(!e.pirateRole)return false;
 const state=crewFor(g);
 e.defeated=true;e.deathTimer=0;e.state=e.animationAction='death';
 if(e.pirateWreckHat){recordWreckDefeat(g,e);return true;}
 if(!state||state.defeated.includes(e.pirateRole)||!atSea(pirateShip(g)))return true;
 state.defeated.push(e.pirateRole);
 const items=e.pirateRole==='hook'?HOOK_LOOT:g.random()<PARROT_CAGE_CHANCE?[PARROT_CAGE]:[];
 const center=railwayLootAnchor(g,e);
 for(const [index,type] of items.entries()){
  if(!center)break;
  const side=e.pirateRide.x+15*(index-1.5);
  const anchor=railwayLootAnchor(g,{pirateRide:{...e.pirateRide,x:side}});
  const spot=anchor&&!g.blocked(anchor.x,anchor.y,3,false,true,false,0,0,false,e)?anchor:center;
  g.dropLoot(spot.x,spot.y,type,1,e.name,true,spot);
 }
 if(e.pirateRole==='hook')g.message?.(captainWin);
 g.persist?.();
 return true;
}
