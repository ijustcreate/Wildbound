import {REALMS,readRealmLayouts,realmFootprint} from './realm-world.mjs';
import { creatures } from './definitions.mjs';
import {beachWorld} from './beach-world.mjs';
import {BOUNDLESS_GENERATION_VERSION,boundlessMap,naturalBoundlessTile,boundlessGeneratedTile,boundlessRegionPlan,boundlessRegionPlanTask,regionRouteDistance,translateRegionProps,clearBoundlessGeneration,regionSeed} from './boundless-generation.mjs';
import {applyAuthoredScenes,authoredPropsInRegion} from './world-authoring-runtime.mjs';

// Boundless worlds are streamed in fixed 50×50 tile regions. Only scenery
// within one region of an active explorer is resident in the live simulation.
export const BOUNDLESS_CHUNK_TILES = 50;
export const BOUNDLESS_CHUNK_SIZE = BOUNDLESS_CHUNK_TILES * 32;
export const BOUNDLESS_SAFE_RADIUS = 620;
export const BOUNDLESS_SCENERY_MARGIN = 1;
const species = {
 swamp:['crocodile'],caverns:['bat'],shadow:['murk_wolf'],
 forest:['panther','tiger','lion'],desert:['lion','scorpion'],
 ice:['snow_leopard','white_lion'],temple:['tiger','gorilla','monkey'],
 graveyard:['zombie','skeleton','spider','bat'],beach:['scorpion'],house:['panther','lion'],
};
const keyOf=(x,y)=>`${x},${y}`,chunkOf=n=>Math.floor(n/BOUNDLESS_CHUNK_SIZE);
export const boundlessBiomeAt=g=>boundlessMap(g);
export function boundlessTerrainAt(g,tx,ty){
 if(tx>=0&&ty>=0&&tx<50&&ty<50)return g.terrain?.[ty*50+tx]||'grass';
 return boundlessGeneratedTile(g,tx,ty);
}
/** Apply the new central/outer contract once; preserve collected props and tiles
 * changed from the old procedural beach in a saved expedition. */
