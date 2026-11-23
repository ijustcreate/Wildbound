import test from 'node:test';
import assert from 'node:assert/strict';
import {Game,EVENTS} from '../src/core.mjs';
import {defaultHouse,validateHouse,carveDoor} from '../src/house-design.mjs';
import {findPath,navigateEnemy,clearShot} from '../src/navigation.mjs';
import {tickHazards} from '../src/hazards.mjs';
const setup=random=>{const g=new Game(random);g.environment='house';g.addPlayer('keyboard');g.start();g.openingBoard=false;g.scenery=[];g.terrain.fill('grass');Object.assign(g.players[0],{x:640,y:580});return g;};
const initialQuiver=36;
function stationaryArcher(g,x,y){
 g.spawnEvent(EVENTS.findIndex(e=>e.mixedSkeletons),{force:true});
 const archer=g.enemies.find(enemy=>enemy.kind==='archer');
 assert.ok(archer);
 g.enemies=[archer];
 Object.assign(archer,{x,y,cooldown:0,speed:0,startingArrows:initialQuiver,arrowsLeft:initialQuiver});
 return archer;
}
test('archers never fire without a living present target, beyond range, or through walls',()=>{
 const scenarios=[
  {name:'dead',archerY:540,playerX:640,playerY:620,clear:true,playerState:{hp:0}},
  {name:'room',archerY:540,playerX:640,playerY:620,clear:true,playerState:{room:900,roomX:150,roomY:125}},
  {name:'far',archerY:400,playerX:1100,playerY:400,clear:true},
  {name:'wall',archerY:400,playerX:640,playerY:580,clear:false},
 ];
 for(const {name,archerY,playerX,playerY,clear,playerState} of scenarios){
  const g=setup(()=>.5),e=stationaryArcher(g,640,archerY),p=g.players[0];
  Object.assign(p,{x:playerX,y:playerY},playerState);
  for(let i=0;i<20;i++)g.update(.05,{});
  assert.equal(clearShot(g,e,p),clear,`${name} fixture line of sight`);
  assert.equal(e.arrowsLeft,initialQuiver,name);
  assert.equal(g.arrows.filter(a=>a.hostile).length,0,name);
 }
 const g=setup(()=>.5),e=stationaryArcher(g,640,540);
 g.players[0].y=620;
 g.update(.05,{});
 assert.ok(clearShot(g,e,g.players[0]),'in-range fixture has an open sightline');
 assert.equal(g.arrows.filter(a=>a.hostile).length,0,'clear target still gets a tell');
 for(let i=0;i<20&&e.arrowsLeft===initialQuiver;i++)g.update(.05,{});
 assert.equal(e.arrowsLeft,initialQuiver-1,'clear in-range target');
});
test('monkeys navigate through doors while animals wait; dragons cannot fit even through open doors',()=>{
 const g=setup(),p=g.players[0];p.x=640;p.y=600;
 const monkey={kind:'monkey',x:640,y:420,speed:90,hp:50,state:'hunt'};
 assert.ok(findPath(g,monkey,p).length);assert.equal(findPath(g,{...monkey,kind:'lion'},p).length,0);
 for(let i=0;i<100;i++){g.time+=.05;navigateEnemy(g,monkey,p,.05);}assert.ok(monkey.y>500,JSON.stringify(monkey));assert.ok(g.house.doors[0].open);
 assert.ok(findPath(g,{kind:'lion',x:640,y:420},p).length);assert.equal(findPath(g,{kind:'dragon',x:640,y:420},p).length,0);
});
test('fast fire, poison and bananas stop at house walls before damaging a player',()=>{
 for(const family of ['fireballs','poisonShots','bananas']){const g=setup(),p=g.players[0];p.x=520;p.y=580;g[family]=[{x:450,y:580,z:20,vz:0,vx:2000,vy:0,life:2,damage:10,trail:1,duration:3}];const hp=p.hp;tickHazards(g,.05);assert.equal(p.hp,hp,family);assert.equal(g[family].length,0,family);}
});
test('house template provides valid furniture, yards, deep pool and carved door openings',()=>{
 const h=defaultHouse();assert.ok(validateHouse(h));assert.ok(h.furniture.some(f=>f.kind==='mailbox'));assert.ok(h.walls.some(w=>w.kind==='fence'));assert.ok(h.trees.some(t=>t.y>1120));assert.ok(h.trees.some(t=>t.y<480));assert.ok(h.pools.length);
 h.walls.push({x:1200,y:800,w:160,h:16});carveDoor(h,{x:1248,y:800,w:64,h:16,open:false});assert.ok(!h.walls.some(w=>w.y===800&&w.x<1312&&w.x+w.w>1248));
 h.walls.push({x:800,y:800,w:32,h:32});assert.equal(validateHouse(h),false);
});
