import {requestEnemyGroupTurn} from './enemy-group-combat.mjs';
import {drawHouseAppliances} from './house-living.mjs';
import {drawGroundWeb} from './spider-web-art.mjs';
export {drawTreeWeb} from './spider-tree-web-art.mjs';
import {nearbyScenery} from './performance.mjs';
import {drawFurniture,drawWindow} from './house-render.mjs';
import {surfaceAction,visibleSurfaceItems} from './house-surfaces.mjs';
import {drawHouseFloor,drawHouseWall,drawHouseDoor} from './house-architecture-art.mjs';
import {drawHouseInteriorWalls} from './house-interior-art.mjs';
import {boardTableBlocked} from './board-table.mjs';
import {raisedSurfaceBlocked} from './terrain-support.mjs';
import {drawWaterSurface} from './water-surface.mjs';
import {activeHouse, contains, furnitureHeight} from './house-design.mjs';
import {navigateEnemy} from './navigation.mjs';
import {triggerEnemyTrap} from './enemy-traps.mjs';
import {creatures} from './definitions.mjs';
import {sectionBlocked,drawBreakable,breakDamagedWindow} from './structure-destruction.mjs';
import {controlledFollower} from './follower-control.mjs';
import {overlookBlocked} from './overlook-maze.mjs';
export const ENVIRONMENTS=['forest','desert','ice','house','temple','beach','graveyard','swamp','caverns','shadow'];
export const resolveEnvironment=(choice,seed)=>choice==='random'?ENVIRONMENTS[Math.abs(seed)%ENVIRONMENTS.length]:choice;
export const insideHouse=(x,y,h=null)=>h?.floors?h.floors.some(r=>contains(r,x,y)):x>480&&x<1120&&y>480&&y<1120;
export const makeHouse=()=>activeHouse();
const structureQueryScopes = new WeakMap();
const structureQuerySize = 128;
const structureQueryPadding = 48;

// Reuse nearby geometry while combat rays and movement probe the same cells.
// Collision state such as open doors and damaged sections stays live.
export function withStructureCollisionQueries(game, update) {
  const previous = structureQueryScopes.get(game);
  structureQueryScopes.set(game, {cells: new Map()});
  try {
    return update();
  } finally {
    if (previous) structureQueryScopes.set(game, previous);
    else structureQueryScopes.delete(game);
  }
}

function structureCandidates(game, x, y, radius) {
  const house = game.house, scope = structureQueryScopes.get(game);
  if (!house || !scope || !(radius <= structureQueryPadding)) return house;
  const {walls, doors, furniture, destructionRevision} = house;
  if (scope.house !== house || scope.walls !== walls || scope.doors !== doors ||
      scope.furniture !== furniture || scope.wallCount !== walls?.length ||
      scope.doorCount !== doors?.length || scope.furnitureCount !== furniture?.length ||
      scope.revision !== destructionRevision) {
    scope.cells.clear();
    scope.last = null;
    Object.assign(scope, {house, walls, doors, furniture, revision: destructionRevision,
      wallCount: walls?.length, doorCount: doors?.length, furnitureCount: furniture?.length});
  }
  const cx = Math.floor(x / structureQuerySize), cy = Math.floor(y / structureQuerySize);
  if (scope.last && cx === scope.cx && cy === scope.cy) return scope.last;
  const key = cx + ':' + cy;
  let candidates = scope.cells.get(key);
  if (!candidates) {
    const left = cx * structureQuerySize - structureQueryPadding;
    const top = cy * structureQuerySize - structureQueryPadding;
    const right = (cx + 1) * structureQuerySize + structureQueryPadding;
    const bottom = (cy + 1) * structureQuerySize + structureQueryPadding;
    const overlaps = b => b.x <= right && b.y <= bottom &&
      Math.max(b.x, b.x + b.w) >= left && Math.max(b.y, b.y + b.h) >= top;
    candidates = {walls: walls?.filter(overlaps), doors: doors?.filter(overlaps), furniture: furniture?.filter(overlaps)};
    scope.cells.set(key, candidates);
  }
  scope.cx = cx;
  scope.cy = cy;
  scope.last = candidates;
  return candidates;
}

