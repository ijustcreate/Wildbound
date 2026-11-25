import {ARENA_ARRIVAL,ARENA_BAR,ARENA_BAR_SERVICE,ARENA_ENTRANCES,ARENA_STAIRS,DIAGON_ARENA_ROOM,arenaCanFight,arenaFighter,arenaPlayerSource,inDiagonArena} from './diagon-arena-layout.mjs';
import {ARENA_DRINK_ITEMS,CHAMPION_DRINK,championUnlocked,recordChampionKnockout} from './arena-drink-state.mjs';
import {arenaGuestActors} from './diagon-arena-guests.mjs';
import {dismountBroom} from './broom-mount.mjs';
import {clearGardenCats} from './diagon-garden-cats.mjs';
import {playerInput} from './inventory-input.mjs';
import {itemKind} from './items.mjs';
import {jumpMotion,releaseJump,startJump,tickJump} from './jumping.mjs';
import {hasAimWeapon,updateAimFacing,updateBowAimBlend} from './ranged-aim.mjs';
import {clearSwordPolish} from './sword-charge-state.mjs';
import {clearCharm} from './succubus-charm.mjs';
import {spellTransition} from './portal-transition.mjs';
import {tickNightEquipment} from './night-equipment.mjs';
import {tickPlayerIce} from './frost-prison.mjs';
import {collectNearbyWorldLoot} from './inventory-world.mjs';

const POOLED_ACTORS=['enemies','loot','pickups','baits','spells','arrows','traps','effects',
 'xpOrbs','ghosts','villageFollowers','boomerangs','rifleShots','scenery','succubusKisses','barricades'];
const PANEL_ACTIONS=['close','next','prev','down','up','panel','use','offhand','sockets','store','drop','dropOne','pick','split'];
const within=(p,q,r)=>Math.hypot(p.x-q.x,p.y-q.y)<=r;
const RESET_FIELDS=['trainRide','gardenBench','pirateRide','swordStrike','swordFacing','swordDash',
 'swordDashRequested','queuedAttack','attackClip','locomotionTransition','locomotionTurning','playerFrame','poseTime'];

function settle(p,point,row=0){
 clearSwordPolish(p);
 for(const key of RESET_FIELDS)delete p[key];
 Object.assign(p,point,{room:null,ui:null,swimming:false,underBridge:false,trainGround:0,trainVisualLift:0,
  trainDeck:false,groundHeight:0,jumpHeight:0,jumpVelocity:0,diveDepth:0,attack:0,charge:0,guardWardTime:0,
  swordChargeAim:false,dashTime:0,dashRecovery:0,bowAiming:false,holdingPosition:false,blocking:false,
  moving:false,walking:false,step:0,moveSpeed:0,wingHover:false,consumeInput:false,slideX:0,slideY:0,
  x:point.x+((row%3)-1)*14,y:point.y+Math.floor(row/3)*16});
}

export function enterDiagonArena(g,p,entranceId){
 const t=g.trainTest,door=ARENA_ENTRANCES[entranceId];
 if(!door||t?.design.activeRoom!=='diagon'||p.hp<=0||p.room||!within(p,door,24))return false;
 if(g.players.some(q=>q.room||q.trainRide||q.pirateRide||q.vehicleId||q.controlledFollowerId)){
  g.message?.('Meet at the stairs on foot before entering the vault.');return true;
 }
 if(g.players.some(q=>q.broomMount&&!q.inventory?.some(slot=>slot?.type==='mounted_broom'))){
  g.message?.('Make room for the mounted broom before entering the vault.');return true;
 }
 for(const q of g.players)if(q.broomMount)dismountBroom(g,q);
 clearGardenCats(g);
 const visit=t.arenaSerial=(t.arenaSerial||0)+1;
 t.arena={visit,entranceId,enteredAt:g.time,house:g.house||null,actors:Object.fromEntries(POOLED_ACTORS.map(key=>[key,g[key]||[]])),
  entryHealth:Object.fromEntries(g.players.map(q=>[q.id,q.hp])),talk:{},combatEvents:[],nextCombatEvent:1};
 for(const key of POOLED_ACTORS)g[key]=[];
 g.loot=t.arenaGroundLoot||[];
 delete t.arenaGroundLoot;
 g.house=null;
 t.design.activeRoom=DIAGON_ARENA_ROOM;
 t.wildLandsOverview=false;
 t.noticeUntil=0;
 for(const [i,q] of g.players.entries()){
  clearCharm(q,false);
  settle(q,ARENA_ARRIVAL,i);
  q.arenaVisit=visit;
 }
 spellTransition(g);
 g.persist?.();
 return true;
}