export function initializeBoundlessWorld(g,{fresh=false}={}){
 if(g.mapMode!=='boundless'||g.boundlessGenerationVersion===BOUNDLESS_GENERATION_VERSION&&!fresh)return false;
 if(!fresh)g.scenery=(g.scenery||[]).filter(p=>!p.id?.startsWith('boundless:'));
 if(REALMS.includes(boundlessMap(g))&&(fresh||!g.boundlessRealmLayouts))g.boundlessRealmLayouts=structuredClone(readRealmLayouts());
 g.boundlessLoadedChunks=[];g.boundlessChunkEdits=fresh?{}:g.boundlessChunkEdits||{};
 for(const [key,old]of Object.entries(g.boundlessChunkChanges||{})){
  const edits=g.boundlessChunkEdits[key]||={props:{},plots:{}};
  for(const id of old.removed||[])if(!Object.hasOwn(edits.props,id))edits.props[id]=null;
  for(const p of [...old.changed||[],...old.added||[]])if(!Object.hasOwn(edits.props,p.id))edits.props[p.id]=p;
 }
 delete g.boundlessChunkChanges;
 if(boundlessMap(g)==='beach'){
  const old=beachWorld(g.seed).terrain;
  g.terrain=g.terrain.map((tile,i)=>{
   if(['wood','bridge'].includes(tile)||!fresh&&tile!==old[i])return tile;
   return naturalBoundlessTile(g,i%50,Math.floor(i/50));
  });
 }
 g.boundlessGenerationVersion=BOUNDLESS_GENERATION_VERSION;clearBoundlessGeneration(g);
 const central=boundlessRegionPlan(g,0,0);g.terrain=central.terrain;clearBoundlessGeneration(g);
 if(fresh){const plan=boundlessRegionPlan(g,0,0);g.scenery=g.scenery.filter(p=>{
  const y=p.rootY??p.y,kind=g.terrain[Math.floor(y/32)*50+Math.floor(p.x/32)];
  if(boundlessMap(g)==='beach'&&p.coastal&&!['beach_arch','beach_foundation'].includes(p.kind)&&['water','shallow'].includes(kind))return false;
  if(p.realm&&realmFootprint(p)&&regionRouteDistance(plan,p.x,y)<90)return false;
  return !['tree','palm','rock','leafless_tree','grave_forest_tree','snow_tree'].includes(p.kind)||regionRouteDistance(plan,p.x,y)>90;
 });}
 g.boundlessSceneryRevision=(g.boundlessSceneryRevision||0)+1;return true;
}
export function createBoundlessChunk(g,cx,cy){
 const task=createBoundlessChunkTask(g,cx,cy);let step;do{step=task.next();}while(!step.done);return step.value;
}
export function* createBoundlessChunkTask(g,cx,cy){
 const plan=yield* boundlessRegionPlanTask(g,cx,cy),prefix=`boundless:${cx}:${cy}:`;
 if(plan.biome==='graveyard'||REALMS.includes(plan.biome)){
  const generated=translateRegionProps(plan);
  if(g.localWorld)generated.props.push(...authoredPropsInRegion(g.environment,cx,cy));
  let realmState=null;
  if(plan.realmState){realmState=structuredClone(plan.realmState);const ox=cx*1600,oy=cy*1600;Object.assign(realmState,{originX:ox,originY:oy,key:plan.key});realmState.chambers=realmState.chambers.map(p=>({...p,x:p.x+ox,y:p.y+oy}));if(realmState.animals)for(const a of realmState.animals){a.x+=ox;a.y+=oy;if(Number.isFinite(a.homeX))a.homeX+=ox;if(Number.isFinite(a.homeY))a.homeY+=oy;}}
  return {...generated,realmState,plan};
 }
 const props=[],biome=plan.biome,random=(x,y)=>regionSeed(plan.seed,x,y)/2147483647;
 for(let cell=0;cell<576;cell++){
  if(cell%24===0)yield;
  const ly=1+Math.floor(cell/24)*2,lx=1+(cell%24)*2;
  const r=random(lx,ly);if(r<.68)continue;
  const x=cx*1600+lx*32+16+(random(lx+83,ly)-.5)*22,y=cy*1600+ly*32+16+(random(lx,ly+83)-.5)*22;
  const tile=plan.terrain[Math.floor((y-cy*1600)/32)*50+Math.floor((x-cx*1600)/32)];
  if(['water','shallow','bridge','quicksand','ice'].includes(tile)||regionRouteDistance(plan,x,y)<90)continue;
  const kinds=biome==='beach'?['beach_grass','beach_driftwood','rock','palm']:biome==='desert'?['dune','cactus','rock','palm']:biome==='ice'?['frost_shrub','snow_tree','ice_rock','ice_spire']:['fern','bush','rock','tree'];
  let kind=kinds[Math.min(3,Math.floor((r-.68)/.32*4))];
  if(biome==='desert'&&kind==='palm'&&![-2,-1,0,1,2].some(dx=>[-2,-1,0,1,2].some(dy=>boundlessTerrainAt(g,Math.floor(x/32)+dx,Math.floor(y/32)+dy)==='shallow')))kind='cactus';
  const size=['tree','palm','snow_tree'].includes(kind)?88+random(ly,lx)*40:kind==='ice_spire'?76:32+random(ly,lx)*28;
  // Sparse landmarks and biome-native vegetation leave route shoulders clear.
  const p={id:prefix+lx+':'+ly,kind,x,y:y-size*(['tree','snow_tree'].includes(kind)?.35:.19),size,procedural:true,boundlessRegion:plan.key};
  if(biome==='beach')Object.assign(p,{coastal:true,rootY:y,...(kind==='rock'?{beachFootprint:[size*.2,size*.12]}:{})});
  if(kind==='palm')p.coconuts=1+Math.floor(random(lx+13,ly)*3);
  props.push(p);
 }
 if(biome==='forest')for(let cell=0;cell<529;cell++){
  if(cell%23===0)yield;
  const ly=3+Math.floor(cell/23)*2,lx=3+(cell%23)*2;
  const roll=random(lx+41,ly+13),x=cx*1600+lx*32+16+(random(lx+97,ly)-.5)*34,y=cy*1600+ly*32+16+(random(lx,ly+97)-.5)*34;
  const tx=Math.floor((x-cx*1600)/32),ty=Math.floor((y-cy*1600)/32),ground=plan.terrain[ty*50+tx];
  if(ground!=='grass'||regionRouteDistance(plan,x,y)<118||roll>.34+random(lx+9,ly+23)*.16)continue;
  const size=72+random(ly+7,lx+29)*20;
  props.push({id:prefix+'tallgrass:'+lx+':'+ly,kind:'tall_grass',x,y:y-size*.4,rootY:y,size,procedural:true,
   grassPalette:random(lx+31,ly+11)>.77?'temple':'forest',grassShade:.8+random(ly+51,lx+17)*.3,
   tuftSeed:Math.floor(random(lx,ly)*0x7fffffff),boundlessRegion:plan.key});
 }
 if(['forest','temple'].includes(biome))for(const [i,dx]of [-210,210].entries()){
  const x=plan.hub.x+dx,y=plan.hub.y-180;
  if(regionRouteDistance(plan,x,y)>95&&!['water','shallow'].includes(boundlessTerrainAt(g,Math.floor(x/32),Math.floor(y/32))))props.push({id:prefix+'ruin:'+i,kind:'forest_ruin',x,y,width:70,depth:32,height:biome==='temple'?96:48,shape:biome==='temple'?'pillar':'terrace',size:96,seed:plan.seed+i,procedural:true,boundlessRegion:plan.key});
 }
 if(g.localWorld)props.push(...authoredPropsInRegion(g.environment,cx,cy));
 return {props,plots:[],mausoleums:[],plan};
}
const persistentPropKeys=['hp','harvest','fallen','falling','fallDirection','depleted','chipped','chunks','coconuts','picked','opened','doorOpen','cryptPortalId','burning','burned','cut','charred','grassFire','grassSizzle','grassSpreadIn','grassSpreadDepth','grassSpreadDone','hazardState','hazardTime'];
const persistentState=p=>JSON.stringify(persistentPropKeys.map(k=>p?.[k]));
function rememberChunk(g,entry){
 const live=new Map(g.scenery.map(p=>[p.id,p])),changes={props:{},plots:{},...(entry.realmState?{realmState:structuredClone(entry.realmState)}:{})};
 const prefix=`boundless:${entry.key.replace(',',':')}:`,ids=new Set(entry.base.props.map(p=>p.id));
 for(const p of g.scenery)if(p.id?.startsWith(prefix)&&!ids.has(p.id))changes.props[p.id]=structuredClone(p);
 for(const base of entry.base.props){const p=live.get(base.id);if(g.localWorld&&['tree','snow_tree','leafless_tree','bush','fern','flower'].includes(base.kind)&&(!p||p.fallen||p.depleted||p.harvested)){
  const harvests=g.localWorld.harvests||={};harvests[base.id]||={hour:Math.floor(g.localWorld.seconds/3600),prop:structuredClone(base)};
 }}
 for(const base of entry.base.props){const current=live.get(base.id);if(!current)changes.props[base.id]=null;else if(persistentState(base)!==persistentState(current))changes.props[base.id]=structuredClone(current);}
 for(const base of entry.base.plots){const current=g.graveyard?.plots.find(p=>p.id===base.id);if(current&&JSON.stringify(base)!==JSON.stringify(current))changes.plots[base.id]=structuredClone(current);}
 if(changes.realmState||Object.keys(changes.props).length||Object.keys(changes.plots).length)g.boundlessChunkEdits[entry.key]=changes;else delete g.boundlessChunkEdits[entry.key];
}

