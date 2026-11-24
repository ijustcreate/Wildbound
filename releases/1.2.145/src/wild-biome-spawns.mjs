import {creatures} from './definitions.mjs';
import {actorRadius} from './navigation.mjs';
import {streamRegion} from './railway-stream.mjs';
import {nearestTrainTrack} from './train-track.mjs';
import {WILD_LANDS_EXIT,WILD_LANDS_GATES,WILD_LANDS_STOPS,wildHash,wildLandsGround,wildLandsSurfaceAt} from './wild-lands-world.mjs';
import {WILD_LANDS_SITES} from './wild-lands-content.mjs';
import {WILD_HOMESTEAD,WILDS_OVERLOOK,inOverlookGround} from './overlook-maze-layout.mjs';
import {PIRATE_SHIP_BERTH} from './pirate-ship.mjs';
import {wildLandsPathAt} from './wild-lands-geography.mjs';
import {initializeImp} from './imps.mjs';
import {initializeZombie} from './zombies.mjs';
import {tideglassIntersects,tideglassSafePoint} from './tideglass-layout.mjs';
import {stopCrabPincer} from './crab-pincer.mjs';
import {wildHomesteadAt} from './wild-homestead-layout.mjs';
import {inBayouGoblinHut} from './bayou-goblin-hut-layout.mjs';
import {MERLOCK_CAMPS,MERLOCK_CAMP_AGGRO,MERLOCK_CAMP_WAKE,merlockCampGround,merlockCampOf,strollMerlockCamp} from './wild-merlock-camps.mjs';
import {interruptShoreGoblin} from './shore-goblin-state.mjs';

const biomeGroups={
 forest:[['wolf','wolf'],['boar'],['vine','snake'],['beetle','spider']],
 jungle:[['tiger'],['monkey','snake'],['carnivorous_flower','spider'],['tarantula']],
 ice:[['frost_skeleton_mage','skeleton_unarmed'],['water_elemental'],['white_lion'],['wolf','wolf']],
 graveyard:[['skeleton','skeleton_unarmed'],['zombie','zombie'],['ghost'],['skeleton_wizard','skeleton_unarmed']],
 house:[['beetle'],['vine'],['imp'],['spider','spider']],
 beach:[['crab','crab'],['shore_goblin','shore_goblin'],['skeleton_deckhand'],['water_elemental']],
 swamp:[['crocodile'],['spore','snake'],['zombie','water_elemental'],['tarantula']],
 tideglass:[['water_elemental'],['shore_goblin','shore_goblin'],['arcane_eye'],['crab','crab']],
 caverns:[['bat','bat'],['arcane_eye'],['cave_monster'],['crystal_golem','eye_tentacle']],
 shadow:[['watcher'],['evil_hand','enchanted_book'],['ghost','ghost'],['forest_golem']],
};
const slimeHabitats={forest:'forest',jungle:'forest',ice:'ice',graveyard:'graveyard',beach:'beach',swamp:'graveyard',tideglass:'beach',caverns:'temple'};
export const WILD_BIOME_GROUPS=Object.freeze(Object.fromEntries(Object.entries(biomeGroups).map(([biome,groups])=>[
 biome,slimeHabitats[biome]?[...groups,['slime']]:groups,
])));

const CELL=512,WAKE_NEAR=490,WAKE_FAR=940,SLEEP_DISTANCE=1660;
const CHASE_RADIUS=365,MAX_LIVE=24,MAX_LOCAL=12,REGROW_TIME=480;
const roomKey=d=>d.activeRoom||'surface';
const enabled=d=>d?.wildLands&&(!d.activeRoom||d.activeRoom==='caverns'||d.activeRoom==='shadow');
const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
const onFoot=p=>p.hp>0&&!p.room&&!p.trainRide&&!p.pirateRide&&!p.broomMount&&!p.wingHover&&!p.swimming&&
 !p.disconnected&&!p.lobbyDisconnected&&!p.unavailable&&!p.spectator;
