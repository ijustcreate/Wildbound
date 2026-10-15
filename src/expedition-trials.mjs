// Trials reward what the party resolves, never how often it strikes the board.
export const TRIAL_LETTER = 'The dice may hurry, feet may flee;\nNo borrowed courage pays the tree.\nThe trials you leave, the gifts forego—\nBrave roots alone make treasure grow.';
const bosses = new Set(['anaconda','banshee_queen','succubus','gorilla','dragon','skeleton_boss','necromancer','hunter','krampus','dreadmane_lion','grim_reaper']);
export function encounterRole(e) {
  if (e.role) return e.role;
  if (['friendly_npc','villager_camp','merchant','breather','raven_flock','murder_of_crows'].includes(e.type) || ['elephant','zebra','pelican'].includes(e.kind)) return 'peaceful';
  if (e.type && e.type !== 'enemy') return ['old_well','mausoleum','mystery'].includes(e.type) ? 'discovery' : 'hazard';
  if (bosses.has(e.kind)) return 'boss';
  return ['golem','oathless_captain','skeleton_wizard','tarantula'].includes(e.kind) ? 'elite' : 'ordinary';
}
export function trialState(g) {
  if (!g.expeditionTrials || g.expeditionTrials.version !== 1) g.expeditionTrials = {version:1, entries:[], serial:0, legacyCredit:Math.min(6,Math.max(0,g.cleared||0)), stage:0, destinations:[]};
  return g.expeditionTrials;
}
export function resetTrials(g) { g.expeditionTrials={version:1,entries:[],serial:0,legacyCredit:0,stage:0,destinations:[]}; }
export function pacingWeight(g,event) {
  const state=trialState(g), progress=Math.max(0,...(g.players||[]).map(p=>p.progress||0));
  state.stage=Math.max(state.stage,progress<12?0:progress<28?1:2);
  const role=encounterRole(event), seed=(g.seed||0)>>>0;
  // Different expeditions have different personalities; no closing-board phase.
  const mood=seed%3; let weight=1;
  if(state.stage===0)weight=role==='boss'?.45:role==='elite'?.7:1;
  if(state.stage===2&&role==='boss')weight=1.45;
  if(mood===0&&role==='discovery')weight*=1.5;
  if(mood===1&&role==='boss')weight*=1.3;
  if(mood===2&&role==='peaceful')weight*=1.5;
  // This is a preference, never a safety veto when the party rolls again.
  const recent=g.eventDirector?.recent?.slice(-2)||[];
  if(recent.length===2&&recent.every(e=>['boss','elite','hazard'].includes(e.role)))weight*=role==='peaceful'||role==='discovery'?2.4:.8;
  return weight;
}
export function beginTrial(g,event,units=[]) {
  const s=trialState(g),role=encounterRole(event),members=units.filter(e=>e.hp>0&&e.faction!=='ally'&&e.faction!=='neutral'&&!e.wildlife&&!e.stampede&&!e.practiceTarget);
  const entry={id:++s.serial,name:event.name,kind:event.kind,role,zone:g.generatedEnvironment||g.environment,started:g.time||0,members:members.map(e=>e.id),defeated:[],complete:false};
  if(role==='peaceful'||!members.length&&!['discovery','hazard'].includes(role))return null;
  if(role==='hazard'){
    entry.hazardType=event.type;entry.duration=event.duration||(event.type==='volcano'?65:event.type==='stampede'?12:45);entry.exposure=0;
    if(event.type==='volcano'){const v=g.volcanoes?.findLast(v=>v.life>0);if(v)v.trialId=entry.id;}
    else if(event.type==='stampede')entry.hazardMembers=(g.enemies||[]).filter(e=>e.stampede&&e.hp>0).map(e=>e.id);
    else if(g.weather)g.weather.trialId=entry.id;
  }
  s.entries.push(entry);
  while(s.entries.length>256){
    const index=s.entries.findIndex(t=>t.complete||t.expired);if(index<0)break;
    const [old]=s.entries.splice(index,1);s.archivedOffered=(s.archivedOffered||0)+1;
    if(old.complete){s.archivedCleared=(s.archivedCleared||0)+1;s.archivedScore=(s.archivedScore||0)+(old.role==='boss'?3:old.role==='elite'?2:1);}
  }
  for(const e of members)e.trialId=entry.id;
  if(!s.destinations.includes(entry.zone))s.destinations.push(entry.zone);
  return entry;
}
export function defeatTrialMember(g,e) {
  const entry=trialState(g).entries.find(t=>t.id===e.trialId);
  if(!entry||entry.complete||!entry.members.includes(e.id)||entry.defeated.includes(e.id))return;
  entry.defeated.push(e.id);
  if(entry.defeated.length===entry.members.length){completeTrial(g,entry);g.message?.(entry.name+' · Trial cleared. The board remembers.');}
}
function completeTrial(g,entry){
  entry.complete=true;entry.finished=g.time||0;
  const s=trialState(g),count=(s.archivedCleared||0)+s.entries.filter(t=>t.complete).length;
  for(const p of g.players||[]){
    p.field??={};
    if(p.field.pendingTrialTreasure){g.dropLoot?.(p.x,p.y+28,'charm',1,'Challenge resolved',true);delete p.field.pendingTrialTreasure;}
    if(count%3===0&&count>(s.choiceAt||0))p.field.choice=true;
  }
  if(count%3===0)s.choiceAt=count;
}
export function finishDiscovery(g,name) {
  const entry=trialState(g).entries.findLast(t=>!t.complete&&t.name===name&&['discovery','hazard'].includes(t.role));
  if(entry)completeTrial(g,entry);
}
export function trialSummary(g) {
  const s=trialState(g),challenges=s.entries.filter(e=>['ordinary','elite','boss','hazard','discovery'].includes(e.role)),cleared=challenges.filter(e=>e.complete);
  const score=s.legacyCredit+(s.archivedScore||0)+cleared.reduce((n,e)=>n+(e.role==='boss'?3:e.role==='elite'?2:1),0),offered=challenges.length+(s.archivedOffered||0),finished=cleared.length+(s.archivedCleared||0);
  return {offered,cleared:finished,score,skipped:offered-finished,destinations:[...s.destinations]};
}
export function tickTrials(g,dt){
  const zone=g.generatedEnvironment||g.environment;
  const exposed=(g.players||[]).some(p=>p.hp>0&&!p.room);
  for(const e of trialState(g).entries){
    if(e.complete||e.expired||e.role!=='hazard'||e.zone!==zone)continue;
    const active=e.hazardType==='volcano'?(g.volcanoes||[]).some(v=>v.trialId===e.id&&v.life>0):e.hazardType==='stampede'?(g.enemies||[]).some(n=>e.hazardMembers?.includes(n.id)&&n.stampede&&n.hp>0):g.weather?.trialId===e.id&&g.weather.life>0;
    if(active&&exposed)e.exposure+=dt;
    if(!active&&e.exposure>=Math.min(15,e.duration*.7)){completeTrial(g,e);g.message?.(e.name+' · Trial weathered.');}
    else if(!active)e.expired=true;
  }
}
export function regionalObjective(g){
  const pools={forest:['defeat','protect','explore','rescue'],desert:['explore','survive','ritual','defeat'],ice:['survive','rescue','protect','explore'],house:['protect','rescue','defeat','ritual'],temple:['ritual','explore','defeat','protect'],graveyard:['ritual','rescue','defeat','survive']};
  const pool=pools[g.generatedEnvironment||g.environment]||pools.forest;
  const choices=pool.filter(k=>k!==g.lastObjectiveKind);
  const kind=choices[Math.min(choices.length-1,Math.floor(g.random()*choices.length))];
  g.lastObjectiveKind=kind;return kind;
}
export const BREATHER_EVENT={name:'The board takes a breath',kind:'breather',type:'breather',count:0,weight:5,verse:'The timber sighs; the leaves lie still.\nTake breath, then choose your journey’s will.',tip:'Regroup and gather the small supplies. You may roll again whenever you choose.'};
