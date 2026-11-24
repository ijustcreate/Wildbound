import {creatures} from './definitions.mjs';
import {actorRadius} from './navigation.mjs';
import {streamRegion} from './railway-stream.mjs';
import {nearestTrainTrack} from './train-track.mjs';
import {WILD_LANDS_EXIT,WILD_LANDS_GATES,WILD_LANDS_STOPS,wildHash,wildLandsGround,wildLandsSurfaceAt} from './wild-lands-world.mjs';
import {WILD_LANDS_SITES} from './wild-lands-content.mjs';
import {WILDS_OVERLOOK,inOverlookGround} from './overlook-maze-layout.mjs';
import {PIRATE_SHIP_BERTH} from './pirate-ship.mjs';
import {wildLandsPathAt} from './wild-lands-geography.mjs';
import {initializeImp} from './imps.mjs';
import {initializeZombie} from './zombies.mjs';
import {tideglassIntersects,tideglassSafePoint} from './tideglass-layout.mjs';
import {stopCrabPincer} from './crab-pincer.mjs';

export const WILD_BIOME_GROUPS=Object.freeze({
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
});

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
  inOverlookGround(WILDS_OVERLOOK,x,y,100)||distance(PIRATE_SHIP_BERTH,point)<520||
  wildLandsGround(d,x,y)==='mountain'||tideglassIntersects(x-1,y-1,x+1,y+1)&&tideglassSafePoint(x,y);
}

function groupPlan(d,cx,cy,key){
 const seed=Number(d.seed)||Number(d.forestSeed)||0;
 const biome=wildLandsGround(d,cx*CELL+CELL/2,cy*CELL+CELL/2),group=WILD_BIOME_GROUPS[biome];
 if(!group)return null;
 const roll=i=>wildHash(cx*79+i*241+seed,cy*137-seed+i*197);
 const kinds=group[Math.floor(roll(1)*group.length)];
 const members=kinds.map((kind,index)=>{
  const positions=Array.from({length:7},(_,i)=>{
   const offset=index*17+i+2;
   return {x:Math.floor(cx*CELL+48+roll(offset)*416),y:Math.floor(cy*CELL+48+roll(offset+113)*416)};
  });
  const occasional = biome === 'swamp' && kind === 'water_elemental';
  return {kind,key:`${key}:${index}`,positions,newArrival:!occasional||roll(181)<1/3};
 });
 return {key,biome,members};
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
  id:g.nextId++,kind,skin:kind,group:plan.key,x,y,homeX:x,homeY:y,
  wildSpawnKey:key,wildSpawnBiome:plan.biome,wildSpawnRoom:roomKey(g.trainTest.design),
  hp:stats.hp,maxHp:stats.hp,damage:stats.damage,speed:stats.speed,
  state:'hunt',faceX:0,faceY:1,step:0,attack:0,cooldown:1.05,flash:0,dx:0,dy:0,timer:1,tacticTime:1.6,
  orbit:1,temperament:'patient',
 };
 if(kind==='imp')initializeImp(enemy);
 if(kind==='zombie')initializeZombie(enemy,enemy.id);
 g.configureCreature(enemy,false);
 if(enemy.faction!=='enemy')return null;
 if(Number.isFinite(record?.hp))enemy.hp=Math.min(enemy.hp,Math.max(1,record.hp));
 g.enemies.push(enemy);
 return enemy;
}

export function recordWildBiomeDefeat(g,enemy){
 const t=g.trainTest;
 if(!t||!enemy.wildSpawnKey)return;
 (t.wildBiomeSpawns??={})[enemy.wildSpawnKey]={defeatedAt:t.time};
}

