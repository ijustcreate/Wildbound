import {Game} from './core.mjs';
import {creatures} from './definitions.mjs';
import {saveSession,restoreSession} from './session.mjs';
import {generateWorld} from './world.mjs';
import {tickLocalWorld} from './world-runtime.mjs';
import {checkpointBoundlessWorld,initializeBoundlessWorld} from './boundless-world.mjs';
import {createWorldState,validateWorldState,catchUpWorld,validatePack,hash,recordWorldEvent} from './world-simulation.mjs';
const baselines=new WeakMap();
const clone=v=>structuredClone(v);
function worldBaseline(seed,environment){
 const base={...generateWorld(seed,environment),seed,environment,generatedEnvironment:environment,mapMode:'boundless'};
 initializeBoundlessWorld(base,{fresh:true});return base;
}
export function seededRandom(seed){let a=seed>>>0;return()=>{a+=0x6d2b79f5;let t=a;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return((t^(t>>>14))>>>0)/4294967296;};}
export function createLocalWorld({id,name,seed,pack,party,now=Date.now()}) {
  if(!party?.length)throw Error('Choose at least one explorer in the lobby before creating a world.');
  const s=createWorldState({id,name,seed,pack,now});
  for(const kind of [...s.pack.prey,...s.pack.predators])if(!creatures[kind])throw Error('This content pack names an unknown creature: '+kind);
  const g=new Game(seededRandom(seed));
  g.seed=seed;g.environment=s.pack.environment;g.generatedEnvironment='';g.mapMode='boundless';
  for(const p of party){const player=g.addPlayer(p.device,p.name);Object.assign(player,clone(p));player.room=null;player.ui=null;player.x=800;player.y=920;}
  g.start();g.openingBoard=false;g.persistentWorld=true;g.localWorld=s;
  // Fresh identity: no old nested Heartwood journey or remote authority.
  g.portals=g.portals.filter(d=>!d.forestTravel);delete g.forestJourney;
  baselines.set(g,worldBaseline(seed,s.pack.environment));
  rememberPlants(g);
  g.message(name+' · local world · saved on this computer.');return g;
}
const plant=p=>['tree','snow_tree','leafless_tree','bush','fern','flower'].includes(p.kind);
function rememberPlants(g){const originals=new Map((baselines.get(g)?.scenery||[]).map(p=>[p.id,p]));for(const p of g.scenery||[])if(plant(p)&&!p.localOriginal)p.localOriginal=clone(originals.get(p.id)||p);}
function sceneryDelta(current,original){
  const baseline=new Map(original.map(p=>[p.id,p])),live=new Map(current.map(p=>[p.id,p]));
  const changed=[],added=[],removed=[];
  for(const p of current){
    const copy=clone(p);delete copy.localOriginal;
    delete copy.rustle;if(copy.webbed===false)delete copy.webbed;
    if(!baseline.has(p.id))added.push(copy);
    else if(JSON.stringify(copy)!==JSON.stringify(baseline.get(p.id)))changed.push(copy);
  }
  for(const p of original)if(!live.has(p.id))removed.push(p.id);
  return {changed,added,removed};
}
export function saveLocalWorld(g,now=Date.now()) {
  validateWorldState(g.localWorld);checkpointBoundlessWorld(g);
  g.localWorld.lastWall=Math.max(g.localWorld.lastWall,now);
  const baseline=baselines.get(g)||worldBaseline(g.seed,g.generatedEnvironment);
  baselines.set(g,baseline);
  const live=new Map(g.scenery.map(p=>[p.id,p]));
  const harvests=g.localWorld.harvests||={};
  const hour=Math.floor(g.localWorld.seconds/3600);
  for(const original of baseline.scenery.filter(plant)){
    const p=live.get(original.id);
    if(!p||p.fallen||p.depleted||p.harvested){
      if(!harvests[original.id]){harvests[original.id]={hour,prop:clone(original)};recordWorldEvent(g.localWorld,'plant-harvested',{prop:original.id});}
      if(p)p.localHarvestHour??=harvests[original.id].hour;
    }
  }
  const session=saveSession(g);
  // Terrain and scenery are reconstructed from seed + deltas, never copied as
  // an untouched full world. Stateful actors, NPCs and board events are checkpoints.
  session.state=clone(session.state);
  const delta=sceneryDelta((g.scenery||[]).filter(p=>!String(p.id).startsWith('boundless:')),baseline.scenery);
  const terrain=[];for(let i=0;i<(g.terrain||[]).length;i++)if(g.terrain[i]!==baseline.terrain[i])terrain.push([i,g.terrain[i]]);
  delete session.state.scenery;delete session.state.terrain;delete session.state.forestLandscape;
  delete session.state.boundlessLoadedChunks;delete session.state.forestJourney;
  session.state.localWorld=clone(g.localWorld);
  return {version:1,generationVersion:g.boundlessGenerationVersion,id:g.localWorld.id,savedAt:now,session,delta,terrain};
}
export function restoreLocalWorld(record,now=Date.now()) {
  if(record?.version!==1||!record.session?.state?.localWorld||record.id!==record.session.state.localWorld.id||!record.delta||!Array.isArray(record.terrain))throw Error('Invalid world snapshot.');
  const s=validateWorldState(clone(record.session.state.localWorld));
  validatePack(s.pack);
  const base=record.generationVersion?worldBaseline(s.seed,s.pack.environment):generateWorld(s.seed,s.pack.environment);
  const removed=new Set(record.delta.removed),changed=new Map(record.delta.changed.map(p=>[p.id,p]));
  const scenery=base.scenery.filter(p=>!removed.has(p.id)).map(p=>clone(changed.get(p.id)||p));
  scenery.push(...clone(record.delta.added));
  const terrain=clone(base.terrain);
  for(const [i,t]of record.terrain){if(!Number.isInteger(i)||i<0||i>=terrain.length||typeof t!=='string')throw Error('Invalid terrain edit.');terrain[i]=t;}
  const g=restoreSession({...record.session,state:{...record.session.state,localWorld:s,scenery,terrain}});
  // Legacy snapshots retain their edited tiles even when the streamer upgrades.
  g.terrain=terrain;
  g.random=seededRandom(Math.floor(hash(s.seed,s.seconds)*4294967296));
  baselines.set(g,worldBaseline(s.seed,s.pack.environment));
  const elapsed=catchUpWorld(g.localWorld,now);
  g.boundlessLoadedChunks=[];g.persistentWorld=true;g.remoteAuthoritative=false;
  g.portals=(g.portals||[]).filter(d=>!d.forestTravel);delete g.forestJourney;
  rememberPlants(g);
  tickLocalWorld(g,0);
  if(elapsed>60)g.message('Welcome back. Your world advanced '+Math.floor(elapsed/60)+' real minutes while you were away.');
  return g;
}
export function worldAction(g,action,give) {
  const s=g.localWorld,p=g.players.find(p=>p.hp>0&&!p.room);
  if(!s||!p)throw Error('A living explorer must be outside to interact.');
  const key=`${Math.floor(p.x/1600)},${Math.floor(p.y/1600)}`,r=s.regions[key];
  if(!r)throw Error('Explore this region first.');
  if(action==='nest'){
    if(r.nests<1)throw Error('No occupied nests remain here. New nests may appear on future days.');
    if(!give(p.inventory,'arrow',3))throw Error('Your backpack is full.');r.nests--;
    recordWorldEvent(s,'nest-emptied',{x:r.x,y:r.y});return 'Collected 3 arrows from an abandoned nest.';
  }
  if(action==='trade'){
    if(!r.merchant)throw Error('No travelling merchant is visiting this region today.');
    if(r.settlement.supplies<5)throw Error('The settlement needs to replenish its supplies.');
    if(!give(p.inventory,'potion',1))throw Error('Your backpack is full.');r.settlement.supplies-=5;r.settlement.relation++;
    recordWorldEvent(s,'settlement-trade',{x:r.x,y:r.y});return 'Received a potion from the settlement. Relations improved.';
  }
  if(action==='repair'){
    if(r.settlement.supplies<10)throw Error('Repairs need 10 settlement supplies.');
    r.settlement.supplies-=10;r.settlement.condition=Math.min(1,r.settlement.condition+.2);r.settlement.relation++;
    recordWorldEvent(s,'settlement-repaired',{x:r.x,y:r.y});return 'Repaired local shelter with settlement supplies.';
  }
  throw Error('Unknown world action.');
}
