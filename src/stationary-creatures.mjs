import {creatures} from './definitions.mjs';

// Anatomy, not a temporary slow/root status or an AI's current speed.
export function stationaryCreature(actor){
 if(!actor?.kind)return false;
 const cfg=creatures[actor.kind];
 return actor.stationary===true||actor.immobile===true||cfg?.stationary===true||cfg?.stats?.speed===0||cfg?.rig?.type==='plant'||['vine','carnivorous_flower','mimic_vine','poison_pod','bee_hive','spider_egg'].includes(actor.kind);
}
export const creatureEgg=actor=>actor?.kind==='egg'||actor?.kind?.endsWith('_egg')||actor?.egg===true;
