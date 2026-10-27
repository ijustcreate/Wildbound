import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import {Game,EVENTS} from '../src/core.mjs';
import {beginTrial,defeatTrialMember,resetTrials,trialSummary,pacingWeight,regionalObjective,tickTrials} from '../src/expedition-trials.mjs';
import {victoryRewards} from '../src/victory-chest.mjs';
import {ITEMS,sellValue,socketTrinket,stat} from '../src/items.mjs';
import {salvageYield} from '../src/salvage.mjs';
import {damageEnemy} from '../src/enemy-damage.mjs';
import {weaponHitContext} from '../src/dark-essence.mjs';
import {trainingPoints,awardTrainingPoint} from '../src/training-points.mjs';
import {trainSkill} from '../src/field-skills.mjs';
import {vendingStock,ensureVendingStock,purchaseVending,collectVending} from '../src/shops.mjs';
import {saveSession,restoreSession} from '../src/session.mjs';
import {mitigatedHit} from '../src/combat-fairness.mjs';
import {ENCOUNTER_CUES,encounterCue} from '../src/encounter-cues.mjs';
const make=()=>{const g=new Game(()=>.5);g.addPlayer('keyboard','Explorer');g.start();g.openingBoard=false;return g;};
test('delayed kills resolve their original trial once, not the newest roll',()=>{
 const g={players:[],cleared:0,enemies:[],time:1,environment:'forest'},a={id:1,hp:100},b={id:2,hp:20};
 beginTrial(g,{name:'Lion',kind:'lion'},[a,b]);beginTrial(g,{name:'Dragon',kind:'dragon'},[{id:3,hp:100}]);
 assert.equal(trialSummary(g).score,0);defeatTrialMember(g,a);assert.equal(trialSummary(g).score,0);defeatTrialMember(g,b);defeatTrialMember(g,b);
 assert.deepEqual({...trialSummary(g),destinations:[]},{offered:2,cleared:1,skipped:1,score:1,destinations:[]});
 resetTrials(g);assert.equal(trialSummary(g).score,0);
});
test('real spawning, save restoration and victory use clear credit; skipping awards no XP or gear',()=>{
 const g=make(),p=g.players[0];g.spawnEvent(0);assert.ok(g.expeditionTrials.entries.length);const before=p.xp;
 for(let i=0;i<20;i++)g.players[0].progress=i+28;
 g.completeVictory();assert.equal(p.xp,before);assert.equal(g.expeditionDebrief.cleared,0);assert.deepEqual(g.victoryRewards.map(i=>i.type),['trial_letter','arrow','fruit']);
 const h=make();h.spawnEvent(0);for(const e of h.enemies.filter(e=>e.trialId)){e.hp=0;defeatTrialMember(h,e);}
 const restored=restoreSession(JSON.parse(JSON.stringify(saveSession(h))));assert.deepEqual(trialSummary(restored),trialSummary(h));
 const old=JSON.parse(JSON.stringify(saveSession(h)));delete old.state.expeditionTrials;old.state.cleared=3;assert.equal(trialSummary(restoreSession(old)).score,3);
});
test('peaceful NPCs have no pressure or reward credit; weather needs surface participation',()=>{
 const g={players:[{hp:100}],enemies:[],time:0,environment:'ice',weather:{type:'blizzard',life:20}};
 assert.equal(beginTrial(g,{name:'Friends',type:'villager_camp'}),null);
 beginTrial(g,{name:'Snow',type:'blizzard',duration:20});g.players[0].room='safe';tickTrials(g,20);g.weather=null;tickTrials(g,1);assert.equal(trialSummary(g).score,0);
 g.weather={type:'blizzard',life:20};beginTrial(g,{name:'Second snow',type:'blizzard',duration:20});g.players[0].room=null;tickTrials(g,15);g.weather=null;tickTrials(g,.1);assert.equal(trialSummary(g).score,1);assert.equal(trialSummary(g).skipped,1);
});
test('late pacing has no 40–47 phase or health veto and regional objectives vary',()=>{
 const g={seed:1,random:()=>.7,players:[{hp:0,progress:39}],environment:'temple',enemies:[]};const e={kind:'dragon'};
 const a=pacingWeight(g,e);g.players[0].progress=47;assert.equal(pacingWeight(g,e),a);g.players[0].hp=100;assert.equal(pacingWeight(g,e),a);
 const first=regionalObjective(g);assert.notEqual(regionalObjective(g),first);
});
test('starter weapons have small sale value and one material; relic copies still stack',()=>{
 const ids=Object.keys(ITEMS).filter(id=>id.startsWith('starter_')&&ITEMS[id].slot);assert.ok(ids.length>=7);
 for(const id of ids){assert.ok(sellValue(id)>=1&&sellValue(id)<=5,id);assert.deepEqual(salvageYield(id),[{type:'relic_dust',qty:1}],id);}
 const p={equipment:{},inventory:[{type:'jade_scarab',qty:1}]};const single=stat(p,'armor');assert.equal(single,1);p.inventory.push({type:'jade_scarab',qty:1});assert.equal(stat(p,'armor'),single*2);
});
test('dark essence consumes on actual healing, refills, and cannot heal from old or swapped shots',()=>{
 const g=make(),p=g.players[0];p.equipment.hand1='sword';p.hp=50;p.maxHp=100;p.inventory=[{type:'dark_essence',qty:2}];p.equipmentSockets={};
 assert.ok(socketTrinket(p,{mode:'gear',slot:'hand1'},0));const shot=weaponHitContext(p),e={hp:5};
 damageEnemy(e,100,'physical',{g,p,shot});assert.equal(p.hp,51);assert.equal(e.hp,0);assert.ok(p.equipmentSockets.hand1.includes('dark_essence'));assert.ok(!p.inventory.some(i=>i?.type==='dark_essence'));
 damageEnemy({hp:20},20,'physical',{g,p,shot});assert.equal(p.hp,55);assert.deepEqual(p.equipmentSockets.hand1,[]);
 p.equipmentSockets.hand1=['dark_essence'];p.equipment.hand1='dagger';damageEnemy({hp:30},20,'physical',{g,p,shot});assert.equal(p.hp,55);
 p.equipment.hand1='sword';const uncharged={...shot,darkCharged:false};damageEnemy({hp:30},20,'physical',{g,p,shot:uncharged});assert.equal(p.hp,55);
 p.hp=100;damageEnemy({hp:30},20,'physical',{g,p,shot});assert.ok(p.equipmentSockets.hand1.includes('dark_essence'));
 p.inventory=[{type:'dark_essence',qty:1}];p.equipment.head='hat';assert.equal(socketTrinket(p,{mode:'gear',slot:'head'},0),false);
});
test('training migration preserves ranks and XP, earns on levels and spends only points',()=>{
 const p={level:5,xp:180,field:{skills:{long_jump:1},skillScrolls:{long_jump:true}}};assert.equal(trainingPoints(p),3);trainSkill(p,'long_jump');assert.equal(p.xp,180);assert.equal(p.field.skills.long_jump,2);assert.equal(trainingPoints(p),2);awardTrainingPoint(p);assert.equal(trainingPoints(p),3);
});
test('vending bundles retain quantity through save, preserve depletion and custom stock',()=>{
 const owner={id:1,vendingStock:Array.from({length:12},(_,i)=>({type:i%3===1?'stamina_potion':'potion',price:i%3===1?15:10,qty:i===2?0:4}))};
 ensureVendingStock(owner);assert.equal(owner.vendingStock[2].qty,0);assert.equal(new Set(vendingStock().map(s=>s.type)).size,12);
 const p={coins:100,inventory:[]};owner.vendingStock[2].qty=1;purchaseVending(p,owner,2);const restored=JSON.parse(JSON.stringify(p));restored.vendingOrders[0].ready=true;assert.ok(collectVending(restored,1));assert.equal(restored.inventory[0].qty,8);assert.equal(restored.coins,90);
 const custom={vendingStock:[{type:'sword',qty:2,price:7}]};ensureVendingStock(custom);assert.equal(custom.vendingStock[0].price,7);
});
test('armor cannot erase dangerous hits, gentle damage and adventure tuning remain distinct',()=>{
 assert.equal(mitigatedHit(40,100,'normal'),10);assert.equal(mitigatedHit(40,100,'adventure'),6.5);assert.equal(mitigatedHit(40,100,'gentle'),1);
});
test('all encounter cards have distinct composed PCM assets, bounded levels and usable metadata',()=>{
 const hashes=new Set();for(const event of EVENTS){const cue=encounterCue(event);assert.equal(typeof cue,'object',event.name);const wav=fs.readFileSync(cue.files[0]);assert.equal(wav.toString('ascii',0,4),'RIFF');assert.equal(wav.readUInt32LE(24),22050);let peak=0;for(let i=44;i<wav.length;i+=2)peak=Math.max(peak,Math.abs(wav.readInt16LE(i)));assert.ok(peak>1000&&peak<=24000);hashes.add(crypto.createHash('sha256').update(wav).digest('hex'));}
 assert.equal(hashes.size,EVENTS.length);assert.equal(Object.keys(ENCOUNTER_CUES).length,EVENTS.length+13);
 for(const destination of ['swamp','caverns','shadow'])assert.equal(typeof encounterCue('Travel · '+destination),'object',destination+' travel cue');
 const rich=victoryRewards([{equipment:{hand1:'bow'}}],()=>.3,{score:20,cleared:10,skipped:0});assert.ok(rich.some(i=>ITEMS[i.type].rarity==='legendary'));assert.equal(new Set(rich.map(i=>i.type)).size,rich.length);
});