const collisionNeighbors=[[42,0],[-42,0],[0,42],[0,-42]];
const runtimes=new WeakMap();

export function wildBiomeSafe(t,x,y){
 const d=t.design,point={x,y};
 if(d.activeRoom)return distance(point,WILD_LANDS_EXIT)<285||
  WILD_LANDS_SITES.some(s=>s.room===d.activeRoom&&distance(s,point)<145);
 return (d.wildStops||WILD_LANDS_STOPS).some(s=>Math.abs(x-s.x)<625&&Math.abs(y-(s.y-100))<420)||
  WILD_LANDS_GATES.some(s=>distance(s,point)<285)||
  WILD_LANDS_SITES.some(s=>!s.room&&distance(s,point)<(s.id==='hearth'?450:170))||
  inOverlookGround(WILDS_OVERLOOK,x,y,100)||inBayouGoblinHut(x,y,235)||distance(PIRATE_SHIP_BERTH,point)<520||
  wildLandsGround(d,x,y)==='mountain'||tideglassIntersects(x-1,y-1,x+1,y+1)&&tideglassSafePoint(x,y);
}

function groupPlan(d,cx,cy,key){
 const seed=Number(d.seed)||Number(d.forestSeed)||0;
 const biome=wildLandsGround(d,cx*CELL+CELL/2,cy*CELL+CELL/2),group=biomeGroups[biome];
 if(!group)return null;
 const roll=i=>wildHash(cx*79+i*241+seed,cy*137-seed+i*197);
 const kinds=group[Math.floor(roll(1)*group.length)];
 const positionsFor=index=>Array.from({length:7},(_,i)=>{
   const offset=index*17+i+2;
   return {x:Math.floor(cx*CELL+48+roll(offset)*416),y:Math.floor(cy*CELL+48+roll(offset+113)*416)};
 });
 const wolves=kinds[0]==='wolf'?Array.from({length:2+Math.floor(roll(209)*4)},(_,index)=>({
  kind:'wolf',key:`${key}:${index}`,
 })):null;
 if(wolves){
  const angle=roll(217)*Math.PI*2;
  for(const [index,wolf] of wolves.entries()){
   const bearing=angle+index*Math.PI*2/wolves.length;
   wolf.offset={x:Math.round(67*Math.cos(bearing)),y:Math.round(67*Math.sin(bearing))};
   wolf.packSize=wolves.length;wolf.alpha=index===4;
  }
 }
 const members=wolves?[]:kinds.map((kind,index)=>{
  const occasional = biome === 'swamp' && kind === 'water_elemental';
  return {kind,key:`${key}:${index}`,positions:positionsFor(index),newArrival:!occasional||roll(181)<1/3};
 });
 const slime=slimeHabitats[biome]&&{kind:'slime',key:`${key}:slime`,positions:positionsFor(11),newArrival:roll(195)<.47,
  slimeBiome:slimeHabitats[biome],slimeVariant:Math.floor(roll(199)*3)};
 return {key,biome,members,slime,wolves,dens:wolves?positionsFor(0):null};
}

function fixedPlacement(g,t,plan,member,point,live){
 const {x,y}=point,d=t.design,r=actorRadius(member);
 if(x<32||y<32||x>d.width-32||y>d.height-32||wildLandsGround(d,x,y)!==plan.biome||
    wildLandsSurfaceAt(d,x,y)!=='grass'||wildBiomeSafe(t,x,y)||!d.activeRoom&&wildLandsPathAt(x,y))return false;
 if(!d.activeRoom&&[t.route,...(t.otherRoutes||[])].some(route=>route&&nearestTrainTrack(route,x,y).distance<105))return false;
 if(live.some(e=>distance(e,point)<54))return false;
 if(!streamRegion(t,x,y,4))return null;
 if(g.blocked(x,y,r+6))return false;
 return collisionNeighbors.some(([dx,dy])=>!g.blocked(x+dx,y+dy,r));
}

