import test from 'node:test';
import assert from 'node:assert/strict';
import {ALLEY_SHOPS,alleyBlocked,alleyMerchantActor,insideNocturne} from '../src/diagon-alley.mjs';
import {gardenCatsFor,nocturneCatFor} from '../src/diagon-garden-cats.mjs';
import {validateAlleyGoblinMotion} from '../src/alley-goblin-motion.mjs';
import {validateGloamwhiskerMotion} from '../src/gloamwhisker-motion.mjs';
import {poseAt} from '../src/player-motion.mjs';
import {rigPack} from '../src/project-rigs.mjs';
import {rigSubject} from '../src/rig-subjects.mjs';

test('banker and rat use independently editable native rig data',()=>{
 const bank=ALLEY_SHOPS.find(shop=>shop.id==='gringotts');
 const banker=alleyMerchantActor(bank),pack=rigPack([],{});
 assert.equal(banker.sprite,'alley_goblin');
 assert.equal(banker.goblinRole,'banker');
 assert.match(bank.line,/gold is counted/);
 assert.equal(rigSubject(banker.sprite).data.type,banker.sprite);
 assert.ok(validateAlleyGoblinMotion(pack.alley_goblin));
 assert.ok(validateGloamwhiskerMotion(pack.gloamwhisker_rat));
 const goblin=pack.alley_goblin.joints;
 assert.ok(goblin.handL.position[2]<goblin.pelvis.position[2],'the long hands hang below the waist');
 const rat=pack.gloamwhisker_rat;
 const walk=poseAt(rat,'walk',2),scurry=poseAt(rat,'scurry',2),idle=poseAt(rat,'idle',2);
 assert.ok(scurry.frontPawL[1]>walk.frontPawL[1]&&walk.frontPawL[1]>idle.frontPawL[1]);
 assert.deepEqual(poseAt(rat,'scurry',0),poseAt(rat,'scurry',rat.clips.scurry.length));
});

test('the black cat wanders a clear Nocturne route and stays out of the garden roster',()=>{
 const game={time:0,trainTest:{design:{wildLands:true,activeRoom:'diagon'}}};
 const points=new Set();
 for(let time=0;time<55;time+=.2){
  game.time=time;
  const actor=nocturneCatFor(game);
  points.add(Math.round(actor.x)+','+Math.round(actor.y));
  assert.equal(actor.id,'nocturne-black-cat');
  assert.equal(actor.catCoat,'black');
  assert.ok(insideNocturne(actor.x,actor.y));
  assert.equal(alleyBlocked(game,actor.x,actor.y,4),false);
 }
 assert.ok(points.size>100);
 assert.equal(gardenCatsFor(game).length,4);
 game.trainTest.design.activeRoom='caverns';
 assert.equal(nocturneCatFor(game),null);
});
