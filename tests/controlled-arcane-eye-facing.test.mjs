import test from 'node:test';
import assert from 'node:assert/strict';
import { Game } from '../src/core.mjs';
import { cycleFollowerControl } from '../src/follower-control.mjs';
import { facingIndex } from '../src/player-motion.mjs';

test('player-controlled Corrupted Eye tracks all eight aim directions into its renderer-facing fields',()=>{
  const game=new Game();game.phase='play';game.openingBoard=false;game.house=null;game.scenery=[];game.terrain.fill('grass');
  const player=game.addPlayer('keyboard');Object.assign(player,{x:320,y:320,faceX:0,faceY:-1});
  const eye={id:game.nextId++,kind:'arcane_eye',name:'Corrupted Eye',x:320,y:320,hp:170,maxHp:170,speed:43,faction:'ally',allyOwner:player.id};
  game.enemies.push(eye);cycleFollowerControl(game,player);
  for(let direction=0;direction<8;direction++){
    const angle=direction*Math.PI/4;
    game.update(.016,{keyboard:{aimX:-Math.sin(angle),aimY:Math.cos(angle)}});
    assert.equal(facingIndex(eye.faceX,eye.faceY),direction,`eye view ${direction} follows player aim`);
  }
});
