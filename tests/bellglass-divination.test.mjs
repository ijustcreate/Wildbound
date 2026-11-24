import test from 'node:test';
import assert from 'node:assert/strict';
import {Game} from '../src/core.mjs';
import {alleyBlocked,alleyGate,alleyPrompt} from '../src/diagon-alley.mjs';
import {GARDEN_SHOPS} from '../src/diagon-garden-shops.mjs';
import {CRYSTAL_BALL_ID,CRYSTAL_BALL_REPLIES,MAGIC_MUSHROOM_ID,ZODIAC_READINGS} from '../src/divination-content.mjs';
import {npcDialogueView} from '../src/npc-quests.mjs';
import {controllerButtonNames} from '../src/controls.mjs';
import {inventoryToolbar} from '../src/inventory-toolbar.mjs';
import {ITEMS} from '../src/items.mjs';
import {enterWildLands} from '../src/wild-lands.mjs';

function bellglass(){
 const g=new Game(()=>.5),p=g.addPlayer('keyboard','Stargazer');
 g.start();g.openingBoard=false;g.persist=()=>{};g.onSound=()=>{};
 assert.ok(enterWildLands(g,{persistent:true}).ok);
 const gate=alleyGate(g),tick=input=>g.update(.05,{keyboard:input||{}});
 const interact=()=>{tick();tick({interact:true});};
 Object.assign(p,{x:gate.x,y:gate.y+55});p.equipment.hand1='starter_wand';
 interact();for(let i=0;i<16;i++)tick();interact();
 assert.equal(g.trainTest.design.activeRoom,'diagon');
 const shop=GARDEN_SHOPS.find(s=>s.id==='bellglass');
 Object.assign(p,{x:shop.x,y:shop.y+32,coins:100});
 assert.equal(alleyBlocked(g,p.x,p.y),false);
 assert.equal(alleyPrompt(g,p),'TALK TO IONA BELLGLASS');
 return {g,p,interact};
}

test('the Bellglass counter reads all twelve signs and cycles four different readings for each',()=>{
 const {g,p,interact}=bellglass();interact();
 assert.ok(p.ui.bellglassDivination);
 assert.equal(npcDialogueView(g,p).npc.name,'Iona Bellglass');
 const select=action=>{
  const index=npcDialogueView(g,p).choices.findIndex(c=>c.action===action);
  assert.ok(index>=0,action+' is reachable in the live conversation');
  g.inventoryAction(p,'choice:'+index);
 };
 select('signs:0');
 const signs=[...npcDialogueView(g,p).choices.filter(choice=>choice.action.startsWith('sign:'))];
 select('signs:1');
 signs.push(...npcDialogueView(g,p).choices.filter(choice=>choice.action.startsWith('sign:')));
 assert.deepEqual(signs.map(s=>s.label),Object.keys(ZODIAC_READINGS));
 for(const [i,{label,action}] of signs.entries()){
  if(i===0)select('signs:0');
  if(i===6)select('signs:1');
  const replies=[];
  for(let j=0;j<4;j++){select(action);replies.push(npcDialogueView(g,p).text);}
  assert.deepEqual(new Set(replies),new Set(ZODIAC_READINGS[label]));
  select('signs:'+(i<6?0:1));
 }
 assert.equal(new Set(Object.values(ZODIAC_READINGS).flat()).size,48);
 select('greeting');
 assert.match(npcDialogueView(g,p).text,/mushrooms.*funny/);
});

test('old Bellglass stock gains both items and the crystal ball is reusable for twenty distinct answers',()=>{
 const {g,p,interact}=bellglass(),t=g.trainTest;
 t.alleyMerchants={bellglass:{owner:'Iona Bellglass',visual:{id:'alley-bellglass'},alleyShop:true,trainTailor:true,
  shopTitle:'Bellglass Conservatory',stock:[{item:{type:'potion',qty:1},price:12}],greeting:'Welcome.',revision:0}};
 interact();
 assert.deepEqual(t.alleyMerchants.bellglass.stock.map(row=>row.item.type),['potion',CRYSTAL_BALL_ID,MAGIC_MUSHROOM_ID]);
 g.inventoryAction(p,'close');interact();
 assert.equal(t.alleyMerchants.bellglass.stock.length,3);
 g.inventoryAction(p,'choice:1');
 assert.equal(p.ui.shop,'merchant');
 p.ui.index=1;g.inventoryAction(p,'use');
 assert.equal(p.coins,65);
 g.inventoryAction(p,'close');g.openInventory(p);
 p.ui.index=p.inventory.findIndex(item=>item?.type===CRYSTAL_BALL_ID);
 const action=inventoryToolbar(g,p,controllerButtonNames('xbox')).options.find(o=>o.id==='use');
 assert.equal(action.label,'Ask the crystal ball');assert.equal(action.reason,'');
 assert.match(ITEMS[CRYSTAL_BALL_ID].description,/yes-or-no.*without using it up/);
 const replies=[];
 for(let i=0;i<20;i++){g.inventoryAction(p,action.action);replies.push(p.ui.notice);}
 assert.deepEqual(new Set(replies),new Set(CRYSTAL_BALL_REPLIES));
 g.inventoryAction(p,action.action);
 assert.notEqual(p.ui.notice,replies.at(-1));
 assert.equal(p.inventory[p.ui.index].qty,1);
});

test('Magic Mushrooms use the native purchased item stack and stop at three active portions',()=>{
 const {g,p,interact}=bellglass();interact();g.inventoryAction(p,'choice:1');
 p.ui.index=g.trainTest.alleyMerchants.bellglass.stock.findIndex(r=>r.item.type===MAGIC_MUSHROOM_ID);
 for(let i=0;i<4;i++)g.inventoryAction(p,'use');
 assert.equal(p.coins,52);
 g.inventoryAction(p,'close');g.openInventory(p);
 p.ui.index=p.inventory.findIndex(item=>item?.type===MAGIC_MUSHROOM_ID);
 const action=inventoryToolbar(g,p,controllerButtonNames('xbox')).options.find(o=>o.id==='use');
 assert.equal(action.label,'Eat magic mushroom');assert.equal(action.reason,'');
 for(let i=0;i<3;i++){g.inventoryAction(p,action.action);assert.equal(p.field.bellglassMushroomRemaining,60*(i+1));}
 g.inventoryAction(p,action.action);
 assert.match(p.ui.notice,/Three waves/);
 assert.equal(p.inventory[p.ui.index].qty,1);
 assert.equal(p.field.bellglassMushroomRemaining,180);
});
