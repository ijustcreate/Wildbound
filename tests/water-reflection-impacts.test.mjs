import test from 'node:test';
import assert from 'node:assert/strict';
import {WaterInteractionRenderer,bareIceAt} from '../src/water-interactions.mjs';

const visible=()=>true;
function waterFixture(){
 const terrain=Array(2500).fill('grass');
 terrain.fill('shallow',10*50,12*50);
 const player={id:7,x:320,y:340,hp:100,landTime:0};
 return {phase:'play',time:1,terrain,players:[player],effects:[]};
}

test('wet footsteps follow travel cadence and the landing uses the observed splash coordinates',()=>{
 const game=waterFixture(),a=game.players[0],renderer=new WaterInteractionRenderer();
 assert.deepEqual(renderer.collectImpacts(game,visible),{landings:0,steps:0});
 game.time+=.12;a.x+=34;
 assert.deepEqual(renderer.collectImpacts(game,visible),{landings:0,steps:1});
 assert.deepEqual([...renderer.impactUniforms.slice(0,2)],[350,342]);
 game.time+=.12;a.x+=36;a.jumpHeight=9;
 assert.deepEqual(renderer.collectImpacts(game,visible),{landings:0,steps:1});
 game.time+=.12;a.jumpHeight=0;a.landTime=.2;
 game.effects.push({particle:'jump-splash',x:a.x-3,y:a.y,life:.98,seed:a.id});
 assert.deepEqual(renderer.collectImpacts(game,visible),{landings:1,steps:1});
 assert.deepEqual([...renderer.impactUniforms.slice(4,6)],[a.x-3,a.y]);
 game.time+=.15;a.landTime=.05;
 assert.deepEqual(renderer.collectImpacts(game,visible),{landings:1,steps:1});
 game.time+=.93;a.landTime=0;
 assert.deepEqual(renderer.collectImpacts(game,visible),{landings:0,steps:0});
});

test('dry land, solid bridge tops and submerged actors do not produce water impacts',()=>{
 const game=waterFixture(),a=game.players[0],renderer=new WaterInteractionRenderer();
 a.y=290;a.landTime=.2;
 renderer.collectImpacts(game,visible);game.time+=.12;a.x+=32;
 assert.deepEqual(renderer.collectImpacts(game,visible),{landings:0,steps:0});
 game.time+=.2;a.y=340;a.trainDeck=true;a.landTime=.22;
 renderer.collectImpacts(game,visible);game.time+=.12;a.x+=32;
 assert.deepEqual(renderer.collectImpacts(game,visible),{landings:0,steps:0});
 game.time+=.2;a.trainDeck=false;a.swimming=true;a.diveDepth=.9;a.landTime=.22;
 renderer.collectImpacts(game,visible);game.time+=.12;a.x+=32;
 assert.deepEqual(renderer.collectImpacts(game,visible),{landings:0,steps:0});
});

test('only frozen ice with little surface snow can receive an ice reflection',()=>{
 const game=waterFixture();
 game.generatedEnvironment='ice';
 game.terrain[10*50+10]='ice';
 game.terrain[10*50+11]='snow';
 assert.equal(bareIceAt(game,325,340),true);
 assert.equal(bareIceAt(game,357,340),false);
 assert.equal(bareIceAt(game,300,340),false);
 game.snowDepth=.5;
 assert.equal(bareIceAt(game,325,340),false);
});
