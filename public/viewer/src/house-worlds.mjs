import {snapshot} from './rooms.mjs';
import {seatOpeningParty} from './opening-board.mjs';
import {restoreForestLandscape} from './forest-landscape.mjs';

export const HOUSE_WORLD_DESTINATIONS=['temple','forest','ice','desert'];
const protectedKeys=new Set(['houseWorlds','houseWorldsEnabled','random','persist','onSound','spriteLibrary','saving','saveError','controlLabels']);
function capture(g){
  const state=snapshot(g);
  for(const key of protectedKeys)delete state[key];
  return structuredClone(state);
}
export function travelHouseWorlds(g,total){
  if(!g.houseWorldsEnabled||![5,8].includes(total))return false;
  const mode=g.houseWorlds??={worlds:{}};
  const from=g.generatedEnvironment;
  const to=from==='house'?HOUSE_WORLD_DESTINATIONS[Math.min(3,Math.floor(g.random()*4))]:'house';
  mode.worlds[from]=capture(g);
  let state=mode.worlds[to];
  if(!state){
    const fresh=new g.constructor();
    fresh.players=structuredClone(g.players);
    fresh.nextId=g.nextId;
    fresh.seed=g.seed+1+Math.floor(g.random()*100000);
    fresh.environment=to;fresh.spriteLibrary=g.spriteLibrary;
    fresh.start();
    // Use the normal safe opening arrangement for the entire party.
    fresh.openingBoard=true;
    seatOpeningParty(fresh.players);
    state=capture(fresh);
  }
  const devices=new Map(g.players.map(p=>[p.id,p.device]));
  for(const key of Object.keys(g))if(!protectedKeys.has(key)&&typeof g[key]!=='function'&&!(key in state))delete g[key];
  Object.assign(g,structuredClone(state));
  g.explored=new Set(state.explored||[]);g.forestLandscape=null;
  restoreForestLandscape(g,state.forestLandscapeVersion);
  g.houseWorlds=mode;g.houseWorldsEnabled=true;
  for(const p of g.players){p.device=devices.get(p.id)??p.device;p.previousInput={};p.ui=null;p.charge=0;}
  g.roll=null;g.eventOnBoard=false;
  g.message(to==='house'?'Five or eight — everyone returns to the house.':'Until the dice read five or eight, in this world you must wait.');
  g.persist();
  return true;
}
