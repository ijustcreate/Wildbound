import test from 'node:test';
import assert from 'node:assert/strict';
import {Game} from '../src/core.mjs';
import {enterWildLands} from '../src/wild-lands.mjs';
import {restoreSession,saveSession} from '../src/session.mjs';
import {trainPrompt,trainWorldBlocked} from '../src/train-test.mjs';
import {wildLandsGround,wildLandsSurface,wildLandsSurfaceAt} from '../src/wild-lands-world.mjs';
import {nativeWaterRuns} from '../src/wild-lands-art.mjs';
import {mountainPursuitRoute,tickMountainPursuit} from '../src/wild-mountain-encounters.mjs';
import {EAST_WILDS_WIDTH,HOLLOW_ROOM,HOLLOW_GATE,HOLLOW_EXIT,HOLLOW_NAV,MOUNTAIN_ASCENT,MOUNTAIN_CAVE_TRAIL,MOUNTAIN_DESCENTS,MOUNTAIN_SUMMIT,hollowSurface,mountainHeight,mountainLineOpen,mountainMovementScale} from '../src/wild-mountain-layout.mjs';

function wilds(){
 const g=new Game(()=>.5);g.addPlayer('keyboard');g.persist=()=>{};
 assert.ok(enterWildLands(g,{persistent:true}).ok);
 g.trainTest.preparing=false;
 return {g,p:g.players[0],d:g.trainTest.design};
}
const step=(g,input={})=>g.update(.05,{keyboard:input});
const point=([x,y])=>({x,y});
function walk(g,p,target){
 for(let i=0;i<180;i++){
  const dx=target.x-p.x,dy=target.y-p.y,span=Math.hypot(dx,dy);
  if(span<13)return;
  step(g,{x:dx/span,y:dy/span});
 }
 assert.fail(`cannot walk to ${target.x},${target.y} from ${p.x},${p.y}`);
}

test('the east expansion preserves old world coordinates and an older save opens at the larger width',()=>{
 const {g,p,d}=wilds();
 assert.equal(d.width,EAST_WILDS_WIDTH);
 assert.equal(wildLandsSurface(d,14783,8247),'grass','Portal Island keeps the same shore');
 const old=JSON.parse(JSON.stringify(saveSession(g)));old.wilds.design.width=16000;
 const resumed=restoreSession(old);
 assert.equal(resumed.trainTest.design.width,EAST_WILDS_WIDTH);
 assert.deepEqual([resumed.players[0].x,resumed.players[0].y],[p.x,p.y]);
});

test('the switchbacks are an uninterrupted walk with physical cliffs and rising character ground',()=>{
 const {g,p,d}=wilds();
 const start=point(MOUNTAIN_ASCENT[0]);Object.assign(p,{...start,invuln:999});
 assert.equal(wildLandsSurface(d,start.x,start.y),'grass');
 let previous=0;
 for(const [index,node] of MOUNTAIN_ASCENT.entries()){
  const target=point(node);
  if(index)assert.ok(mountainLineOpen(d,point(MOUNTAIN_ASCENT[index-1]),target,8),'clear switchback '+index);
  walk(g,p,target);step(g);
  assert.ok(Math.abs((p.trainGround||0)-node[2])<4,'player stands at trail elevation '+node[2]);
  assert.ok(p.trainGround>=previous-2);previous=p.trainGround;
 }
 assert.ok(p.trainGround>460);
 assert.ok(mountainMovementScale(d,15920,7185,5,0)<1);
 assert.ok(trainWorldBlocked(g,17238,6530,8,false,true), 'cliff flank has no climb surface');
 assert.ok(!mountainLineOpen(d,point(MOUNTAIN_ASCENT[4]),point(MOUNTAIN_ASCENT[6]),8),'cannot shortcut through the middle cliff');
});

test('the coastal entrance reaches its own cove, preserves both worlds and returns to the south trail',()=>{
 const {g,p,d}=wilds();
 for(const [i,node] of MOUNTAIN_CAVE_TRAIL.entries())if(i)assert.ok(mountainLineOpen(d,point(MOUNTAIN_CAVE_TRAIL[i-1]),point(node),8));
 Object.assign(p,{x:HOLLOW_GATE.x,y:HOLLOW_GATE.y-25});
 const dryLoot={id:88002,x:15340,y:7090,type:'potion',qty:1};g.loot.push(dryLoot);
 assert.match(trainPrompt(g,p),/ENTER SMUGGLERS/);
 step(g,{interact:true});step(g);
 assert.equal(d.activeRoom,HOLLOW_ROOM);
 assert.ok(!g.loot.includes(dryLoot));
 assert.ok(g.enemies.length>0&&g.enemies.every(e=>e.wildMountain));
 assert.equal(hollowSurface(p.x,p.y),'grass');
 assert.equal(wildLandsSurface(d,8050,5050),'water');
 assert.equal(wildLandsSurface(d,7933,5327),'grass');
 assert.ok(trainWorldBlocked(g,7170,4450,8,true,true),'even airborne movement meets the cave wall');
 const resumed=restoreSession(JSON.parse(JSON.stringify(saveSession(g))));
 assert.equal(resumed.trainTest.design.activeRoom,HOLLOW_ROOM);
 Object.assign(p,HOLLOW_EXIT);step(g,{interact:true});
 assert.equal(d.activeRoom,undefined);
 assert.ok(g.loot.includes(dryLoot));
 assert.ok(Math.hypot(p.x-HOLLOW_GATE.x,p.y-HOLLOW_GATE.y)<36);
 assert.equal(g.trainTest.hollowActors.enemies.length,3);
});

