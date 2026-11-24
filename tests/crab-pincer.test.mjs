import assert from 'node:assert/strict';
import {test} from 'node:test';
import {Game} from '../src/core.mjs';
import {CRAB_PINCER_PHASES} from '../src/crab-pincer.mjs';
import {CREATURE_PACK_SUBJECTS} from '../src/creature-packs/index.mjs';
import {creaturePackVisualActor} from '../src/creature-pack-animation-routing.mjs';
import {poseAt} from '../src/player-motion.mjs';
import {enterWildLands} from '../src/wild-lands.mjs';
import {wildLandsSurface} from '../src/wild-lands-world.mjs';

test('authored pincer movement stays attached and continuous across the strike phases',()=>{
 const rig=CREATURE_PACK_SUBJECTS.crab.data;
 const raised=poseAt(rig,'raise-claws',7),opened=poseAt(rig,'pinch',0),closed=poseAt(rig,'pinch',7);
 const recover=poseAt(rig,'recover',0),rest=poseAt(rig,'recover',7),idle=poseAt(rig,'idle',0);
 for(const side of ['L','R']){
  const claw='claw'+side;
  assert.deepEqual(raised[claw],opened[claw]);
  assert.deepEqual(closed[claw],recover[claw]);
  assert.deepEqual(rest[claw],idle[claw]);
  assert.ok(raised[claw][2]>idle[claw][2]+7);
  assert.ok(closed[claw][1]>opened[claw][1]+8);
 }
});

test('real Wild Lands crab lifts, pinches and recovers through the existing hit path',()=>{
 const g=new Game(()=>.5),p=g.addPlayer('keyboard');
 g.start();g.openingBoard=false;g.persist=()=>{};
 assert.ok(enterWildLands(g,{persistent:true}).ok);
 const t=g.trainTest;t.preparing=false;
 Object.assign(p,{x:12950,y:8170});
 for(let i=0;i<50;i++)g.update(1/30,{});
 const crab=g.enemies.find(e=>e.kind==='crab');
 assert.ok(crab?.wildSpawnKey);
 g.enemies=[crab];
 Object.assign(p,{x:crab.x+42*Math.cos(Math.PI/8),y:crab.y+42*Math.sin(Math.PI/8),swimming:false});
 assert.equal(wildLandsSurface(t.design,p.x,p.y),'grass');
 const phases=new Map(),startingHP=p.hp;
 for(let i=0;i<42;i++){
  g.update(1/30,{});
  const visual=creaturePackVisualActor(crab),phase=crab.wildlifeBehaviorPhase;
  if(!phase)continue;
  assert.equal(visual.animationAction,CRAB_PINCER_PHASES[phase].clip);
  phases.set(phase,(phases.get(phase)||[]).concat(visual.poseTime));
  if(phase!=='recover')assert.equal(p.hp,startingHP);
 }
 assert.deepEqual([...phases.keys()],['windup','attack','recover']);
 assert.ok([...phases.values()].every(times=>times[0]===0&&times.at(-1)>.7));
 assert.ok(p.hp<startingHP);
});