export function structureBlocked(g,x,y,r=8,canOpenDoors=false,footOffset=14,elevation=0,projectile=false,from=null,flying=false){
 r=from?.vehicleId?Math.max(r,34):r;
 if(!projectile&&boardTableBlocked(g,x,y,r,elevation,from))return true;
 y+=footOffset;
 if(overlookBlocked(g,x,y,r,elevation,projectile))return true;
 const clearsFence=!projectile&&(flying||from?.wingHover&&elevation>=32);
 const candidates=structureCandidates(g,x,y,r);
 if(candidates?.walls?.some(w=>!(clearsFence&&w.kind==='fence')&&!(w.kind==='window'&&w.broken&&!w.sectionDamage&&(projectile||elevation>=10))&&sectionBlocked(w,x,y,r)))return true;
 if(!canOpenDoors&&candidates?.doors?.some(d=>!(clearsFence&&d.kind==='gate')&&!d.open&&sectionBlocked(d,x,y,r)))return true;
 return !!candidates?.furniture?.some(f=>{
  if(f.wallMounted||f.kind==='rug'||f.kind==='plant'||f.kind==='wall_clock'||!sectionBlocked(f,x,y,r))return false;
  const height=furnitureHeight(f);
  if(height>0&&elevation>=height)return false;
  return raisedSurfaceBlocked(f,x,y,r,height>0&&!projectile?from:null,footOffset);
 });
}
export function breakWindow(g,x,y,r=1){
 if(breakDamagedWindow(g,x,y,r))return true;
 const pane=g.house?.walls.find(w=>w.kind==='window'&&!w.broken&&Math.hypot(x-Math.max(w.x,Math.min(x,w.x+w.w)),y-Math.max(w.y,Math.min(y,w.y+w.h)))<r);
 if(!pane)return false;pane.broken=true;g.onSound?.('glassBreak',{x,y});g.message?.('Glass shattered. Shoot or jump through the opening.');return true;
}
export function toggleDoor(g,p){
  const d=g.house?.doors.find(d=>!d.destroyed&&Math.hypot(p.x-d.x-d.w/2,p.y-d.y-d.h/2)<64);
  if(!d)return false;
  if(d.open&&[...g.players,...g.enemies].some(a=>a.hp>0&&Math.abs(a.x-d.x-d.w/2)<d.w/2+12&&Math.abs(a.y-d.y-d.h/2)<d.h/2+12)){g.message('Doorway occupied.');return true;}
  d.open=!d.open;g.onSound(d.open?'doorOpen':'doorClose',p);g.message(d.open?'Door opened.':'Door closed.');return true;
}
export const isSpider=e=>['spider','tarantula','baby_spider'].includes(e?.kind);
const adultSpider=e=>e.kind==='spider'||e.kind==='tarantula';
const airborne=(a)=>!!(a?.flying||a?.flightHeight||a?.roostHeight||a?.impFlightHeight||a?.succubusFlightHeight||
  (a?.jumpHeight||0)>2||['bat','bee','wasp','tsetse','dragonfly','fairy','bird','pelican','raven','crow'].includes(a?.kind));
