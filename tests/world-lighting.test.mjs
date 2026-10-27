import test from 'node:test';
import assert from 'node:assert/strict';
import {lightVolumeInterval,pointLightVisibility} from '../src/realtime-shadows.mjs';
import {propLightGeometry,worldLightField,localLightStrength,groundShadowPolygon} from '../src/world-lighting.mjs';
import {characterLightingAt,characterLightingFrame} from '../src/character-lighting.mjs';
import {lightAt} from '../src/night-cycle.mjs';

const source={x:0,y:0,height:20,radius:280,intensity:1};
test('low light passes beneath raised foliage, but tree trunks cast a shadow',()=>{
 const tree={id:1,kind:'tree',x:60,y:0,rootY:0,size:100},g=propLightGeometry(tree);
 assert.equal(g.volumes.length,2);assert.ok(g.volumes[1].minZ>source.height);
 const field={volumes:g.volumes};
 assert.equal(pointLightVisibility(field,source,{x:120,y:30,z:0}),1,'ray under crown misses the narrow trunk');
 assert.equal(pointLightVisibility(field,source,{x:120,y:0,z:0}),0,'trunk blocks the ray');
 assert.ok(pointLightVisibility(field,{...source,height:90},{x:120,y:30,z:80})<.1,'high ray meets foliage');
});
test('solid bushes, rocks and custom ruins block light at their real height',()=>{
 for(const kind of ['bush','frost_shrub','rock','ice_rock','forest_ruin','cactus','grave']){
  const g=propLightGeometry({id:kind,kind,x:60,y:0,rootY:0,size:80,height:40});
  assert.ok(g.volumes.length,kind);assert.ok(pointLightVisibility({volumes:g.volumes},source,{x:120,y:0,z:10})<.05,kind);
  assert.equal(pointLightVisibility({volumes:g.volumes},{...source,height:100},{x:120,y:0,z:90}),1,kind+' does not act infinitely tall');
 }
});
test('closed supply chests are solid box-shaped dynamic light blockers and opening removes the blocker',()=>{
 const chest={id:'supply:1',x:60,y:0,opened:false},game={time:0,phase:'play',supplyChests:[chest],scenery:[]};
 let field=worldLightField(game,[source]);assert.equal(field.volumes.length,1);assert.equal(field.volumes[0].shape,'box');
 assert.equal(pointLightVisibility(field,source,{x:120,y:0,z:10}),0);
 chest.opened=true;field=worldLightField(game,[source]);assert.equal(field.volumes.length,0);
});
test('finite ray segments do not shadow in front of a blocker or beyond the light',()=>{
 const volume={x:60,y:0,rx:10,ry:10,minZ:0,maxZ:50,shape:'box',owner:'wall'};
 assert.equal(pointLightVisibility({volumes:[volume]},source,{x:30,y:0,z:0}),1);
 assert.equal(pointLightVisibility({volumes:[volume]},source,{x:120,y:0,z:0}),0);
 assert.equal(pointLightVisibility({volumes:[volume]},source,{x:120,y:0,z:0},'wall'),1);
 assert.equal(lightVolumeInterval(source,{x:30,y:0,z:0},volume),null);
});
test('all environments share the same point-light blockers, including opened/destroyed updates',()=>{
 for(const environment of ['forest','desert','ice','temple','house','beach','graveyard']){
  const rock={kind:'rock',x:60,y:0,rootY:0,size:80},game={time:0,generatedEnvironment:environment,scenery:[rock]};
  assert.equal(localLightStrength(worldLightField(game,[source]),source,{x:120,y:0,z:10}),0,environment);
  rock.depleted=true;assert.ok(localLightStrength(worldLightField(game,[source]),source,{x:120,y:0,z:10})>.1,environment+' updates without time advancing');
 }
 const door={id:'door',x:50,y:-20,w:10,h:40,kind:'door'},game={scenery:[],house:{doors:[door]}};
 assert.equal(pointLightVisibility(worldLightField(game,[source]),source,{x:120,y:0,z:10}),0);
 door.open=true;assert.equal(pointLightVisibility(worldLightField(game,[source]),source,{x:120,y:0,z:10}),1);
});
test('lights add independently; a blocked source does not erase another source',()=>{
 const block=propLightGeometry({id:1,kind:'bush',x:50,y:0,rootY:0,size:80}),field={volumes:block.volumes},point={x:120,y:0,z:15};
 assert.equal(localLightStrength(field,source,point),0);
 assert.ok(localLightStrength(field,{...source,x:140},point)>.5);
});
test('characters use the same blockers without self-shadowing the lantern carrier',()=>{
 const game={time:0,sky:{elapsed:330},scenery:[{kind:'rock',id:1,x:60,y:0,rootY:0,size:80}],players:[{id:2,x:0,y:0,hp:100,inventory:[{type:'lantern',qty:1}]}]};
 const frame=characterLightingFrame(game);
 assert.equal(characterLightingAt(frame,{id:3,x:120,y:0}).lights.length,0);
 assert.equal(lightAt(game,{id:3,x:120,y:0}),0,'visibility uses the same occluded light');
 assert.ok(characterLightingAt(frame,game.players[0]).lights.length>0);
 assert.equal(characterLightingAt({...frame,room:'upper'},{id:3,x:0,y:0}),null);
});

test('destroyed wall sections transmit light while neighboring sections stay opaque',()=>{
 const wall={id:'wall',kind:'wall',x:50,y:-60,w:10,h:120,sectionDamage:{1:{broken:true}}},game={scenery:[],house:{walls:[wall]}},field=worldLightField(game,[source]);
 assert.equal(pointLightVisibility(field,source,{x:120,y:0,z:10}),1);
 assert.equal(pointLightVisibility(field,{...source,y:45},{x:120,y:45,z:10}),0);
 wall.sectionDamage[1].broken=false;assert.equal(pointLightVisibility(worldLightField(game,[source]),source,{x:120,y:0,z:10}),0);
});

test('ground masks respect canopy clearance and finite low-object shadow lengths',()=>{
 const raised={x:60,y:0,rx:30,ry:20,minZ:50,maxZ:110,shape:'ellipsoid'};
 assert.deepEqual(groundShadowPolygon(source,raised),[]);
 const short={x:60,y:0,rx:8,ry:8,minZ:0,maxZ:8,shape:'box'};
 const finite=groundShadowPolygon(source,short),tall=groundShadowPolygon(source,{...short,maxZ:60});
 assert.ok(finite.length>=4);assert.ok(Math.max(...finite.map(p=>p[0]))<150);
 assert.ok(Math.max(...tall.map(p=>p[0]))>300);
 assert.deepEqual(groundShadowPolygon({...source,owner:'carrier'},{...short,owner:'carrier'}),[]);
 assert.equal(pointLightVisibility({volumes:[short]},source,{x:120,y:0,z:0}),1,'short object below the ray does not block');
});

test('no-source frames skip all light-field work, and edited heights invalidate cached fields',()=>{
 assert.equal(worldLightField({scenery:[]},[]),null);
 const rock={kind:'rock',x:60,y:0,rootY:0,size:80,height:5},game={scenery:[rock]};
 const first=worldLightField(game,[source]);rock.height=50;
 const second=worldLightField(game,[source]);assert.notEqual(first,second);
 assert.equal(pointLightVisibility(second,source,{x:120,y:0,z:10}),0);
});
