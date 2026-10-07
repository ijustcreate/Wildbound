import test from 'node:test';import assert from 'node:assert/strict';
import {Game,EVENTS} from '../src/core.mjs';import {creatures,applyDefinitions} from '../src/definitions.mjs';
import {generateWorld} from '../src/world.mjs';import {BEE_HIVE_CAP,BEE_HIVE_INTERVAL,tickBeeHive,tickBee,migrateBeeEvent,hivePlacement} from '../src/bee-swarm.mjs';
import {actorContact} from '../src/contact-shadow.mjs';
import {befriendCreature} from '../src/friendly-creatures.mjs';
import {drawDesertChunk,drawDesertSand,drawDesertClutter,desertSandColor,drawDesertWind,DESERT_WIND_LIMIT,DESERT_CLUTTER} from '../src/desert-art.mjs';
import {boardArtBiome} from '../src/board-art.mjs';import {drawBeePose,drawBeeHive} from '../src/bee-art.mjs';
function field(){const g=new Game(()=>.42);g.phase='play';g.openingBoard=false;g.terrain.fill('grass');g.scenery=[];g.house=null;g.enemies=[];const p=g.addPlayer('keyboard');Object.assign(p,{x:800,y:900,hp:999,maxHp:999});return g;}
function canvas(){const calls=[],stack=[];return {calls,globalAlpha:1,save(){stack.push(this.globalAlpha);},restore(){this.globalAlpha=stack.pop();},translate(){},scale(){},fillRect(x,y,w,h){assert.ok([x,y,w,h].every(Number.isInteger));assert.ok(w>0&&h>0);calls.push([x,y,w,h,this.fillStyle,this.globalAlpha]);}};}
test('bee event spawns recognizable bees plus a destructible persistent hive, not charging wasps',()=>{
 const g=field(),i=EVENTS.findIndex(e=>e.name==='A thousand little wings');g.spawnEvent(i);const hive=g.enemies.find(e=>e.kind==='bee_hive'),bees=g.enemies.filter(e=>e.kind==='bee');assert.ok(hive);assert.equal(bees.length,5);assert.ok(bees.every(e=>e.hiveId===hive.id));assert.equal(creatures.bee.behaviors.dash,false);assert.equal(creatures.bee_hive.behaviors.hunt,false);assert.equal(befriendCreature(hive,g.players[0].id),false);
 const restored=JSON.parse(JSON.stringify(hive));assert.equal(restored.spawnTimer,BEE_HIVE_INTERVAL);assert.deepEqual(restored.beeStats,hive.beeStats);
 const old=migrateBeeEvent({kind:'wasp',name:'A thousand little wings'});assert.equal(old.kind,'bee');assert.equal(old.beeHive,true);assert.equal(migrateBeeEvent({kind:'wasp',name:'Custom wasps'}).kind,'wasp');
});
test('hive replenishes to eight living bees, counts charmed bees, and stops immediately on destruction',()=>{
 const g=field();g.spawnEvent(EVENTS.findIndex(e=>e.kind==='bee'));const hive=g.enemies.find(e=>e.kind==='bee_hive');
 for(let i=0;i<300;i++)tickBeeHive(g,hive,.2);assert.equal(g.enemies.filter(e=>e.kind==='bee'&&e.hp>0).length,BEE_HIVE_CAP);
 for(const e of g.enemies.filter(e=>e.kind==='bee'))befriendCreature(e,0);for(let i=0;i<50;i++)tickBeeHive(g,hive,.2);assert.equal(g.enemies.filter(e=>e.kind==='bee'&&e.hp>0).length,8);
 const dead=g.enemies.find(e=>e.kind==='bee');dead.hp=0;tickBeeHive(g,hive,.2);assert.equal(g.enemies.filter(e=>e.kind==='bee'&&e.hp>0).length,8);const born=g.enemies.at(-1);assert.equal(born.maxHp,hive.beeStats.hp);assert.equal(born.damage,hive.beeStats.damage);
 hive.hp=0;born.hp=0;const before=g.enemies.length;for(let i=0;i<100;i++)tickBeeHive(g,hive,.2);assert.equal(g.enemies.length,before);
});
test('bee attack is a short sting with bounded flight speed; hidden players are not pursued',()=>{
 const g=field(),p=g.players[0],e={id:22,kind:'bee',x:p.x+120,y:p.y,hp:27,speed:90,damage:7,state:'charge',timer:4,cooldown:0,step:0};g.enemies=[e];
 for(let i=0;i<100;i++){g.time+=.05;const old={x:e.x,y:e.y};tickBee(g,e,.05,[p]);assert.ok(Math.hypot(e.x-old.x,e.y-old.y)<=e.speed*.05+.001);assert.ok(!['charge','windup'].includes(e.state));}
 assert.ok(p.hp<999);assert.ok(e.cooldown>0);p.underBridge=true;const x=e.x,y=e.y;for(let i=0;i<20;i++)tickBee(g,e,.05,[p]);assert.equal(e.x,x);assert.equal(e.y,y);
 delete p.underBridge;p.swimming=true;p.diveDepth=.5;tickBee(g,e,.05,[p]);assert.equal(e.x,x);assert.equal(e.y,y);delete p.swimming;
 g.traps=[{x:e.x,y:e.y,life:10,variant:'snare'}];tickBee(g,e,.05,[p]);assert.equal(e.state,'snared');tickBee(g,e,2.1,[p]);assert.ok(e.hp<=0);
});
test('actual game attacks damage the hive and a destroyed hive cannot respawn in the next game update',()=>{
 const g=field();g.spawnEvent(EVENTS.findIndex(e=>e.kind==='bee'));const hive=g.enemies.find(e=>e.kind==='bee_hive'),p=g.players[0];Object.assign(p,{x:hive.x,y:hive.y+30,faceX:0,faceY:-1});p.equipment.hand1='sword';const before=hive.hp;g.attack(p);assert.ok(hive.hp<before);
 for(const e of g.enemies)e.hp=0;g.update(.05,{});assert.ok(hive.defeated);const count=g.enemies.length;for(let i=0;i<80;i++)g.update(.05,{});assert.ok(!g.enemies.some(e=>e.kind==='bee'&&e.hp>0));assert.ok(g.enemies.length<=count);
});
test('hives sit on the floor or hang from a live tree with a ground-anchored shadow, and drop if the tree falls',()=>{
 const g=field(),anchor={x:300,y:330,id:4};assert.equal(hivePlacement(g,anchor),null);
 g.scenery=[{kind:'tree',id:51,x:300,y:300,size:80,rootY:328}];const place=hivePlacement(g,anchor);assert.equal(place.hiveTreeId,51);assert.ok(place.hiveLift>0);assert.equal(place.y,334);
 const hive={...place,kind:'bee_hive',hp:160,spawnTimer:3.5};g.enemies=[hive];const shadow=actorContact(g,hive,48,false);assert.equal(shadow.x,hive.x);assert.equal(shadow.y,hive.y+1);assert.equal(shadow.surface,0);assert.ok(shadow.separation>0&&shadow.alpha<.3);
 g.scenery[0].fallen=true;tickBeeHive(g,hive,.05);assert.equal(hive.hiveLift,0);const floor=actorContact(g,hive,48,false);assert.equal(floor.y,shadow.y);assert.equal(floor.separation,0);assert.ok(floor.alpha>shadow.alpha);assert.equal(hivePlacement(g,anchor),null);
});
test('bees retain their spider rivalry without charging, and preserve zero-valued event overrides',()=>{
 const g=field(),p=g.players[0];Object.assign(p,{x:810,y:900});
 const bee={kind:'bee',id:22,x:800,y:900,hp:27,speed:90,damage:7,cooldown:0},spider={kind:'spider',id:23,x:825,y:900,hp:70};g.enemies=[bee,spider];
 tickBee(g,bee,.05,[p]);assert.equal(spider.hp,63);assert.equal(p.hp,999);assert.equal(bee.state,'sting');assert.ok(Math.hypot(bee.buzzVX,bee.buzzVY)<=90);
 const old=g.projectileBlocked;g.projectileBlocked=()=>true;Object.assign(bee,{cooldown:0,attack:0,buzzVX:0,buzzVY:0});p.underBridge=true;const x=bee.x,y=bee.y;tickBee(g,bee,.05,[p]);assert.equal(bee.x,x);assert.equal(bee.y,y);g.projectileBlocked=old;
 g.enemies=[];const index=EVENTS.findIndex(e=>e.kind==='bee');g.spawnEvent(index);const hive=g.enemies.find(e=>e.kind==='bee_hive');hive.beeStats={hp:27,speed:0,damage:0};g.enemies=g.enemies.filter(e=>e===hive);hive.spawnTimer=0;tickBeeHive(g,hive,.05);const born=g.enemies.at(-1);assert.equal(born.speed,0);assert.equal(born.damage,0);delete p.underBridge;const bx=born.x,by=born.y;tickBee(g,born,.05,[p]);assert.equal(born.x,bx);assert.equal(born.y,by);
});
test('desert dunes and clutter are deterministic, all eight detail varieties render, and textures change with seed',()=>{
 const g={...generateWorld(321,'desert'),seed:321},a=canvas(),b=canvas();drawDesertChunk(a,g,1,1);drawDesertChunk(b,g,1,1);assert.deepEqual(a.calls,b.calls);assert.ok(new Set(a.calls.map(p=>p[4])).size>=8);assert.ok(a.calls.length<6000);
 for(const kind of DESERT_CLUTTER){const c=canvas();drawDesertClutter(c,kind,40,40,5);assert.ok(c.calls.length>=5,kind);}
 const left=canvas(),right=canvas(),whole=canvas();drawDesertSand(left,224,0,32,32,321);drawDesertSand(right,256,0,32,32,321);drawDesertSand(whole,224,0,64,32,321);const order=a=>a.toSorted((a,b)=>a[1]-b[1]||a[0]-b[0]||String(a[4]).localeCompare(b[4]));assert.deepEqual(order([...left.calls,...right.calls]),order(whole.calls));
 assert.notEqual(Array.from({length:30},(_,i)=>desertSandColor(i*16,88,321)).join(),Array.from({length:30},(_,i)=>desertSandColor(i*16,88,765)).join());
});
test('desert wind is animated with a strict screen budget, respects parent opacity, and uses no persistent particles',()=>{
 const g={time:0,seed:10,bloom:3,effects:[]},a=canvas(),b=canvas();a.globalAlpha=.5;const bounds={left:300,top:300,right:1000,bottom:1000};assert.equal(drawDesertWind(a,g,bounds),DESERT_WIND_LIMIT);drawDesertWind(b,{...g,time:2},bounds);assert.notDeepEqual(a.calls,b.calls);assert.ok(a.calls.length<190);assert.ok(a.calls.every(p=>p[5]<=.5));assert.equal(a.globalAlpha,.5);assert.equal(g.effects.length,0);
 const far=canvas();assert.equal(drawDesertWind(far,g,bounds,2),48);assert.ok(far.calls.length<60);
 assert.equal(boardArtBiome({generatedEnvironment:'desert'}),'desert');assert.equal(boardArtBiome({generatedEnvironment:'forest',environment:'desert'}),'forest');
});
test('bee wing poses and woven hive render only palette-coloured square pixels',()=>{
 const views=new Set();for(let d=0;d<8;d++)for(let f=0;f<4;f++){const c=canvas();drawBeePose(c,{kind:'bee',hp:27,faceX:-Math.sin(d*Math.PI/4),faceY:Math.cos(d*Math.PI/4)},f/24);assert.ok(c.calls.length<1800&&c.calls.length>100);views.add(JSON.stringify(c.calls));assert.ok(c.calls.some(p=>p[4]==='#dba64c'));assert.ok(c.calls.some(p=>p[4]==='#24242a'));}assert.ok(views.size>20);
 const hive=canvas();drawBeeHive(hive,{hp:160,x:100,y:100},0);assert.ok(hive.calls.length>30);const dead=canvas();drawBeeHive(dead,{hp:0,x:100,y:100},0);assert.ok(dead.calls.length>5&&dead.calls.length<hive.calls.length);
});
