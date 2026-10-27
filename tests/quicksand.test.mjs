import test from 'node:test';
import assert from 'node:assert/strict';
import {Game} from '../src/core.mjs';
import {tickQuicksand,tickQuicksandLoot,MAX_SAND_DEPTH} from '../src/quicksand.mjs';
const setup=()=>{const g=new Game();g.phase='play';g.openingBoard=false;g.house=null;g.scenery=[];g.terrain.fill('quicksand');const p=g.addPlayer('keyboard');Object.assign(p,{x:300,y:300});return {g,p};};
test('Idle player sinks fully, uses pool breath rules, and suffocates in quicksand',()=>{
 const {g,p}=setup();for(let i=0;i<200;i++)g.update(.05,{});assert.equal(p.sink,MAX_SAND_DEPTH);assert.equal(p.quicksandUnder,true);assert.ok(p.breath<20);assert.equal(p.breathVisible,1);assert.equal(p.hp,100);
 p.breath=.1;for(let i=0;i<23;i++)g.update(.05,{});assert.equal(p.hp,75);
});
test('Moving rises slowly, jumping rises fast, leaving sand restores air',()=>{
 const {g,p}=setup();p.sink=48;g.update(.05,{keyboard:{x:1}});for(let i=0;i<20;i++)g.update(.05,{keyboard:{x:1}});assert.ok(p.sink<42&&p.sink>30);
 const before=p.sink;g.update(.1,{keyboard:{jump:true}});assert.ok(p.sink<before-20);assert.ok(p.jumpHeight>0);assert.equal(p.quicksandUnder,false);
 g.terrain.fill('grass');p.breath=4;for(let i=0;i<50;i++)g.update(.05,{});assert.equal(p.sink,0);assert.equal(p.breath,20);assert.equal(p.breathVisible,0);
});
test('Sinking is time based, not frame based, and supported players do not sink',()=>{
 const {g}=setup(),a={x:300,y:300,hp:100},b={...a};for(let i=0;i<100;i++)tickQuicksand(g,a,{},.01);for(let i=0;i<10;i++)tickQuicksand(g,b,{},.1);assert.ok(Math.abs(a.sink-b.sink)<1e-8);
 a.groundHeight=16;a.sink=0;tickQuicksand(g,a,{},1);assert.equal(a.sink,0);
});
test('Loot sinks into quicksand, stays interactable for one second after vanishing, then is removed',()=>{
 const {g,p}=setup();p.x=300;p.y=300;
 const loot={id:991,x:300,y:300,type:'sword',qty:1};g.loot.push(loot);
 tickQuicksandLoot(g,.5);assert.equal(loot.quicksandSink,13);assert.equal(loot.quicksandHidden,undefined);
 tickQuicksandLoot(g,.5);assert.equal(loot.quicksandHidden,true);assert.equal(loot.quicksandGrace,1);
 assert.equal(g.nearbyLoot(p),loot);tickQuicksandLoot(g,.9);assert.ok(g.loot.includes(loot));
 assert.equal(g.collect(p,loot),true);assert.ok(!g.loot.includes(loot));
 const missed={id:992,x:300,y:300,type:'sword',qty:1};g.loot.push(missed);tickQuicksandLoot(g,1);assert.equal(missed.quicksandHidden,true);
 tickQuicksandLoot(g,.99);assert.ok(g.loot.includes(missed));tickQuicksandLoot(g,.02);assert.ok(!g.loot.includes(missed));
});