export const webSlow=(g,a)=>{
 const owner=(g.players||[]).find(p=>p===a),controlled=owner?.controlledFollowerId?controlledFollower(g,owner):null;
 return !isSpider(a)&&!isSpider(controlled)&&!airborne(a)&&g.webs?.some(w=>Math.hypot(a.x-w.x,a.y-w.y)<w.radius);
};
const webMaintenance=new WeakMap();
const webAnchorKind=kind=>['tree','palm','snow_tree','mangrove','old_cypress','grave_forest_tree','leafless_tree','gravestone','mausoleum','cemetery_fence','cemetery_gate'].includes(kind);
export function maintainSpiderWebs(g, dt = 0) {
  let state=webMaintenance.get(g);if(!state||state.scenery!==g.scenery){state={scenery:g.scenery,marked:new Set(),cleared:false,clock:0};webMaintenance.set(g,state);}
  const adults = (g.enemies || []).filter(e => e.hp > 0 && adultSpider(e));
  if (!adults.length) {
    if(!state.cleared)for(const prop of g.scenery||[])if(prop.webbed)prop.webbed=false;
    state.marked.clear();state.cleared=true;
    g.webs = [];
    return;
  }
  state.cleared=false;state.clock-=dt;
  for (const w of g.webs || []) {
    const nearby = adults.some(e => Math.hypot(e.x - w.x, e.y - w.y) < w.radius + 80);
    if (nearby) w.radius = Math.min(220, w.radius + dt * 0.8);
    if(state.clock<=0)for (const prop of nearbyScenery(g.scenery||[],w.x,w.y,w.radius+100))
      if (webAnchorKind(prop.kind) && Math.hypot(prop.x-w.x,prop.y-w.y)<w.radius+(prop.size||0)*.32){prop.webbed=true;state.marked.add(prop);}
  }
  if(state.clock<=0)state.clock=.25;
}
function layWebEgg(g, adult, web) {
  const angle = Math.atan2(adult.y - web.y, adult.x - web.x) + Math.PI * 0.35;
  const x = web.x + Math.cos(angle) * (web.radius - 14), y = web.y + Math.sin(angle) * (web.radius - 14);
  g.enemies.push({id:g.nextId++,group:adult.group,kind:'spider_egg',hatchSprite:adult.kind,x,y,hp:24,maxHp:24,speed:0,damage:0,hatchIn:20,faceX:0,faceY:1,state:'idle',cooldown:0,eggPhase:adult.id*.71});
  adult.webEggCooldown = 45;
  g.message('A spider lays an egg at the web edge.');
}
export function spawnSpot(g,a,d,interior=false){
  if(interior && g.house?.floors?.length){
    const candidates=[];
    for(const room of g.house.floors)for(let y=room.y+24;y<room.y+room.h-24;y+=16)for(let x=room.x+24;x<room.x+room.w-24;x+=16){
      if(!g.blocked(x,y,16,false,false,false,0)&&!g.blocked(x,y,16))candidates.push({x,y});
    }
    const players=g.players.filter(p=>p.hp>0);
    const distance=p=>Math.min(...players.map(q=>Math.hypot(p.x-q.x,p.y-q.y)),240);
    candidates.sort((p,q)=>Math.abs(distance(p)-180)-Math.abs(distance(q)-180));
    if(candidates.length)return candidates[0];
  }
  const radius=g.generatedEnvironment==='house'?Math.max(475,d):d;
  let x=800+Math.cos(a)*radius,y=800+Math.sin(a)*radius;
  for(let n=0;n<100;n++){
    if(!g.blocked(x,y)&&!(g.generatedEnvironment==='house'&&insideHouse(x,y,g.house)))return {x,y};
    const angle=a+n*2.4,range=radius+(n%5)*24;x=Math.max(60,Math.min(1540,800+Math.cos(angle)*range));y=Math.max(60,Math.min(1540,800+Math.sin(angle)*range));
  }
  return {x:800,y:1250};
}
export function spiderNest(g,anchor,group){
  g.webs ||= [];g.webs.push({x:anchor.x,y:anchor.y,radius:145,group});
  for(const tree of g.scenery)if(['tree','palm','snow_tree'].includes(tree.kind)&&Math.hypot(tree.x-anchor.x,tree.y-anchor.y)<180)tree.webbed=true;
  for(let i=0;i<3;i++){
    let spot={x:anchor.x+Math.cos(i*2.1)*42,y:anchor.y+Math.sin(i*2.1)*42};
    if(g.blocked(spot.x,spot.y)||(g.house&&insideHouse(spot.x,spot.y,g.house)))spot={x:anchor.x,y:anchor.y};
    g.enemies.push({id:g.nextId++,group,kind:'spider_egg',hatchSprite:anchor.kind==='tarantula'?'tarantula':'spider',...spot,hp:24,maxHp:24,speed:0,damage:0,hatchIn:20,faceX:0,faceY:1,state:'idle',cooldown:0,eggPhase:i*1.73});
  }
}
const lineClear=(g,a,b)=>{const n=Math.ceil(Math.hypot(a.x-b.x,a.y-b.y)/12);for(let i=1;i<n;i++)if(structureBlocked(g,a.x+(b.x-a.x)*i/n,a.y+(b.y-a.y)*i/n,2))return false;return true;};
export function tickSpider(g,e,dt,visiblePlayers=g.players){
  if(e.kind==='spider_egg'){
    e.eggPhase=(e.eggPhase||0)+dt;
    e.hatchIn-=dt;
    if(e.hatchIn<=0){const tar=e.hatchSprite==='tarantula';Object.assign(e,{kind:'baby_spider',sprite:tar?'tarantula':'spider',hp:tar?38:28,maxHp:tar?38:28,speed:tar?72:95,damage:tar?7:5,state:'hunt',timer:0,cooldown:.8,step:0});g.message('Spider eggs are hatching!');}
    return true;
  }
  const spider=isSpider(e),insect=['wasp','bee','beetle'].includes(e.kind);
  if(!spider&&!insect)return false;
  if(e.frozen>0||e.stun>0){e.frozen=Math.max(0,(e.frozen||0)-dt);e.stun=Math.max(0,(e.stun||0)-dt);e.moving=false;return true;}
  const opponents=g.enemies.filter(q=>q!==e&&q.hp>0&&(spider?['wasp','bee','beetle'].includes(q.kind):isSpider(q))&&Math.hypot(q.x-e.x,q.y-e.y)<300&&lineClear(g,e,q));
  const detection=creatures[e.kind]?.stats?.detection??600;
  const targets=opponents.length?opponents:spider?visiblePlayers.filter(p=>p.hp>0&&!p.room&&(!adultSpider(e)||Math.hypot(p.x-e.x,p.y-e.y)<=detection)):[];
  if(!spider&&!targets.length)return false;
  e.cooldown=Math.max(0,(e.cooldown||0)-dt);e.flash=Math.max(0,(e.flash||0)-dt);e.attack=Math.max(0,(e.attack||0)-dt);e.moving=false;
  if(e.state==='snared'){e.timer-=dt;if(e.timer<=0)e.hp=0;return true;}
  const trap=g.traps.find(t=>t.life>0&&Math.hypot(t.x-e.x,t.y-e.y)<30);
  if(trap&&trap.variant!=='slow'){triggerEnemyTrap(g,e,trap);return true;}
  if(e.state==='recover'&&e.timer>0){e.timer-=dt;return true;}
  let target=targets.sort((a,b)=>Math.hypot(a.x-e.x,a.y-e.y)-Math.hypot(b.x-e.x,b.y-e.y))[0];
  if (adultSpider(e)) {
    const web = (g.webs || []).filter(w => w.group === e.group || Math.hypot(e.x-w.x,e.y-w.y)<w.radius+30).sort((a,b)=>Math.hypot(e.x-a.x,e.y-a.y)-Math.hypot(e.x-b.x,e.y-b.y))[0];
    if (web) {
      if(target){
        e.webEggCooldown = Math.max(0, (e.webEggCooldown ?? 45) - dt);
        const sameGroupEgg = g.enemies.some(q => q.hp > 0 && q.kind === 'spider_egg' && q.group === e.group);
        const lead = g.enemies.filter(q => q.hp > 0 && adultSpider(q) && q.group === e.group).sort((a,b)=>a.id-b.id)[0];
        if (lead === e && e.webEggCooldown <= 0 && !sameGroupEgg) layWebEgg(g,e,web);
      }
      // Pursuit and returning home are exclusive. Applying both movements in
      // one tick pinned adults to the inner edge of their web.
      const huntRadius=web.radius+Math.min(detection,240);
      if(Math.hypot(e.x-web.x,e.y-web.y)>huntRadius||target&&Math.hypot(target.x-web.x,target.y-web.y)>huntRadius)target=null;
      if(!target&&Math.hypot(e.x-web.x,e.y-web.y)>web.radius*.82){navigateEnemy(g,e,web,dt);return true;}
    }
  }
  if(!target)return true;
  e.state='hunt';
  const d=Math.hypot(target.x-e.x,target.y-e.y)||1;e.faceX=(target.x-e.x)/d;e.faceY=(target.y-e.y)/d;
  if(g.house&&!lineClear(g,e,target)){navigateEnemy(g,e,target,dt);return true;}
  if(d>28){const moved=g.moveActor(e,e.faceX*e.speed*dt,e.faceY*e.speed*dt,insect&&e.kind!=='beetle');if(moved<e.speed*dt*.2){if(spider)navigateEnemy(g,e,target,dt);else g.moveActor(e,-e.faceY*e.speed*dt,e.faceX*e.speed*dt);}}
  if(d<42&&e.cooldown<=0&&lineClear(g,e,target)&&requestEnemyGroupTurn(g,e,target)){
    if(g.players.includes(target))g.hurt(target,e.damage,e);else {target.hp-=e.damage;target.flash=.2;}
    e.cooldown=spider?.9:1.2;e.attack=.25;
  }
  return true;
}
export function drawHousePool(c,g,p){
 drawWaterSurface(c,g,p.x,p.y,p.w,p.h);
 c.strokeStyle='#bcece488';c.lineWidth=2;c.strokeRect(p.x+5,p.y+5,p.w-10,p.h-10);
 c.strokeStyle='#c1ccbc';c.lineWidth=8;c.strokeRect(p.x-4,p.y-4,p.w+8,p.h+8);
 c.strokeStyle='#416c75';c.lineWidth=2;c.strokeRect(p.x+3,p.y+3,p.w-6,p.h-6);
}

