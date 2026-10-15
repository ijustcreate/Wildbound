// Pure deterministic ecology. No renderer, filesystem, network or wall-clock access.
export const WORLD_SCHEMA = 1;
export const WORLD_HOUR = 3600;
export const WORLD_DAY = WORLD_HOUR * 24;
export const WORLD_RATE = 60; // One real minute is one world hour, open or closed.
export const REGION_SIZE = 1600;
export const MAX_REGIONS = 4096;
export const BUILTIN_PACKS = [
  {id:'heartwood',name:'Heartwood',environment:'forest',description:'Forests, deer herds and roaming predators.',prey:['mother_deer','stag','baby_deer','pig'],predators:['panther'],food:.8,water:.7},
  {id:'cemetery',name:'Cemetery',environment:'graveyard',description:'Weathered graves, moths, beetles and restless dead.',prey:['bat'],predators:['skeleton'],food:.4,water:.4},
  {id:'beach',name:'Beach',environment:'beach',description:'Coastal wildlife, tidal weather and wandering merchants.',prey:['pig','pig_spotted'],predators:['scorpion'],food:.65,water:.9},
  {id:'jungle',name:'Jungle',environment:'temple',description:'A lush temple ecosystem with prowling tigers.',prey:['mother_deer','pig'],predators:['tiger'],food:.95,water:.85},
];
export function hash(...values) {
  let n=2166136261;
  for(const c of values.join('|')){n^=c.charCodeAt(0);n=Math.imul(n,16777619);}
  return (n>>>0)/4294967296;
}
const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
const finite=(v,f)=>Number.isFinite(v)?v:f;
export function validatePack(input) {
  const p=structuredClone(input);
  if(!p||!/^[-a-z0-9]{1,48}$/.test(p.id)||typeof p.name!=='string'||!p.name.trim()||p.name.length>80)throw Error('Pack needs a safe id and a name (1–80 characters).');
  if(!['forest','graveyard','beach','temple','desert','ice'].includes(p.environment))throw Error('Unknown native terrain generator.');
  for(const k of ['prey','predators'])if(!Array.isArray(p[k])||p[k].length>16||p[k].some(s=>typeof s!=='string'||!/^\w{1,64}$/.test(s)))throw Error('Invalid species list.');
  for(const k of ['food','water'])if(!Number.isFinite(p[k])||p[k]<0||p[k]>1)throw Error('Food and water must be between zero and one.');
  if(p.events&&(!Array.isArray(p.events)||p.events.length>128||p.events.some(v=>!Number.isInteger(v)||v<0)))throw Error('Invalid event table.');
  if(p.factions&&(!Array.isArray(p.factions)||p.factions.length>16||p.factions.some(v=>typeof v!=='string'||v.length>80)))throw Error('Invalid factions.');
  if(p.quests&&(!Array.isArray(p.quests)||p.quests.length>32||p.quests.some(q=>!q||typeof q.id!=='string'||typeof q.name!=='string'||!Number.isInteger(q.target)||q.target<1||q.target>1000)))throw Error('Quests need an id, name and positive target.');
  for(const [k,v] of Object.entries(p.assets||{}))if(!['board','lobby','music','ambience','cemetery'].includes(k)||typeof v!=='string'||!/^assets\/[a-zA-Z0-9_./ -]+\.(png|jpg|webp|mp3|ogg|wav)$/.test(v)||v.split('/').includes('..'))throw Error('Pack artwork and audio must use safe relative assets paths.');
  return {...p,version:1,description:String(p.description||'Local ecosystem pack').slice(0,300)};
}
export function createWorldState({id,name,seed,pack,now=Date.now()}) {
  pack=validatePack(pack);
  if(!/^[a-zA-Z0-9_-]{1,80}$/.test(id)||!Number.isSafeInteger(seed)||typeof name!=='string'||!name.trim()||name.length>80||!Number.isFinite(now))throw Error('Invalid local world identity.');
  const state={version:WORLD_SCHEMA,id,name:name.trim(),seed,pack,seconds:0,lastWall:now,createdAt:now,regions:{},events:[],nextEvent:1,quests:{},offline:true};
  visitRegion(state,0,0);return state;
}
export function validateWorldState(s) {
  if(s?.version!==WORLD_SCHEMA||!/^[a-zA-Z0-9_-]{1,80}$/.test(s.id)||!Number.isSafeInteger(s.seed)||!Number.isFinite(s.seconds)||s.seconds<0||!Number.isFinite(s.lastWall)||!s.regions||typeof s.regions!=='object'||Array.isArray(s.regions)||Object.keys(s.regions).length>MAX_REGIONS||!Array.isArray(s.events)||s.events.length>256)throw Error('Invalid world save.');
  validatePack(s.pack);return s;
}
export function visitRegion(s,x,y) {
  const key=`${x},${y}`;
  if(!Number.isSafeInteger(x)||!Number.isSafeInteger(y))throw Error('Invalid region coordinates.');
  if(!s.regions[key]){
    if(Object.keys(s.regions).length>=MAX_REGIONS)throw Error('This world has reached its explored-region limit (4096).');
    const r=hash(s.seed,x,y);
    s.regions[key]={x,y,hour:0,prey:12+Math.floor(r*12),predators:1+Math.floor(r*3),food:s.pack.food,water:s.pack.water,nests:1+Math.floor(r*3),settlement:{supplies:30,condition:1,relation:0,faction:s.pack.factions?.[0]||'Wayfarers'},weather:'clear',migration:0,rare:false,merchant:false};
    advanceRegion(s,s.regions[key],Math.floor(s.seconds/WORLD_HOUR));
  }
  return s.regions[key];
}
function emit(s,r,h,type,details={}) {
  const id=`${r.x},${r.y}:${h}:${type}`;
  s.nextEvent++;
  s.events.push({id,sequence:Math.floor(hash(id)*4294967296),hour:h,region:`${r.x},${r.y}`,type,...details});
  s.events.sort((a,b)=>a.hour-b.hour||a.id.localeCompare(b.id));
  if(s.events.length>256)s.events.splice(0,s.events.length-256);
}
export function advanceRegion(s,r,targetHour) {
  // At most 90 detailed days per catch-up. Older intervals use an analytical
  // equilibrium; the clock still advances completely, without millions of ticks.
  if(targetHour-r.hour>2160){
    const days=(targetHour-r.hour-2160)/24;
    const relax=1-Math.exp(-days/8);
    r.prey+=(18*s.pack.food-r.prey)*relax;r.predators+=(2-r.predators)*relax;
    r.food+=(s.pack.food-r.food)*relax;r.water+=(s.pack.water-r.water)*relax;
    r.settlement.supplies=clamp(r.settlement.supplies+days*2,0,300);
    r.settlement.condition=clamp(r.settlement.condition-days*.0005,.15,1);
    r.hour=targetHour-2160;
    emit(s,r,r.hour,'long-absence',{days:Math.floor(days)});
  }
  for(let h=r.hour+1;h<=targetHour;h++) {
    const rain=hash(s.seed,r.x,r.y,h,'weather');
    r.weather=rain<.04?'storm':rain<.25?'rain':'clear';
    r.water=clamp(r.water+(rain<.25?.025:-.004));
    r.food=clamp(r.food+.004*r.water-.00015*r.prey);
    r.prey=clamp(r.prey+r.prey*.004*r.food*(1-r.prey/45)-r.predators*.008,0,60);
    r.predators=clamp(r.predators+(r.prey>10?.0009:-.002)*r.predators,0,8);
    if(h%24===0){
      const migrate=hash(s.seed,r.x,r.y,h,'herd')<.35;
      if(migrate){const count=hash(s.seed,r.x,r.y,h,'direction')<.5?-2:2;r.prey=clamp(r.prey+count,0,60);r.migration+=count;emit(s,r,h,'herd-migration',{count});}
      if(r.nests<5&&hash(s.seed,r.x,r.y,h,'nest')<.3){r.nests++;emit(s,r,h,'new-nest');}
      r.merchant=hash(s.seed,r.x,r.y,h,'merchant')<.3;
      if(r.merchant)emit(s,r,h,'merchant-arrival');
      r.rare=hash(s.seed,r.x,r.y,h,'rare')<.08;
      if(r.rare)emit(s,r,h,'rare-creature');
      if(r.weather==='storm'){r.settlement.condition=clamp(r.settlement.condition-.025,.15,1);emit(s,r,h,'storm-damage');}
      r.settlement.supplies=clamp(r.settlement.supplies+4*r.food-2,0,300);
      r.settlement.condition=clamp(r.settlement.condition-.0005,.15,1);
      if(hash(s.seed,r.x,r.y,h,'faction')<.08){r.settlement.relation=clamp(r.settlement.relation+(r.food>.4?1:-1),-20,20);emit(s,r,h,'faction-shift');}
      if(h%168===0)emit(s,r,h,'season-change',{season:Math.floor(h/168)%4});
    }
  }
  r.hour=targetHour;
}
export function advanceWorld(s,seconds) {
  if(!Number.isFinite(seconds)||seconds<0)throw Error('Invalid world time.');
  const oldHour=Math.floor(s.seconds/WORLD_HOUR);
  s.seconds+=seconds;
  const hour=Math.floor(s.seconds/WORLD_HOUR);
  if(hour===oldHour)return s;
  for(const r of Object.values(s.regions))advanceRegion(s,r,hour);
  return s;
}
export function catchUpWorld(s,now=Date.now()) {
  const elapsed=Math.max(0,finite(now,s.lastWall)-s.lastWall)/1000;
  advanceWorld(s,elapsed*WORLD_RATE);
  s.lastWall=Math.max(s.lastWall,finite(now,s.lastWall));return elapsed;
}
export function simulationTier(r,players) {
  const ds=players.filter(p=>p.hp>0&&!p.room).map(p=>Math.max(Math.abs(Math.floor(p.x/REGION_SIZE)-r.x),Math.abs(Math.floor(p.y/REGION_SIZE)-r.y)));
  const distance=Math.min(Infinity,...ds);
  return distance===0?'active':distance<=1?'regional':'distant';
}
export function recordWorldEvent(s,type,details={}) {
  emit(s,{x:details.x??0,y:details.y??0},Math.floor(s.seconds/WORLD_HOUR),type,details);
}
