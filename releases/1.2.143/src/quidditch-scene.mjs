import {broomFlightSpeed,dismountBroom} from './broom-mount.mjs';
import {playerInput} from './inventory-input.mjs';
import {spellTransition} from './portal-transition.mjs';
import {QUIDDITCH_ROOM,QUIDDITCH_ARRIVAL,QUIDDITCH_RETURN,QUIDDITCH_RACK,QUIDDITCH_TEAMS,PITCH_FLIGHT_MIN,PITCH_FLIGHT_MAX,quidditchFieldBlocked} from './quidditch-layout.mjs';
import {createQuidditchMatch,advanceQuidditchMatch,quidditchAction,quidditchPrompt} from './quidditch-match.mjs';
import {clearGardenCats} from './diagon-garden-cats.mjs';
import {nearbyQuidditchTalker,openQuidditchDialogue} from './quidditch-dialogue.mjs';
import {actorRadius} from './navigation.mjs';
import {clearSwordPolish} from './sword-charge-state.mjs';
import {tickChampionDraught} from './arena-drink-state.mjs';
import {tickBellglassMushroom} from './bellglass-mushroom-state.mjs';

export {QUIDDITCH_COACH,quidditchCoachActor} from './quidditch-dialogue.mjs';

export const inQuidditch=g=>g.trainTest?.design.activeRoom===QUIDDITCH_ROOM;
const nearby=(p,point,r)=>Math.hypot(p.x-point.x,p.y-point.y)<r;
const limit=(v,lo,hi)=>Math.max(lo,Math.min(hi,v));
const panelInputs=['close','next','prev','down','up','panel','use','offhand','sockets','store','drop','dropOne','pick','split'];
const footingAngles=[Math.PI/2,0,Math.PI,Math.PI*1.5,Math.PI/4,Math.PI*.75,Math.PI*1.25,Math.PI*1.75];
const ballInput=input=>!!(input.quidditchBall??input.tvX);

export function quidditchVisualActor(p){
 return {...p,equipment:{...p.equipment,hand1:null,hand2:null},attack:0,charge:0,bowAiming:false,
  bowAimBlend:undefined,blocking:false,swordChargeAim:false,swordPolish:undefined};
}

// Land beside a stand or trunk instead of dropping a grounded body inside it.
// The same correction applies to a checkpoint saved before this rule existed.
function recoverPitchFooting(p){
 const r=actorRadius(p),elevation=(p.jumpHeight||0)+(p.groundHeight||0);
 if(!quidditchFieldBlocked(p.x,p.y,r,elevation))return;
 for(const reach of [14,20,26,31,40,52,68,92])for(const angle of footingAngles){
  const x=p.x+Math.cos(angle)*reach,y=p.y+Math.sin(angle)*reach;
  if(!quidditchFieldBlocked(x,y,r,elevation)){Object.assign(p,{x,y});return;}
 }
}

function land(g,p){
 if(p.quidditchLoaner){delete p.broomMount;delete p.quidditchLoaner;}
 else if(p.broomMount&&!dismountBroom(g,p))return false;
 p.jumpHeight=p.jumpVelocity=p.groundHeight=0;
 delete p.quidditchAltitude;
 if(inQuidditch(g))recoverPitchFooting(p);
 return true;
}
function placeParty(g,point){
 for(const [i,p] of g.players.entries()){
  const col=i%3-1,row=Math.floor(i/3);
  Object.assign(p,{x:point.x+col*18,y:point.y+row*17,ui:null,swimming:false,underBridge:false,trainDeck:false,
   trainGround:0,trainVisualLift:0,groundHeight:0,attack:0,charge:0,jumpHeight:0,jumpVelocity:0,dashTime:0,moving:false});
  delete p.trainRide;
  delete p.gardenBench;
  clearSwordPolish(p);
  Object.assign(p,{bowAiming:false,bowAimBlend:undefined,blocking:false,queuedAttack:null});
 }
}
export function visitQuidditchPitch(g,p,returnPoint){
 const t=g.trainTest;
 if(t?.design.activeRoom!=='diagon'||p.hp<=0||g.players.some(q=>q.trainRide||q.pirateRide||q.vehicleId))return false;
 for(const q of g.players)if(!land(g,q))return false;
 clearGardenCats(g);
 t.quidditchReturn={x:returnPoint.x,y:returnPoint.y+12};
 t.quidditch=createQuidditchMatch({players:g.players,seed:g.seed||1});
 t.design.activeRoom=QUIDDITCH_ROOM;
 t.wildLandsOverview=false;t.noticeUntil=0;
 placeParty(g,QUIDDITCH_ARRIVAL);
 spellTransition(g,null,{effect:'portkey'});g.persist?.();
 return true;
}

