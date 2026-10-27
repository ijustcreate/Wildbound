import test from 'node:test';
import assert from 'node:assert/strict';
import {LobbyPractice,LOBBY_FURNITURE} from '../src/lobby-practice.mjs';
import {LOBBY_TV} from '../src/lobby-geometry.mjs';
import {LobbyTelevision} from '../src/lobby-tv.mjs';
import {LOBBY_OBJECTS} from '../src/playable-lobby.mjs';
import {damageEnemy} from '../src/enemy-damage.mjs';
import {targetReportAlpha,lobbyObjectNearby,lobbyLabelY,lobbyPropDepth,lobbySeatedModel} from '../src/lobby-scene.mjs';
import {controllerCablePoints} from '../src/lobby-controller-cable.mjs';
import {furnitureHeight} from '../src/house-design.mjs';
import {tickChestCritters} from '../src/supply-chest-critters.mjs';
import {spatialMenuNeighbor} from '../src/menu-navigation.mjs';
import {playerMotion,playerPose} from '../src/player-motion.mjs';

test('target total is absent before a hit, holds for a minute, fades, and refreshes on another hit',()=>{
 const g=new LobbyPractice(),t=g.targets[0];assert.equal(targetReportAlpha(t),0);
 damageEnemy(t,10);g.updateTargets(60);assert.equal(targetReportAlpha(t),1);g.updateTargets(1.5);assert.equal(targetReportAlpha(t),.5);
 damageEnemy(t,8);assert.equal(t.hits,2);assert.equal(t.score,18);assert.equal(targetReportAlpha(t),1);g.updateTargets(63);assert.equal(targetReportAlpha(t),0);
});
test('labels require a nearby active player, and tall prop captions are above their art',()=>{
 const o=LOBBY_OBJECTS.find(o=>o.id==='television'),p={id:1,hp:100},s={spawned:true,x:723,y:234},members=new Map([[1,s]]);
 assert.equal(lobbyObjectNearby(o,[p],members),true);s.y+=100;assert.equal(lobbyObjectNearby(o,[p],members),false);s.y=o.y;s.spawned=false;assert.equal(lobbyObjectNearby(o,[p],members),false);
 for(const id of ['television','character-station','difficulty']){const o=LOBBY_OBJECTS.find(o=>o.id===id);assert.ok(lobbyLabelY(o)<o.y-50);assert.ok(lobbyPropDepth(o)>o.y);}
});
test('TV has a ground footprint and a jumpable top while the totem stays solid at flight/jump height',()=>{
 const g=new LobbyPractice(),f=LOBBY_FURNITURE.find(f=>f.id==='television');
 assert.equal(g.blocked(785,145),false);assert.equal(g.blocked(785,178),true);assert.equal(g.blocked(785,178,8,false,false,false,0,f.surfaceHeight),false);
 assert.equal(g.blocked(955,165,8,false,false,false,0,150),true);assert.equal(furnitureHeight({kind:'table',surfaceHeight:78}),18);assert.equal(furnitureHeight(f),LOBBY_TV.height);
});
test('controllers belong to two independent owners, drop on leaving, and can be picked up again',()=>{
 const tv=new LobbyTelevision(1);assert.equal(tv.join(1),true);assert.equal(tv.join(2),true);assert.equal(tv.join(3),false);
 tv.leave(1,{x:723,y:234});assert.equal(tv.controllers[0].owner,null);assert.equal(tv.controllers[0].x,723);assert.equal(tv.controllers[0].y,242);assert.equal(tv.controllers[1].owner,2);
 assert.equal(tv.join(3),true);assert.equal(tv.controllers[0].owner,3);tv.reset();assert.ok(tv.controllers.every(p=>p.owner===null));
});
test('cable endpoints stay connected as the controller moves, with a sagging middle',()=>{
 for(const grip of [{x:720,y:220},{x:850,y:180},{x:760,y:260}]){const port={x:776,y:198},p=controllerCablePoints(port,grip);assert.deepEqual(p[0],port);assert.deepEqual(p.at(-1),grip);assert.ok(p[12].y>(port.y+grip.y)/2);}
});
test('seated pose keeps rig limb lengths, lowers pelvis, and never mutates the authored model',()=>{
 const before=JSON.stringify(playerMotion),model=lobbySeatedModel(),pose=playerPose({animationAction:'lobby_sit',playerFrame:0,equipment:{}},0,model);
 assert.ok(pose.pelvis[2]<model.joints.pelvis.position[2]-4);
 for(const side of ['L','R'])for(const [a,b]of [['hip','knee'],['knee','foot'],['shoulder','elbow'],['elbow','hand']]){
  const distance=(x,y)=>Math.hypot(...x.map((v,i)=>v-y[i]));assert.ok(Math.abs(distance(pose[a+side],pose[b+side])-distance(model.joints[a+side].position,model.joints[b+side].position))<.0001,a+side);
 }
 assert.equal(JSON.stringify(playerMotion),before);
});
test('forest and jungle chest visitors flee nearby players, survive saves, and remain gone',()=>{
 for(const biome of ['forest','temple','jungle']){
  const g={generatedEnvironment:biome,supplyChests:[{x:500,y:500}],players:[{x:100,y:100,hp:100}]};tickChestCritters(g,.05);assert.equal(g.supplyChests[0].critter.phase,'perched');
  g.players[0].x=500;g.players[0].y=540;tickChestCritters(g,.2);const a=g.supplyChests[0].critter;assert.equal(a.phase,'fleeing');assert.ok(a.y<480);
  const saved=structuredClone(g);tickChestCritters(saved,4);assert.equal(saved.supplyChests[0].critter.phase,'gone');tickChestCritters(saved,.1);assert.equal(saved.supplyChests[0].critter.phase,'gone');
 }
 for(const biome of ['ice','desert','house']){const g={generatedEnvironment:biome,supplyChests:[{x:0,y:0}],players:[]};tickChestCritters(g,.1);assert.equal(g.supplyChests[0].critter,undefined);}
});
test('Down from a full-width Boundless row enters the nearest map row instead of Close',()=>{
 const b=(left,top,width=230)=>({disabled:false,getClientRects:()=>[1],getBoundingClientRect:()=>({left,top,width,height:40})});
 const wild=b(0,0,480),boundless=b(0,55,480),random=b(0,105),forest=b(250,105),beach=b(0,255),grave=b(250,255),close=b(0,310,480),buttons=[wild,boundless,random,forest,beach,grave,close];
 assert.equal(spatialMenuNeighbor(buttons,boundless,0,1),random);assert.equal(spatialMenuNeighbor(buttons,forest,0,-1),boundless);assert.equal(spatialMenuNeighbor(buttons,grave,0,1),close);
});
