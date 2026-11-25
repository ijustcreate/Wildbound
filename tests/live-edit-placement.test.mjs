import assert from 'node:assert/strict';
import test from 'node:test';
import {Game} from '../src/core.mjs';
import {enterWildLands} from '../src/wild-lands.mjs';
import {wildBuildingSubjects,wildLandmarkBuildings} from '../src/wild-landmark-buildings.mjs';
import {nativeWildBlocked} from '../src/wild-native-biomes.mjs';
import {applyPlacement,getPlacement,placementOverride,placementTargets,restorePlacementOverrides} from '../src/live-edit-placement.mjs';

function wilds(){
 const game=new Game(()=>.4,{deferWorld:true});
 game.addPlayer('keyboard','Explorer');
 assert.ok(enterWildLands(game,{persistent:true,homeStart:true}).ok);
 return game;
}

test('live placement leaves Classic and custom railway objects out of the editor',()=>{
 const tree={id:'tree-1',kind:'tree',x:100,y:130};
 const furniture={id:'desk-1',kind:'desk',x:100,y:130,w:52,h:28};
 const classic={scenery:[tree],house:{id:'house1',furniture:[furniture]}};
 const railway={trainTest:{design:{scenery:[tree]}}};
 for(const game of [classic,railway]){
  assert.deepEqual(placementTargets(game,tree,'trees'),[]);
  assert.deepEqual(placementTargets(game,furniture,'props'),[]);
  assert.equal(applyPlacement(game,'scenery:tree-1',{x:110,y:140}),false);
  assert.equal(applyPlacement(game,'furniture:house1:desk-1',{x:110,y:140}),false);
 }
 assert.deepEqual([tree.x,tree.y,furniture.x,furniture.y],[100,130,100,130]);
});

test('live picking and movement update the native Homestead geometry',()=>{
 const game=wilds();
 const home=wildLandmarkBuildings(game.trainTest.design).find(house=>house.id==='homestead');
 const asset=home.furniture.find(item=>item.id&&!item.destroyed);
 const position={x:asset.x,y:asset.y},id=`furniture:${home.id}:${asset.id}`;
 const inside={x:asset.x+asset.w/2,y:asset.y+asset.h/2};
 assert.ok(placementTargets(game,inside,'props').some(item=>item.id===id));
 const moved={x:asset.x+30,y:asset.y+50};
 assert.ok(applyPlacement(game,id,moved));
 assert.equal(asset.x,moved.x);
 assert.equal(asset.y,moved.y);
 const collisionAsset=game.house.furniture.find(item=>item.id===asset.id);
 assert.equal(collisionAsset,asset);
 const subject=wildBuildingSubjects(game.trainTest.design).find(item=>item.wildBuildingAsset===asset);
 if(asset.kind!=='rug')assert.equal(subject.y,moved.y+asset.h);
 assert.ok(applyPlacement(game,id,position));
 assert.deepEqual([asset.x,asset.y],[position.x,position.y]);
});

test('moving the Jungle Temple translates its floor, visible walls and shared collision walls',()=>{
 const game=wilds(),design=game.trainTest.design;
 const temple=wildLandmarkBuildings(design).find(house=>house.temple);
 const id='building:jungle-temple',target=getPlacement(game,id);
 const wall=temple.walls[0],wallX=wall.x,wallY=wall.y;
 assert.ok(applyPlacement(game,id,{x:target.x+160,y:target.y-70}));
 assert.deepEqual([wall.x,wall.y],[wallX+160,wallY-70]);
 const subject=wildBuildingSubjects(design).find(item=>item.wildBuildingAsset===wall);
 assert.equal(subject.y,wallY-70+wall.h);
 assert.equal(game.house.walls.find(item=>item.id===wall.id),wall);
 const next=getPlacement(game,id);
 assert.deepEqual([next.bounds.x,next.bounds.y],[target.x+160,target.y-70]);
});

test('Jungle Temple fixtures retain local positions after the temple moves and the scene reloads',()=>{
 const game=wilds(),design=game.trainTest.design;
 const temple=wildLandmarkBuildings(design).find(house=>house.temple);
 const buildingId='building:jungle-temple',building=getPlacement(game,buildingId);
 const [first,second]=temple.furniture.map(item=>`furniture:${temple.id}:${item.id}`);
 const edits={};
 for(const [id,dx,dy] of [[first,20,10],[second,15,25],[buildingId,160,-70],[first,10,-5]]){
  const position=getPlacement(game,id);
  const point={x:position.x+dx,y:position.y+dy};
  assert.ok(applyPlacement(game,id,point));
  edits[id]=placementOverride(game,id,point);
 }
 assert.deepEqual(Object.keys(edits),[first,second,buildingId]);
 assert.equal(edits[first].relativeTo,buildingId);
 assert.equal(edits[second].relativeTo,buildingId);
 assert.deepEqual(edits[buildingId],{x:building.x+160,y:building.y-70});
 const reloaded=wilds(),saved=JSON.parse(JSON.stringify(edits));
 for(let i=0;i<2;i++){
  restorePlacementOverrides(reloaded,saved);
  for(const id of Object.keys(saved))assert.deepEqual(getPlacement(reloaded,id),getPlacement(game,id));
 }
});

test('native trees move between collision buckets and preserve their vertical anchor offset',()=>{
 const game=wilds(),t=game.trainTest;
 const prop={id:'wild-native:surface:forest:forest:3:2:tree',kind:'tree',x:5090,y:3990,rootY:4030,size:100,procedural:true};
 t.wildNativeWorlds=new Map([['surface:forest:forest:3:2',{accepted:[prop]}]]);
 t.nativeCollisionRoom='surface';
 t.nativeCollisionAreas=new Set(['3:2']);
 t.nativeCollision=new Map([['19:15',[prop]]]);
 t.visibleForest=[prop];
 const id=`native:${prop.id}`;
 assert.ok(placementTargets(game,{x:prop.x,y:prop.y},'trees').some(item=>item.id===id));
 assert.equal(nativeWildBlocked(t,5090,4025),true);
 assert.ok(applyPlacement(game,id,{x:5210,y:4150}));
 assert.equal(t.nativeCollision.has('19:15'),false);
 assert.deepEqual(t.nativeCollision.get('20:16'),[prop]);
 assert.equal(prop.rootY,4190);
 assert.equal(nativeWildBlocked(t,5090,4025),false);
 assert.equal(nativeWildBlocked(t,5210,4185),true);
 assert.equal(applyPlacement(game,id,{x:6401,y:4150}),false,'the generated source region stays stable');
 assert.equal(getPlacement(game,id).x,5210);
 const restored=wilds();
 restorePlacementOverrides(restored,{[id]:{x:5210,y:4150}});
 assert.deepEqual(restored.trainTest.liveEditNativePlacements[prop.id],{x:5210,y:4150});
});
