import assert from 'node:assert/strict';
import test from 'node:test';
import { BACKPACK_SLOTS,ITEMS } from '../src/items.mjs';
import { alleyBlocked,alleyPrompt,interactAlley,tickAlley } from '../src/diagon-alley.mjs';
import { ALLEY_RESIDENTS } from '../src/diagon-resident-schedules.mjs';
import { GARDEN_RESIDENTS } from '../src/diagon-garden-residents.mjs';
import { insideMageGarden } from '../src/diagon-garden-layout.mjs';
import { ALLEY_RESIDENT_DAY,alleyResidentsFor } from '../src/diagon-residents.mjs';
import { npcDialogueAction,npcDialogueView } from '../src/npc-quests.mjs';
import { playerAction } from '../src/player-motion.mjs';

function fixture(players=[]){
 return {players,sky:{elapsed:0},trainTest:{time:5,design:{wildLands:true,activeRoom:'diagon'}}};
}

test('street residents walk every daily route and meet a neighbor on clear ground',()=>{
 const g=fixture(),dt=.25;
 tickAlley(g,0);
 const visitors=g.trainTest.alleyVisitors,start=visitors.map(a=>({place:a.place,x:a.x,y:a.y}));
 const moved=new Set(),socialized=new Set(),reached=new Map(visitors.map(a=>[a.id,new Set()]));
 assert.equal(new Set(visitors.map(a=>a.id)).size,17);
 assert.equal(new Set(visitors.map(a=>JSON.stringify(a.equipment))).size,17);
 for(const actor of visitors){
  assert.ok(Object.values(actor.equipment).every(id=>ITEMS[id]),actor.name);
  assert.ok(Object.values(actor.equipment).some(id=>id.startsWith('alley_')),actor.name);
 }
 for(let elapsed=0;elapsed<=ALLEY_RESIDENT_DAY+70;elapsed+=dt){
  g.trainTest.time=elapsed+5;
  g.sky.elapsed=elapsed%ALLEY_RESIDENT_DAY;
  tickAlley(g,dt);
  for(const actor of visitors){
   assert.ok(!alleyBlocked(g,actor.x,actor.y,7),actor.name+' remains on walkable ground');
   reached.get(actor.id).add(actor.place);
   if(actor.movementGait==='walk'&&actor.moveSpeed>0)moved.add(actor.id);
   if(Number.isFinite(actor.lastSocialAt))socialized.add(actor.id);
  }
 }
 assert.strictEqual(g.trainTest.alleyVisitors,visitors);
 for(const [index,actor]of visitors.entries()){
  assert.deepEqual(reached.get(actor.id),new Set(ALLEY_RESIDENTS[index].stops),actor.name);
  assert.deepEqual({place:actor.place,x:actor.x,y:actor.y},start[index],actor.name+' returns on the next day');
 }
 assert.equal(moved.size,17);
 assert.equal(socialized.size,17);
});

test('alley talk opens resident-specific dialogue and stays with the initiating explorer',()=>{
 const p={id:1,device:'keyboard',hp:10,x:7800,y:4395},g=fixture([p]);
 tickAlley(g,0);
 const first=ALLEY_RESIDENTS[0],actor=g.trainTest.alleyVisitors[0];
 Object.assign(p,{x:actor.x,y:actor.y+25});
 assert.equal(alleyPrompt(g,p),'TALK TO TAMSIN QUILL');
 assert.ok(interactAlley(g,p));
 assert.equal(npcDialogueView(g,p).text,first.greeting);
 assert.ok(npcDialogueAction(g,p,'use'));
 assert.equal(npcDialogueView(g,p).text,first.story);
 npcDialogueAction(g,p,'use');
 npcDialogueAction(g,p,'down');
 npcDialogueAction(g,p,'use');
 assert.match(npcDialogueView(g,p).text,/Ink & Quill.*fountain/);
 g.sky.elapsed=121;
 g.trainTest.time+=1;
 const beforeTalk=[actor.x,actor.y];
 tickAlley(g,.25);
 assert.deepEqual([actor.x,actor.y],beforeTalk);
 assert.match(npcDialogueView(g,p).text,/on my way to the fountain/);
 const other={...p,device:'pad:0',ui:{...p.ui}};
 npcDialogueAction(g,other,'use');
 assert.equal(other.ui,null);
 assert.ok(p.ui);
 p.x+=115;
 tickAlley(g,.25);
 assert.equal(p.ui,null);
 assert.equal(actor.moving,true);
});

