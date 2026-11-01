import test from 'node:test';
import assert from 'node:assert/strict';
import { Game } from '../src/core.mjs';

function world(tile){
  const game=new Game();game.phase='play';game.openingBoard=false;game.house=null;game.scenery=[];game.terrain.fill(tile);
  const player=game.addPlayer('keyboard');Object.assign(player,{x:320,y:320});
  return {game,player};
}
function movedOn(tile,actor,flightArg=false){
  const {game}=world(tile);Object.assign(actor,{x:320,y:320,hp:100});
  const moved=game.moveActor(actor,30,0,flightArg);return {moved,actor};
}

test('shallow water, quicksand, mud and snow slow grounded actors but not airborne ones',()=>{
  for(const tile of ['shallow','quicksand','mud']){
    const ground=movedOn(tile,{kind:'training_enemy'}).moved;
    assert.ok(ground<29,`${tile} still slows grounded units`);
    const jumper=movedOn(tile,{kind:'training_enemy',jumpHeight:18});
    assert.ok(jumper.moved>29,`${tile} does not slow a jumping enemy`);
    assert.equal(jumper.actor.sink||0,0,`${tile} does not sink an airborne enemy`);
    const flyer=movedOn(tile,{kind:'training_enemy',flying:true});
    assert.ok(flyer.moved>29,`${tile} does not slow a flying enemy`);
    assert.equal(flyer.actor.sink||0,0,`${tile} does not sink a flying enemy`);
    const {game:pg,player}=world(tile);player.broomMount=true;
    assert.ok(pg.moveActor(player,30,0)>29,`${tile} does not slow a flying player`);
  }
  const {game}=world('grass');game.generatedEnvironment='ice';game.snowDepth=1;
  const snowy={kind:'training_enemy',x:320,y:320,hp:100};
  const grounded=game.moveActor(snowy,30,0);assert.ok(grounded<29);
  const airborne={kind:'training_enemy',x:320,y:320,hp:100,jumpHeight:18};
  assert.ok(game.moveActor(airborne,30,0)>29);
});
