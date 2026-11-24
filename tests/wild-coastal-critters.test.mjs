import assert from 'node:assert/strict';
import {test} from 'node:test';
import {wildLandsDesign} from '../src/wild-lands.mjs';
import {wildLandsSurfaceAt} from '../src/wild-lands-world.mjs';
import {
 catchableWildCoastalCritter,removeWildCoastalCritter,tickWildCoastalCritters,
 wildCoastalAnimals,wildCoastalHabitat,wildCoastalReleaseSpot,
} from '../src/wild-coastal-critters.mjs';

const west={id:'west',x:660,y:4400,hp:100},east={id:'east',x:18600,y:4050,hp:100};
const game=(...players)=>({players:players.map(p=>({...p})),trainTest:{design:wildLandsDesign(),time:1}});
function simulate(g,seconds){
 for(let i=0;i<seconds*15;i++){
  g.trainTest.time+=1/15;
  tickWildCoastalCritters(g,1/15);
 }
}

test('Wild Lands ocean species live along native beaches and Tideglass, away from inland water',()=>{
 const g=game(west,east),d=g.trainTest.design;
 assert.equal(wildLandsSurfaceAt(d,17048,3650),'water');
 assert.equal(wildCoastalHabitat(d,'fish',17048,3650),false,'Tideglass lagoon');
 assert.equal(wildCoastalHabitat(d,'fish',18600,3150),true,'Tideglass open inlet');
 assert.equal(wildCoastalHabitat(d,'crab',8300,7300),false,'Homestead');
 simulate(g,1);
 const animals=wildCoastalAnimals(g);
 assert.deepEqual([...new Set(animals.map(a=>a.kind))].sort(),['crab','fish','gull','pelican']);
 assert.ok(animals.length<=24);
 assert.ok(animals.some(a=>a.kind==='fish'&&a.x<1000));
 assert.ok(animals.some(a=>a.kind==='fish'&&a.x>18000));
 simulate(g,12);
 for(const a of wildCoastalAnimals(g).filter(a=>a.kind==='crab'||a.kind==='fish')){
  assert.ok(wildCoastalHabitat(d,a.kind,a.x,a.y),`${a.kind} ${a.id} kept its habitat while moving`);
 }
 g.players[0].x=8200;g.players[0].y=5000;
 g.players[1].x=17048;g.players[1].y=3650;
 simulate(g,1);
 assert.equal(wildCoastalAnimals(g).length,0);
});

test('coastal net targets use directional reach and save-friendly respawn timestamps',()=>{
 const g=game(east),p=g.players[0];
 simulate(g,1);
 const crab=wildCoastalAnimals(g).find(a=>a.kind==='crab');
 Object.assign(p,{x:crab.x-28,y:crab.y,faceX:-1,faceY:0});
 assert.equal(catchableWildCoastalCritter(g,p),null);
 p.faceX=1;
 assert.equal(catchableWildCoastalCritter(g,p),crab);
 removeWildCoastalCritter(g,crab);
 assert.ok(g.trainTest.wildCoastalCaught[crab.id]>g.trainTest.time);
 const fresh=game(east);
 fresh.trainTest.wildCoastalCaught=JSON.parse(JSON.stringify(g.trainTest.wildCoastalCaught));
 simulate(fresh,1);
 assert.ok(!wildCoastalAnimals(fresh).some(a=>a.id===crab.id));
 fresh.trainTest.time+=361;
 simulate(fresh,1);
 assert.ok(wildCoastalAnimals(fresh).some(a=>a.id===crab.id));
 assert.ok(wildCoastalReleaseSpot(g,p,'crab'));
 assert.equal(wildCoastalReleaseSpot(g,{x:17048,y:3650},'fish'),null);
});
