import test from 'node:test';
import assert from 'node:assert/strict';
import {Game,EVENTS} from '../src/core.mjs';
import {ITEMS} from '../src/items.mjs';
import {getNpcQuestConfig,validateNpcQuestConfig,replaceNpcQuestConfig} from '../src/npc-quest-data.mjs';
import {spawnQuestNpc,openNpcDialogue,npcDialogueAction,npcDialogueView,npcQuestState,recordNpcQuestKill,tickNpcQuests,preserveQuestGear} from '../src/npc-quests.mjs';
import {saveSession,restoreSession} from '../src/session.mjs';
import {travelHouseWorlds} from '../src/house-worlds.mjs';
import {LOBBY_OBJECTS} from '../src/playable-lobby.mjs';
import {LOBBY_FIXTURES} from '../src/lobby-practice.mjs';

function setup(){const g=new Game(()=>.31);g.environment='forest';const p=g.addPlayer('keyboard','Quest QA');g.start();g.openingBoard=false;p.inventory=Array(24).fill(null);const n=spawnQuestNpc(g);assert.ok(n);Object.assign(p,{x:n.x,y:n.y+30});assert.ok(openNpcDialogue(g,p));return {g,p,n};}
function accept(g,p,branch=0){p.ui.node='quests';npcDialogueAction(g,p,'offer:'+branch);npcDialogueAction(g,p,'accept');assert.ok(npcQuestState(p).active);}
function fulfill(g,p){const a=npcQuestState(p).active,o=a.contract.objective;if(o.type==='collect')p.inventory[0]={type:o.item,qty:o.count};else if(o.type==='visit'){Object.assign(p,a.target);tickNpcQuests(g,.1);const n=g.questNpcs[0];Object.assign(p,{x:n.x,y:n.y+30});openNpcDialogue(g,p);p.ui.node='quests';}else for(let i=0;i<o.count;i++)recordNpcQuestKill(g,{kind:o.kind,hp:0,killedBy:p.id});}