function spawn(g,plan,member,point,record){
 const {kind,key}=member,{x,y}=point,stats=creatures[kind]?.stats;
 if(!stats)return null;
 const enemy={
  id:g.nextId++,kind,skin:kind,group:kind==='slime'?key:plan.key,x,y,homeX:x,homeY:y,
  wildSpawnKey:key,wildSpawnBiome:plan.biome,wildSpawnRoom:roomKey(g.trainTest.design),
  hp:stats.hp,maxHp:stats.hp,damage:stats.damage,speed:stats.speed,
  state:'hunt',faceX:0,faceY:1,step:0,attack:0,cooldown:1.05,flash:0,dx:0,dy:0,timer:1,tacticTime:1.6,
  orbit:1,temperament:'patient',
 };
 if(member.role){
  enemy.name='Merlock';
  enemy.merlockCamp=plan.key;enemy.merlockPost=member.index;
  enemy.shoreRole=member.role;enemy.shoreColor=member.role==='healer'?2:member.role==='spear'?1:0;
  enemy.animationAction='idle';
 }
 if(kind==='imp')initializeImp(enemy);
 if(kind==='zombie')initializeZombie(enemy,enemy.id);
 if(kind==='slime'){enemy.slimeBiome=member.slimeBiome;enemy.slimeVariant=member.slimeVariant;}
 g.configureCreature(enemy,false);
 if(enemy.faction!=='enemy')return null;
 if(member.packSize){
  enemy.wildWolfPackSize=member.packSize;
  if(member.alpha){enemy.alpha=true;enemy.wildAlphaWolf=true;enemy.name='Alpha Wolf';}
 }
 if(Number.isFinite(record?.hp))enemy.hp=Math.min(enemy.hp,Math.max(1,record.hp));
 g.enemies.push(enemy);
 return enemy;
}

function wakeMerlockCamps(g,t,anchors,live,active){
 const d=t.design;
 for(const camp of MERLOCK_CAMPS){
  if(!anchors.some(p=>distance(p,camp)<MERLOCK_CAMP_WAKE))continue;
  const nearby=live.filter(e=>distance(e,camp)<WAKE_FAR).length;
  const pending=camp.members.filter(member=>{
   const record=t.wildBiomeSpawns?.[member.key];
   return !active.has(member.key)&&(record?.defeatedAt==null||t.time-record.defeatedAt>=REGROW_TIME);
  });
  if(!pending.length||pending.length+nearby>MAX_LOCAL||pending.length+live.length>MAX_LIVE)continue;
  if(!merlockCampGround(d,camp)||!streamRegion(t,camp.x,camp.y,8))continue;
  if([t.route,...(t.otherRoutes||[])].some(route=>route&&nearestTrainTrack(route,camp.x,camp.y).distance<200))continue;
  const points=pending.map(member=>({member,record:t.wildBiomeSpawns?.[member.key]}));
  if(points.some(({member,record})=>{
   const point=record?.home||member;
   return wildBiomeSafe(t,point.x,point.y)||g.blocked(point.x,point.y,13)||
    anchors.some(p=>distance(p,point)<32)||live.some(e=>distance(e,point)<25);
  }))continue;
  for(const {member,record} of points){
   const enemy=spawn(g,camp,member,record?.home||member,record);
   if(!enemy)continue;
   if(record?.defeatedAt!=null)delete t.wildBiomeSpawns[member.key];
   active.add(member.key);live.push(enemy);
  }
 }
}

