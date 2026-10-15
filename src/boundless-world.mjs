import { creatures } from './definitions.mjs';
import {beachWorld} from './beach-world.mjs';
import {BOUNDLESS_GENERATION_VERSION,boundlessMap,naturalBoundlessTile,boundlessGeneratedTile,boundlessRegionPlan,regionRouteDistance,translateRegionProps,clearBoundlessGeneration,regionSeed} from './boundless-generation.mjs';

// Boundless worlds are streamed in fixed 50×50 tile regions. Only scenery
// within one region of an active explorer is resident in the live simulation.
export const BOUNDLESS_CHUNK_TILES = 50;
export const BOUNDLESS_CHUNK_SIZE = BOUNDLESS_CHUNK_TILES * 32;
export const BOUNDLESS_SAFE_RADIUS = 620;
export const BOUNDLESS_SCENERY_MARGIN = 1;
const species = {
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
 g.boundlessLoadedChunks=[];g.boundlessChunkEdits=fresh?{}:g.boundlessChunkEdits||{};
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
  return !['tree','palm','rock','leafless_tree','grave_forest_tree','snow_tree'].includes(p.kind)||regionRouteDistance(plan,p.x,y)>90;
 });}
 g.boundlessSceneryRevision=(g.boundlessSceneryRevision||0)+1;return true;
}
export function createBoundlessChunk(g,cx,cy){
 const plan=boundlessRegionPlan(g,cx,cy),prefix=`boundless:${cx}:${cy}:`;
 if(plan.biome==='graveyard')return {...translateRegionProps(plan),plan};
 const props=[],biome=plan.biome,random=(x,y)=>regionSeed(plan.seed,x,y)/2147483647;
 for(let ly=1;ly<49;ly+=2)for(let lx=1;lx<49;lx+=2){
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
 if(['forest','temple'].includes(biome))for(const [i,dx]of [-210,210].entries()){
  const x=plan.hub.x+dx,y=plan.hub.y-180;
  if(regionRouteDistance(plan,x,y)>95&&!['water','shallow'].includes(boundlessTerrainAt(g,Math.floor(x/32),Math.floor(y/32))))props.push({id:prefix+'ruin:'+i,kind:'forest_ruin',x,y,width:70,depth:32,height:biome==='temple'?96:48,shape:biome==='temple'?'pillar':'terrace',size:96,seed:plan.seed+i,procedural:true,boundlessRegion:plan.key});
 }
 return {props,plots:[],mausoleums:[],plan};
}
const persistentPropKeys=['hp','harvest','fallen','falling','fallDirection','depleted','chipped','chunks','coconuts','picked','opened','doorOpen','cryptPortalId','burning','burned'];
const persistentState=p=>JSON.stringify(persistentPropKeys.map(k=>p?.[k]));
function rememberChunk(g,entry){
 const live=new Map(g.scenery.map(p=>[p.id,p])),changes={props:{},plots:{}};
 for(const base of entry.base.props){const current=live.get(base.id);if(!current)changes.props[base.id]=null;else if(persistentState(base)!==persistentState(current))changes.props[base.id]=structuredClone(current);}
 for(const base of entry.base.plots){const current=g.graveyard?.plots.find(p=>p.id===base.id);if(current&&JSON.stringify(base)!==JSON.stringify(current))changes.plots[base.id]=structuredClone(current);}
 if(Object.keys(changes.props).length||Object.keys(changes.plots).length)g.boundlessChunkEdits[entry.key]=changes;else delete g.boundlessChunkEdits[entry.key];
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
    const prefix=`boundless:${cx}:${cy}:`,generated=createBoundlessChunk(g,cx,cy),base={props:structuredClone(generated.props),plots:structuredClone(generated.plots)},edits=g.boundlessChunkEdits?.[key];
    let props=generated.props.map(p=>edits?.props&&Object.hasOwn(edits.props,p.id)?edits.props[p.id]:p).filter(Boolean);
    const existing=(g.scenery||[]).filter(prop=>prop.id?.startsWith(prefix));
    if(existing.length)props=existing;
    const plots=generated.plots.map(p=>g.graveyard?.plots.find(old=>old.id===p.id)||edits?.plots?.[p.id]||p);
    const entry={key,scenery:props,base};
    if(!existing.length)g.scenery.push(...props);
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
  if (explorer && activeThreats.length < 8 && g.boundlessSpawnTimer <= 0) {
    if (spawnThreat(g, explorer)) g.boundlessSpawnTimer = 18 + g.random() * 8;
    else g.boundlessSpawnTimer = 2;
  }
  // Cull encounters that are far outside every player's active region.
  if (players.length) g.enemies = g.enemies.filter(e => !e.boundlessThreat || players.some(p => Math.hypot(e.x - p.x, e.y - p.y) < (e.hp>0?BOUNDLESS_CHUNK_SIZE*1.5:600)));
}
