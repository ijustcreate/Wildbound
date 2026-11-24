import test from 'node:test';
import assert from 'node:assert/strict';
import {Game} from '../src/core.mjs';
import {BACKPACK_SLOTS,ITEMS,equip} from '../src/items.mjs';
import {saveSession,restoreSession} from '../src/session.mjs';
import {trainInteraction,trainPrompt,trainWorldBlocked} from '../src/train-test.mjs';
import {enterWildLands} from '../src/wild-lands.mjs';
import {VEIL_GLAIVE_CHEST} from '../src/wild-lands-content.mjs';
import {wildLandsInteract} from '../src/wild-lands-world.mjs';
import {nativeWildTile} from '../src/wild-native-biomes.mjs';

test('the reachable Shadow Realm chest gives one equippable Glaive and preserves the claim across saves',()=>{
 const g=new Game(()=>.4,{deferWorld:true}),p=g.addPlayer('keyboard');
 assert.ok(enterWildLands(g,{persistent:true}).ok);
 const chest=VEIL_GLAIVE_CHEST,t=g.trainTest;
 const nearChest={x:chest.x,y:chest.y+32};
 Object.assign(p,nearChest);
 assert.doesNotMatch(trainPrompt(g,p),/VEILKEEPER/);
 assert.equal(p.inventory.some(item=>item?.type==='glaive'),false);
 assert.equal(ITEMS.glaive.supplyOnly,true);

 Object.assign(p,{x:14600,y:8500});
 assert.ok(wildLandsInteract(g,p));
 assert.equal(t.design.activeRoom,'shadow');
 const walks=(x,y)=>nativeWildTile(t,x,y)==='shadow_soil'&&!trainWorldBlocked(g,x,y,9,false,false,0,false,p);
 const pending=[[p.x,p.y]],used=new Set([p.x+','+p.y]);
 for(let i=0;i<pending.length;i++){
  const [x,y]=pending[i];
  if(x===nearChest.x&&y===nearChest.y)break;
  for(const [dx,dy] of [[16,0],[-16,0],[0,16],[0,-16]]){
   const qx=x+dx,qy=y+dy,key=qx+','+qy;
   if(qx<7750||qx>8960||qy<5140||qy>5620||used.has(key)||!walks(qx,qy)||!walks(x+dx/2,y+dy/2))continue;
   used.add(key);pending.push([qx,qy]);
  }
 }
 assert.ok(used.has(nearChest.x+','+nearChest.y),'walk from the gate to the front of the chest');

 Object.assign(p,nearChest);
 assert.match(trainPrompt(g,p),/OPEN VEILKEEPER’S CHEST/);
 p.inventory=Array.from({length:BACKPACK_SLOTS},(_,slot)=>({type:'sword',qty:1,slot}));
 assert.ok(trainInteraction(g,p));
 assert.match(t.notice,/Make room/);
 assert.equal(t.wildExploration.opened.has(chest.id),false);
 p.inventory.pop();
 assert.ok(trainInteraction(g,p));
 assert.ok(t.wildExploration.opened.has(chest.id));
 assert.equal(p.inventory.filter(item=>item?.type==='glaive').length,1);
 for(const slot of ['hand1','hand2']){
  const copy=structuredClone(p),index=copy.inventory.findIndex(item=>item?.type==='glaive');
  assert.ok(equip(copy,index,slot));assert.equal(copy.equipment[slot],'glaive');
 }
 const restored=restoreSession(JSON.parse(JSON.stringify(saveSession(g)))),restoredPlayer=restored.players[0];
 assert.ok(restored.trainTest.wildExploration.opened.has(chest.id));
 assert.ok(trainInteraction(restored,restoredPlayer));
 assert.equal(restoredPlayer.inventory.filter(item=>item?.type==='glaive').length,1);
});
