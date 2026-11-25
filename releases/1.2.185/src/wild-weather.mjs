import {DAY_LENGTH} from './night-cycle.mjs';
import {WILDS_OVERLOOK,overlookSnowCoverage} from './overlook-maze-layout.mjs';
import {inBayouGoblinHut} from './bayou-goblin-hut-layout.mjs';
import {wildHash,wildLandsGround} from './wild-lands-world.mjs';

export const WILD_RAIN_SECONDS=120;
export const WILD_RAIN_CHANCE=.2;
const intervals=[[0,240],[300,450]];
const regionSalt={forest:32783,swamp:94141};
const clamp=value=>Math.max(0,Math.min(1,value));
const ease=value=>{const t=clamp(value);return t*t*(3-2*t);};
const clear=Object.freeze({rain:0,snow:0});

// Sky time and the world seed are checkpointed. A storm stays on its original
// schedule across a save, a biome crossing or a second player's arrival.
export function wildRainWindow(seed,day,biome,phase){
 const salt=regionSalt[biome],interval=intervals[phase];
 if(!salt||!interval)return null;
 const key=day*2+phase;
 if(wildHash((seed||0)^salt,key)>=WILD_RAIN_CHANCE)return null;
 const [first,last]=interval;
 const start=day*DAY_LENGTH+first+(last-first-WILD_RAIN_SECONDS)*wildHash((seed||0)^salt,key+51473);
 return {start,end:start+WILD_RAIN_SECONDS};
}

export function wildRainIntensity(g,biome){
 const time=g.sky?.elapsed||0,day=Math.floor(time/DAY_LENGTH),phase=time-day*DAY_LENGTH>=300?1:0;
 const storm=wildRainWindow(g.seed,day,biome,phase);
 if(!storm||time<storm.start||time>=storm.end)return 0;
 return ease((time-storm.start)/26)*ease((storm.end-time)/35);
}

export function wildWeatherAt(g,p){
 const t=g.trainTest,d=t?.design;
 if(!p||p.hp<=0||p.room||p.houseInterior||p.trainRide||p.pirateRide?.level==='hold'||!d?.wildLands||
  d.activeRoom||t.wildLandsOverview||inBayouGoblinHut(p.x,p.y))return clear;
 const cover=overlookSnowCoverage(WILDS_OVERLOOK,p.x,p.y);
 const biome=wildLandsGround(d,p.x,p.y);
 if(cover>=.45||biome==='ice')return {rain:0,snow:biome==='ice' ? .68 : .39+cover*.27};
 return {rain:wildRainIntensity(g,biome),snow:0};
}

export function easeWildWeather(current,target,dt){
 const step=Math.min(.2,Math.max(0,dt||0));
 const approach=(from,to)=>{
  const max=step/(to>from ? .75 : 1.8);
  return Math.abs(to-from)<=max?to:from+Math.sign(to-from)*max;
 };
 return {rain:approach(current.rain,target.rain),snow:approach(current.snow,target.snow)};
}