function hibernate(g,t,anchors){
 const live=[];
 let far=null;
 for(const e of g.enemies){
  if(!e.wildSpawnKey||e.hp<=0)continue;
  if(e.wildSpawnRoom!==roomKey(t.design)||!anchors.some(p=>distance(p,e)<SLEEP_DISTANCE)){
   (far??=new Set()).add(e);
   const progress=t.wildBiomeSpawns??={};
   progress[e.wildSpawnKey]={home:{x:e.homeX,y:e.homeY},...(e.hp<e.maxHp?{hp:e.hp}:{})};
  }else live.push(e);
 }
 if(far)g.enemies=g.enemies.filter(e=>!far.has(e));
 return live;
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
 const active=new Set(live.map(e=>e.wildSpawnKey)),area=new Map(),room=roomKey(d);
 for(const p of anchors){
  const cx=Math.floor(p.x/CELL),cy=Math.floor(p.y/CELL);
  for(let y=cy-2;y<=cy+2;y++)for(let x=cx-2;x<=cx+2;x++){
   const key=`${room}:${x}:${y}`,gap=Math.hypot((x+.5)*CELL-p.x,(y+.5)*CELL-p.y);
   if(gap<WAKE_FAR+CELL/2&&gap<(area.get(key)?.gap??Infinity))area.set(key,{x,y,key,gap});
  }
 }
 let placed=0,tries=0;
 for(const cell of [...area.values()].sort((a,b)=>a.gap-b.gap)){
  if(!runtime.plans.has(cell.key))runtime.plans.set(cell.key,groupPlan(d,cell.x,cell.y,cell.key));
  const plan=runtime.plans.get(cell.key);
  if(!plan)continue;
  for(const member of plan.members){
   const record=t.wildBiomeSpawns?.[member.key];
   if(active.has(member.key)||record?.defeatedAt!=null&&t.time-record.defeatedAt<REGROW_TIME)continue;
   // A previously placed elemental keeps its recorded home and HP.
   if(!member.newArrival&&!record?.home)continue;
   const invalid=runtime.invalid.get(member.key)||new Set();
   runtime.invalid.set(member.key,invalid);
   const positions=record?.home?[record.home]:member.positions;
   for(const [index,point] of positions.entries()){
    if(!record?.home&&invalid.has(index)||!anchors.some(p=>distance(p,point)<WAKE_FAR)||
       g.players.some(p=>p.hp>0&&distance(p,point)<WAKE_NEAR))continue;
    if(live.filter(e=>distance(e,point)<WAKE_FAR).length>=MAX_LOCAL)continue;
    if(++tries>18)return;
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
     if(++placed>=3||live.length>=MAX_LIVE)return;
    }
    break;
   }
  }
 }
}

export function wildBiomeTargets(g,enemy,targets){
 if(!enemy.wildSpawnKey)return targets;
 const t=g.trainTest;
 return targets.filter(p=>onFoot(p)&&Math.hypot(p.x-enemy.homeX,p.y-enemy.homeY)<CHASE_RADIUS&&
  !wildBiomeSafe(t,p.x,p.y));
}

export function tickWildBiomeLeash(g,e,dt,targets){
 if(!e.wildSpawnKey||e.hp<=0||e.stun>0||e.frozen>0||e.sleeping>0||e.state==='snared')return false;
 const x=e.homeX-e.x,y=e.homeY-e.y,distance=Math.hypot(x,y);
 if(targets.length&&distance<CHASE_RADIUS&&!e.returningToWildSpawn)return false;
 if(e.kind==='crab'&&e.wildlifeBehaviorPhase)stopCrabPincer(e);
 if(!targets.length&&distance<21&&!e.returningToWildSpawn&&!e.moving&&!e.attack)return true;
 if(!e.returningToWildSpawn){
  e.returningToWildSpawn=true;e.attack=0;
  delete e.speciesCombat;delete e.tactics;delete e.groupTurn;
 }
 e.moving=false;
 if(distance<21){delete e.returningToWildSpawn;return !targets.length;}
 if(e.speed<=0)return true;
 const step=Math.min(e.speed*.68*dt,distance),dx=x/distance,dy=y/distance;
 e.faceX=dx;e.faceY=dy;
 const moved=g.moveActor(e,dx*step,dy*step);
 if(!moved){
  const side=e.id%2?1:-1;
  if(!g.moveActor(e,(dx-dy*side*.85)*step,(dy+dx*side*.85)*step))
   g.moveActor(e,(dx+dy*side*.85)*step,(dy-dx*side*.85)*step);
 }
 return true;
}
