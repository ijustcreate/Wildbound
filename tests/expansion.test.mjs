import test from 'node:test';
import assert from 'node:assert/strict';
import {Game,EVENTS} from '../src/core.mjs';
import {generateWorld} from '../src/world.mjs';
import {insideHouse,toggleDoor,resolveEnvironment,tickSpider,spiderNest,webSlow,structureBlocked} from '../src/expansion.mjs';
import {saveSession,restoreSession} from '../src/session.mjs';
import {defaultBeastMotion,validateBeastMotion} from '../src/beast-motion.mjs';
const game=env=>{const g=new Game();g.environment=env;g.addPlayer('keyboard');g.start();g.openingBoard=false;return g;};
test('all four random maps are reachable and ice terrain is snowy',()=>{
 assert.deepEqual(new Set([0,1,2,3].map(n=>resolveEnvironment('random',n))),new Set(['forest','desert','ice','house']));
 const w=generateWorld(42,'ice');assert.ok(w.terrain.every(t=>['snow','ice'].includes(t)));assert.ok(w.scenery.some(p=>p.kind==='snow_tree'));
});
test('ice cats spawn only in ice and use valid distinct editable rigs',()=>{
 for(const kind of ['white_lion','snow_leopard']){
  const i=EVENTS.findIndex(e=>e.kind===kind);
  for(const env of ['forest','desert','house','ice']){const g=game(env);g.spawnEvent(i);assert.equal(g.enemies.length,env==='ice'?EVENTS[i].count:0);}
  assert.ok(validateBeastMotion(kind,defaultBeastMotion(kind)));
 }
 const spider=defaultBeastMotion('spider');assert.equal(Object.keys(spider.joints).filter(n=>n.startsWith('foot')).length,8);assert.ok(validateBeastMotion('spider',spider));
});
test('house starts players and first lion indoors, other encounters outdoors; doors control collision',()=>{
 const g=game('house'),p=g.players[0];assert.ok(insideHouse(p.x,p.y));
 for(let i=0;i<EVENTS.length;i++){if(EVENTS[i].environment||['monsoon','volcano','rhino'].includes(EVENTS[i].kind))continue;g.enemies=[];g.spawnEvent(i);assert.ok(g.enemies.every(e=>EVENTS[i].kind==="lion" ? insideHouse(e.x,e.y,g.house) : !insideHouse(e.x,e.y,g.house)),EVENTS[i].name);}
 const d=g.house.doors[0];p.x=d.x+d.w/2;p.y=d.y-40;assert.equal(structureBlocked(g,p.x,d.y-14),true);assert.equal(toggleDoor(g,p),true);assert.equal(structureBlocked(g,p.x,d.y-14),false);assert.equal(toggleDoor(g,p),true);assert.equal(d.open,false);
 p.x=d.x+d.w/2;p.y=d.y+d.h/2;d.open=true;toggleDoor(g,p);assert.equal(d.open,true,'cannot close on an actor');
 assert.equal(g.projectileBlocked(480,600),true);
});
test('spider event creates exactly two adults, three timed eggs and webbed nearby trees',()=>{
 const g=game('forest');g.spawnEvent(EVENTS.findIndex(e=>e.kind==='spider'));
 assert.equal(g.enemies.filter(e=>e.kind==='spider').length,2);const eggs=g.enemies.filter(e=>e.kind==='spider_egg');assert.equal(eggs.length,3);assert.equal(g.webs.length,1);
 for(const e of eggs){tickSpider(g,e,19.99);assert.equal(e.kind,'spider_egg');tickSpider(g,e,.02);assert.equal(e.kind,'baby_spider');}
 g.scenery=[{kind:'tree',x:900,y:900}];spiderNest(g,{x:900,y:900},123);assert.equal(g.scenery[0].webbed,true);
});
test('webs slow heroes and other creatures but spiders are immune; spiders fight insects',()=>{
 const g=game('forest');g.scenery=[];g.webs=[{x:1000,y:1000,radius:150}];
 const p=g.players[0];Object.assign(p,{x:1000,y:1000});assert.ok(webSlow(g,p));
 const spider={kind:'spider',x:1000,y:1000,hp:70,speed:70,damage:10,cooldown:0,state:'hunt'},beetle={kind:'beetle',x:1020,y:1000,hp:50,speed:60,damage:8,cooldown:0,state:'hunt'};g.enemies=[spider,beetle];
 assert.ok(!webSlow(g,spider));assert.ok(webSlow(g,beetle));tickSpider(g,spider,.05);assert.equal(beetle.hp,40);tickSpider(g,beetle,.05);assert.equal(spider.hp,62);
 const wasp={...beetle,kind:'wasp',hp:50,cooldown:0};g.enemies=[spider,wasp];spider.cooldown=0;tickSpider(g,spider,.05);assert.equal(wasp.hp,40);
});
test('house doors, webs and unhatched egg timers persist in saved expeditions',()=>{
 const g=game('house');g.house.doors[0].open=true;g.spawnEvent(EVENTS.findIndex(e=>e.kind==='spider'));const egg=g.enemies.find(e=>e.kind==='spider_egg');tickSpider(g,egg,7);
 const restored=restoreSession(JSON.parse(JSON.stringify(saveSession(g))));assert.equal(restored.house.doors[0].open,true);assert.equal(restored.enemies.find(e=>e.id===egg.id).hatchIn,13);assert.equal(restored.webs.length,1);
});


test('door interaction works on the controller Interact release and destroyed eggs do not hatch',()=>{
 const g=game('house'),p=g.players[0],d=g.house.doors[0];p.x=d.x+d.w/2;p.y=d.y-40;
 g.update(.05,{keyboard:{interact:true}});g.update(.05,{keyboard:{interact:false}});assert.equal(d.open,true);
 g.enemies=[{kind:'spider_egg',id:999,x:1200,y:1200,hp:0,maxHp:24,hatchIn:.01}];g.update(.05,{});assert.ok(!g.enemies.some(e=>e.kind==='baby_spider'));
});
test('spiders cannot bite insects through a closed house wall',()=>{
 const g=game('house');const a={kind:'spider',x:478,y:700,hp:70,speed:0,damage:10,cooldown:0,state:'hunt'},b={kind:'beetle',x:501,y:700,hp:50,speed:0,damage:8,cooldown:0,state:'hunt'};g.enemies=[a,b];tickSpider(g,a,.05);assert.equal(b.hp,50);
});
