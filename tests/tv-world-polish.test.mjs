import test from 'node:test';import assert from 'node:assert/strict';
import {TvWildbound,TV_BOARD_X} from '../src/tv-wildbound.mjs';
import {ITEMS} from '../src/items.mjs';
test('TV world starts near one central board and its roll freezes action in the shared board view',()=>{
 const m=new TvWildbound([{id:1,inventory:[]}],19),p=m.players.get(1);m.intro=3;p.x=TV_BOARD_X;m.step(.01,{1:{attack:true}});assert.ok(m.rollView);const x=p.x;m.step(.05,{1:{right:true}});assert.equal(p.x,x);
 p.x=235;m.rollView=null;m.boardCooldown=0;p.attackHeld=false;const progress=m.progress;m.step(.01,{1:{attack:true}});assert.equal(m.progress,progress);
});
test('question block is one-use, drops a lootable purple mushroom without consuming it',()=>{
 const hero={id:1,inventory:[]},m=new TvWildbound([hero],19),p=m.players.get(1);m.intro=3;const b=m.blocks[0];Object.assign(p,{x:b.x,y:b.y+28+58,vy:-500,grounded:false});m.step(.016,{});assert.equal(b.used,true);assert.equal(m.loot.length,1);
 const item=m.loot[0];Object.assign(item,{x:p.x,y:417,age:1});Object.assign(p,{y:437,vy:0});m.step(.016,{});assert.equal(hero.inventory[0].type,'unknown_mushroom');assert.equal(m.loot.length,0);assert.equal(ITEMS.unknown_mushroom.rarity,'unique');assert.match(ITEMS.unknown_mushroom.description,/no use yet/);
});
test('goomba spawns vary with seed and remain bounded',()=>{const a=new TvWildbound([],1),b=new TvWildbound([],2);assert.notDeepEqual(a.enemies.filter(e=>e.kind==='goomba').map(e=>e.x),b.enemies.filter(e=>e.kind==='goomba').map(e=>e.x));for(let i=0;i<100;i++)a.spawnGoomba();assert.equal(a.enemies.filter(e=>e.kind==='goomba').length,12);});
