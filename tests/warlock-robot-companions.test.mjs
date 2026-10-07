import test from 'node:test';
import assert from 'node:assert/strict';
import {Game,EVENTS} from '../src/core.mjs';
import {ITEMS,WARLOCK_EQUIPMENT,rollGear,sellValue} from '../src/items.mjs';
import {warlockMotion,validateWarlockMotion,warlockVisualActor,drawWarlock} from '../src/warlock-motion.mjs';
import {rigSubject} from '../src/rig-subjects.mjs';
import {definitionPack,applyDefinitions} from '../src/definitions.mjs';
import {robotBuybackIndices,buybackStack} from '../src/robot-shop.mjs';
import {befriendCreature,tickFriendlyCreature} from '../src/friendly-creatures.mjs';
import {companionVisualActor,companionMovement} from '../src/companion-locomotion.mjs';
import {restoreHunterPet,tickHunterPets,TAMABLE_KINDS} from '../src/hunter-pets.mjs';

const setup=()=>{const g=new Game(()=>.5),p=g.addPlayer('pad:0');g.phase='play';g.openingBoard=false;g.house=null;g.scenery=[];g.terrain.fill('grass');Object.assign(p,{x:300,y:300,hp:100,robotRepaired:true});return {g,p};};
test('warlock is the shared equipped humanoid and preserves old actor/save equipment',()=>{
  assert.equal(rigSubject('necromancer').data,warlockMotion);assert.ok(validateWarlockMotion(warlockMotion));assert.equal(warlockMotion.artGeneration,3);
  const actor={kind:'necromancer',hp:60,equipment:{hand1:'staff'},moving:true},before=structuredClone(actor),visual=warlockVisualActor(actor);
  for(const [slot,id]of Object.entries(WARLOCK_EQUIPMENT))assert.equal(visual.equipment[slot],id);
  assert.deepEqual(actor,before);for(const id of Object.values(WARLOCK_EQUIPMENT))assert.ok(ITEMS[id].npcOnly);
  for(const rarity of ['common','rare','unique','legendary'])for(let n=0;n<100;n++)assert.ok(!ITEMS[rollGear(()=>n/100,rarity)]?.npcOnly);
});
test('warlock supports walk, cast, hurt and death without changing its gameplay actor',()=>{
  const actor={kind:'necromancer',hp:80,equipment:{hand1:'staff'},faceX:0,faceY:1};
  assert.equal(warlockVisualActor({...actor,summonPulse:.4}).animationAction,'cast');assert.equal(warlockVisualActor({...actor,healEffect:.6}).animationAction,'cast');
  assert.equal(warlockVisualActor({...actor,flash:.1,summonPulse:.4}).animationAction,'hurt');assert.equal(warlockVisualActor({...actor,hp:0,flash:.1}).animationAction,'death');
  const rasters=new Set();for(let d=0;d<8;d++)for(const animationAction of ['idle','walk','cast','hurt','death']){
    let pixels=0;const colors=new Set(),c={save(){},restore(){},fillRect(x,y,w,h){assert.ok([x,y,w,h].every(Number.isFinite));pixels+=w*h;colors.add(this.fillStyle);}};
    const pose=drawWarlock(c,{...actor,faceX:Math.sin(d*Math.PI/4),faceY:Math.cos(d*Math.PI/4),animationAction,playerFrame:3},.6);
    assert.ok(pose.handR&&pose.footR&&pose.head);assert.ok(pixels>100&&pixels<10000);rasters.add([...colors].join(','));
  }assert.ok(rasters.size>1);
  const pack=structuredClone(definitionPack(EVENTS,ITEMS));assert.ok(validateWarlockMotion(pack.warlock));assert.doesNotThrow(()=>applyDefinitions(pack,EVENTS,ITEMS));
});
test('robot backpack navigation is a full six by four grid, including empty slots',()=>{
  const {g,p}=setup();p.room=1;g.portals=[{id:1,owner:p.id}];p.inventory=[null,{type:'potion',qty:7}];assert.ok(g.openShop(p,'robot'));assert.equal(p.ui.index,1);
  g.inventoryAction(p,'down');assert.equal(p.ui.index,7);g.inventoryAction(p,'prev');assert.equal(p.ui.index,6);g.inventoryAction(p,'up');assert.equal(p.ui.index,0);
  g.inventoryAction(p,'next');g.inventoryAction(p,'use');assert.equal(p.coins,21);assert.equal(p.inventory[1],undefined);assert.equal(p.ui.index,1);
  g.inventoryAction(p,'panel');assert.equal(p.ui.robotView,'buyback');g.inventoryAction(p,'use');assert.equal(p.coins,0);assert.equal(p.inventory[0].qty,7);assert.equal(p.robotStock.length,0);
});
test('compact victory loot navigation matches its six-column slot grid',()=>{
  const {g,p}=setup();g.victoryRewards=Array.from({length:12},()=>({type:'hat',qty:1}));g.openInventory(p,'victory');p.ui.loot=true;p.ui.panel='chest';
  g.inventoryAction(p,'down');assert.equal(p.ui.index,6);g.inventoryAction(p,'up');assert.equal(p.ui.index,0);g.inventoryAction(p,'prev');assert.equal(p.ui.index,23);const before=structuredClone(g.victoryRewards);g.inventoryAction(p,'use');assert.deepEqual(g.victoryRewards,before);
});
test('robot buyback is atomic, retains sockets and bags, and never duplicates a purchase',()=>{
  const {g,p}=setup();p.coins=100;p.inventory=Array.from({length:24},()=>({type:'hat',qty:1}));const item={type:'necromancer_wand',qty:1,sockets:['azure_bead']},owner={robotStock:[structuredClone(item)]},snapshot=JSON.stringify([p.inventory,owner.robotStock,p.coins]);
  assert.match(buybackStack(p,owner,0),/Backpack full/);assert.equal(JSON.stringify([p.inventory,owner.robotStock,p.coins]),snapshot);
  p.inventory[2]=null;p.coins=0;assert.match(buybackStack(p,owner,0),/Not enough/);assert.deepEqual(owner.robotStock[0],item);
  p.coins=100;assert.match(buybackStack(p,owner,0),/Bought back/);assert.deepEqual(p.inventory[2],item);assert.equal(p.coins,100-sellValue(item.type));const coins=p.coins;buybackStack(p,owner,0);assert.equal(p.coins,coins);
  p.inventory=[];owner.robotStock=[{type:'armor_bag',qty:1,contents:[{type:'hat',qty:1,sockets:['ruby']}]}];p.coins=100;const bag=structuredClone(owner.robotStock[0]);assert.match(buybackStack(p,owner,0),/Bought back/);assert.deepEqual(p.inventory[0],bag);
});
test('robot buyback pages expose all old sold items and preserve each players cursor',()=>{
  const {g,p}=setup(),q=g.addPlayer('pad:1');q.inventory=[];p.room=q.room=1;g.portals=[{id:1,owner:p.id}];p.robotStock=Array.from({length:14},()=>({type:'hat',qty:1}));g.openShop(p,'robot');g.openShop(q,'robot');g.inventoryAction(q,'robotContinue');g.openShop(q,'robot');
  g.inventoryAction(p,'panel');assert.equal(p.ui.robotIndex,13);g.inventoryAction(p,'robotPage:next');assert.equal(p.ui.robotIndex,7);g.inventoryAction(p,'robotPage:next');assert.equal(p.ui.robotIndex,1);
  assert.equal(q.ui.robotView,'sell');assert.equal(q.ui.index,0);assert.equal(robotBuybackIndices(p).length,14);
  p.coins=100;g.inventoryAction(p,'use');assert.equal(p.robotStock[1],null);assert.equal(q.inventory.length,0);
});
test('friendship conversion clears pinned frames and hostile phases for every tamable species',()=>{
  for(const kind of TAMABLE_KINDS){const {g,p}=setup(),actor={id:g.nextId++,kind,x:460,y:300,hp:60,speed:90,damage:10,playerFrame:0,animationProgress:1,animationTime:0,night:{phase:'windup',timer:9},state:'charge',animationAction:'pounce'};g.enemies=[actor];befriendCreature(actor,p.id);
    assert.equal(actor.playerFrame,undefined);assert.equal(actor.night,undefined);const frames=new Set();
    for(let n=0;n<8;n++){tickFriendlyCreature(g,actor,.05);assert.equal(actor.moving,true);const visual=companionVisualActor(actor,rigSubject(kind).data);assert.equal(visual.animationAction,kind==='bat'?'fly':'walk');frames.add(visual.playerFrame);}
    if(kind!=='bat')assert.equal(frames.size,8);assert.ok(actor.step>0);p.x=actor.x;p.y=actor.y;actor.playerFrame=0;actor.night={phase:'windup'};tickFriendlyCreature(g,actor,.4);assert.equal(actor.moving,false);assert.equal(actor.playerFrame,undefined);assert.equal(actor.night,undefined);
  }
});
test('Ranger pet movement advances gait exactly once and blocked pets stay idle',()=>{
  for(const kind of TAMABLE_KINDS){const {g,p}=setup();p.hunterPet=restoreHunterPet({kind});Object.assign(p.hunterPet,{x:450,y:300});const pet=p.hunterPet;tickHunterPets(g,.05);assert.ok(pet.moving);assert.ok(pet.step>0);assert.equal(companionVisualActor(pet,rigSubject(kind).data).animationAction,kind==='bat'?'fly':'run');
    const before=pet.step;g.blocked=()=>true;tickHunterPets(g,.05);assert.equal(pet.moving,false);assert.equal(pet.step,before);
  }
  const actor={x:0,y:0,hp:50,speed:90,step:0},finish=companionMovement(actor,.1);actor.x=9;actor.step=9*.13;finish();assert.equal(actor.step,9*.13);
  const stopped={...actor,moving:false,animationAction:'sit'};assert.equal(companionVisualActor(stopped,rigSubject('lion').data),stopped);
  const preview={...actor,faction:'ally',moving:true,animationAction:'idle',playerFrame:3};assert.equal(companionVisualActor(preview,rigSubject('lion').data),preview);
});