const BOARD_ENCOUNTER='homestead-board-encounter';
export function spawnHomesteadBoardEncounter(g,rollerId){
 const t=g.trainTest,d=t.design,board=t.homesteadBoard;
 if(!board||board.encounter||g.enemies.some(e=>e.wildSpawnKey===BOARD_ENCOUNTER&&e.hp>0))return null;
 const anchor=g.players.find(p=>p.id!==rollerId&&onFoot(p)&&distance(p,WILD_HOMESTEAD)<500);
 if(!anchor)return null;
 const kind=g.random()<.6?'wolf':'beetle',start=g.random()*Math.PI*2;
 for(const radius of [500,600,700,800])for(let i=0;i<12;i++){
  const angle=start+i*Math.PI/6,x=Math.round(WILD_HOMESTEAD.x+Math.cos(angle)*radius),y=Math.round(WILD_HOMESTEAD.y+Math.sin(angle)*radius);
  if(distance(anchor,{x,y})>760||wildHomesteadAt(d,x,y,115)||g.players.some(p=>p.hp>0&&distance(p,{x,y})<210))continue;
  const plan={key:BOARD_ENCOUNTER,biome:wildLandsGround(d,x,y)},member={kind,key:BOARD_ENCOUNTER};
  if(!fixedPlacement(g,t,plan,member,{x,y},g.enemies.filter(e=>e.hp>0)))continue;
  const enemy=spawn(g,plan,member,{x,y});
  if(enemy){if(t.wildBiomeSpawns)delete t.wildBiomeSpawns[BOARD_ENCOUNTER];board.encounter={x,y,kind,biome:plan.biome};return enemy;}
 }
 return null;
}

export function recordWildBiomeDefeat(g,enemy){
 const t=g.trainTest;
 if(!t||!enemy.wildSpawnKey)return;
 (t.wildBiomeSpawns??={})[enemy.wildSpawnKey]={defeatedAt:t.time};
 if(enemy.wildSpawnKey===BOARD_ENCOUNTER&&t.homesteadBoard)delete t.homesteadBoard.encounter;
}

function hibernate(g,t,anchors){
 const live=[];
 let far=null;
 for(const e of g.enemies){
  if(!e.wildSpawnKey||e.hp<=0)continue;
  if(e.wildSpawnRoom!==roomKey(t.design)||!anchors.some(p=>distance(p,e)<SLEEP_DISTANCE)){
   (far??=new Set()).add(e);
   const progress=t.wildBiomeSpawns??={};
   progress[e.wildSpawnKey]={home:{x:e.homeX,y:e.homeY},...(e.hp<e.maxHp?{hp:e.hp}:{}),
    ...(e.wildWolfPackSize?{wolfPackSize:e.wildWolfPackSize}:{})};
  }else live.push(e);
 }
 if(far)g.enemies=g.enemies.filter(e=>!far.has(e));
 return live;
}

function placeWolfPack(g,t,plan,live,active,anchors,probe){
 const saved=t.wildBiomeSpawns||{},present=live.filter(e=>e.kind==='wolf'&&e.group===plan.key);
 const due=plan.wolves.filter(w=>!active.has(w.key)&&!(saved[w.key]?.defeatedAt!=null&&t.time-saved[w.key].defeatedAt<REGROW_TIME));
 if(!due.length||live.length+due.length>MAX_LIVE)return 0;
 const savedMember=plan.wolves.find(w=>saved[w.key]?.home||present.some(e=>e.wildSpawnKey===w.key));
 const home=savedMember&&(present.find(e=>e.wildSpawnKey===savedMember.key)||saved[savedMember.key].home);
 // A surviving or hibernated wolf fixes the pack's den across reloads. In an
 // older save this also gathers the old independently scattered packmates.
 let dens=plan.dens;
 if(home){
  const anchored={x:(home.homeX??home.x)-savedMember.offset.x,y:(home.homeY??home.y)-savedMember.offset.y};
  dens=present.length||saved[savedMember.key]?.wolfPackSize?[anchored]:[anchored,...plan.dens];
 }
 for(const den of dens){
  const points=due.map(wolf=>({x:den.x+wolf.offset.x,y:den.y+wolf.offset.y}));
  if(points.some(point=>!anchors.some(p=>distance(p,point)<WAKE_FAR)||g.players.some(p=>p.hp>0&&distance(p,point)<WAKE_NEAR)))continue;
  if(points.some(point=>live.filter(e=>distance(e,point)<WAKE_FAR).length+points.length>MAX_LOCAL))continue;
  if(!due.every((wolf,index)=>probe()&&fixedPlacement(g,t,plan,wolf,points[index],live)))continue;
  for(const e of present)e.wildWolfPackSize=plan.wolves.length;
  let placed=0;
  for(const [index,wolf] of due.entries()){
   const record=saved[wolf.key],enemy=spawn(g,plan,wolf,points[index],record);
   if(!enemy)continue;
   if(record?.defeatedAt!=null)delete saved[wolf.key];
   active.add(wolf.key);live.push(enemy);placed++;
  }
  return placed;
 }
 return 0;
}

