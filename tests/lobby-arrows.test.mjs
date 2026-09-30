import test from 'node:test';
import assert from 'node:assert/strict';
import {LobbyPractice} from '../src/lobby-practice.mjs';

const arrow=(x,y,vx=300,vy=0)=>({x,y,vx,vy,z:18,vz:0,angle:Math.atan2(vy,vx),damage:12,embedDepth:9,owner:999});
for(const [name,x,y] of [['map table',570,168],['dice table',720,168],['board table',690,380],['totem',880,165],['starter chest',870,512],['hero cabinet',560,535],['boundary',960,300]]){
  test(`Lobby arrows remain at the ${name} impact instead of disappearing or passing through`,()=>{
    const g=new LobbyPractice();g.arrows.push(arrow(x,y));
    for(let n=0;n<10;n++)g.tickAdventure(.02,{});
    assert.equal(g.arrows.length,0);
    assert.equal(g.loot.length,1);
    const hit=g.loot[0];
    assert.equal(hit.type,'arrow');assert.equal(hit.embedded,true);assert.equal(hit.surfaceEmbedded,true);
    assert.equal(hit.y,y);assert.ok(hit.x>x&&hit.x<x+30);assert.ok(hit.z>0);
    assert.equal(hit.manualPickup,true);
    const position=[hit.x,hit.y,hit.z];
    for(let n=0;n<60;n++)g.tickAdventure(.02,{});
    assert.deepEqual([hit.x,hit.y,hit.z],position);
  });
}
test('Missed lobby arrows stay on the floor as visible embedded loot',()=>{
  const g=new LobbyPractice();g.arrows.push({...arrow(350,450),z:1,vz:-10});
  for(let n=0;n<30;n++)g.tickAdventure(.02,{});
  assert.equal(g.arrows.length,0);assert.equal(g.loot.length,1);
  assert.equal(g.loot[0].embedded,true);assert.equal(g.loot[0].surfaceEmbedded,undefined);
});
test('Arrows attach to moving practice targets and score only once',()=>{
  const g=new LobbyPractice(),target=g.targets[0];
  g.arrows.push(arrow(target.x,target.y+40,0,-300));
  for(let n=0;n<8;n++)g.tickAdventure(.02,{});
  const shot=g.arrows[0];assert.equal(shot.stuck,true);assert.equal(shot.enemy,target.id);
  const offset=[shot.x-target.x,shot.y-target.y],height=shot.z;
  g.toggleTargets();
  for(let n=0;n<60;n++){g.updateTargets(.02);g.tickAdventure(.02,{});}
  assert.ok(Math.abs(shot.x-target.x-offset[0])<1e-8);
  assert.ok(Math.abs(shot.y-target.y-offset[1])<1e-8);
  assert.equal(shot.z,height);assert.equal(target.hits,1);assert.equal(target.score,12);
});