function leaveQuidditchPitch(g){
 const t=g.trainTest;
 if(!t.quidditchReturn)return false;
 for(const p of g.players)if(!land(g,p))return false;
 placeParty(g,t.quidditchReturn);
 t.design.activeRoom='diagon';
 if(t.quidditch?.result)t.alleyQuidditchResult=t.quidditch.result;
 delete t.quidditchReturn;delete t.quidditch;
 spellTransition(g,null,{effect:'portkey'});g.persist?.();
 return true;
}
function matchFor(g){const t=g.trainTest;return t.quidditch??=createQuidditchMatch({players:g.players,seed:g.seed||1});}
export function quidditchScenePrompt(g,p){
 if(!inQuidditch(g)||p.hp<=0||p.ui)return '';
 if((p.jumpHeight||0)<52&&nearby(p,QUIDDITCH_RETURN,41))return 'PORTKEY TO DIAGON ALLEY';
 if(!p.broomMount&&nearby(p,QUIDDITCH_RACK,48))return 'BORROW A PRACTICE BROOM';
 const action=quidditchPrompt(matchFor(g),p,g.players);
 if(action)return action;
 const actor=nearbyQuidditchTalker(g,p);
 return actor?'TALK TO '+actor.name.toUpperCase():'';
}

export function interactQuidditchScene(g,p){
 if(!inQuidditch(g)||p.hp<=0||p.ui)return false;
 if((p.jumpHeight||0)<52&&nearby(p,QUIDDITCH_RETURN,41))return leaveQuidditchPitch(g);
 if(!p.broomMount&&nearby(p,QUIDDITCH_RACK,48)){
  p.broomMount={item:{type:'flying_broom',qty:1},time:0};p.quidditchLoaner=true;
  p.quidditchAltitude=42;g.onSound?.('mount',p);
  return true;
 }
 const match=matchFor(g),action=quidditchPrompt(match,p,g.players);
 if(action==='OPEN BALL TRUNK'||action==='START REMATCH'||action==='TURN IN SNITCH'){
  const result=quidditchAction(match,p,'interact');
  if(match.phase==='finished')recoverPitchFooting(p);
  return result;
 }
 return openQuidditchDialogue(g,p,nearbyQuidditchTalker(g,p));
}

export function tickQuidditchScene(g,dt,inputs){
 if(!inQuidditch(g))return false;
 if(!['play','won'].includes(g.phase))return true;
 const t=g.trainTest,match=matchFor(g),firstEvent=match.nextEvent;
 dt=limit(dt,0,.05);t.time+=dt;g.time+=dt;
 for(const p of g.players){
  tickChampionDraught(p,dt);tickBellglassMushroom(p,dt);
  const old=t.previous.get(p.id)||{},input=playerInput(g.players,p,inputs);
  t.previous.set(p.id,{...input});
  if(p.hp<=0){p.moving=false;g.tickDownedPlayer?.(p,dt,inputs);continue;}
  if(input.inventory&&!old.inventory){
   if(p.ui)p.ui=null;
   else{if(p.quidditchLoaner)land(g,p);g.openInventory?.(p);}
  }
  if(p.ui){
   p.moving=false;
   for(const action of panelInputs)if(p.ui&&input[action]&&!old[action])g.inventoryAction?.(p,action);
   continue;
  }
  const dismount=p.device==='keyboard'?input.block&&!old.block:input.loot&&!old.loot;
  if(p.broomMount&&dismount)land(g,p);
  if(p.broomMount){
   p.broomMount.time=(p.broomMount.time||0)+dt;
   p.quidditchAltitude=limit((p.quidditchAltitude??Math.max(42,p.jumpHeight||0))+
    ((input.jump?1:0)-(input.dodge?1:0))*68*dt,PITCH_FLIGHT_MIN+3,PITCH_FLIGHT_MAX);
   p.jumpHeight+=(p.quidditchAltitude-(p.jumpHeight||0))*(1-Math.exp(-dt*10));
  }else p.jumpHeight=0;
  recoverPitchFooting(p);
  const x=input.x||0,y=input.y||0,span=Math.max(1,Math.hypot(x,y));
  const staggered=(match.stagger?.[String(p.id)]||0)>match.time;
  const speed=(p.broomMount?broomFlightSpeed(p):133)*(staggered ? .38 : 1);
  const moved=g.moveActor(p,x/span*speed*dt,y/span*speed*dt,!!p.broomMount);
  p.moveSpeed=moved/Math.max(dt,.001);p.moving=moved>.05;
  if(Math.hypot(input.aimX||0,input.aimY||0)>.24){p.faceX=input.aimX;p.faceY=input.aimY;}
  else if(Math.hypot(x,y)>.1){p.faceX=x/span;p.faceY=y/span;}
  p.movementGait=p.moving?'run':'idle';p.locomotionTransition=null;
  if(input.interact&&!old.interact)interactQuidditchScene(g,p);
  if(!inQuidditch(g))return true;
  if(ballInput(input)&&!ballInput(old))quidditchAction(match,p,'ball',{aimX:p.faceX,aimY:p.faceY},g.players);
 }
 advanceQuidditchMatch(match,dt,g.players);
 for(const event of match.events)if(event.id>=firstEvent){
  const sounds={open:'door',throw:'swing','quaffle-caught':'pickup','quaffle-stolen':'pickup','bludger-swatted':'hit',goal:'confirm',stagger:'hit','snitch-caught':'magic',finish:'win'};
  if(sounds[event.type])g.onSound?.(sounds[event.type],event);
  if(event.type==='finish'){
   const result=match.winner==='tie'?'The match ends in a draw.':`${QUIDDITCH_TEAMS[match.winner].name} wins the match!`;
   g.message?.(result);g.persist?.();
  }
 }
 return true;
}