export function leaveDiagonArena(g){
 const t=g.trainTest,state=t?.arena,door=state&&ARENA_ENTRANCES[state.entranceId];
 if(!inDiagonArena(g)||!door)return false;
 t.arenaGroundLoot=g.loot;
 Object.assign(g,state.actors,{house:state.house});
 t.design.activeRoom='diagon';
 delete t.arena;
 for(const [i,p] of g.players.entries()){
  delete p.arenaVisit;
  settle(p,door.arrival,i);
 }
 spellTransition(g);
 g.persist?.();
 return true;
}

export function arenaKnockout(g,p,source){
 const state=g.trainTest?.arena;
 // The ordinary hit path has already lowered the target to zero.
 if(!state||!arenaCanFight(g,source,{...p,hp:1}))return false;
 const winner=arenaPlayerSource(g,source),wasChampion=championUnlocked(winner);
 recordChampionKnockout(winner);
 const original=g.trainTest.returnPlayers?.find(q=>q.id===winner?.id);
 if(original&&original!==winner&&!g.trainTest.persistent)recordChampionKnockout(original);
 const x=p.x,y=p.y;
 recordArenaAction(g,p,'knockout');
 const index=Math.max(0,g.players.indexOf(p));
 settle(p,{x:8055,y:4990,faceX:0,faceY:-1},index);
 p.hp=Math.max(1,Math.min(p.maxHp||100,state.entryHealth[p.id]||1));
 p.invuln=1;p.getUpTime=.35;p.stun=0;p.frozen=0;p.hit=0;
 g.effects.push({x,y:y-28,text:'OUT OF THE RING',color:'#e8cc92',life:1.05});
 g.message?.(p.name+' is back in the gallery.');
 if(!wasChampion&&winner){
  g.effects.push({x:winner.x,y:winner.y-38,text:'CHAMPION’S DRAUGHT UNLOCKED',color:'#f3cc7f',life:1.25});
  g.persist?.();
 }
 return true;
}

function recordArenaAction(g,p,kind){
 const state=g.trainTest.arena,events=state.combatEvents??=[];
 const id=state.nextCombatEvent||1;
 state.nextCombatEvent=id+1;
 events.push({id,kind,at:g.time,x:p.x,y:p.y});
 if(events.length>8)events.shift();
}

const bartender={id:'arena-bartender',name:'Brindle',role:'bartender',title:'Lamplit Vault barkeep',kind:'alley_goblin',sprite:'alley_goblin',
 goblinRole:'bartender',...ARENA_BAR,faceX:0,faceY:1,hp:1,interactAt:ARENA_BAR_SERVICE,
 dialogue:['Mugs stay up here. Broken noses go in the ring.',
  'The lamps mark the boundary. Stand outside them if you want to keep your drink.']};
const guests=[bartender,...arenaGuestActors()];
export const diagonArenaGuests=()=>guests;

const drinks=[['vault_smoke_cider',6],['vault_ember_mead',10],[CHAMPION_DRINK,24]];
export function arenaBarView(g,p){
 const leave={label:'Leave the bar',action:'close'};
 if(!inDiagonArena(g)||p.ui?.ownerDevice!==p.device||!within(p,ARENA_BAR_SERVICE,32))return {text:'The bar is out of reach.',choices:[leave]};
 const won=championUnlocked(p);
 const text=p.ui.notice||(won?"I saw you put someone down in the ring. You've earned a Champion’s Draught. I’ll keep a bottle for you whenever you come back.":'Mugs stay up here. Broken noses go in the ring. What are you drinking?');
 const choices=drinks.slice(0,won?drinks.length:2).map(([type,price])=>({label:ARENA_DRINK_ITEMS[type].name+' · '+price+' gold',detail:ARENA_DRINK_ITEMS[type].description,action:'drink:'+type,type,price,disabled:(p.coins||0)<price}));
 return {npc:bartender,text,choices:[...choices,leave]};
}