export function tickWildBiomeSpawns(g){
 const t=g.trainTest,d=t?.design;
 if(!enabled(d)||t.wildLandsOverview||d.activeRoom&&!t.wildBiomeRoomActors?.surface)return;
 let runtime=runtimes.get(t);
 if(!runtime||runtime.room!==roomKey(d)){
  runtime={room:roomKey(d),next:t.time+.45,plans:new Map(),invalid:new Map()};runtimes.set(t,runtime);
 }
 if(t.time<runtime.next)return;
 runtime.next=t.time+.35;
 const anchors=g.players.filter(onFoot);
 const live=hibernate(g,t,g.players.filter(p=>p.hp>0&&!p.disconnected&&!p.lobbyDisconnected&&!p.spectator));
 if(!anchors.length||live.length>=MAX_LIVE)return;
 const boardEncounter=!d.activeRoom&&t.homesteadBoard?.encounter;
 if(boardEncounter&&!live.some(e=>e.wildSpawnKey===BOARD_ENCOUNTER)&&anchors.some(p=>distance(p,boardEncounter)<WAKE_FAR)){
  const {kind,biome}=boardEncounter,plan={key:BOARD_ENCOUNTER,biome},member={kind,key:BOARD_ENCOUNTER};
  const record=t.wildBiomeSpawns?.[BOARD_ENCOUNTER];
  if(fixedPlacement(g,t,plan,member,boardEncounter,live)){
   const foe=spawn(g,plan,member,boardEncounter,record);
   if(foe)live.push(foe);
  }
 }
 const active=new Set(live.map(e=>e.wildSpawnKey)),area=new Map(),room=roomKey(d);
 if(!d.activeRoom)wakeMerlockCamps(g,t,anchors,live,active);
 if(live.length>=MAX_LIVE)return;
 for(const p of anchors){
  const cx=Math.floor(p.x/CELL),cy=Math.floor(p.y/CELL);
  for(let y=cy-2;y<=cy+2;y++)for(let x=cx-2;x<=cx+2;x++){
   const key=`${room}:${x}:${y}`,gap=Math.hypot((x+.5)*CELL-p.x,(y+.5)*CELL-p.y);
   if(gap<WAKE_FAR+CELL/2&&gap<(area.get(key)?.gap??Infinity))area.set(key,{x,y,key,gap});
  }
 }
 let placed=0,tries=0;
 const plans=[];
 for(const cell of [...area.values()].sort((a,b)=>a.gap-b.gap)){
  if(!runtime.plans.has(cell.key))runtime.plans.set(cell.key,groupPlan(d,cell.x,cell.y,cell.key));
  const plan=runtime.plans.get(cell.key);
  if(plan)plans.push(plan);
 }
 const placeMember=(plan,member)=>{
  const record=t.wildBiomeSpawns?.[member.key];
  if(active.has(member.key)||record?.defeatedAt!=null&&t.time-record.defeatedAt<REGROW_TIME)return false;
  if(!member.newArrival&&!record?.home)return false;
  const invalid=runtime.invalid.get(member.key)||new Set();
  runtime.invalid.set(member.key,invalid);
  const positions=record?.home?[record.home]:member.positions;
  for(const [index,point] of positions.entries()){
   if(!record?.home&&invalid.has(index)||!anchors.some(p=>distance(p,point)<WAKE_FAR)||
      g.players.some(p=>p.hp>0&&distance(p,point)<WAKE_NEAR))continue;
   if(live.filter(e=>distance(e,point)<WAKE_FAR).length>=MAX_LOCAL)continue;
   if(++tries>18)return true;
   const clear=fixedPlacement(g,t,plan,member,point,live);
   if(clear===null)continue;
   if(!clear){
    if(!record?.home&&!live.some(e=>distance(e,point)<54))invalid.add(index);
    continue;
   }
   const enemy=spawn(g,plan,member,point,record);
   if(enemy){
    if(record?.defeatedAt!=null)delete t.wildBiomeSpawns[member.key];
    active.add(member.key);live.push(enemy);
    return ++placed>=3||live.length>=MAX_LIVE;
   }
  }
  return false;
 };
 for(const plan of plans){
  if(plan.wolves){
   placed+=placeWolfPack(g,t,plan,live,active,anchors,()=>++tries<=18);
   if(placed>=3||tries>=18||live.length>=MAX_LIVE)return;
  }
  for(const member of plan.members)if(placeMember(plan,member))return;
 }
 for(const plan of plans)if(plan.slime&&placeMember(plan,plan.slime))return;
}