test('the new residents have individual branches, paired conversations, and commentary for a completed match',()=>{
 const p={id:1,device:'keyboard',hp:10,x:7810,y:4395},g=fixture([p]);
 tickAlley(g,0);
 const visitors=g.trainTest.alleyVisitors;
 const newcomers=['fred','george','lee','mcgonagall'];
 assert.equal(new Set(newcomers.map(id=>ALLEY_RESIDENTS.find(a=>a.id===id).topic.label)).size,newcomers.length);
 assert.match(visitors.find(a=>a.residentId==='fred').activity,/wrapper/);
 assert.match(visitors.find(a=>a.residentId==='george').activity,/out/);
 for(const id of newcomers){
  const actor=visitors.find(a=>a.residentId===id);
  const resident=ALLEY_RESIDENTS.find(a=>a.id===id);
  Object.assign(p,{x:actor.x,y:actor.y});
  assert.ok(interactAlley(g,p),id);
  assert.equal(npcDialogueView(g,p).text,resident.greeting);
  assert.ok(npcDialogueAction(g,p,'choice:2'));
  assert.equal(npcDialogueView(g,p).text,resident.topic.text);
  for(const [index,reply] of resident.topic.replies.entries()){
   assert.ok(npcDialogueAction(g,p,'choice:'+index));
   assert.equal(npcDialogueView(g,p).text,reply.text);
   assert.ok(npcDialogueAction(g,p,'choice:0'));
  }
  npcDialogueAction(g,p,'close');
 }
 const lee=visitors.find(a=>a.residentId==='lee');
 Object.assign(p,{x:lee.x,y:lee.y});
 g.trainTest.alleyQuidditchResult={scores:{gold:60,violet:50},winner:'gold'};
 assert.ok(interactAlley(g,p));
 assert.match(npcDialogueView(g,p).text,/60 for Gold and 50 for Violet/);
});

test('four named garden residents act, walk clear routes and visit the bookshop',()=>{
 const g=fixture(),dt=.5;
 g.trainTest.gardenVisitors=[{residentId:'irene-mossmere'},{residentId:'celia-pollen'},
  {residentId:'vesper-rill'},{residentId:'adwin-chime'}];
 tickAlley(g,0);
 const visitors=g.trainTest.gardenVisitors;
 assert.equal(new Set(alleyResidentsFor(g).map(actor=>actor.name)).size,21);
 assert.deepEqual(visitors.map(actor=>actor.name),['Neville Longbottom','Luna Lovegood','Hermione Granger','Professor Pomona Sprout']);
 assert.equal(new Set(visitors.map(actor=>JSON.stringify(actor.equipment))).size,4);
 for(const actor of visitors)assert.ok(Object.values(actor.equipment).every(id=>ITEMS[id]),actor.name);
 const stops=new Map(visitors.map(actor=>[actor.residentId,new Set()]));
 const actions=new Map(visitors.map(actor=>[actor.residentId,new Set()]));
 const areas=new Set(),seenProps=new Set();
 for(let elapsed=0;elapsed<=ALLEY_RESIDENT_DAY+70;elapsed+=dt){
  g.trainTest.time=elapsed+5;g.sky.elapsed=elapsed%ALLEY_RESIDENT_DAY;
  tickAlley(g,dt);
  for(const actor of visitors){
   assert.ok(!alleyBlocked(g,actor.x,actor.y,7),actor.name+' must stay on clear ground');
   stops.get(actor.residentId).add(actor.place);
   actions.get(actor.residentId).add(playerAction(actor));
   if(actor.interactionArt)seenProps.add(actor.interactionArt);
   if(actor.residentId==='hermione'&&actor.moving)areas.add(insideMageGarden(actor.x,actor.y));
  }
 }
 for(const resident of GARDEN_RESIDENTS)assert.deepEqual(stops.get(resident.id),new Set(resident.stops),resident.name);
 assert.deepEqual(areas,new Set([true,false]));
 assert.deepEqual(seenProps,new Set(['seedling','openBook']));
 for(const [id,action] of [['neville','pickup'],['sprout','pickup'],['luna','interact'],['hermione','carry']]){
  assert.ok(actions.get(id).has(action),id);
  assert.ok(actions.get(id).has('walk'),id);
 }
});