export function arenaBarAction(g,p,action,give){
 const ui=p.ui,{npc,choices}=arenaBarView(g,p);
 if(!npc||action==='close'){p.ui=null;p.consumeInput=true;return true;}
 if(['next','prev','up','down'].includes(action)){
  ui.index=(ui.index+choices.length+(['next','down'].includes(action)?1:-1))%choices.length;return true;
 }
 if(action==='use')action=choices[ui.index]?.action;
 if(action?.startsWith('choice:'))action=choices[Number(action.slice(7))]?.action;
 if(action==='close'){p.ui=null;p.consumeInput=true;return true;}
 const choice=choices.find(c=>c.action===action&&!c.disabled);
 if(!choice)return true;
 if(!give(p.inventory,choice.type,1)){ui.notice='Come back when there’s room in your pack.';return true;}
 p.coins-=choice.price;
 if(!g.trainTest.persistent&&g.trainTest.returnPlayers){
  const ledger=((g.trainTest.alleyPurchases??={})[p.id]??={spent:0,gold:0,items:[],delta:{}});
  ledger.spent+=choice.price;ledger.delta[choice.type]=(ledger.delta[choice.type]||0)+1;
 }
 ui.notice='Here you are. Keep the bottle clear of the rail.';
 g.onSound?.('purchase',p);g.persist?.();return true;
}

const exchanges=[
 {at:4,speaker:'Brindle',line:'Clear a spot by the rail. The next round is about to start.'},
 {at:16,speaker:'Lou',line:'The ring’s loud enough. Let the mugs have some peace.'},
 {at:31,speaker:'Brindle',line:'Two cold mugs. One for each person who thinks they won.'},
 {at:43,speaker:'Leeloo Dallas',line:'I heard the bell. I’m still coming back for those olives.'},
];
export function diagonArenaExchange(g,p){
 const at=(g.time-(g.trainTest.arena?.enteredAt||0))%57;
 if(!within(p,ARENA_BAR,145)||arenaFighter(g,p))return null;
 return exchanges.find(exchange=>at>=exchange.at&&at<exchange.at+3.3)||null;
}

function nearbyGuest(p){
 return guests.find(a=>within(p,a.interactAt||a,a.role==='bartender'?24:30));
}
export function diagonArenaPrompt(g,p){
 if(!inDiagonArena(g)||p.hp<=0||p.ui)return '';
 if(within(p,ARENA_STAIRS,28))return 'RETURN TO MERIDIAN HALL';
 const guest=nearbyGuest(p);
 if(guest)return 'TALK TO '+guest.name.toUpperCase();
 if(within(p,ARENA_BAR_SERVICE,25))return 'THE BAR IS A SAFE AREA';
 return '';
}
export function interactDiagonArena(g,p){
 if(!inDiagonArena(g)||p.hp<=0||p.ui||p.jumpHeight>0)return false;
 if(within(p,ARENA_STAIRS,28))return leaveDiagonArena(g);
 const guest=nearbyGuest(p);
 if(!guest)return false;
 if(guest===bartender){p.ui={shop:'npc-dialogue',arenaBar:true,ownerDevice:p.device,index:0,node:'drinks'};p.consumeInput=true;return true;}
 const state=g.trainTest.arena,previous=state.talk[p.id],lines=guest.dialogue||[];
 if(!lines.length)return true;
 const index=previous?.id===guest.id?(previous.index+1)%lines.length:0;
 state.talk[p.id]={id:guest.id,index,speaker:guest.name,line:lines[index],until:g.time+5};
 return true;
}

