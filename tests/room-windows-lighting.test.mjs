import test from 'node:test';
import assert from 'node:assert/strict';
import {sharedRoomGroups,roomWindowLayout,sharedRoomCamera,isSharedWorldRoom} from '../src/room-windows.mjs';
import {lightSources,lanternGlowStops} from '../src/night-cycle.mjs';
import {characterLightingFrame,characterLightingAt} from '../src/character-lighting.mjs';
import {wellRoomCamera} from '../src/old-well.mjs';
const setup=()=>({players:[{id:1,room:'upper',roomX:70,roomY:90,hp:100,x:1000,y:1000,equipment:{hand1:'lantern'}},{id:2,room:'upper',roomX:230,roomY:140,hp:100,x:1000,y:1000}],portals:[{id:'upper',temple:true},{id:'lower',oldWell:true,well:{exit:{x:40,y:40}}}],sky:{elapsed:320},generatedEnvironment:'temple'});
test('one shared room window per location, including players with personal inventory open',()=>{
 const g=setup();assert.equal(sharedRoomGroups(g).length,1);assert.equal(sharedRoomGroups(g)[0].players.length,2);
 g.players[1].ui={panel:'pack'};assert.equal(sharedRoomGroups(g).length,1);
 g.players[1].room='lower';assert.equal(sharedRoomGroups(g).length,2);
 g.players[1].room=null;assert.equal(sharedRoomGroups(g)[0].players.length,1);assert.equal(isSharedWorldRoom(g,g.players[1]),false);
 g.players[0].room=null;assert.equal(sharedRoomGroups(g).length,0);
});
test('room windows leave a border of surface world visible at small and large sizes',()=>{
 for(const [width,height]of [[160,120],[640,400],[1280,800]])for(const n of [1,2,4]){
  const boxes=roomWindowLayout(Array.from({length:n},(_,id)=>({id})),width,height);
  for(const box of boxes){assert.ok(box.x>0&&box.y>0);assert.ok(box.x+box.width<width&&box.y+box.height<height);}
 }
});
test('shared underground camera includes both widely separated players',()=>{
 const players=[{roomX:120,roomY:100},{roomX:540,roomY:370}],view={width:500,height:300,top:12,bottom:12,...sharedRoomCamera(players,500,276)};
 const camera=wellRoomCamera(players[0],{width:40,height:28},view);
 for(const p of players){assert.ok(p.roomX>=camera.x&&p.roomX<=camera.x+view.width/view.zoom);assert.ok(p.roomY>=camera.y&&p.roomY<=camera.y+(view.height-24)/view.zoom);}
});
test('interior character lighting uses interior coordinates, never surface lights',()=>{
 const g=setup(),surface=lightSources(g),upper=lightSources(g,'upper');
 assert.ok(!surface.some(s=>s.inventoryLight));assert.ok(upper.some(s=>s.x===70&&s.y===90&&s.inventoryLight));
 assert.ok(!lightSources(g,'lower').some(s=>s.inventoryLight));
 const actor={...g.players[0],x:70,y:90};assert.equal(characterLightingAt(characterLightingFrame(g),actor),null);
 assert.ok(characterLightingAt(characterLightingFrame(g,'upper'),actor).lights.length>0);
});
test('lantern outer glow has stronger warm color and a fully transparent soft boundary',()=>{
 const stops=lanternGlowStops({inventoryLight:true,color:'#ffbd70',intensity:1});
 const alpha=color=>Number(color.slice(color.lastIndexOf(',')+1,-1));
 assert.ok(alpha(stops.find(([s])=>s===.72)[1])>.2);assert.ok(alpha(stops.find(([s])=>s===.95)[1])>0);
 assert.equal(alpha(stops.at(-1)[1]),0);assert.ok(stops.some(([,c])=>c.includes('255,157,73')));
 const blue=lanternGlowStops({inventoryLight:true,color:'#6699ff'});assert.ok(blue.some(([,c])=>c.includes('102,153,255')));
});
