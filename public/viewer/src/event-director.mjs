export const EVENT_HISTORY_LIMIT=24;
export const EVENT_COVERAGE_LIMIT=256;
const bosses=new Set(['anaconda','banshee_queen','succubus','gorilla','dragon','skeleton_boss','necromancer','hunter','krampus']);
const weather=new Set(['monsoon','sandstorm','thunderstorm','blizzard']);
export const eventBoss=event=>bosses.has(event.kind);
function state(g){
 const old=g.eventDirector;
 if(!old||old.version!==2){
  // Upgrade old expeditions in place, including saves from the packaged picker
  // that recorded only encounteredEvents. Reloading must not start a fresh bag.
  const recent=Array.isArray(old?.recent)?old.recent:[];
  const counts=Object.create(null);
  for(const name of Object.keys(g.encounteredEvents||{}).slice(-EVENT_COVERAGE_LIMIT))
   if(g.encounteredEvents[name])counts[name]=1;
  for(const e of recent)if(typeof e?.name==='string')counts[e.name]=(counts[e.name]||0)+1;
  g.eventDirector={version:2,draws:old?.draws||0,recent,lastBossAt:old?.lastBossAt??-99,counts};
 }
 const s=g.eventDirector;
 s.draws=Number.isFinite(s.draws)?Math.max(0,Math.floor(s.draws)):0;
 s.recent=Array.isArray(s.recent)?s.recent.filter(e=>e&&typeof e.name==='string'&&typeof e.kind==='string').slice(-EVENT_HISTORY_LIMIT):[];
 s.lastBossAt=Number.isFinite(s.lastBossAt)?s.lastBossAt:-99;
 s.counts=Object.fromEntries(Object.entries(s.counts||{})
  .filter(([name,count])=>name.length<=200&&Number.isFinite(count)&&count>=0)
  .slice(-EVENT_COVERAGE_LIMIT).map(([name,count])=>[name,Math.min(1000000,Math.floor(count))]));
 return s;
}
const coverageCount=(s,name)=>Object.hasOwn(s.counts,name)?s.counts[name]:0;
export function eventUnitStats(event,group,kind,definitions){
 const cfg=definitions[kind],fallback=cfg?.stats||{hp:60,speed:40,damage:10};
 const source=cfg?.edited&&!group?.manualOverride?fallback:{...fallback,...(kind===event.kind?{hp:event.hp,speed:event.speed,damage:event.damage}:{}),...group,...event.squadStats?.[kind]};
 return Object.fromEntries(['hp','speed','damage'].map(key=>[key,Number.isFinite(source[key])&&source[key]>=(key==='hp'?1:0)?source[key]:fallback[key]]));
}
export function rememberEvent(g,event,index){
 const s=state(g);s.draws++;
 s.recent.push({index,name:event.name,kind:event.kind,type:event.type||'enemy'});
 if(s.recent.length>EVENT_HISTORY_LIMIT)s.recent.shift();
 // Move the entry to the end so exceptionally large edited rosters evict the
 // least recently used key. Normal rosters keep coverage for the whole run.
 const count=coverageCount(s,event.name);delete s.counts[event.name];
 Object.defineProperty(s.counts,event.name,{value:Math.min(1000000,count+1),enumerable:true,writable:true,configurable:true});
 if(Object.keys(s.counts).length>EVENT_COVERAGE_LIMIT)delete s.counts[Object.keys(s.counts)[0]];
 if(eventBoss(event))s.lastBossAt=s.draws;
}
export function selectEvent(g,events,available){
 const s=state(g),alive=(g.enemies||[]).filter(e=>e.hp>0&&!e.wildlife&&!e.stampede&&e.faction!=='ally'&&e.faction!=='neutral');
 const last=s.recent.at(-1),recentNames=new Set(s.recent.slice(-6).map(e=>e.name));
 const eligible=events.flatMap((event,index)=>{
  if(!available(g,event)||!(event.weight??10)||event.weight<0)return [];
  if(event.type==='old_well'&&(g.portals||[]).some(d=>d.oldWell))return [];
  if(event.type==='mausoleum'&&(g.portals||[]).some(d=>d.mausoleum&&d.oldWell))return [];
  if(event.type==='mystery'&&g.mystery&&!g.mystery.done)return [];
  if(event.type==='merchant'&&g.merchant)return [];
  if(weather.has(event.type)&&g.weather?.life>0)return [];
  if(event.type==='volcano'&&(g.volcanoes||[]).some(v=>v.life>0))return [];
  if(eventBoss(event)&&(s.draws<3||s.draws-s.lastBossAt<3||alive.length))return [];
  const combat=!event.type||event.type==='enemy';
  if(combat&&alive.length>=12)return [];
  let weight=Math.max(0,event.weight??10);
  if(eventBoss(event))weight=Math.min(weight,4);
  if(s.draws<2&&combat&&(event.count||1)*(event.hp||60)>260)weight*=.25;
  if(combat&&alive.length)weight*=Math.max(.12,1-alive.length/12);
  if(alive.some(e=>e.kind===event.kind))weight*=.12;
  if(s.recent.slice(-7).some(e=>e.name===event.name))weight*=.35;
  if(last?.kind===event.kind)weight*=.15;
  if(last?.type===(event.type||'enemy'))weight*=.75;
  return [{index,event,weight,seen:coverageCount(s,event.name)}];
 });
 // Weighted coverage, not independent rolls: give every currently eligible
 // encounter its turn before recycling common cards. Weights still choose
 // the order, while boss/night/biome/active-hazard gates remain authoritative.
 // Temporarily blocked cards retain their counts and rejoin without a reset.
 const leastSeen=Math.min(...eligible.map(e=>e.seen));
 let pool=eligible.filter(e=>e.seen===leastSeen&&!recentNames.has(e.event.name));
 if(!pool.length)pool=eligible.filter(e=>e.seen===leastSeen&&!s.recent.slice(-3).some(r=>r.name===e.event.name));
 if(!pool.length)pool=eligible.filter(e=>!recentNames.has(e.event.name));
 if(!pool.length)pool=eligible.filter(e=>e.seen===leastSeen&&e.event.name!==last?.name);
 if(!pool.length)pool=eligible.filter(e=>e.event.name!==last?.name);
 if(!pool.length)pool=eligible;
 // Different cards can still look like the same wave (several skeleton or
 // elemental encounters). Prefer a different lead species when possible.
 const differentKind=pool.filter(e=>e.event.kind!==last?.kind);
 if(differentKind.length)pool=differentKind;
 const sum=pool.reduce((n,e)=>n+e.weight,0);if(!sum)return null;
 const r=Number(g.random());let pick=Math.max(0,Math.min(.999999999,Number.isFinite(r)?r:0))*sum;
 for(const e of pool){pick-=e.weight;if(pick<0)return e.index;}
 return pool.at(-1).index;
}