export function wildBiomeTargets(g,enemy,targets){
 if(!enemy.wildSpawnKey)return targets;
 const t=g.trainTest,camp=merlockCampOf(enemy);
 const x=camp?.x??enemy.homeX,y=camp?.y??enemy.homeY,radius=camp?MERLOCK_CAMP_AGGRO:CHASE_RADIUS;
 return targets.filter(p=>onFoot(p)&&Math.hypot(p.x-x,p.y-y)<radius&&
  !wildBiomeSafe(t,p.x,p.y));
}

export function tickWildBiomeLeash(g,e,dt,targets){
 if(!e.wildSpawnKey||e.hp<=0||e.stun>0||e.frozen>0||e.sleeping>0||e.state==='snared')return false;
 const x=e.homeX-e.x,y=e.homeY-e.y,distance=Math.hypot(x,y);
 const camp=merlockCampOf(e);
 const inRange=camp?Math.hypot(e.x-camp.x,e.y-camp.y)<MERLOCK_CAMP_AGGRO:distance<CHASE_RADIUS;
 if(targets.length&&inRange&&!e.returningToWildSpawn)return false;
 if(camp&&!targets.length&&distance<21&&!e.attack&&!e.shoreAction){
  delete e.returningToWildSpawn;
  strollMerlockCamp(g,e,dt);return true;
 }
 if(e.kind==='crab'&&e.wildlifeBehaviorPhase)stopCrabPincer(e);
 if(!targets.length&&distance<21&&!e.returningToWildSpawn&&!e.moving&&!e.attack)return true;
 if(!e.returningToWildSpawn){
  e.returningToWildSpawn=true;e.attack=0;
  if(camp&&e.shoreAction)interruptShoreGoblin(e);
  delete e.speciesCombat;delete e.tactics;delete e.groupTurn;
 }
 e.moving=false;
 if(distance<21){delete e.returningToWildSpawn;return !targets.length;}
 if(e.speed<=0)return true;
 const step=Math.min(e.speed*.68*dt,distance),dx=x/distance,dy=y/distance;
 e.faceX=dx;e.faceY=dy;
 if(camp){e.animationAction='walk';e.poseTime=null;}
 const moved=g.moveActor(e,dx*step,dy*step);
 if(camp){e.step+=moved*.12;e.moving=moved>0;}
 if(!moved){
  const side=e.id%2?1:-1;
  if(!g.moveActor(e,(dx-dy*side*.85)*step,(dy+dx*side*.85)*step))
   g.moveActor(e,(dx+dy*side*.85)*step,(dy-dx*side*.85)*step);
 }
 return true;
}
