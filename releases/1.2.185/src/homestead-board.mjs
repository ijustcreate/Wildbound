import {dismissBoardResult,tickBoardSequence} from './board-sequence.mjs';
import {wildHomesteadAt,wildHomesteadBoardTable} from './wild-homestead-layout.mjs';
import {WILD_LANDS_STOPS,wildLandsSurfaceAt} from './wild-lands-world.mjs';
import {spellTransition} from './portal-transition.mjs';
import {spawnHomesteadBoardEncounter} from './wild-biome-spawns.mjs';

const FINISH=48, SUCTION_SECONDS=.76;
const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
const center=b=>({x:b.x+b.w/2,y:b.y+b.h/2});
const available=p=>p.hp>0&&!p.spectator&&!p.disconnected&&!p.lobbyDisconnected&&!p.unavailable;
const pawns=g=>g.players.filter(available).map(({id,device,name,color,hp})=>({id,device,name,color,hp,progress:0,boardProgress:0,rolls:0}));
const canContinue=(g,s)=>s.pawns.some(q=>q.progress<FINISH&&g.players.some(p=>p.id===q.id&&available(p)));
const canCall=(g,s)=>s.pawns.some(q=>q.progress>=FINISH&&g.players.some(p=>p.id===q.id&&available(p)));
const restartable=(g,s)=>s.winnerId!=null||!canContinue(g,s)&&!canCall(g,s);

function access(g,p){
 const d=g.trainTest?.design,b=wildHomesteadBoardTable(d);
 return b&&available(p)&&!p.trainRide&&!p.pirateRide&&!p.vehicleId&&!p.broomMount&&!p.wingHover&&!p.room&&!p.swimming&&!p.bedRest&&
  !(p.jumpHeight>2)&&wildHomesteadAt(d,p.x,p.y)&&distance(p,center(b))<=68;
}

function initialize(g){
 return {pawns:pawns(g),turnOrder:[],turn:0,round:1,locked:false,roll:null,rollCooldown:0,event:null};
}

function nativeView(g,s){
 const view=Object.assign(Object.create(Object.getPrototypeOf(g)),s,{
  players:s.pawns,phase:'play',enemies:[],worldTravel:null,houseWorldsEnabled:false,
  diceCount:g.diceCount,eventDuration:g.eventDuration,random:()=>g.random(),
  message:text=>g.message?.(view.roll?.centerLanding?
   'Center reached! Interact beside the board to call WILDBOUND.':text),onSound:(...args)=>g.onSound?.(...args),
  spawnEvent(){resolveLanding(g,s,this);},
 });
 return view;
}

function sync(s,view){
 for(const key of ['turnOrder','turn','round','locked','roll','rollCooldown','event','eventTime','repeatTurnPlayerId'])s[key]=view[key];
}

function whoseTurn(s){
 if(s.repeatTurnPlayerId!=null)return s.pawns.find(p=>p.id===s.repeatTurnPlayerId);
 return s.locked?s.pawns.find(p=>p.id===s.turnOrder[s.turn]):null;
}

function trimTurn(g,s){
 if(s.roll||s.portal)return;
 if(!canContinue(g,s))return;
 const alive=new Set(g.players.filter(available).map(p=>p.id));
 if(s.repeatTurnPlayerId!=null&&!alive.has(s.repeatTurnPlayerId))s.repeatTurnPlayerId=null;
 for(let i=0;s.locked&&i<s.turnOrder.length;i++){
  const next=whoseTurn(s);if(next&&alive.has(next.id)&&next.progress<FINISH)break;
  s.turn++;if(s.turn>=s.turnOrder.length){s.turn=0;s.round++;}
 }
 if(!s.locked&&s.pawns.filter(p=>alive.has(p.id)&&p.progress<FINISH).every(p=>s.turnOrder.includes(p.id))){
  for(const p of s.pawns)if(!s.turnOrder.includes(p.id))s.turnOrder.push(p.id);
  s.locked=true;s.turn=0;s.round++;
  trimTurn(g,s);
 }
}