export function tickDiagonArena(g,dt,inputs){
 if(!inDiagonArena(g))return false;
 const t=g.trainTest;
 if(!t.arena||!['play','won'].includes(g.phase))return true;
 dt=Math.max(0,Math.min(.05,dt));t.time+=dt;g.time+=dt;
 g.tickWorldLoot?.(dt);
 for(const p of g.players){
  const input=playerInput(g.players,p,inputs),previous=t.previous.get(p.id)||{};
  const use=input.interact&&!previous.interact,jump=input.jump&&!previous.jump;
  t.previous.set(p.id,{...input});
  if(p.hp<=0){g.tickDownedPlayer?.(p,dt,inputs);continue;}
  if(input.inventory&&!previous.inventory){
   if(p.ui)p.ui=null;
   else g.openInventory?.(p);
  }
  p.consumeInput=!!p.ui;
  const previousAttack=p.attack||0;
  tickPlayerIce(p,dt);g.tickPlayerCombatTimers?.(p,dt);g.tickHeroVitals?.(p,dt);
  if(p.ui){
   p.moving=false;p.charge=0;p.bowAiming=false;p.swordChargeAim=false;
   for(const action of PANEL_ACTIONS)if(p.ui&&input[action]&&!previous[action])g.inventoryAction?.(p,action);
   continue;
  }
  if(p.stun>0||p.frozen>0||p.sleeping>0){p.moving=false;continue;}
  if(input.loot&&!previous.loot)collectNearbyWorldLoot(g,p);
  else if(use&&!collectNearbyWorldLoot(g,p,true)){
   if(!interactDiagonArena(g,p))collectNearbyWorldLoot(g,p);
   if(!inDiagonArena(g))return true;
  }
  const fighter=arenaFighter(g,p);
  updateAimFacing(p,input);
  p.bowAiming=!!(fighter&&input.block&&hasAimWeapon(p));
  p.holdingPosition=!!(fighter&&input.holdPosition);
  p.blocking=!!(fighter&&input.block&&!hasAimWeapon(p)&&itemKind(p.equipment?.hand2)==='shield');
  updateBowAimBlend(p,fighter?input:{},dt);
  if(fighter){
   g.tickWeaponInput?.(p,input,previous,dt);
   if((p.attack||0)>previousAttack+.015)recordArenaAction(g,p,'attack');
  }
  else if(p.charge||p.swordDash||p.swordStrike||p.queuedAttack){
   clearSwordPolish(p);p.charge=0;p.swordChargeAim=false;
   delete p.swordDash;delete p.swordStrike;delete p.swordFacing;delete p.queuedAttack;
  }
  if(input.potion&&!previous.potion)g.usePotion?.(p);
  if(jump)startJump(p);
  if(!input.jump)releaseJump(p);
  p.jumpHeld=!!input.jump;tickJump(p,dt,g);
  const x=input.x||0,y=input.y||0,length=Math.hypot(x,y),scale=Math.max(1,length);
  const motion=g.playerDashMotion(p,input,dt,x/scale,y/scale);
  const speed=p.bowAiming||p.holdingPosition||p.swordDash||p.swordChargeAim?0:motion.speed;
  const stride=jumpMotion(p,motion.x,motion.y,speed,dt);
  const moved=speed?g.moveActor(p,stride?.dx??motion.x*speed*dt,stride?.dy??motion.y*speed*dt):0;
  if(moved>.02&&!p.swordFacing&&Math.hypot(input.aimX||0,input.aimY||0)<.2&&length>.05){
   p.faceX=x/length;p.faceY=y/length;
  }
  g.tickMeleeContact?.(p);
  p.moving=moved>.02;p.walking=p.moving&&length<.75;p.step=(p.step||0)+moved*.13;
  p.moveSpeed=moved/Math.max(.001,dt);p.movementGait=p.moving?p.walking?'walk':'run':'idle';
  g.tickAutomaticLoot?.(p);
 }
 tickNightEquipment(g,dt);
 g.tickProjectiles?.(dt);
 for(const fx of g.effects)fx.life-=dt;
 g.effects=g.effects.filter(fx=>fx.life>0);
 return true;
}