test('clears unlock choices, extended runs retain credit, and spawn grace blocks immediate damage',()=>{
 const g=make(),p=g.players[0];p.invuln=0;const hp=p.hp,enemy={id:998,x:p.x+10,y:p.y,hp:10,spawnReadyAt:g.time+1};g.enemies.push(enemy);g.hurt(p,20,enemy);assert.equal(p.hp,hp);
 g.time+=2;g.hurt(p,20,enemy);assert.ok(p.hp<hp);
 resetTrials(g);for(let i=0;i<300;i++){const e={id:i,hp:1};beginTrial(g,{name:'Trial '+i,kind:'lion'},[e]);defeatTrialMember(g,e);}
 assert.equal(trialSummary(g).score,300);assert.equal(trialSummary(g).cleared,300);assert.ok(g.expeditionTrials.entries.length<=256);assert.ok(p.field.choice);
});

test('the board letter has an enabled Read action and is reusable beside an open chest',async()=>{
 const {inventoryToolbar}=await import('../src/inventory-toolbar.mjs');const g=make(),p=g.players[0];p.inventory=[{type:'trial_letter',qty:1}];g.victoryRewards=[{type:'arrow',qty:4}];g.openInventory(p,'victory');p.ui.panel='pack';p.ui.index=0;
 const action=inventoryToolbar(g,p,[]).options.find(o=>o.id==='use');assert.equal(action.label,'Read');assert.equal(action.reason,'');g.inventoryAction(p,action.action);assert.ok(p.ui.notice.includes('The dice may hurry'));assert.equal(p.inventory[0].qty,1);
});