export function drawExpansion(c,g,visible=()=>true,{floorOnly=false,structuresOnly=false,lightPaint=null}={}){
 if(!structuresOnly){
  for(const w of g.webs||[])if(visible(w,w.radius+12))drawGroundWeb(c,w);
  if(!g.house)return;
  if(g.generatedEnvironment==='house'){
    drawHouseFloor(c,g.house);
    drawHouseInteriorWalls(c,g.house,g.players,visible,{clockPass:'none'});
  }else if(g.house.temple)drawHouseInteriorWalls(c,g.house,g.players,visible,{always:true});
  for(const p of g.house.pools||[])drawHousePool(c,g,p);
 }
 if(!g.house||floorOnly)return;
 const paint=(shape,draw,key)=>{const run=ctx=>drawBreakable(ctx,g,shape,draw,key);if(lightPaint)lightPaint(c,key.startsWith('furniture:')?{...shape,surfaceArtKey:key}:shape,run);else run(c);};
  // The clock and its wall face sit in front of the outdoor ground detail.
  if(g.generatedEnvironment==='house')drawHouseInteriorWalls(c,g.house,g.players,visible,{clockPass:'mounted'});
  for(const f of g.house.furniture||[]){if(!visible({x:f.x+f.w/2,y:f.y+f.h/2},Math.max(f.w,f.h)+64))continue;if(f.kind==='wall_clock'){drawFurniture(c,f,g);continue;}paint(f,(pen,shape)=>drawFurniture(pen,shape,g),'furniture:'+JSON.stringify(visibleSurfaceItems(g,f)));}
  drawHouseAppliances(c,g);
  const nearby=(g.players||[]).filter(p=>p.hp>0&&!p.room&&!p.vehicleId&&!p.ui).map(p=>surfaceAction(g,p)).filter(Boolean).sort((a,b)=>a.d-b.d)[0];
  if(nearby){const {f,prop}=nearby,label='Interact · '+({kettle:'Cook broth',recipe_book:'Read recipe',candle:prop.lit?'Extinguish candle':'Light candle'}[prop.kind]||'Inspect '+prop.kind.replaceAll('_',' '));
    c.save();c.font='8px sans-serif';c.textAlign='center';const width=c.measureText(label).width+12;c.fillStyle='#142c27ed';c.fillRect(f.x+f.w/2-width/2,f.y-28,width,14);c.fillStyle='#f0dfb7';c.fillText(label,f.x+f.w/2,f.y-18);c.restore();}
  for(const b of g.house.walls){if(g.house.temple)continue;if(!visible({x:b.x+b.w/2,y:b.y+b.h/2},Math.max(b.w,b.h)+64))continue;paint(b,b.kind==='window'?drawWindow:drawHouseWall,b.kind==='window'?'window':'wall');}
  for(const d of g.house.doors){paint(d,drawHouseDoor,'door:'+!!d.open);
    if(g.players.some(p=>!p.room&&Math.hypot(p.x-d.x-d.w/2,p.y-d.y)<65)){c.fillStyle='#fff3c5';c.font='9px sans-serif';c.textAlign='center';c.fillText(d.open?'Interact: close':'Interact: open',d.x+d.w/2,d.y-8);}}

}
