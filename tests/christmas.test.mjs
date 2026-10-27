import test from 'node:test';import assert from 'node:assert/strict';
import {Game,EVENTS} from '../src/core.mjs';
import {SANTA_EQUIPMENT} from '../src/christmas-items.mjs';
import {spawnSanta,santaEncounterChance,useChristmasItem,tickChristmas,hitToyTrain,interactToyTrain} from '../src/christmas.mjs';
import {openNpcDialogue,npcDialogueView,npcDialogueAction} from '../src/npc-quests.mjs';
import {inventoryToolbar} from '../src/inventory-toolbar.mjs';
import {tickSalvage} from '../src/salvage.mjs';
import {stat} from '../src/items.mjs';
import {saveSession,restoreSession} from '../src/session.mjs';
import {damageStructureMelee} from '../src/structure-destruction.mjs';
import {tickFriendlyCreature} from '../src/friendly-creatures.mjs';
import {selectEvent} from '../src/event-director.mjs';
const setup=()=>{const g=new Game(()=>.3);g.environment='ice';const p=g.addPlayer('keyboard'),q=g.addPlayer('pad:0');g.start();g.openingBoard=false;g.scenery=[];g.enemies=[];g.terrain.fill('grass');p.x=p.y=500;q.x=550;q.y=500;g.blocked=()=>false;return{g,p,q};};
test('mailbox destruction releases one forgotten letter, never one per cell or hit',()=>{
 const {g,p}=setup();const mailbox={kind:'mailbox',x:500,y:470,w:24,h:32};g.house={furniture:[mailbox],walls:[],doors:[]};p.x=512;p.y=520;p.faceX=0;p.faceY=-1;
 for(let i=0;i<30;i++)damageStructureMelee(g,p,200,80,true);
 assert.equal(g.loot.filter(i=>i.type==='santa_letter').length,1);assert.ok(mailbox.santaLetterDropped);
});
test('Santa is ice-only, favored by a carried letter, creates two stags and cannot duplicate',()=>{
 const {g,p}=setup(),event=EVENTS.find(e=>e.type==='santa');assert.equal(event.environment,'ice');assert.equal(santaEncounterChance(g),.045);p.inventory=[{type:'santa_letter',qty:1}];assert.equal(santaEncounterChance(g),.65);
 const index=selectEvent(g,EVENTS,(_g,e)=>!e.environment||e.environment==='ice');assert.equal(EVENTS[index].type,'santa');
 const n=spawnSanta(g);assert.equal(g.santaDeer.length,2);assert.ok(g.santaDeer.every(d=>d.kind==='stag'));assert.equal(spawnSanta(g),n);assert.equal(g.questNpcs.filter(n=>n.santa).length,1);
 g.generatedEnvironment='forest';assert.equal(santaEncounterChance(g),0);assert.equal(spawnSanta(g),false);
});
test('each player can speak to Santa; only a real letter exchanges for a present and full bag drops reward',()=>{
 const {g,p,q}=setup(),santa=spawnSanta(g);Object.assign(p,{x:santa.x,y:santa.y+25});Object.assign(q,{x:santa.x+20,y:santa.y});
 p.inventory=[{type:'santa_letter',qty:1}];q.inventory=[];assert.ok(openNpcDialogue(g,p));assert.ok(openNpcDialogue(g,q));assert.ok(npcDialogueView(g,p).quest);assert.equal(npcDialogueView(g,q).quest,null);
 npcDialogueAction(g,q,'santa:deliver');assert.ok(!q.inventory.some(i=>i?.type==='wrapped_present'));
 npcDialogueAction(g,p,'santa:deliver');assert.ok(p.inventory.some(i=>i?.type==='wrapped_present'));assert.ok(!p.inventory.some(i=>i?.type==='santa_letter'));
 npcDialogueAction(g,q,'santa:chocolate');npcDialogueAction(g,q,'santa:chocolate');assert.equal(q.inventory.find(i=>i.type==='christmas_chocolate').qty,1);
 p.inventory=Array.from({length:24},()=>({type:'hat',qty:1}));p.inventory[0]={type:'santa_letter',qty:2};npcDialogueAction(g,p,'santa:deliver');assert.equal(p.inventory[0].qty,1);assert.ok(g.loot.some(i=>i.type==='wrapped_present'));
 const before=p.inventory[0].qty;p.ui.ownerDevice='pad:1';npcDialogueAction(g,p,'santa:deliver');assert.equal(p.inventory[0].qty,before);
});
test('hold to unwrap is selection-safe, gives all three gifts and spills overflow without losing rewards',()=>{
 const {g,p}=setup();p.inventory=Array.from({length:24},()=>({type:'hat',qty:1}));p.inventory[0]={type:'wrapped_present',qty:1};p.ui={panel:'pack',index:0};
 const action=inventoryToolbar(g,p,Array(17).fill('A')).options.find(o=>o.id==='salvage-hold');assert.equal(action.label,'Unwrap');assert.equal(action.reason,'');
 for(let i=0;i<14;i++)tickSalvage(g,p,true,.1);assert.equal(p.inventory[0].type,'christmas_bell');assert.deepEqual(g.loot.filter(i=>['toy_train','christmas_chocolate'].includes(i.type)).map(i=>i.type).sort(),['christmas_chocolate','toy_train']);
 for(let i=0;i<14;i++)tickSalvage(g,p,true,.1);assert.equal(g.loot.filter(i=>i.type==='toy_train').length,1);
 p.inventory=[{type:'christmas_chocolate',qty:2}];p.hp=1;useChristmasItem(g,p,0);assert.equal(p.hp,p.maxHp);assert.equal(p.inventory[0].qty,1);
});
test('toy train runs exactly two laps per interaction, survives saves and packs back into a pickup',()=>{
 const {g,p}=setup();p.inventory=[{type:'toy_train',qty:1}];p.faceX=0;p.faceY=1;useChristmasItem(g,p,0);assert.equal(g.toyTrains.length,1);assert.ok(!p.inventory[0]);
 for(let i=0;i<200;i++)tickChristmas(g,.05);assert.equal(g.toyTrains[0].lapsLeft,0);assert.ok(interactToyTrain(g,p));assert.equal(g.toyTrains[0].lapsLeft,2);
 const r=restoreSession(JSON.parse(JSON.stringify(saveSession(g))));assert.equal(r.toyTrains[0].lapsLeft,2);assert.ok(hitToyTrain(g,p,60));assert.equal(g.toyTrains.length,0);assert.equal(g.loot.filter(i=>i.type==='toy_train').length,1);assert.equal(hitToyTrain(g,p,60),false);
});
test('reindeer uses the stag, defends its owner, joins owner attacks, persists and can die',()=>{
 const {g,p}=setup();p.inventory=[{type:'christmas_bell',qty:1}];useChristmasItem(g,p,0);const pet=g.enemies.find(e=>e.holidayReindeer);assert.equal(pet.kind,'stag');useChristmasItem(g,p,0);assert.equal(g.enemies.length,1);
 const foe={id:g.nextId++,kind:'lion',faction:'enemy',x:pet.x+30,y:pet.y,hp:300,speed:0,damage:10};g.enemies.push(foe);tickFriendlyCreature(g,pet,.05);assert.equal(foe.hp,300,'does not attack an unprovoked neighbor');
 p.reindeerThreatId=foe.id;tickFriendlyCreature(g,pet,.05);assert.ok(foe.hp<300);foe.hp=300;pet.cooldown=0;delete p.reindeerThreatId;delete pet.reindeerTargetId;foe.killedBy=p.id;tickFriendlyCreature(g,pet,.05);assert.ok(foe.hp<300);
 const r=restoreSession(JSON.parse(JSON.stringify(saveSession(g))));assert.ok(r.enemies.some(e=>e.holidayReindeer));g.hurt(pet,999,foe);assert.equal(pet.hp,0);
 useChristmasItem(g,p,0);assert.equal(g.enemies.filter(e=>e.holidayReindeer&&e.hp>0).length,1);g.phase='won';tickChristmas(g,.05);assert.ok(!g.enemies.some(e=>e.holidayReindeer));
});
test('Christmas Spirit requires the full wearable set and supplies cosmetic icy footprints',()=>{
 const {p}=setup();p.equipment={...SANTA_EQUIPMENT};assert.equal(stat(p,'christmasSpirit'),1);assert.equal(stat(p,'icySteps'),1);delete p.equipment.gloves;assert.equal(stat(p,'christmasSpirit'),0);
});