function spawnThreat(g, explorer) {
  const bx = explorer.x - 800, by = explorer.y - 800, angle = Math.atan2(by, bx) + (g.random() - .5) * 1.4;
  const distance = 240 + g.random() * 100;
  const x = explorer.x + Math.cos(angle) * distance, y = explorer.y + Math.sin(angle) * distance;
  const biome = boundlessBiomeAt(g, x, y), choices = species[biome] || species.forest;
  const kind = choices[Math.floor(g.random() * choices.length)], config = creatures[kind];
  if (!config || g.blocked(x, y, 22)) return false;
  const e = {
    kind, id: g.nextId++, group: `boundless:${chunkOf(x)},${chunkOf(y)}`,
    x, y, hp: config.stats.hp, maxHp: config.stats.hp,
    speed: config.stats.speed, damage: config.stats.damage,
    state: 'hunt', timer: 1, cooldown: 1, flash: 0, dx: 0, dy: 0,
    attackX: 0, attackY: 0, step: 0, moving: false,
    faceX: -Math.cos(angle), faceY: -Math.sin(angle),
    temperament: 'restless', orbit: g.random() < .5 ? -1 : 1,
    tacticTime: 1.8, boundlessThreat: true,
  };
  g.configureCreature(e, false);
  g.enemies.push(e);
  return true;
}

