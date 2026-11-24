import { DEFAULT_APPEARANCE } from './appearance.mjs';
import { give } from './items.mjs';
import { ALLEY_RESIDENT_PLACES, ALLEY_RESIDENTS, ALLEY_SOCIAL_EXCHANGES } from './diagon-resident-schedules.mjs';
import { GARDEN_AVENUE, GARDEN_RESIDENT_PLACES, GARDEN_RESIDENT_WALKS, GARDEN_RESIDENTS } from './diagon-garden-residents.mjs';
import { QUIDDITCH_TEAMS } from './quidditch-layout.mjs';
import flourishRecipe from '../assets/pixel-recipes/diagon-alley/garden-ward-flourish.pixel.json' with {type:'json'};
import { compilePixelRecipe } from './pixel-recipe.mjs';
import { drawPixelRecipe } from './pixel-recipe-canvas.mjs';
import { DARK_WIZARD_WARNING,maskWearers,stationaryWizardWarning,tickDarkWizardAlarm,tickStationaryWizardAlarms } from './dark-wizard-reactions.mjs';
import {clearFortescuePose,fortescueResidentStart,tickFortescueResident,visitingFortescue} from './diagon-ice-cream-residents.mjs';

export const ALLEY_RESIDENT_DAY = 480;
const TALK_REACH = 68, TALK_HOLD = 100, RESIDENT_RADIUS = 7;
const WEST_LANE = 7870, EAST_LANE = 8120, CROSS_STREET = 4330;
const BRANCH_GATE = {x:8140,y:5225}, BRANCH_CORNER = {x:9040,y:5225};
const dist = (a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
const inAlley = g=>g.trainTest?.design.activeRoom==='diagon';
export const alleyResidentsFor = g=>[...(g.trainTest?.alleyVisitors||[]),...(g.trainTest?.gardenVisitors||[])];
const places = {...ALLEY_RESIDENT_PLACES,...GARDEN_RESIDENT_PLACES,
 flourishStudy:{x:8210,y:4246,name:'Flourish & Blotts',routine:'read',faceX:1,faceY:0,fixed:true},
};
const byId = new Map([...ALLEY_RESIDENTS,...GARDEN_RESIDENTS].map(resident=>[resident.id,resident]));
const exchangeKey=(a,b)=>[a.residentId,b.residentId].sort().join('|');
const flourish=compilePixelRecipe(flourishRecipe);
const gardenNeighbors=new Map(Object.keys(GARDEN_RESIDENT_PLACES).map(place=>[place,new Set()]));
for(const walk of GARDEN_RESIDENT_WALKS)for(let i=1;i<walk.length;i++){
 gardenNeighbors.get(walk[i-1]).add(walk[i]);
 gardenNeighbors.get(walk[i]).add(walk[i-1]);
}

function alleyDayTime(g){
 return g.sky?.elapsed??g.trainTest.time??0;
}

function scheduledShift(resident,time){
 const timeOfDay=((time%ALLEY_RESIDENT_DAY)+ALLEY_RESIDENT_DAY)%ALLEY_RESIDENT_DAY;
 return Math.floor(timeOfDay/(ALLEY_RESIDENT_DAY/resident.stops.length));
}

function placePoint(index,place,blocked){
 const origin=places[place];
 if(origin.fixed&&!blocked(origin.x,origin.y,RESIDENT_RADIUS))return origin;
 if(GARDEN_RESIDENT_PLACES[place]){
  const dx=((index%3)-1)*11,dy=((index%4)-1.5)*6;
  const approaches=[{x:origin.x+dx,y:origin.y+dy},origin,{x:origin.x-15,y:origin.y+4},{x:origin.x+15,y:origin.y+4},
   {x:origin.x,y:origin.y-16},{x:origin.x,y:origin.y+16}];
  return approaches.find(p=>!blocked(p.x,p.y,RESIDENT_RADIUS))||origin;
 }
 const point={x:origin.x+((index%3)-1)*13,y:origin.y+(Math.floor(index/3)-2)*8};
 for(const candidate of [point,origin,{x:origin.x-18,y:origin.y},{x:origin.x,y:origin.y+18}]){
  if(!blocked(candidate.x,candidate.y,RESIDENT_RADIUS))return candidate;
 }
 // Authored storefronts can move. Keep a valid stop on the public lane.
 return {x:origin.x<8000?WEST_LANE:origin.x>8600?BRANCH_CORNER.x:EAST_LANE,y:origin.y};
}

function segmentClear(from,to,blocked){
 const steps=Math.max(1,Math.ceil(dist(from,to)/10));
 for(let i=1;i<=steps;i++){
  const amount=i/steps;
  if(blocked(from.x+(to.x-from.x)*amount,from.y+(to.y-from.y)*amount,RESIDENT_RADIUS))return false;
 }
 return true;
}

function mainStreetRoutes(from,to){
 return [
  [to],
  ...[WEST_LANE,EAST_LANE].map(x=>[{x,y:from.y},{x,y:to.y},to]),
  [{x:from.x,y:CROSS_STREET},{x:to.x,y:CROSS_STREET},to],
 ];
}

function routeTo(from,to,blocked){
 const fromBranch=from.x>8600,toBranch=to.x>8600;
 const branchIn=point=>[{x:BRANCH_CORNER.x,y:point.y},point];
 const branchOut=point=>[{x:BRANCH_CORNER.x,y:point.y},BRANCH_CORNER,BRANCH_GATE];
 let candidates;
 if(fromBranch&&toBranch)candidates=[[to],[BRANCH_CORNER,...branchIn(to)]];
 else if(fromBranch)candidates=mainStreetRoutes(BRANCH_GATE,to).map(path=>[...branchOut(from),...path]);
 else if(toBranch)candidates=mainStreetRoutes(from,BRANCH_GATE).map(path=>[...path,BRANCH_CORNER,...branchIn(to)]);
 else candidates=mainStreetRoutes(from,to);
 return candidates.find(path=>path.every((to,index)=>segmentClear(index?path[index-1]:from,to,blocked)))||[];
}

function gardenRoute(from,to,blocked){
 if(dist(from,to)<55&&segmentClear(from,to,blocked))return [to];
 const entrances=Object.keys(GARDEN_RESIDENT_PLACES)
  .map(id=>({id,distance:dist(from,places[id])}))
  .filter(entry=>entry.distance<115&&segmentClear(from,places[entry.id],blocked))
  .sort((a,b)=>a.distance-b.distance);
 const queue=entrances.map(({id})=>[id]),visited=new Set(queue.flat());
 for(let i=0;i<queue.length;i++){
  const path=queue[i],tail=path.at(-1),point=places[tail];
  if(dist(point,to)<34&&segmentClear(point,to,blocked))return [...path.map(id=>places[id]),to];
  for(const neighbor of gardenNeighbors.get(tail)){
   if(visited.has(neighbor)||!segmentClear(point,places[neighbor],blocked))continue;
   visited.add(neighbor);queue.push([...path,neighbor]);
  }
 }
 return [];
}

function residentRoute(actor,destination,to,blocked){
 if(!actor.gardenResident)return routeTo(actor,to,blocked);
 const fromGarden=actor.x<GARDEN_AVENUE.x-20,toGarden=Boolean(GARDEN_RESIDENT_PLACES[destination]);
 if(fromGarden&&toGarden)return gardenRoute(actor,to,blocked);
 if(!fromGarden&&!toGarden)return routeTo(actor,to,blocked);
 const entry=fromGarden?gardenRoute(actor,GARDEN_AVENUE,blocked):routeTo(actor,GARDEN_AVENUE,blocked);
 const exit=toGarden?gardenRoute(GARDEN_AVENUE,to,blocked):routeTo(GARDEN_AVENUE,to,blocked);
 return entry.length&&exit.length?[...entry,...exit]:[];
}

function makeResident(resident,index,time,blocked,gardenResident=false,iceCreamShop){
 const place=resident.stops[scheduledShift(resident,time)];
 const stroll=place==='sweets'&&iceCreamShop&&fortescueResidentStart(iceCreamShop,resident.id,blocked);
 const position=stroll||placePoint(index,place,blocked);
 const {faceX,faceY}=places[place];
 return {
  id:'alley-resident:'+resident.id,residentId:resident.id,name:resident.name,title:resident.title,
  sprite:'player',kind:'player',hp:1,appearance:{...DEFAULT_APPEARANCE,...resident.look},equipment:{...resident.equipment},
  x:position.x,y:position.y,faceX,faceY,place,targetPlace:place,path:[],step:0,walking:true,moving:false,
  movementGait:'idle',moveSpeed:0,lastSocialAt:-Infinity,
  ...(gardenResident?{gardenResident:true}:{}),
 };
}

function lookToward(actor,point){
 const dx=point.x-actor.x,dy=point.y-actor.y,length=Math.hypot(dx,dy);
 if(length>1){actor.faceX=dx/length;actor.faceY=dy/length;}
}

function walkResident(actor,resident,index,destination,time,dt,blocked){
 if(actor.place===destination&&actor.targetPlace===destination&&!actor.path.length)return;
 if(actor.targetPlace!==destination||(actor.place!==destination&&!actor.path.length&&time>=(actor.retryAt||0))){
  actor.targetPlace=destination;
  const to=placePoint(index,destination,blocked);
  actor.path=residentRoute(actor,destination,to,blocked);
  actor.retryAt=time+2;
 }
 while(actor.path.length&&dist(actor,actor.path[0])<.15)actor.path.shift();
 if(!actor.path.length){
  const point=placePoint(index,destination,blocked);
  if(dist(actor,point)<.2&&actor.place!==destination){
   const place=places[destination];
   actor.place=destination;actor.activity=place.activity;actor.activityFrom=time;actor.activityUntil=time+4;
   actor.faceX=place.faceX;actor.faceY=place.faceY;
  }
  return;
 }
 followResidentPath(actor,resident.speed,dt,blocked);
}

function followResidentPath(actor,speed,dt,blocked){
 while(actor.path.length&&dist(actor,actor.path[0])<.15)actor.path.shift();
 if(!actor.path.length)return;
 const waypoint=actor.path[0],travel=Math.min(dist(actor,waypoint),speed*dt);
 lookToward(actor,waypoint);
 const x=actor.x+(waypoint.x-actor.x)*travel/Math.max(.01,dist(actor,waypoint));
 const y=actor.y+(waypoint.y-actor.y)*travel/Math.max(.01,dist(actor,waypoint));
 if(blocked(x,y,RESIDENT_RADIUS)){actor.path=[];return;}
 actor.x=x;actor.y=y;actor.moving=travel>0;actor.walking=true;actor.movementGait=travel>0?'walk':'idle';
 actor.moveSpeed=travel>0?speed:0;actor.step+=travel*.13;
}

function clearGardenRoutine(actor){
 delete actor.animationAction;
 delete actor.poseTime;
 delete actor.interactionArt;
}

function gardenRoutine(actor,time){
 const {routine,faceX,faceY}=places[actor.place];
 actor.faceX=faceX;actor.faceY=faceY;
 if(routine==='read'){
  actor.animationAction='carry';
  actor.poseTime=.35+Math.sin(time*2)*.1;
  actor.interactionArt='openBook';
 }else if(routine==='tend'){
  const phase=(time+(actor.residentId==='sprout'?1.3:0))%5.6;
  actor.animationAction=phase<2.4?'pickup':'carry';
  actor.poseTime=phase<2.4?phase*.3:.35+Math.sin(time*2)*.1;
  actor.interactionArt=phase<.65?false:'seedling';
 }else if(routine==='watch'){
  const phase=time%6.7;
  actor.faceY+=Math.sin(time*.92)*.52;
  if(phase<1.2){
   actor.animationAction='interact';
   actor.poseTime=phase/1.2;
  }
 }
}

function matchingTalk(g,p,reach=TALK_HOLD){
 if(!inAlley(g)||p.hp<=0||p.room||p.trainRide||!p.ui?.alleyResident||p.ui.ownerDevice!==p.device)return null;
 return alleyResidentsFor(g).find(actor=>actor.id===p.ui.alleyResident&&!actor.darkWizardAlarm&&dist(actor,p)<=reach);
}

export function tickAlleyResidents(g,dt,blocked,nearStationaryWizard,iceCreamShop){
 if(!inAlley(g))return;
 const railway=g.trainTest,time=railway.time||0,dayTime=alleyDayTime(g);
 if(railway.alleyVisitors?.length!==ALLEY_RESIDENTS.length||
  ALLEY_RESIDENTS.some((resident,index)=>railway.alleyVisitors[index]?.residentId!==resident.id)){
  railway.alleyVisitors=ALLEY_RESIDENTS.map((resident,index)=>makeResident(resident,index,dayTime,blocked,false,iceCreamShop));
 }
 if(railway.gardenVisitors?.length!==GARDEN_RESIDENTS.length||
  GARDEN_RESIDENTS.some((resident,index)=>railway.gardenVisitors[index]?.residentId!==resident.id)){
  railway.gardenVisitors=GARDEN_RESIDENTS.map((resident,index)=>makeResident(resident,index,dayTime,blocked,true));
 }
 const companions=new Map(),wearers=maskWearers(g.players);
 const fortescue={shop:iceCreamShop,visitors:railway.alleyVisitors,routeTo,segmentClear,follow:followResidentPath};
 tickStationaryWizardAlarms(railway,wearers,time,nearStationaryWizard);
 for(const p of g.players){
  if(!p.ui?.alleyResident)continue;
  const actor=matchingTalk(g,p);
  if(actor){if(!companions.has(actor.id))companions.set(actor.id,p);}
  else {p.ui=null;p.consumeInput=true;}
 }
 for(const group of [railway.alleyVisitors,railway.gardenVisitors]){
  for(const [index,actor]of group.entries()){
   const resident=byId.get(actor.residentId),destination=resident.stops[scheduledShift(resident,dayTime)];
   actor.moving=false;actor.moveSpeed=0;actor.movementGait='idle';
   clearFortescuePose(actor,time);
   if(actor.gardenResident)clearGardenRoutine(actor);
   if((wearers.length||actor.darkWizardAlarm)&&tickDarkWizardAlarm(actor,wearers,time,dt,blocked,RESIDENT_RADIUS,p=>segmentClear(actor,p,blocked))){
    if(companions.has(actor.id))for(const p of g.players)if(p.ui?.alleyResident===actor.id){p.ui=null;p.consumeInput=true;}
    continue;
   }
   const conversation=companions.get(actor.id);
   if(conversation){lookToward(actor,conversation);continue;}
   if(iceCreamShop&&!actor.gardenResident&&tickFortescueResident(actor,resident,destination,time,dt,blocked,fortescue))continue;
   if(time<(actor.socialUntil||0)&&actor.place===destination)continue;
   walkResident(actor,resident,index,destination,time,dt,blocked);
   if(actor.gardenResident&&!actor.moving&&actor.place===destination)gardenRoutine(actor,time);
  }
 }
 if(time<(railway.nextAlleySocialCheck||0))return;
 railway.nextAlleySocialCheck=time+.35;
 const available=railway.alleyVisitors.filter(a=>!a.darkWizardAlarm&&!visitingFortescue(a)&&!a.moving&&a.place===a.targetPlace&&!a.path.length&&!companions.has(a.id)&&time-a.lastSocialAt>16)
  .sort((a,b)=>a.lastSocialAt-b.lastSocialAt);
 const pairs=[];
 for(const [i,a] of available.entries())for(const b of available.slice(i+1)){
  if(a.place!==b.place||dist(a,b)>58||!segmentClear(a,b,blocked))continue;
  pairs.push({a,friend:b,exchange:ALLEY_SOCIAL_EXCHANGES[exchangeKey(a,b)]});
 }
 pairs.sort((a,b)=>Number(!!b.exchange)-Number(!!a.exchange));
 for(const {a,friend,exchange} of pairs){
  if(time-a.lastSocialAt<=16||time-friend.lastSocialAt<=16)continue;
  const [first,second]=exchange&&a.residentId>friend.residentId?[friend,a]:[a,friend];
  a.lastSocialAt=friend.lastSocialAt=time;
  a.socialUntil=friend.socialUntil=time+3;
  first.activity=exchange?.[0]||byId.get(first.residentId).social;
  second.activity=exchange?.[1]||byId.get(second.residentId).social;
  first.activityFrom=time;first.activityUntil=time+1.5;
  second.activityFrom=time+1.5;second.activityUntil=time+3;
  lookToward(a,friend);lookToward(friend,a);
 }
}

export function nearbyAlleyResident(g,p,blocked){
 if(!inAlley(g)||p.hp<=0||p.room||p.trainRide||p.ui)return null;
 let nearest=null,reach=TALK_REACH;
 for(const actor of alleyResidentsFor(g)){
  if(actor.darkWizardAlarm)continue;
  const distance=dist(actor,p);
  if(distance<reach&&segmentClear(p,actor,blocked)){nearest=actor;reach=distance;}
 }
 return nearest;
}

export function openAlleyResidentDialogue(g,p,actor){
 if(!actor||actor.darkWizardAlarm||p.ui)return false;
 p.ui={shop:'npc-dialogue',ownerDevice:p.device,npcId:actor.id,alleyResident:actor.id,node:'hello',index:0};
 p.consumeInput=true;p.charge=0;p.interactUsed=true;p.moving=false;p.menuRepeat=0;
 if(actor.gardenResident)clearGardenRoutine(actor);
 actor.activityUntil=0;lookToward(actor,p);
 g.onSound?.('ui',p);
 return true;
}

const goodbye={label:'See you around.',action:'close'};
const backToGreeting={label:'Ask something else.',action:'resident:hello'};
const followupChoices=[backToGreeting,goodbye];

function leeResult(result){
 if(!result?.scores)return '';
 const gold=result.scores.gold,violet=result.scores.violet;
 const winner=QUIDDITCH_TEAMS[result.winner];
 const call=winner?winner.name+' took the match.':'That one was a draw.';
 return `${call} ${gold} for Gold and ${violet} for Violet. I’d have called that final run twice if I had the breath.`;
}

export function alleyResidentDialogueView(g,p){
 const npc=matchingTalk(g,p);
 if(!npc)return {text:'The conversation has ended.',choices:[{label:'Close',action:'close'}]};
 const resident=byId.get(npc.residentId),node=p.ui.node;
 const shift=scheduledShift(resident,alleyDayTime(g)),destination=resident.stops[shift];
 const place=places[destination].name;
 const nextStop=resident.stops[(shift+1)%resident.stops.length],next=places[nextStop].name;
 let route=`I’m stopping at ${place}. After that I’m due at ${next}.`;
 if(npc.place!==destination)route=`I’m on my way to ${place}. Catch me there if you need me.`;
 else if(destination===nextStop)route=`I’m staying at ${place} awhile. Come find me here.`;
 if(npc.fortescueCone)route=`I’m taking my cone for a walk. After that I’m due at ${next}.`;
 const topic=resident.topic;
 const matchLine=resident.id==='lee'?leeResult(g.trainTest.alleyQuidditchResult):'';
 if(node==='hello'){
  const choices=[
   {label:resident.question,action:'resident:story'},
   {label:'Where are you headed?',action:'resident:route'},
  ];
  if(topic)choices.push({label:topic.label,action:'resident:topic'});
  return {npc,text:matchLine||resident.greeting,choices:[...choices,goodbye]};
 }
 if(topic&&node==='topic'){
  const replies=topic.replies.map(({label},index)=>({label,action:'resident:reply:'+index}));
  return {npc,text:topic.text,choices:[...replies,backToGreeting,goodbye]};
 }
 if(topic&&node?.startsWith('reply:')){
  const reply=topic.replies[Number(node.slice(6))];
  if(reply)return {npc,text:p.ui.residentResponse||reply.text,choices:[{label:'Try the other answer.',action:'resident:topic'},...followupChoices]};
 }
 return {npc,text:node==='route'?route:resident.story,choices:followupChoices};
}

export function alleyResidentDialogueAction(g,p,action){
 const ui=p.ui;
 const close=()=>{p.ui=null;p.consumeInput=true;return true;};
 const actor=matchingTalk(g,p);
 if(action==='close'||!actor)return close();
 const choices=alleyResidentDialogueView(g,p).choices;
 if(['next','down','prev','up'].includes(action)){
  const move=action==='next'||action==='down'?1:-1;
  ui.index=((ui.index||0)+move+choices.length)%choices.length;
  return true;
 }
 if(action==='use')action=choices[ui.index||0]?.action;
 if(action?.startsWith('choice:'))action=choices[Number(action.slice(7))]?.action;
 if(action==='close')return close();
 if(choices.some(choice=>choice.action===action)&&action?.startsWith('resident:')){
  ui.node=action.slice(9);ui.index=0;
  delete ui.residentResponse;
  if(actor.gardenResident&&ui.node.startsWith('reply:')){
   const reply=byId.get(actor.residentId).topic.replies[Number(ui.node.slice(6))];
   if(reply.reward){
    // Keep completed garden exchanges recorded when the resident roster changes.
    const claim=reply.claim??actor.residentId;
    const previous=p.npcQuests?.wandmakers_garden;
    if(previous?.[claim])ui.residentResponse='You’ve already taken your sample. You’re welcome to stay and compare notes.';
    else if(!give(p.inventory,reply.reward))ui.residentResponse='Make space in your backpack and come back. I’ll put this aside for you.';
    else{
     p.npcQuests??={};
     (p.npcQuests.wandmakers_garden??={})[claim]=true;
     g.persist?.();
    }
   }
   if(!ui.residentResponse){
    g.onSound?.(reply.sound,actor);
    if(reply.sound==='event'||reply.sound==='magic'||reply.sound==='click')actor.gardenFlourishAt=g.trainTest.time;
   }
  }
 }
 return true;
}

export function drawAlleyResidentActivity(c,g,visible){
 const time=g.trainTest.time,actors=alleyResidentsFor(g);
 for(const actor of actors){
  const age=time-actor.gardenFlourishAt;
  if(!(age>=0&&age<.35)||!visible(actor.x,actor.y,28,60))continue;
  drawPixelRecipe(c,flourish,age*1000,actor.x+actor.faceX*13,actor.y-35-age*16);
 }
 const alarm=actors.find(a=>time<a.darkWizardAlarm?.warningUntil&&visible(a.x,a.y,80,100))||stationaryWizardWarning(g.trainTest,time,visible);
 const actor=alarm||actors.find(a=>a.activity&&time>=(a.activityFrom||0)&&time<a.activityUntil&&visible(a.x,a.y,80,100)&&g.players.some(p=>!p.ui&&dist(a,p)<160));
 if(!actor)return;
 const line=alarm?DARK_WIZARD_WARNING:actor.activity;
 c.save();c.font='600 10px system-ui';c.textAlign='center';c.lineWidth=3;c.strokeStyle='#251c24';c.fillStyle='#f2d9aa';
 c.strokeText(line,actor.x,actor.y-57);c.fillText(line,actor.x,actor.y-57);c.restore();
}