export function homesteadBoardPrompt(g,p){
 if(!access(g,p))return '';
 const s=g.trainTest.homesteadBoard;
 if(!s||!s.roll&&!s.portal&&restartable(g,s))return 'PLAY WILDBOUND';
 if(s.portal)return '';
 if(s.roll)return 'WILDBOUND · DICE ROLLING';
 if(s.pawns.some(q=>q.id===p.id&&q.progress>=FINISH))return 'CALL WILDBOUND';
 if(!canContinue(g,s))return 'WILDBOUND · A PAWN REACHED THE CENTER';
 const owner=whoseTurn(s);
 if(owner&&owner.id!==p.id)return 'WILDBOUND · '+owner.name.toUpperCase()+'’S TURN';
 return 'WILDBOUND · ROLL DICE';
}

export function interactHomesteadBoard(g,p){
 if(!access(g,p))return false;
 const t=g.trainTest;
 let s=t.homesteadBoard;
 if(s?.roll||s?.portal)return true;
 if(!s||restartable(g,s))s=t.homesteadBoard={...initialize(g),encounter:s?.encounter};
 else if(s.pawns.some(q=>q.id===p.id&&q.progress>=FINISH)){
  s.winnerId=p.id;s.event={name:'WILDBOUND!',tip:`${p.name} reached the center.`};s.eventTime=5;
  g.message?.(`${p.name} calls WILDBOUND and wins! Interact at the board to play again.`);
  g.persist?.();return true;
 }
 if(!s.pawns.some(q=>q.id===p.id))s.pawns.push(...pawns(g).filter(q=>q.id===p.id));
 if(s.locked&&!s.turnOrder.includes(p.id))s.turnOrder.push(p.id);
 trimTurn(g,s);
 const view=nativeView(g,s),pawn=s.pawns.find(q=>q.id===p.id);
 if(view.hitTable(pawn)){
  s.event=null;view.event=null;sync(s,view);g.persist?.();
 }else if(!s.roll&&!s.portal&&s.rollCooldown<=0){
  const owner=whoseTurn(s);
  g.message?.(owner?`It’s ${owner.name}’s turn at the Wildbound board.`:`${p.name} has already rolled this round.`);
 }
 return true;
}

function safeDestination(g,x,y){
 const d=g.trainTest.design;
 if(x<100||y<100||x>d.width-100||y>d.height-100||wildHomesteadAt(d,x,y,160))return false;
 if(g.players.some(p=>available(p)&&distance(p,{x,y})<80)||g.enemies.some(e=>e.hp>0&&distance(e,{x,y})<90))return false;
 return [[0,0],[24,0],[-24,0],[0,24],[0,-24]].every(([dx,dy])=>
  wildLandsSurfaceAt(d,x+dx,y+dy)==='grass'&&!g.blocked(x+dx,y+dy,10,false,false,false,0,0,false,{x,y}));
}

function findDestination(g){
 const stops=(g.trainTest.design.wildStops||WILD_LANDS_STOPS).filter(s=>s.id!=='house');
 const start=Math.floor(g.random()*stops.length), side=g.random()<.5?-1:1;
 for(let i=0;i<stops.length;i++){
  const s=stops[(start+i)%stops.length],shift=Math.floor(g.random()*7);
  for(let j=0;j<7;j++){
   const x=s.x+side*(145+(j+shift)%7*57),y=s.y-150-(j+shift)%3*66;
   if(safeDestination(g,x,y))return {x,y,name:s.name};
  }
 }
 return null;
}

function resolveLanding(g,s,view){
 const b=wildHomesteadBoardTable(g.trainTest.design),r=view.roll,p=g.players.find(q=>q.id===r.playerId&&available(q));
 if(b&&p&&[5,8].includes(r.total)){
  const destination=findDestination(g);
  if(destination){
   s.portal={playerId:p.id,fromX:p.x,fromY:p.y,startsAt:g.trainTest.time,...destination,encounter:g.random()<.28};
   view.event={name:'WILDS PORTAL',tip:`The board pulls ${p.name} into the Wild Lands.`};
   return;
  }
 }
 view.event={name:'TRAIL '+view.players.find(p=>p.id===r.playerId).progress,tip:`${r.total} rolled`};
}

