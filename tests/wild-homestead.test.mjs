import test from 'node:test';
import assert from 'node:assert/strict';
import {Game} from '../src/core.mjs';
import {defaultHouse,HOUSE_KEY,HOUSE_STATE_KEY} from '../src/house-design.mjs';
import {insideHouse} from '../src/expansion.mjs';
import {waterAt} from '../src/environment.mjs';
import {WILD_HOMESTEAD,WILDS_OVERLOOK} from '../src/overlook-maze-layout.mjs';
import {trainInteraction,trainPrompt} from '../src/train-test.mjs';
import {enterWildLands,wildLandsDesign} from '../src/wild-lands.mjs';
import {restoreWildLands,snapshotWildLands} from '../src/wild-lands-session.mjs';
import {HOMESTEAD_HEARTH,wildHomestead} from '../src/wild-homestead-layout.mjs';
import {wildLandsGround,wildLandsSurface} from '../src/wild-lands-world.mjs';
import {nativeWildBiome,nativeWildIceMotion,nativeWildTile} from '../src/wild-native-biomes.mjs';

function start(){
 const game=new Game(()=>.5);game.addPlayer('keyboard','Homestead visitor');
 game.start();game.openingBoard=false;game.persist=()=>{};game.onSound=()=>{};
 assert.ok(enterWildLands(game).ok);game.trainTest.preparing=false;
 game.update(.05,{keyboard:{}});
 return {game,player:game.players[0],home:wildHomestead(game.trainTest.design)};
}

test('the Homestead and Overlook flanks stay grassy as Frostmere snow reaches the north entrance',()=>{
 const design=wildLandsDesign(),trainTest={design,streamDisabled:true};
 const {entrance,gate}=WILDS_OVERLOOK;
 for(const [x,y] of [[7484,5518],[8844,5518],[gate.x,gate.y+64],[WILD_HOMESTEAD.x,WILD_HOMESTEAD.y]]){
  assert.equal(wildLandsGround(design,x,y),'house');
  assert.equal(nativeWildBiome(design,x,y),'house');
  assert.equal(wildLandsSurface(design,x,y),'grass');
  const p={x,y,slideX:12,slideY:5};
  assert.deepEqual(nativeWildIceMotion({trainTest},p,1,0,120,1/60),{dx:2,dy:0});
  assert.equal(p.slideX,0);
 }
 const northY=entrance.y-80;
 assert.equal(wildLandsGround(design,entrance.x,northY),'ice');
 assert.equal(nativeWildBiome(design,entrance.x,northY),'ice');
 assert.equal(nativeWildTile(trainTest,entrance.x,northY),'snow');
 assert.equal(wildLandsGround(design,8200,4240),'ice');
 assert.equal(nativeWildBiome(design,9380,5500),'ice');
 assert.equal(nativeWildTile(trainTest,9200,5712),'ice','the eastern frozen lake keeps its slide surface');
 const pool=wildHomestead(design).pools[0];
 assert.equal(wildLandsSurface(design,pool.x+pool.w/2,pool.y+pool.h/2),'water');
});

test('Wilds loads the active main-game house and leaves its saved library and draft intact',()=>{
 const old=globalThis.localStorage,design=defaultHouse();
 design.name='A saved custom house';
 design.floorZones=[{x:496,y:496,w:240,h:176,material:'carpet'}];
 design.furniture.push({kind:'bed',x:670,y:698,w:24,h:48});
 const draft=JSON.stringify({draft:{id:'uncommitted',house:defaultHouse()}});
 const library=JSON.stringify({active:'custom',designs:[{id:'custom',house:design}]});
 const values=new Map([[HOUSE_KEY,library],[HOUSE_STATE_KEY,draft]]);
 globalThis.localStorage={getItem:key=>values.get(key)??null,setItem:(key,value)=>values.set(key,value)};
 try{
  const {game,home}=start(),dx=WILD_HOMESTEAD.x-800,dy=WILD_HOMESTEAD.y-800;
  assert.equal(home.name,design.name);
  assert.deepEqual(home.paths.map(({x,y})=>[x-dx,y-dy]),design.paths.map(({x,y})=>[x,y]));
  assert.equal(home.floorZones[0].material,'carpet');
  assert.deepEqual([home.floorZones[0].x,home.floorZones[0].y],[496+dx,496+dy]);
  assert.equal(home.rooms.length,design.rooms.length);
  assert.equal(home.trees.length,design.trees.length);
  assert.notDeepEqual(home.hearth,HOMESTEAD_HEARTH,'the authored bed occupies the original hearth position');
  assert.ok(insideHouse(home.hearth.x,home.hearth.y,game.house));
  assert.equal(waterAt(game,home.pools[0].x+16,home.pools[0].y+16),'water');
  assert.equal(values.get(HOUSE_KEY),library);
  assert.equal(values.get(HOUSE_STATE_KEY),draft);
 }finally{if(old===undefined)delete globalThis.localStorage;else globalThis.localStorage=old;}
});

test('Wilds uses the main house appliances, bed, chests, garage car, and checkpoint state',()=>{
 const {game,player,home}=start(),step=(input={})=>game.update(.05,{keyboard:input});
 assert.deepEqual(home.hearth,HOMESTEAD_HEARTH);
 const sink=home.furniture.find(f=>f.kind==='sink');
 Object.assign(player,{x:sink.x+sink.w/2,y:sink.y+sink.h+14});
 assert.match(trainPrompt(game,player),/TAP ON/);
 assert.ok(trainInteraction(game,player));assert.ok(sink.applianceOn);
 for(let i=0;i<5;i++)step();
 assert.ok(sink.waterLevel>0);
 const bed=home.furniture.find(f=>f.kind==='bed');
 Object.assign(player,{x:bed.x-21,y:bed.y+65,hp:player.maxHp*.5});
 assert.ok(trainInteraction(game,player));assert.ok(player.bedRest);
 const health=player.hp;
 step();assert.ok(player.hp>health);step({y:1});assert.ok(!player.bedRest);
 const chest=home.furniture.find(f=>f.chestId==='house-car-key');
 Object.assign(player,{x:chest.x+chest.w/2,y:chest.y+chest.h+14});
 assert.ok(trainInteraction(game,player));assert.ok(chest.opened);
 const car=home.vehicles[0];
 Object.assign(player,{x:car.x,y:car.y});
 assert.ok(trainInteraction(game,player));assert.equal(player.vehicleId,car.id);
 const before=car.y;
 for(let i=0;i<12;i++)step({y:1});
 assert.ok(car.y>before+8,'the existing car physics roll out of the garage');
 assert.equal(player.y,car.y);
 const restored=restoreWildLands(JSON.parse(JSON.stringify(snapshotWildLands(game.trainTest))));
 const saved=wildHomestead(restored.design);
 assert.equal(saved.furniture.find(f=>f.id===sink.id).applianceOn,true);
 assert.equal(saved.furniture.find(f=>f.id===chest.id).opened,true);
 assert.equal(saved.vehicles[0].y,car.y);
});
