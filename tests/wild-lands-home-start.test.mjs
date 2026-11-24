import assert from 'node:assert/strict';
import test from 'node:test';
import {Game} from '../src/core.mjs';
import {daylight} from '../src/night-cycle.mjs';
import {saveSession,restoreSession} from '../src/session.mjs';
import {trainWorldBlocked} from '../src/train-test.mjs';
import {wildHomestead} from '../src/wild-homestead-layout.mjs';
import {enterWildLands} from '../src/wild-lands.mjs';

function expedition(count=1){
 const game=new Game(()=>.5);
 for(let i=0;i<count;i++)game.addPlayer(i?'pad:'+i:'keyboard','Explorer '+(i+1));
 const p=game.players[0];
 p.coins=79;p.inventory=[{type:'torch',qty:1}];p.equipment.hand1='starter_wand';
 p.field.gardenManaWard=481;
 return game;
}

test('fresh Wild Lands gives six explorers clear, distinct Homestead floor positions and keeps their profile gear',()=>{
 const g=expedition(6),p=g.players[0],profile=p.profileId;
 Object.assign(p,{x:13400,y:1850});g.sky={elapsed:318,phase:'night',days:0};
 assert.ok(enterWildLands(g,{persistent:true,homeStart:true}).ok);
 const home=wildHomestead(g.trainTest.design);
 assert.equal(new Set(g.players.map(p=>p.x+':'+p.y)).size,6);
 for(const player of g.players){
  assert.ok(home.floors.some(f=>player.x>f.x&&player.x<f.x+f.w&&player.y>f.y&&player.y<f.y+f.h));
  assert.equal(trainWorldBlocked(g,player.x,player.y,10),false);
  assert.equal(player.room,null);assert.equal(player.trainRide,undefined);assert.equal(player.swimming,false);
 }
 assert.equal(p.profileId,profile);assert.equal(p.coins,79);assert.deepEqual(p.inventory,[{type:'torch',qty:1}]);
 assert.equal(p.equipment.hand1,'starter_wand');assert.equal(p.field.gardenManaWard,481);
 assert.equal(g.trainTest.homeStart,true);assert.equal(g.time,0);assert.equal(daylight(g),1);
 assert.deepEqual(g.sky,{elapsed:0,days:0,phase:'day'});
 const saved=JSON.parse(JSON.stringify(saveSession(g))),copy=restoreSession(saved);
 assert.equal(saved.wilds.progress.homeStart,true);assert.equal(copy.trainTest.homeStart,true);
 assert.deepEqual(copy.players.map(p=>[p.x,p.y]),g.players.map(p=>[p.x,p.y]));
});

test('the Wild Lands uses the native day, dusk, night, dawn and full day count',()=>{
 const g=expedition();assert.ok(enterWildLands(g,{persistent:true,homeStart:true}).ok);
 g.update(.05,{});assert.equal(g.sky.elapsed,.05);
 for(const [elapsed,prior,phase] of [[239.98,'day','dusk'],[299.98,'dusk','night'],[449.98,'night','dawn'],[479.98,'dawn','day']]){
  Object.assign(g.sky,{elapsed,phase:prior});
  g.update(.05,{});assert.equal(g.sky.phase,phase);
  if(phase==='night')assert.equal(daylight(g),0);
  else if(phase==='day')assert.equal(daylight(g),1);
  else assert.ok(daylight(g)>0&&daylight(g)<1);
 }
 assert.ok(g.sky.elapsed>480);assert.equal(g.sky.days,1);
 g.phase='lobby';const before=g.sky.elapsed;g.update(.05,{});assert.equal(g.sky.elapsed,before);
});
