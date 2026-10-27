import test from 'node:test';
import assert from 'node:assert/strict';
import {Game} from '../src/core.mjs';
import {LEVEL_SUPPLIES,seedSupplyChests,openSupplyChest,drawSupplyChest} from '../src/supply-chests.mjs';
import {ITEMS,count,rollGear} from '../src/items.mjs';
import {saveSession,restoreSession} from '../src/session.mjs';
import {supportHeight} from '../src/jumping.mjs';
test('Every level offers 1–3 clear, spaced chests with several possible spawn locations',()=>{
 for(const environment of Object.keys(LEVEL_SUPPLIES)){
  const positions=new Set();
  for(const random of [.01,.5,.99]){
   const g=new Game(()=>random);g.environment=environment;g.addPlayer('keyboard');g.start();
   assert.ok(g.supplyChests.length>=1&&g.supplyChests.length<=1+Math.floor(random*3),environment);
   for(const c of g.supplyChests){
    assert.equal(g.blocked(c.x,c.y,8),true,'chest blocks movement at ground level');
    assert.equal(g.blocked(c.x,c.y,8,false,false,false,14,14),false,'jump height clears the chest');
    assert.equal(supportHeight(g,{x:c.x,y:c.y}),14,'chest top supports a landing');positions.add(c.x+','+c.y);
    assert.ok(g.supplyChests.every(b=>b===c||Math.hypot(c.x-b.x,c.y-b.y)>=220));
    assert.equal(c.item,LEVEL_SUPPLIES[environment].item);assert.ok(ITEMS[c.item].slot);
   }
  }
  assert.ok(positions.size>3,environment+' placement options');
 }
});
test('Opening a supply chest while standing on its top nudges the player clear',()=>{
 const g=new Game(()=>.01);const p=g.addPlayer('keyboard');g.start();const c=g.supplyChests[0];
 Object.assign(p,{x:c.x,y:c.y,groundHeight:14,faceX:1,faceY:0});
 assert.equal(openSupplyChest(g,p),true);assert.equal(c.opened,true);assert.equal(p.x,c.x+26);assert.equal(p.groundHeight,0);
});
test('Supply chest art is half-size and names its chest above the prop',()=>{
 const calls=[],g={players:[{x:100,y:100,hp:100}],controlLabels:{interact:'E'},time:0};
 const c=new Proxy({measureText:text=>({width:text.length*5})},{get:(t,k)=>k in t?t[k]:(...args)=>calls.push([k,...args]),set:(t,k,v)=>(t[k]=v,true)});
 drawSupplyChest(c,g,{x:100,y:100,opened:false,name:'Woodland supplies',biome:'forest'});
 assert.ok(calls.some(([method,x,y])=>method==='scale'&&x===.25&&y===.25));
 assert.ok(calls.some(([method,text,x,y])=>method==='fillText'&&text==='Woodland supplies · E'&&y<0));
});
test('Supply chests open once, persist their rewards, and release collectable potions',()=>{
 const g=new Game(()=>.01);g.environment='ice';const p=g.addPlayer('keyboard');g.start();
 const c=g.supplyChests[0];Object.assign(p,{x:c.x,y:c.y});p.inventory=[];
 assert.equal(openSupplyChest(g,p),true);assert.equal(openSupplyChest(g,p),false);
 assert.equal(g.loot.length,3);assert.ok(g.loot.some(l=>l.type==='empty_jar'));assert.equal(g.loot.some(l=>l.type==='ice_arrow_recipe'),false);assert.ok(g.loot.some(l=>l.type==='snowflake_pendant'));
 const potion=g.loot.find(l=>l.type==='potion');g.collect(p,potion);assert.equal(count(p,'potion'),1);
 const restored=restoreSession(JSON.parse(JSON.stringify(saveSession(g))));
 seedSupplyChests(restored);assert.equal(restored.supplyChests[0].opened,true);
 const previous=restored.supplyChests;restored.newExpedition();assert.notEqual(restored.supplyChests,previous);assert.ok(restored.supplyChests.every(c=>!c.opened));
});
test('Themed rewards are rare, environment-specific and excluded from ordinary gear rolls',()=>{
 for(const random of [.119,.12,.99]){
  const g=new Game(()=>random);g.addPlayer('keyboard');g.start();
  assert.ok(g.supplyChests.every(c=>Boolean(c.reward)===(random<.12)));
 }
 for(let i=0;i<100;i++)assert.equal(ITEMS[rollGear(()=>i/100,'uncommon')]?.supplyOnly,undefined);
});