const pendingChunks=new WeakMap();
/** Keep outer scenery and encounters proportional to active play, not travel distance. */
export function updateBoundlessWorld(g, dt) {
  if (g.mapMode !== 'boundless' || g.phase !== 'play' || g.openingBoard) return;
  initializeBoundlessWorld(g);
  const players = g.players.filter(p => p.hp > 0 && !p.room);
  const needed = new Set();
  for (const p of players) {
    const cx = chunkOf(p.x), cy = chunkOf(p.y);
    for (let dy = -BOUNDLESS_SCENERY_MARGIN; dy <= BOUNDLESS_SCENERY_MARGIN; dy++)
      for (let dx = -BOUNDLESS_SCENERY_MARGIN; dx <= BOUNDLESS_SCENERY_MARGIN; dx++) {
        const x = cx + dx, y = cy + dy;
        if (x === 0 && y === 0) continue;
        needed.add(keyOf(x, y));
      }
  }
  const loaded = g.boundlessLoadedChunks ||= [];
  const byKey = new Map(loaded.map(entry => [entry.key, entry]));
  let changed = false;
  const priority=[...needed].sort((a,b)=>{const distance=key=>{const [cx,cy]=key.split(',').map(Number);return Math.min(...players.map(p=>Math.hypot(cx*1600+800-p.x,cy*1600+800-p.y)));};return distance(a)-distance(b);});
  for (const key of priority) {
    if (byKey.has(key)) continue;
    const [cx, cy] = key.split(',').map(Number);
    let generated;
    if(boundlessMap(g)==='forest'){
      let pending=pendingChunks.get(g);
      if(!pending||pending.key!==key||pending.seed!==g.seed){pending={key,seed:g.seed,task:createBoundlessChunkTask(g,cx,cy)};pendingChunks.set(g,pending);}
      const deadline=performance.now()+2;let step;
      do{step=pending.task.next();}while(!step.done&&performance.now()<deadline);
      if(!step.done)break;
      generated=step.value;pendingChunks.delete(g);
    }else generated=createBoundlessChunk(g,cx,cy);
    const prefix=`boundless:${cx}:${cy}:`,base={props:structuredClone(generated.props),plots:structuredClone(generated.plots)},edits=g.boundlessChunkEdits?.[key];
    let props=generated.props.map(p=>edits?.props&&Object.hasOwn(edits.props,p.id)?edits.props[p.id]:p).filter(Boolean);
    const generatedIds=new Set(generated.props.map(p=>p.id));
    props.push(...Object.entries(edits?.props||{}).filter(([id,p])=>p&&!generatedIds.has(id)).map(([,p])=>structuredClone(p)));
    const existing=(g.scenery||[]).filter(prop=>prop.id?.startsWith(prefix));
    if(existing.length)props=existing;
    const plots=generated.plots.map(p=>g.graveyard?.plots.find(old=>old.id===p.id)||edits?.plots?.[p.id]||p);
    const entry={key,scenery:props,base,realmState:structuredClone(edits?.realmState||generated.realmState||null)};
    if(!existing.length)g.scenery.push(...props);
    if(g.localWorld)applyAuthoredScenes(g,cx,cy,{includeProps:false,includeNpcs:true});
    if(g.graveyard){for(const p of plots)if(!g.graveyard.plots.some(old=>old.id===p.id))g.graveyard.plots.push(p);for(const p of generated.mausoleums)if(!g.graveyard.mausoleums.some(old=>old.id===p.id))g.graveyard.mausoleums.push(p);}
    loaded.push(entry);byKey.set(key,entry);changed=true;
    // Spread chunk creation across frames so entering Boundless never builds
    // an entire neighborhood in one synchronous burst.
    break;
  }
  if (loaded.length !== needed.size || loaded.some(entry => !needed.has(entry.key))) {
    for (let i = loaded.length - 1; i >= 0; i--) if (!needed.has(loaded[i].key)) {
      const entry=loaded[i];rememberChunk(g,entry);const prefix='boundless:'+entry.key.replace(',',':')+':';g.scenery=g.scenery.filter(p=>!p.id?.startsWith(prefix));if(g.graveyard){g.graveyard.plots=g.graveyard.plots.filter(p=>p.boundlessRegion!==entry.key);g.graveyard.mausoleums=g.graveyard.mausoleums.filter(p=>p.boundlessRegion!==entry.key);}loaded.splice(i,1);changed=true;
    }
  }
  if (changed) g.boundlessSceneryRevision = (g.boundlessSceneryRevision || 0) + 1;

  // A generous board clearing stays peaceful. Threats are admitted only when
  // someone has deliberately travelled beyond it and remain hard-capped.
  g.boundlessSpawnTimer = Math.max(0, (g.boundlessSpawnTimer || 0) - Math.min(dt, .05));
  const explorer = players.find(p => Math.hypot(p.x - 800, p.y - 800) > BOUNDLESS_SAFE_RADIUS);
  const activeThreats = g.enemies.filter(e => e.hp > 0 && e.boundlessThreat);
  if (!g.localWorld && explorer && activeThreats.length < 8 && g.boundlessSpawnTimer <= 0) {
    if (spawnThreat(g, explorer)) g.boundlessSpawnTimer = 18 + g.random() * 8;
    else g.boundlessSpawnTimer = 2;
  }
  // Cull encounters that are far outside every player's active region.
  if (players.length) g.enemies = g.enemies.filter(e => !e.boundlessThreat || players.some(p => Math.hypot(e.x - p.x, e.y - p.y) < (e.hp>0?BOUNDLESS_CHUNK_SIZE*1.5:600)));
}

// Commit edits before saving too, including a fully cleared active chunk.
export function checkpointBoundlessWorld(g) {
  if(g.mapMode!=='boundless')return;
  for(const entry of g.boundlessLoadedChunks||[])rememberChunk(g,entry);
}