test('six gated stages award full real gear set through either branch',()=>{
 for(const branch of [0,1]){const {g,p,n}=setup();for(let stage=0;stage<6;stage++){
  if(stage){spawnQuestNpc(g);if(!p.ui)openNpcDialogue(g,p);}accept(g,p,branch);fulfill(g,p);const reward=npcQuestState(p).active.reward;
  assert.ok(npcDialogueView(g,p).quest.ready);npcDialogueAction(g,p,'claim');assert.ok(p.inventory.some(i=>i?.type===reward));assert.ok(ITEMS[reward].questReward);
  assert.equal(npcQuestState(p).completed.length,stage+1);npcDialogueAction(g,p,'claim');assert.equal(npcQuestState(p).completed.length,stage+1);
  p.ui.node='quests';npcDialogueAction(g,p,'offer:0');npcDialogueAction(g,p,'accept');assert.equal(npcQuestState(p).active,null);
 }assert.match(npcDialogueView(g,p).text,/full Keeper/);assert.equal(n.faction,'ally');assert.ok(n.unattackable);assert.ok(!g.enemies.includes(n));}
});
test('full backpack preserves ready quest and supplies until a slot is freed',()=>{
 const {g,p}=setup();accept(g,p);p.inventory=Array.from({length:24},()=>({type:'hat',qty:1}));p.inventory[0]={type:'stick',qty:3};npcDialogueAction(g,p,'claim');assert.ok(npcQuestState(p).active);assert.equal(p.inventory[0].qty,3);assert.match(p.ui.notice,/Free one/);
 p.inventory[8]=null;npcDialogueAction(g,p,'claim');assert.equal(p.inventory[8].type,getNpcQuestConfig().stages[0].reward);assert.equal(p.inventory[0],null);assert.equal(npcQuestState(p).completed.length,1);
});
test('different devices cannot share dialogue ownership or quest progress',()=>{
 const {g,p,n}=setup(),q=g.addPlayer('pad:0','Second');q.inventory=Array(24).fill(null);Object.assign(q,{x:n.x+20,y:n.y});assert.ok(openNpcDialogue(g,q));accept(g,p);accept(g,q,1);assert.equal(npcQuestState(p).active.contract.objective.item,'stick');assert.equal(npcQuestState(q).active.contract.objective.item,'stone');
 p.ui.ownerDevice='pad:0';npcDialogueAction(g,p,'next');assert.equal(p.ui,null);assert.ok(q.ui);assert.equal(npcQuestState(q).active.progress,0);
});
test('accepted contracts and progress survive session restore and edits',()=>{
 const {g,p}=setup();accept(g,p);const original=structuredClone(getNpcQuestConfig()),edit=structuredClone(original);edit.stages[0].branches[0].objective.count=8;replaceNpcQuestConfig(edit);
 try{assert.equal(npcQuestState(p).active.contract.objective.count,3);const restored=restoreSession(JSON.parse(JSON.stringify(saveSession(g))));assert.equal(npcQuestState(restored.players[0]).active.contract.objective.count,3);assert.equal(restored.questNpcs.length,1);assert.equal(restored.questSceneToken,g.questSceneToken);}finally{replaceNpcQuestConfig(original);}
});
test('only genuine player or owned target kills count, once, never allies',()=>{
 const {g,p}=setup();npcQuestState(p).completed=[{stageId:getNpcQuestConfig().stages[0].id}];accept(g,p,1);const a=npcQuestState(p).active;const e={kind:'bat',killedBy:p.id};recordNpcQuestKill(g,{kind:'bat',faction:'ally',killedBy:p.id});recordNpcQuestKill(g,{kind:'bat'});assert.equal(a.progress,0);recordNpcQuestKill(g,e);recordNpcQuestKill(g,e);assert.equal(a.progress,1);recordNpcQuestKill(g,{kind:'bat',questOwner:p.profileId||String(p.id),questStage:a.stageId});assert.equal(a.progress,2);
});
test('house-world revisits never roll back character quest chain',()=>{
 const g=new Game(()=>.3);g.environment='house';g.addPlayer('keyboard','Traveler');g.start();g.houseWorldsEnabled=true;travelHouseWorlds(g,5);npcQuestState(g.players[0]).completed.push({stageId:'trail-signs',reward:'keeper_crown'});g.players[0].inventory[0]={type:'keeper_crown',qty:1};travelHouseWorlds(g,8);assert.equal(npcQuestState(g.players[0]).completed.length,1);assert.ok(g.players[0].inventory.some(i=>i?.type==='keeper_crown'));
});
test('invalid graph imports are atomic and NPC event is appended after old content',()=>{
 const c=structuredClone(getNpcQuestConfig()),broken=structuredClone(c);broken.dialogue.nodes.greeting.choices[0].next='missing';assert.equal(validateNpcQuestConfig(broken),false);assert.throws(()=>replaceNpcQuestConfig(broken));assert.deepEqual(getNpcQuestConfig(),c);assert.equal(EVENTS.at(-1).type,'friendly_npc');
});
test('starter chest visible position and collision move together into table row',()=>{
 const chest=LOBBY_OBJECTS.find(o=>o.id==='starter-chest');assert.equal(chest.y,LOBBY_OBJECTS.find(o=>o.id==='environment').y);assert.equal(chest.y,LOBBY_OBJECTS.find(o=>o.id==='dice-count').y);assert.equal(LOBBY_FIXTURES.find(o=>o.id===chest.id).y,516);
});
test('quest gear travels without losing displaced ordinary gear or reviving relinquished rewards',()=>{
 const source={inventory:[{type:'keeper_band',qty:1}],equipment:{head:'keeper_crown'},equipmentSockets:{head:['azure_bead']},chests:[],field:{overflow:[]}};
 const target={inventory:Array.from({length:24},()=>({type:'potion',qty:1})),equipment:{head:'hat'},equipmentSockets:{},chests:[[{type:'keeper_robes',qty:1}]],field:{overflow:[]}};
 preserveQuestGear(source,target);assert.equal(target.equipment.head,'keeper_crown');assert.deepEqual(target.equipmentSockets.head,['azure_bead']);assert.equal(target.chests[0][0],null);assert.deepEqual(target.field.overflow.map(i=>i.type),['keeper_band','hat']);assert.equal(target.inventory.length,24);
});