export function homesteadBoardHolds(g,p){
 const t=g.trainTest,s=t?.homesteadBoard;
 return !!s&&!t.design.activeRoom&&(s.portal?.playerId===p.id||s.roll?.playerId===p.id&&!s.roll.resolved);
}

export function homesteadBoardView(g,closeup=false){
 const t=g.trainTest;
 if(!t?.design.wildLands||t.design.activeRoom)return null;
 const s=t.homesteadBoard;
 const roll=closeup&&(s?.portal||s?.roll?.teleported)?null:s?.roll||null;
 if(closeup&&!roll)return null;
 return {...s,players:s?.pawns||pawns(g),roll,time:g.time,generatedEnvironment:'forest'};
}

export function dismissHomesteadBoardResult(g){
 const t=g.trainTest,s=t?.homesteadBoard;
 if(!t?.design.wildLands||t.design.activeRoom||!s?.roll?.resolved||s.portal||s.roll.teleported)return false;
 const view=nativeView(g,s);
 if(!dismissBoardResult(view))return false;
 sync(s,view);
 g.persist?.();
 return true;
}

export function homesteadBoardSuction(g){
 const t=g.trainTest,s=t?.homesteadBoard,portal=s?.portal;
 if(!portal||t.design.activeRoom)return null;
 const table=wildHomesteadBoardTable(t.design);
 if(!table)return null;
 const {x,y}=center(table),u=Math.max(0,Math.min(1,(t.time-portal.startsAt)/SUCTION_SECONDS));
 const pull=u*u*(3-2*u);
 return {table,playerId:portal.playerId,x,y,u,actorX:portal.fromX+(x-portal.fromX)*pull,actorY:portal.fromY+(y-portal.fromY-table.surfaceHeight)*pull-8*Math.sin(Math.PI*u),scale:1-.85*pull};
}

export function tickHomesteadBoard(g,dt,inputs={}){
 const t=g.trainTest,s=t?.homesteadBoard;
 if(!s||t.design.activeRoom)return;
 trimTurn(g,s);
 let dismissedPlayerId;
 if(!s.roll)s.rollCooldown=Math.max(0,s.rollCooldown-dt);
 else{
  const view=nativeView(g,s),wasResolved=s.roll.resolved,oldRoll=s.roll;
  const pawn=s.pawns.find(p=>p.id===oldRoll.playerId);
  const player=g.players.find(p=>p.id===oldRoll.playerId);
  const input=player&&available(player)&&inputs[player.device];
  if(pawn&&player)pawn.device=player.device;
  // The portal hides the closeup and runs to completion independently.
  const controls=input&&!s.portal&&!oldRoll.teleported?{[player.device]:{...input,use:input.use||input.interact||input.close}}:{};
  tickBoardSequence(view,dt,controls);sync(s,view);
  if(!s.roll)dismissedPlayerId=oldRoll.playerId;
  if(wasResolved!==oldRoll.resolved||!s.roll)g.persist?.();
 }
 const portal=s.portal;
 if(!portal||t.time-portal.startsAt<SUCTION_SECONDS)return dismissedPlayerId;
 s.portal=null;
 if(s.roll)s.roll.teleported=true;
 const p=g.players.find(q=>q.id===portal.playerId&&available(q));
 const spot=p&&(safeDestination(g,portal.x,portal.y)?portal:findDestination(g));
 if(spot){
  Object.assign(p,{x:spot.x,y:spot.y,room:null,swimming:false,underBridge:false,trainDeck:false,trainGround:0,trainVisualLift:0,
   jumpHeight:0,jumpVelocity:0,groundHeight:0,moving:false,walking:false,moveSpeed:0,diveDepth:0,ui:null});
  spellTransition(g,[p.id],{effect:'portkey'});
  const encounter=portal.encounter&&spawnHomesteadBoardEncounter(g,p.id);
  g.message?.(`${p.name} landed near ${spot.name}. Return to the Homestead board for your next roll.${encounter?` A ${encounter.kind} was drawn to the Homestead trail.`:''}`);
 }else if(p)g.message?.('The portal closed without finding a clear landing.');
 g.persist?.();
 return dismissedPlayerId;
}