test('Greywake sand carries a dry route from the western foothill to the Smugglers’ Hollow door',()=>{
 const {g,p,d}=wilds();
 const beach=[[15140,7372],[15490,7690],[15830,7880],[16125,8058],[16482,8195],[16680,8230],[16680,8178]];
 Object.assign(p,{...point(beach[0]),invuln:999});
 for(const [index,[x,y]] of beach.entries()){
  assert.equal(wildLandsGround(d,x,y),'beach');
  assert.equal(wildLandsSurfaceAt(d,x,y),'grass');
  if(index)assert.ok(mountainLineOpen(d,point(beach[index-1]),{x,y},8),'continuous beach segment '+index);
  walk(g,p,{x,y});
  assert.ok(!p.swimming);
  assert.equal(p.trainGround,0);
 }
 const waterline=[[16680,8392,'grass'],[16680,8448,'shallow'],[16680,8528,'water']];
 for(const [x,y,surface] of waterline){
  assert.equal(wildLandsSurface(d,x,y),surface);
  const tile=nativeWaterRuns(d,Math.floor(x/32)*32,Math.floor(y/32)*32);
  const includes=runs=>runs.some(([left,top,width,height])=>x>=left&&x<left+width&&y>=top&&y<top+height);
  assert.equal(includes(tile.wet),surface!=='grass');
  assert.equal(includes(tile.shallow),surface==='shallow');
 }
 assert.ok(trainWorldBlocked(g,16482,7840,8,false,true),'the cliff above the existing cave trail stays solid');
 assert.match(trainPrompt(g,p),/ENTER SMUGGLERS/);
 step(g,{interact:true});
 assert.equal(d.activeRoom,HOLLOW_ROOM);
});

test('the summit uses the visible shelf edge and ledges permit only a committed downhill jump',()=>{
 const {g,p,d}=wilds();
 const [crestX,crestY]=MOUNTAIN_SUMMIT[2];
 assert.ok(trainWorldBlocked(g,crestX,crestY-8,8,false,true),'the north rock beyond the summit edge is solid');
 assert.ok(!trainWorldBlocked(g,crestX,crestY+15,8,false,true),'the granite shelf itself supports the player');
 p.invuln=999;
 for(const {launch,landing} of MOUNTAIN_DESCENTS){
  const rise=mountainHeight(d,...launch),low=mountainHeight(d,...landing);
  const dx=landing[0]-launch[0],dy=landing[1]-launch[1],distance=Math.hypot(dx,dy);
  Object.assign(p,{...point(launch),jumpHeight:0,jumpVelocity:0,trainGround:rise});
  step(g,{x:dx/distance,y:dy/distance,jump:true});
  assert.ok(p.mountainDescent&&p.jumpHeight>0,'Jump at the downhill marker commits to the ledge');
  for(let i=0;i<30&&p.mountainDescent;i++)step(g);
  assert.ok(Math.hypot(p.x-landing[0],p.y-landing[1])<6);
  assert.equal(p.trainGround,low);assert.equal(p.jumpHeight,0);
  step(g,{x:-dx/distance,y:-dy/distance,jump:true});
  assert.ok(!p.mountainDescent,'a jump from the lower shelf does not gain an uphill shortcut');
  for(let i=0;i<25;i++)step(g,{x:-dx/distance,y:-dy/distance});
  assert.ok(mountainHeight(d,p.x,p.y)<rise-12);
 }
});

test('cave mobs route along connected dry rock shelves instead of trying to cross the harbor',()=>{
 const {g,p,d}=wilds();d.activeRoom=HOLLOW_ROOM;
 Object.assign(p,point(HOLLOW_NAV[2]));
 const e={...point(HOLLOW_NAV[9]),kind:'skeleton',hp:80,speed:100,wildMountain:true,cooldown:0};
 const route=mountainPursuitRoute(d,e,p,8);
 assert.ok(route.length>=3);
 let from=e;
 for(const waypoint of route){
  assert.equal(hollowSurface(waypoint.x,waypoint.y),'grass');
  assert.ok(mountainLineOpen(d,from,waypoint,8));from=waypoint;
 }
 let westmost=e.x;
 for(let i=0;i<140;i++){
  g.trainTest.time+=.05;
  if(!tickMountainPursuit(g,e,.05,[p]))break;
  assert.equal(hollowSurface(e.x,e.y),'grass');
  westmost=Math.min(westmost,e.x);
 }
 assert.ok(westmost<7480&&e.y>5075,'mob advances around the west edge of the pool');
 assert.equal(mountainHeight(d,e.x,e.y),0);
});
