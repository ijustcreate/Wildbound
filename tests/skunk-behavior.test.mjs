import test from 'node:test';
import assert from 'node:assert/strict';
import { markSkunkAttacked } from '../src/skunk-state.mjs';
import { tickSkunkActor, tickSkunkClouds } from '../src/skunk-behavior.mjs';

function arena() {
  const player={id:1,x:40,y:0,hp:100,invuln:0};
  const skunk={id:2,kind:'skunk',x:0,y:0,hp:40,speed:54,faceX:1,faceY:0};
  const foe={id:3,kind:'test_target',x:25,y:0,hp:100};
  const game={time:0,players:[player],enemies:[skunk,foe],effects:[],moveActor(a,dx,dy){a.x+=dx;a.y+=dy;return Math.hypot(dx,dy);},hurt(p,amount){p.hp=Math.max(0,p.hp-amount);this.effects.push({x:p.x,y:p.y-25,text:`−${amount}`,color:'#ff9c86',life:.8});}};
  return {game,player,skunk,foe};
}

test('skunk normally flees, but only an actual hit starts its tail-origin spray',()=>{
  const {game,player,skunk}=arena();
  assert.equal(tickSkunkActor(game,skunk,.1,[player]),true);
  assert.ok(skunk.x<0,'moves away from the nearby player');
  assert.equal(skunk.skunkCloud,undefined);
  skunk.x=0;markSkunkAttacked(game,skunk,player);
  assert.equal(tickSkunkActor(game,skunk,.1,[player]),true);
  assert.ok(skunk.skunkCloud);
  assert.ok(skunk.skunkCloud.x>skunk.x,'cloud originates behind the facing direction at the tail');
  assert.equal(skunk.skunkSprayReadyAt,60);
});

test('skunk cloud ticks once per two seconds inside radius, adds green numbers, expires, and cooldown is one minute',()=>{
  const {game,player,skunk,foe}=arena();
  markSkunkAttacked(game,skunk,player);tickSkunkActor(game,skunk,.01,[player]);
  const cloud=skunk.skunkCloud;
  const poison=(target,amount)=>{const dealt=Math.min(target.hp,amount);target.hp-=dealt;return dealt;};
  tickSkunkClouds(game,1.99,poison);assert.equal(player.hp,100);assert.equal(foe.hp,100);
  tickSkunkClouds(game,.01,poison);assert.equal(player.hp,98);assert.equal(foe.hp,98);
  assert.equal(game.effects.find(fx=>fx.text)?.color,'#ade96e');
  tickSkunkClouds(game,1.99,poison);assert.equal(player.hp,98);
  tickSkunkClouds(game,.01,poison);assert.equal(player.hp,96);assert.equal(foe.hp,96);
  const outside={id:3,x:500,y:500,hp:100};game.players.push(outside);
  tickSkunkClouds(game,8,poison);assert.equal(player.hp,90);assert.equal(foe.hp,90);assert.equal(outside.hp,100);
  assert.equal(skunk.skunkCloud,null);
  assert.equal(game.effects.some(fx=>fx.skunkCloud),false);
  tickSkunkActor(game,skunk,.5,[player]);
  game.time=30;markSkunkAttacked(game,skunk,player);tickSkunkActor(game,skunk,.01,[player]);assert.equal(skunk.skunkCloud,null);
  game.time=60;tickSkunkActor(game,skunk,.01,[player]);assert.ok(skunk.skunkCloud);
  assert.equal(cloud.pulse,5,'the expired cloud recorded its five scheduled pulses');
  assert.equal(skunk.skunkCloud.pulse,0,'new spray begins a fresh cloud cadence');
});