test('each garden resident has a two-answer interaction and samples remain one-time',()=>{
 const p={id:1,device:'keyboard',hp:10,inventory:[]},g=fixture([p]);
 Object.assign(p,{x:8000,y:5520});
 let saves=0;
 const sounds=[];g.persist=()=>saves++;g.onSound=(id)=>sounds.push(id);
 tickAlley(g,0);
 const talkers=GARDEN_RESIDENTS.filter(resident=>resident.topic);
 assert.equal(talkers.length,4);
 for(const resident of talkers){
  const actor=g.trainTest.gardenVisitors.find(a=>a.residentId===resident.id);
  const {x,y}=actor;
  Object.assign(p,{x,y,ui:null});
  assert.equal(alleyPrompt(g,p),'TALK TO '+resident.name.toUpperCase());
  assert.ok(interactAlley(g,p));
  const view=()=>npcDialogueView(g,p);
  assert.equal(view().text,resident.greeting);
  npcDialogueAction(g,p,'choice:2');
  assert.equal(view().text,resident.topic.text);
  for(const [i,reply]of resident.topic.replies.entries()){
   npcDialogueAction(g,p,'choice:'+i);
   assert.equal(view().text,reply.text);
   assert.equal(sounds.at(-1),reply.sound);
   npcDialogueAction(g,p,'choice:0');
  }
  if(resident.topic.replies[0].reward){
   npcDialogueAction(g,p,'choice:0');
   assert.match(view().text,/already taken/);
   assert.equal(p.inventory.find(item=>item.type===resident.topic.replies[0].reward).qty,1);
  }
  npcDialogueAction(g,p,'close');
 }
 assert.equal(saves,3);
 assert.deepEqual(p.npcQuests.wandmakers_garden,{'irene-mossmere':true,'celia-pollen':true,'vesper-rill':true});
 p.inventory=[];
 for(const actor of g.trainTest.gardenVisitors){
  if(!GARDEN_RESIDENTS.find(resident=>resident.id===actor.residentId).topic.replies[0].reward)continue;
  Object.assign(p,{x:actor.x,y:actor.y});
  assert.ok(interactAlley(g,p));
  npcDialogueAction(g,p,'choice:2');npcDialogueAction(g,p,'choice:0');
  assert.match(npcDialogueView(g,p).text,/already taken/);
  npcDialogueAction(g,p,'close');
 }
 assert.equal(p.inventory.length,0);
 assert.equal(saves,3);
});

test('a full backpack leaves the garden sample available for a second attempt',()=>{
 const p={id:1,device:'keyboard',hp:10,x:8000,y:5520,inventory:Array.from({length:BACKPACK_SLOTS},()=>({type:'bow',qty:1}))};
 const g=fixture([p]);tickAlley(g,0);
 const {x,y}=g.trainTest.gardenVisitors.find(actor=>actor.residentId==='neville');
 Object.assign(p,{x,y});assert.ok(interactAlley(g,p));
 npcDialogueAction(g,p,'choice:2');npcDialogueAction(g,p,'choice:0');
 assert.match(npcDialogueView(g,p).text,/Make space/);
 assert.equal(p.npcQuests?.wandmakers_garden,undefined);
 p.inventory.pop();
 npcDialogueAction(g,p,'choice:0');npcDialogueAction(g,p,'choice:0');
 assert.equal(p.inventory.at(-1).type,'alley_moonmint_tonic');
 assert.equal(p.npcQuests.wandmakers_garden['irene-mossmere'],true);
});
