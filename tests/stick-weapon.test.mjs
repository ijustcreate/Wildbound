import test from 'node:test';
import assert from 'node:assert/strict';
import {Game} from '../src/core.mjs';
import {equip,moveInventoryItem,itemKind} from '../src/items.mjs';
import {LobbyPractice} from '../src/lobby-practice.mjs';

test('equipping a dragged stick stack takes exactly one and uses sword combat',()=>{
 const g=new Game(()=>.5),p=g.addPlayer('keyboard');p.inventory=[{type:'stick',qty:20}];p.equipment={};
 assert.ok(moveInventoryItem(p,null,{mode:'pack',index:0},{mode:'gear',slot:'hand1'}));
 assert.equal(p.inventory[0].qty,19);assert.equal(p.equipment.hand1,'stick');assert.equal(itemKind('stick'),'sword');
});
test('stick breaks on a successful melee hit below 5%, not on a miss or at 5%',()=>{
 for(const [random,hit,broken]of [[.049,true,true],[.05,true,false],[0,false,false]]){
  const g=new LobbyPractice(),p=g.addPlayer('keyboard');p.equipment={hand1:'stick'};p.inventory=[{type:'stick',qty:19}];p.x=280;p.y=hit?165:300;p.faceX=0;p.faceY=-1;g.random=()=>random;
  assert.ok(g.attack(p));assert.equal(p.equipment.hand1,broken?null:'stick');assert.equal(p.inventory[0].qty,19);
  if(broken){assert.ok(equip(p,0));assert.equal(p.inventory[0].qty,18);assert.equal(p.equipment.hand1,'stick');}
 }
});
