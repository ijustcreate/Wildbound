import test from 'node:test';
import assert from 'node:assert/strict';
import {Game} from '../src/core.mjs';
import {generateWorld} from '../src/world.mjs';
import {ensurePlayground,tickPlayground,breakPlayPot,interactPlayground,shakeAppleTree,throwPlayApple,hitPlayground,foragePlayApple,useApple} from '../src/playground.mjs';
import {playgroundSupport} from '../src/playground-geometry.mjs';
import {startJump,tickJump} from '../src/jumping.mjs';
import {saveSession,restoreSession} from '../src/session.mjs';
function fixture(){const g=new Game(()=>.5),p=g.addPlayer('keyboard','Tester');g.start();Object.assign(g,generateWorld(42,'house'),{seed:42,generatedEnvironment:'house',environment:'house',phase:'play',openingBoard:false});g.persist=()=>{};g.onSound=()=>{};ensurePlayground(g);return {g,p};}
function blank(){const {g,p}=fixture();g.house=null;g.scenery=[];g.terrain.fill('grass');g.playground.props=[];Object.assign(p,{x:400,y:400,faceX:1,faceY:0});return {g,p};}
test('additive playground placement preserves authored scenery and is stable across ticks',()=>{
 const {g}=fixture(),scenery=structuredClone(g.scenery),house=structuredClone(g.house),props=structuredClone(g.playground.props);ensurePlayground(g);assert.deepEqual(g.playground.props,props);assert.deepEqual(g.scenery,scenery);assert.deepEqual(g.house,house);assert.equal(props.filter(o=>o.kind==='apple_tree').length,3);assert.equal(props.filter(o=>o.kind==='step').length,6);assert.equal(props.filter(o=>o.kind==='ball').length,1);
});
test('pot outcomes include empty, coins, frog, imp and six native carryable chickens, once only',()=>{
 for(const [roll,kind,count]of [[.1,'empty',0],[.5,'coins',3],[.75,'frog',1],[.85,'imp',1],[.95,'chicken',6]]){const {g}=blank();g.random=()=>roll;g.enemies=[];const pot={x:400,y:400,kind:'pot'};g.playground.props=[pot];assert.equal(breakPlayPot(g,pot),true);assert.equal(breakPlayPot(g,pot),false);if(kind==='coins')assert.equal(g.playground.coins.length,count);else if(kind==='frog')assert.equal(g.playground.frogs.length,count);else assert.equal(g.enemies.filter(e=>e.kind===kind).length,count);if(kind==='imp')assert.equal(g.enemies[0].faction,'hostile');}
});
test('the real pot-breaking sword strike does not also damage its surprise chickens',()=>{
 const {g,p}=blank();g.random=()=>.95;g.enemies=[];g.playground.props=[{kind:'pot',x:425,y:400}];p.equipment={hand1:'sword'};g.resolveMelee(p,0,{damage:1});const chickens=g.enemies.filter(e=>e.kind==='chicken');assert.equal(chickens.length,6);assert.ok(chickens.every(e=>e.hp===e.maxHp));
});
test('tree shake makes limited falling apples, repeat shakes cannot duplicate fruit',()=>{
 const {g,p}=blank(),tree={kind:'apple_tree',x:430,y:400,fruit:5};g.playground.props=[tree];assert.ok(interactPlayground(g,p));assert.equal(tree.fruit,3);assert.equal(g.playground.apples.length,2);shakeAppleTree(g,p,tree);assert.equal(tree.fruit,3);for(let i=0;i<100;i++)tickPlayground(g,.02);assert.ok(g.playground.apples.every(a=>a.z===0));assert.equal(tree.fruit,3);
});
test('catch, throw and eat fresh apples without consuming an equipped weapon',()=>{
 const {g,p}=blank();const a={id:'apple',x:420,y:400,z:30,vx:0,vy:0,vz:0,age:0};g.playground.apples=[a];const gear=structuredClone(p.equipment);assert.ok(interactPlayground(g,p));assert.equal(a.heldBy,p.id);assert.ok(g.attack(p));assert.equal(a.heldBy,null);assert.equal(a.vx,180);assert.equal(a.vy,0);assert.deepEqual(p.equipment,gear);Object.assign(a,{x:420,y:400,z:0,vx:0,vy:0});assert.ok(interactPlayground(g,p));p.hp=p.maxHp-20;assert.ok(interactPlayground(g,p));assert.equal(p.hp,p.maxHp-8);assert.equal(g.playground.apples.length,0);
});
test('full-health apples pack, full bags keep held apple, backpack apples heal only when needed',()=>{
 const {g,p}=blank();g.playground.apples=[{id:'a',x:420,y:400,z:0,vx:0,vy:0,vz:0,age:0}];p.hp=p.maxHp;interactPlayground(g,p);interactPlayground(g,p);assert.ok(p.inventory.some(i=>i?.type==='apple'));assert.equal(useApple(g,p),false);p.hp-=20;assert.ok(useApple(g,p));assert.equal(p.hp,p.maxHp-8);
 p.inventory=Array.from({length:32},()=>({type:'sword',qty:1}));const a={id:'b',heldBy:p.id,x:p.x,y:p.y,z:24};g.playground.apples=[a];p.hp=p.maxHp;interactPlayground(g,p);assert.equal(a.heldBy,p.id);
});
test('props cannot be struck or interacted with through a wall or behind the player',()=>{
 const {g,p}=blank(),tree={kind:'apple_tree',x:438,y:400,fruit:5};g.playground.props=[tree];g.house={walls:[{x:420,y:370,w:5,h:60}],doors:[],furniture:[],floors:[]};assert.equal(hitPlayground(g,p,50),false);assert.equal(interactPlayground(g,p),false);assert.equal(tree.fruit,5);g.house=null;p.faceX=-1;assert.equal(hitPlayground(g,p,50),false);p.faceX=1;assert.ok(hitPlayground(g,p,50));assert.equal(tree.fruit,3);
});
test('ball reacts to contact, sword launch, rebounds off walls and floats in water',()=>{
 const {g,p}=blank(),b={id:'b',kind:'ball',x:417,y:400,vx:0,vy:0,z:0,vz:0,roll:0};g.playground.props=[b];p.moving=true;tickPlayground(g,.05);assert.ok(b.vx>0);Object.assign(b,{x:425,y:400,vx:0,vy:0});hitPlayground(g,p,40);assert.equal(b.vx,250);g.house={walls:[{x:450,y:360,w:12,h:80}],doors:[],furniture:[],floors:[]};p.x=300;for(let i=0;i<20;i++)tickPlayground(g,.02);assert.ok(b.x<450);assert.ok(b.vx<0);g.house=null;g.terrain.fill('water');Object.assign(b,{x:800,y:800,z:0,vz:0,vx:0,vy:0});tickPlayground(g,.05);assert.ok(Number.isFinite(b.x)&&b.vx>0);assert.equal(b.z,0);
});
test('jump surfaces block grounded entry and receive an actual falling jump',()=>{
 const {g,p}=blank(),step={id:'step',kind:'step',x:440,y:400,height:18};g.playground.props=[step];assert.ok(g.blocked(440,400,8,false,true,false,0,0));assert.equal(g.blocked(440,400,8,false,true,false,0,20),false);Object.assign(p,{x:440,y:400,jumpHeight:30,jumpVelocity:-30,jumpAge:.2});for(let i=0;i<80&&p.jumpHeight;i++)tickJump(p,.01,g,0);assert.equal(p.groundHeight,18);assert.equal(p.jumpHeight,0);
});
test('log carries multiple players, supports feet above water, steers and allows jumping off',()=>{
 const {g,p}=blank();g.terrain.fill('water');const q=g.addPlayer('second','Friend'),log={id:'log',kind:'log',x:400,y:400,flowX:.7,flowY:.3};g.playground.props=[log];Object.assign(q,{x:410,y:400,hp:100});const before=log.x;tickPlayground(g,.05,{keyboard:{x:1}});assert.ok(log.x>before);assert.equal(p.x,log.x);assert.equal(q.x,log.x+10);assert.equal(p.groundHeight,6);assert.equal(playgroundSupport(g,p),6);assert.equal(p.swimming,false);assert.ok(startJump(p));const x=p.x;tickPlayground(g,.05);assert.equal(p.x,x);assert.equal(p.playLogId,undefined);assert.ok(log.x>p.x);
});
test('bell awards coins only once and the native wildlife can eat dropped apples',()=>{
 const {g,p}=blank(),bell={kind:'bell',x:420,y:400};g.playground.props=[bell];hitPlayground(g,p,40);const rewards=g.playground.coins.length;bell.cooldown=0;hitPlayground(g,p,40);assert.equal(g.playground.coins.length,rewards);g.playground.apples=[{x:410,y:400,z:0}];const e={kind:'chicken',x:409,y:400,hp:20,wildLastHp:20};assert.ok(foragePlayApple(g,e,.02));assert.equal(g.playground.apples.length,0);
});
test('scene save restores broken pots, fruit counts and ball position without respawning rewards',()=>{
 const {g}=fixture(),pot=g.playground.props.find(o=>o.kind==='pot'),tree=g.playground.props.find(o=>o.kind==='apple_tree'),ball=g.playground.props.find(o=>o.kind==='ball');breakPlayPot(g,pot);tree.fruit=1;ball.x+=50;const expected=structuredClone(g.playground);const restored=restoreSession(JSON.parse(JSON.stringify(saveSession(g))));ensurePlayground(restored);assert.deepEqual(restored.playground,expected);assert.equal(generateWorld(42,'house').playground,null);
});
