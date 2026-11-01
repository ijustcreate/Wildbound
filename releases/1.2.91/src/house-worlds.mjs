import {encounterCue} from './encounter-cues.mjs';
import {seatOpeningParty} from './opening-board.mjs';
import {restoreForestLandscape} from './forest-landscape.mjs';
import {initLivingEcosystem,captureLivingAmbient} from './living-ecosystem.mjs';

export const HOUSE_WORLD_DESTINATIONS=Object.freeze(['forest','ice','desert','temple','beach','graveyard','swamp','caverns','shadow']);
export const WORLD_TRAVEL_SECONDS=Object.freeze({depart:1.4,arrive:1});
export const WORLD_TRAVEL_EVENTS=Object.freeze({
 swamp:{name:'Where the lanterns drift',verse:'Old roots drink the river deep.\nBeyond the reeds the lanterns wait.\nRoll home again on five or eight.',tip:'The whole party travels to Bayou Marsh. Roll 5 or 8 to return home.'},
 caverns:{name:'The voices under stone',verse:'The crystal hums; the shadows fall.\nA hidden river guards the gate.\nRoll home again on five or eight.',tip:'The whole party travels to Hollowdeep Caverns. Roll 5 or 8 to return home.'},
 shadow:{name:'Beyond the last light',verse:'The pale hart walks where roots entwine.\nKeep close until the turning fate.\nRoll home again on five or eight.',tip:'The whole party travels to the Shadow Realm. Roll 5 or 8 to return home.'},
 forest:{name:'Where the green heart beats',verse:'Roots awake and branches sway.\nThe hungry green has found its way.\nBeneath these boughs you all must wait,\nUntil the dice read five or eight.',tip:'The whole party travels to the Forest. Roll 5 or 8 to return home.'},
 ice:{name:'The winter behind the glass',verse:'The window flowers white with frost.\nBeyond its silver edge, be lost.\nWithin the snow you all must wait,\nUntil the dice read five or eight.',tip:'The whole party travels to the Ice. Roll 5 or 8 to return home.'},
 desert:{name:'A thousand years of thirst',verse:'The hourglass breaks; the sands run free.\nNo roof, no shade, no end to see.\nBeneath this sun you all must wait,\nUntil the dice read five or eight.',tip:'The whole party travels to the Desert. Roll 5 or 8 to return home.'},
 temple:{name:'The steps that remember',verse:'Old stone stirs beneath the vine.\nThe jungle guards a fallen shrine.\nAmong its gods you all must wait,\nUntil the dice read five or eight.',tip:'The whole party travels to the Jungle Temple. Roll 5 or 8 to return home.'},
 beach:{name:'The tide beneath the door',verse:'Salt on the wind; a shell at your feet.\nThe boards give way where the blue waves meet.\nBeyond the shore you all must wait,\nUntil the dice read five or eight.',tip:'The whole party travels to the Beach. Roll 5 or 8 to return home.'},
 graveyard:{name:'The names beneath the moss',verse:'The candles bow; the iron gates sigh.\nThe sleeping stones have heard the die.\nAmong the graves you all must wait,\nUntil the dice read five or eight.',tip:'The whole party travels to the Cemetery. Roll 5 or 8 to return home.'},
 house:{name:'The hearth remembers you',verse:'Five or eight has turned the key.\nThe waiting house calls: Come to me.\nYour place remains; your trail runs on.\nCome home before the light is gone.',tip:'Everyone returns to the house exactly as you left it. Your board pieces keep their places.'},
});
// Campaign state travels with the explorers. Everything else belongs to a paused map.
const campaign=new Set(['players','sharedStash','nextId','turn','round','locked','turnOrder','repeatTurnPlayerId','cleared','encounteredEvents','killedCreatures','log','difficulty','diceCount','mapMode','pvp','mapping','eventDuration','houseWorlds','houseWorldsEnabled','worldTravel','roll','rollCooldown','phase','random','persist','onSound','spriteLibrary','saving','saveError','controlLabels','uiRevision','fieldRevision','victoryRewards','victoryChest','victoryChestOpened','victoryShown','debrief','sealTime','paused']);
campaign.add('expeditionTrials');campaign.add('expeditionDebrief');campaign.add('eventDirector');
const runtimeKeys=new Set(['forestLandscape','boundlessLoadedChunks']);
const landscapes=new WeakMap(),jobs=new WeakMap();
const modeFor=g=>g.houseWorlds??={version:2,seed:g.seed,worlds:{}};
export function resetHouseWorlds(g){jobs.get(g)?.worker?.terminate();jobs.delete(g);g.houseWorlds={version:2,seed:g.seed,worlds:{}};g.worldTravel=null;g.environment='house';g.mapMode='bounded';}
export function captureHouseWorld(g){
 captureLivingAmbient(g);
 const state=Object.fromEntries(Object.entries(g).filter(([key,value])=>!campaign.has(key)&&!runtimeKeys.has(key)&&typeof value!=='function'));
 state.explored=[...g.explored];state.nextId=g.nextId;
 landscapes.set(state,g.forestLandscape);return state;
}
export function createHouseWorld(Game,{destination,seed,nextId}){
 const fresh=new Game(Math.random,{deferWorld:true});fresh.environment=destination;fresh.seed=seed;
 fresh.addPlayer('keyboard','World preparation');fresh.nextId=nextId;fresh.start();fresh.openingBoard=false;fresh.bloom=3;
 return {state:captureHouseWorld(fresh),forestLandscape:fresh.forestLandscape};
}
function destination(g){
 if(g.generatedEnvironment!=='house')return 'house';
 // Draw without replacement: see all nine environments before repeating one.
 const mode=modeFor(g);if(!mode.bag?.length)mode.bag=[...HOUSE_WORLD_DESTINATIONS];
 return mode.bag.splice(Math.min(mode.bag.length-1,Math.max(0,Math.floor(g.random()*mode.bag.length))),1)[0];
}
function requestWorld(g,to){
 const cached=modeFor(g).worlds[to];if(cached)return {state:cached,ready:true};
 let job=jobs.get(g);if(job?.destination===to)return job;
 job?.worker?.terminate();
 const spec={destination:to,seed:(modeFor(g).seed??g.seed)+1+(HOUSE_WORLD_DESTINATIONS.indexOf(to)+1)*7919,nextId:g.nextId};
 job={destination:to,ready:false,spec};jobs.set(g,job);
 const accept=result=>{job.state=result.state;landscapes.set(job.state,result.forestLandscape);job.ready=true;job.worker?.terminate();job.worker=null;};
 if(typeof Worker==='undefined'){accept(createHouseWorld(g.constructor,spec));return job;}
 try{
  const worker=job.worker=new Worker(new URL('./wildbound-world-worker.mjs',import.meta.url),{type:'module'});
  worker.onmessage=e=>{if(e.data.error){job.error=e.data.error;worker.terminate();}else accept(e.data);};
  worker.onerror=e=>{e.preventDefault();job.error=e.message;worker.terminate();};worker.postMessage(spec);
 }catch(error){job.error=String(error);}
 return job;
}
function collectTravelFollowers(world,players){
 const ids=new Set(players.map(p=>p.id)),keys=new Set(players.map(p=>String(p.profileId||p.id))),found=new Map();
 const keep=a=>a&&a.hp>0&&!a.defeated;
 const take=(field,predicate)=>{
  const list=world[field]||[];
  for(const actor of list)if(keep(actor)&&predicate(actor))found.set(actor.id??actor,actor);
  world[field]=list.filter(actor=>!keep(actor)||!predicate(actor));
 };
 take('enemies',a=>a.allyOwner!=null&&ids.has(a.allyOwner));
 take('ghosts',a=>a.pet&&ids.has(a.owner));
 take('villageFollowers',a=>a.ownerKey!=null&&keys.has(String(a.ownerKey)));
 return [...found.values()];
}
function carryTravelFollowers(g,followers){
 const positions=new Map(),counts=new Map();
 for(const actor of followers){
  const owner=g.players.find(p=>p.id===actor.allyOwner||p.id===actor.owner||String(p.profileId||p.id)===String(actor.ownerKey));
  if(!owner||actor.hp<=0||actor.defeated)continue;
  const landing=positions.get(owner.id)||{x:owner.x,y:owner.y};positions.set(owner.id,landing);
  const index=counts.get(owner.id)||0;counts.set(owner.id,index+1);
  const angle=index*2.399963229728653,radius=38+Math.floor(index/8)*22;
  actor.x=landing.x+Math.cos(angle)*radius;actor.y=landing.y+Math.sin(angle)*radius;
  actor.room=null;delete actor.roomX;delete actor.roomY;
  actor.jumpHeight=0;actor.jumpVelocity=0;actor.groundHeight=0;actor.moving=false;actor.controlledBy=undefined;
  if(actor.faction==='ally')actor.state='idle';
  if(actor.ownerKey!=null){actor.followX=actor.x;actor.followY=actor.y;}
  if(actor.allyOwner!=null){g.enemies??=[];g.enemies.push(actor);}
  else if(actor.ownerKey!=null){g.villageFollowers??=[];g.villageFollowers.push(actor);}
  else if(actor.pet&&actor.owner!=null){g.ghosts??=[];g.ghosts.push(actor);}
  if(owner.controlledFollowerId===actor.id){
   owner.controlMainPosition={x:landing.x,y:landing.y};
   owner.x=actor.x;owner.y=actor.y;owner.room=null;delete owner.roomX;delete owner.roomY;
   actor.controlledBy=owner.id;
  }
 }
 // Personal and ritual pets are campaign fields on the player, so carry them
 // with the party and place each one beside its owner after the map swap.
 for(const owner of g.players){
  const base=positions.get(owner.id)||{x:owner.x,y:owner.y};
  for(const pet of [owner.hunterPet,owner.ritualPet])if(pet){
   const index=counts.get(owner.id)||0;counts.set(owner.id,index+1);
   const angle=index*2.399963229728653,radius=38+Math.floor(index/8)*22;
   pet.x=base.x+Math.cos(angle)*radius;pet.y=base.y+Math.sin(angle)*radius;pet.room=null;pet.pvpTarget=null;
   if(owner.controlledFollowerId===pet.id){owner.controlMainPosition={x:base.x,y:base.y};owner.x=pet.x;owner.y=pet.y;owner.room=null;pet.controlledBy=owner.id;}
  }
 }
}
export function prepareHouseWorldTravel(g,total){
 if(!g.houseWorldsEnabled||g.phase!=='play'||![5,8].includes(total))return false;
 const mode=modeFor(g);if(mode.pending)return true;
 const to=destination(g);
 mode.serial=(mode.serial||0)+1;
 mode.pending={to,total,serial:mode.serial,event:g.event,eventTime:g.eventTime,eventOnBoard:g.eventOnBoard};
 g.event={...WORLD_TRAVEL_EVENTS[to],kind:'world_travel',type:'travel',destination:to};g.eventTime=0;g.eventOnBoard=true;
 requestWorld(g,to);return true;
}
// Read-only render view for warming the arrival image while the travel verse is shown.
export function preparedHouseWorldView(g){
 const pending=modeFor(g).pending;if(!pending)return null;
 const job=requestWorld(g,pending.to);if(!job.ready)return null;
 const view=Object.create(g);Object.assign(view,job.state);view.players=g.players.map(p=>({...p}));seatOpeningParty(view.players);
 view.forestLandscape=landscapes.get(job.state)||null;view.worldTravel=null;view.openingBoard=false;view.reveal=null;view.bloom=3;
 return view;
}
function applyWorld(g,to,state){
 const mode=modeFor(g),from=g.generatedEnvironment,suspended=mode.pending,firstVisit=to!=='house'&&!mode.worlds[to];
 const cachedFollowers=collectTravelFollowers(state,g.players);
 const currentFollowers=collectTravelFollowers(g,g.players);
 const uniqueFollowers=[...new Map([...cachedFollowers,...currentFollowers].map(a=>[a.id??a,a])).values()];
 const leaving=captureHouseWorld(g);
 if(suspended){leaving.event=suspended.event;leaving.eventTime=suspended.eventTime;leaving.eventOnBoard=suspended.eventOnBoard;}
 mode.worlds[from]=leaving;delete mode.worlds[to];
 for(const key of Object.keys(g))if(!campaign.has(key)&&!runtimeKeys.has(key)&&typeof g[key]!=='function')delete g[key];
 for(const [key,value]of Object.entries(state))if(!campaign.has(key))g[key]=value;
 g.nextId=Math.max(g.nextId,state.nextId||0);g.explored=new Set(state.explored||[]);g.forestLandscape=landscapes.get(state)||null;
 restoreForestLandscape(g,state.forestLandscapeVersion);g.boundlessLoadedChunks=[];
 mode.pending=null;mode.version=2;g.roll=null;g.rollCooldown=1.25;g.reveal=null;g.openingBoard=false;g.tableShake=0;g.bloom=3;
 seatOpeningParty(g.players);
 carryTravelFollowers(g,uniqueFollowers);
 for(const p of g.players){p.previousInput={};p.ui=null;p.charge=0;p.attack=0;p.blocking=false;p.queuedAttack=null;p.invuln=Math.max(p.invuln||0,2);
 }
 initLivingEcosystem(g);jobs.delete(g);
 g.message(to==='house'?'The hearth remembers you. Your house waits exactly as you left it.':WORLD_TRAVEL_EVENTS[to].verse.replaceAll('\n',' '));
 // Fresh Wildbound destinations should have an encounter ready on arrival;
 // the home board and any previously explored map retain their saved event.
 if(firstVisit)g.spawnEvent();
}
/** Immediate adapter for tools/tests. Runtime uses the animated begin/tick pair. */
export function travelHouseWorlds(g,total){
 if(!prepareHouseWorldTravel(g,total))return false;
 const to=modeFor(g).pending.to,job=requestWorld(g,to);
 if(!job.ready)return false;
 applyWorld(g,to,job.state);g.persist();return true;
}
export function beginHouseWorldTravel(g,total){
 if(!prepareHouseWorldTravel(g,total)||g.worldTravel)return false;
 g.worldTravel={from:g.generatedEnvironment,to:modeFor(g).pending.to,serial:modeFor(g).pending.serial,stage:'depart',elapsed:0};
 g.onSound?.(encounterCue('Travel · '+g.worldTravel.to));return true;
}
export function tickHouseWorldTravel(g,dt,inputs={}){
 const travel=g.worldTravel;if(!travel)return false;
 dt=Math.max(0,Math.min(.05,dt));travel.elapsed+=dt;
 for(const p of g.players){p.previousInput={...(inputs[p.device]||{})};p.charge=0;}
 if(travel.stage==='depart'&&travel.elapsed>=WORLD_TRAVEL_SECONDS.depart){
  const job=requestWorld(g,travel.to);
  if(job.error){
   // Keep the current map intact if a worker cannot load. A retry is safe.
   jobs.delete(g);g.worldTravel=null;g.message('The passage could not open. Roll five or eight to try again.');
   const pending=modeFor(g).pending;g.event=pending?.event||null;g.eventTime=pending?.eventTime||0;modeFor(g).pending=null;return true;
  }
  if(!job.ready)return true;
  applyWorld(g,travel.to,job.state);travel.stage='arrive';travel.elapsed=0;
 }else if(travel.stage==='arrive'&&travel.elapsed>=WORLD_TRAVEL_SECONDS.arrive){g.worldTravel=null;g.persist();}
 return true;
}
export function returnHouseForVictory(g){
 if(!g.houseWorldsEnabled||g.generatedEnvironment==='house')return false;
 const state=modeFor(g).worlds.house;if(!state)return false;
 applyWorld(g,'house',state);g.worldTravel=null;return true;
}
