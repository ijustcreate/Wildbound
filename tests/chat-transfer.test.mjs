import test from 'node:test';
import assert from 'node:assert/strict';
import {Game} from '../src/core.mjs';
import {defaultNativePlayerMotion,upgradePlayerToNative,playerPose} from '../src/player-motion.mjs';
import {readFileSync} from 'node:fs';

test('new games, victories and the next expedition restore full current maximum health',()=>{
 const g=new Game(()=>.5),p=g.addPlayer('keyboard','Health check');p.hp=3;
 assert.equal(g.start(),true);assert.equal(p.hp,p.maxHp);
 p.hp=4;g.completeVictory();assert.equal(p.hp,p.maxHp);
 p.hp=5;g.newExpedition();assert.equal(p.hp,p.maxHp);
});
test('native default swim keeps the head up and uses paired arms; stance survives reload',()=>{
 const m=defaultNativePlayerMotion();assert.equal(m.breaststrokeRevision,1);assert.equal(m.relaxedStanceRevision,1);
 assert.deepEqual(upgradePlayerToNative(m),m);
 for(let frame=0;frame<m.clips.swim.length;frame+=.5){
  const p=playerPose({animationAction:'swim',playerFrame:frame,hp:100},0,m);
  assert.ok(p.head[2]>p.chest[2]+4);
  assert.ok(Math.abs(p.handL[1]-p.handR[1])<.001);
 }
});
test('authored and custom animation data remain available after migration',()=>{
 const m=JSON.parse(readFileSync(new URL('../authored/rigs.json',import.meta.url))).player;
 const original=structuredClone(m);m.clips.cast.keys[0].joints.handR[0]+=.37;
 const upgraded=upgradePlayerToNative(m);
 assert.deepEqual(upgraded.nativeHumanoidSource.preservedClips.cast,m.clips.cast);
 assert.deepEqual(upgraded.nativeHumanoidSource.originalJoints,original.joints);
});
