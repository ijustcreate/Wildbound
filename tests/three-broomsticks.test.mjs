import assert from 'node:assert/strict';
import test from 'node:test';
import {Game} from '../src/core.mjs';
import {enterWildLands} from '../src/wild-lands.mjs';
import {HOGSMEADE_BUILDINGS,hogsmeadeDoor} from '../src/hogsmeade-layout.mjs';
import {HOGSMEADE_NPCS,hogsmeadeDoors} from '../src/hogsmeade.mjs';
import {trainInteraction,trainPrompt,trainWorldBlocked} from '../src/train-test.mjs';
import {npcDialogueAction,npcDialogueView} from '../src/npc-quests.mjs';
import {BACKPACK_SLOTS,count} from '../src/items.mjs';
import {saveSession,restoreSession} from '../src/session.mjs';

const inn=HOGSMEADE_BUILDINGS.find(site=>site.id==='three-broomsticks'),door=hogsmeadeDoor(inn);
const outside={x:door.x,y:door.y+23},inside={x:door.x,y:door.y-23};
const closed=g=>trainWorldBlocked(g,door.x,door.y,7,false,true,0,false,g.players[0]);
const restore=g=>restoreSession(JSON.parse(JSON.stringify(saveSession(g))));

function setup(){
 const g=new Game(()=>.24,{deferWorld:true});
 g.addPlayer('keyboard','Inn visitor');g.addPlayer('pad:1','Inn guest');g.phase='play';
 assert.ok(enterWildLands(g,{persistent:true}).ok);
 g.trainTest.preparing=false;g.persist=()=>{};
 const [p,guest]=g.players;
 for(const explorer of g.players)Object.assign(explorer,{equipment:{},inventory:[],coins:40,faceX:0,faceY:-1});
 Object.assign(p,outside);Object.assign(guest,{x:door.x+40,y:outside.y});
 return {g,p,guest};
}

test('the physical front door requires a main-hand, off-hand, or backpack wand when opening from outside',()=>{
 const {g,p}=setup();
 assert.ok(closed(g));
 assert.match(trainPrompt(g,p),/WAND NEEDED/);
 assert.ok(trainInteraction(g,p));
 assert.ok(closed(g));
 assert.match(g.trainTest.notice,/hand or backpack/);
 for(const gear of [{equipment:{hand1:'wand'},inventory:[]},
  {equipment:{hand2:'alley_ashwood_wand'},inventory:[]},
  {equipment:{},inventory:[{type:'friendship_wand',qty:1}]}]){
  Object.assign(p,gear);
  assert.match(trainPrompt(g,p),/OPEN THE THREE BROOMSTICKS/);
  assert.ok(trainInteraction(g,p));
  assert.equal(closed(g),false);
  assert.deepEqual(p.inventory,gear.inventory);
  assert.ok(trainInteraction(g,p));
  assert.equal(closed(g),true);
 }
 p.inventory=[{type:'wand',qty:0},{type:'staff',qty:1}];
 assert.ok(trainInteraction(g,p));assert.ok(closed(g));
});

test('a shared or legacy open door permits co-op passage and a closed door always opens from inside',()=>{
 const {g,p,guest}=setup();
 g.trainTest.hogsmeade={[inn.id]:{open:true}};
 const restored=restore(g),[host,companion]=restored.players;
 assert.equal(closed(restored),false);
 Object.assign(companion,outside);
 assert.ok(restored.moveActor(companion,0,-47)>30);
 assert.ok(companion.y<door.y);
 Object.assign(guest,{x:door.x,y:door.y+2});
 assert.ok(trainInteraction(g,p));assert.equal(closed(g),false);
 Object.assign(guest,inside);
 assert.ok(trainInteraction(g,p));assert.ok(closed(g));
 assert.ok(trainInteraction(g,guest));assert.equal(closed(g),false);
 assert.equal(hogsmeadeDoors(restored,inn).open,true);
 assert.ok(!host.equipment.hand1);
});

test('Rosmerta sells a Butterbeer inventory item, discusses the Shack freely, and a purchased drink survives reload',()=>{
 const {g,p,guest}=setup(),rosmerta=HOGSMEADE_NPCS.find(actor=>actor.id==='rosmerta');
 Object.assign(p,{x:rosmerta.x,y:rosmerta.y+42,hp:12,maxHp:60});
 assert.match(trainPrompt(g,p),/TALK TO MADAM ROSMERTA/);
 assert.ok(trainInteraction(g,p));
 assert.ok(!guest.ui);
 assert.equal(npcDialogueView(g,p).npc.name,'Madam Rosmerta');
 const rumor=npcDialogueView(g,p).choices.findIndex(c=>c.label.includes('Shrieking Shack'));
 assert.ok(npcDialogueAction(g,p,'choice:'+rumor));
 assert.match(npcDialogueView(g,p).text,/Shack.*wardrobe/);
 assert.equal(p.coins,40);
 assert.ok(npcDialogueAction(g,p,'choice:0'));
 assert.equal(p.coins,36);assert.equal(count(p,'butterbeer'),1);assert.equal(p.hp,12);
 const saved=restore(g),player=saved.players[0];saved.persist=()=>{};
 assert.equal(count(player,'butterbeer'),1);
 player.ui={panel:'pack',index:player.inventory.findIndex(i=>i?.type==='butterbeer')};
 saved.inventoryAction(player,'use');
 assert.equal(player.hp,32);assert.equal(count(player,'butterbeer'),0);
 assert.match(player.ui.notice,/Butterbeer restored 20 health/);
});

test('Rosmerta preserves gold with a full backpack and disables the sale at insufficient funds',()=>{
 const {g,p}=setup(),rosmerta=HOGSMEADE_NPCS.find(actor=>actor.id==='rosmerta');
 Object.assign(p,{x:rosmerta.x,y:rosmerta.y+42,inventory:Array.from({length:BACKPACK_SLOTS},()=>({type:'dagger',qty:1}))});
 assert.ok(trainInteraction(g,p));assert.ok(npcDialogueAction(g,p,'choice:0'));
 assert.equal(p.coins,40);assert.equal(count(p,'butterbeer'),0);
 assert.match(npcDialogueView(g,p).text,/backpack is full/);
 p.coins=3;assert.equal(npcDialogueView(g,p).choices[0].disabled,true);
 assert.ok(npcDialogueAction(g,p,'choice:0'));assert.equal(p.coins,3);
});
