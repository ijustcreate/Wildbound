import {separateActorBodies} from '../src/enemy-separation.mjs';
import {actorRadius} from '../src/navigation.mjs';
import assert from 'node:assert/strict';
import test from 'node:test';

test('living enemies separate after overlapping and do not remain stacked',()=>{
  const game={players:[],enemies:[{id:1,kind:'wolf',x:100,y:100,hp:20},{id:2,kind:'wolf',x:100,y:100,hp:20}],moveActor(a,dx,dy){a.x+=dx;a.y+=dy;}};
  separateActorBodies(game,.1);
  assert.ok(Math.hypot(game.enemies[0].x-game.enemies[1].x,game.enemies[0].y-game.enemies[1].y)>=actorRadius(game.enemies[0])+actorRadius(game.enemies[1]));
});

test('enemy bodies make room around player bodies too',()=>{
  const player={id:1,kind:null,x:100,y:100,hp:100},enemy={id:2,kind:'wolf',x:100,y:100,hp:20};
  const game={players:[player],enemies:[enemy],moveActor(a,dx,dy){a.x+=dx;a.y+=dy;}};
  separateActorBodies(game,.1);
  assert.ok(Math.hypot(player.x-enemy.x,player.y-enemy.y)>0);
});
