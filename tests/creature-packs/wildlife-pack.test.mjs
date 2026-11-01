import test from 'node:test';
import assert from 'node:assert/strict';
import { CREATURE_PACK, WILDLIFE_DONOR_NOTES } from '../../src/creature-packs/wildlife.mjs';
import { Game, EVENTS } from '../../src/core.mjs';
import { RIG_SUBJECTS } from '../../src/rig-subjects.mjs';
import { creatures } from '../../src/definitions.mjs';
import { generateWorld } from '../../src/world.mjs';
import { seedWildFauna } from '../../src/wild-fauna.mjs';
import { waterAt } from '../../src/environment.mjs';
import { selectEvent } from '../../src/event-director.mjs';
import { ENCOUNTER_CUES } from '../../src/encounter-cues.mjs';
import fs from 'node:fs';

const expected = [
  'snail','jumping_spider','fox_kit','llama','penguin','crab','golden_retriever',
  'skunk','triceratops','sheep','squirrel','baby_triceratops','turkey',
];

test('wildlife pack satisfies the isolated catalog contract', () => {
  assert.deepEqual(Object.keys(CREATURE_PACK.subjects).sort(), [...expected].sort());
  assert.deepEqual(Object.keys(CREATURE_PACK.defaults).sort(), [...expected].sort());
  assert.equal(CREATURE_PACK.events.some(event=>event.kind==='monkey_marmoni'),false);
  assert.equal(EVENTS.some(event=>event.kind==='monkey_marmoni'),false);
  assert.equal(Object.hasOwn(RIG_SUBJECTS,'monkey_marmoni'),false);
  assert.equal(Object.hasOwn(creatures,'monkey_marmoni'),false);
  assert.doesNotMatch(fs.readFileSync(new URL('../../scripts/generate-encounter-audio.mjs', import.meta.url), 'utf8'), /monkey_marmoni|Gray Marmoni/);
  assert.equal(Object.hasOwn(ENCOUNTER_CUES,'Gray Marmoni / second monkey encounter'),false);
  assert.equal(JSON.parse(fs.readFileSync(new URL('../../assets/sfx/encounters/manifest.json', import.meta.url), 'utf8')).some(cue=>/Gray Marmoni|monkey_marmoni/i.test(cue.name||'')),false);
  assert.equal(typeof CREATURE_PACK.tickActor, 'function');
  assert.equal(typeof CREATURE_PACK.onSpawn, 'function');
  for (const kind of expected) {
    const d = CREATURE_PACK.defaults[kind];
    assert.ok(d.name && d.baseKind && d.aiKind && d.rigType, `descriptor for ${kind}`);
    assert.ok(d.stats?.hp > 0 && d.stats.speed >= 0, `stats for ${kind}`);
    assert.ok(d.behaviors?.health, `behavior descriptor for ${kind}`);
    const subject = CREATURE_PACK.subjects[kind];
    const model = subject.defaults();
    assert.equal(model.type, kind);
    assert.ok(Object.keys(model.joints).length >= 8, `editable articulated rig for ${kind}`);
    assert.ok(model.clips.idle && model.clips.walk, `idle and locomotion clips for ${kind}`);
    assert.equal(subject.replace(model), undefined);
  }
});

test('each wildlife model draws a nonempty assembled preview in all eight facings', () => {
  for (const kind of expected) {
    const subject = CREATURE_PACK.subjects[kind];
    const model = subject.defaults();
    for (let facing = 0; facing < 8; facing++) {
      const pixels = [];
      const ctx = { fillStyle: '#000', save(){}, restore(){}, scale(){}, fillRect(x,y,w,h) { pixels.push([this.fillStyle,x,y,w,h]); } };
      subject.draw(ctx,{x:0,y:0,faceX:Math.sin(facing*Math.PI/4),faceY:-Math.cos(facing*Math.PI/4),state:'idle',moving:false,id:1},0,model);
      assert.ok(pixels.length > 10, `${kind} facing ${facing} rendered ${pixels.length} pixels`);
      assert.ok(pixels.every(([,x,y,w,h])=>[x,y,w,h].every(Number.isFinite)), `${kind} facing ${facing} has finite pixels`);
    }
  }
});

test('squirrel has an editable bounding rig and motion-specific idle, scamper, and leap clips', () => {
  const model=CREATURE_PACK.subjects.squirrel.defaults();
  assert.deepEqual(model.joints.head.position,[0,6,18]);
  assert.deepEqual(model.joints.frontPawL.position,[-7,4,6]);
  assert.equal(model.clips.scamper.loop,true);
  assert.equal(model.clips.freeze.loop,true);
  assert.equal(model.clips.leap.loop,false);
  assert.equal(model.clips.walk.length,17,'walk uses the NPC 61081 donor Walk track');
  assert.equal(model.clips.scamper.length,16,'scamper uses the NPC 61081 donor Run track');
  assert.ok(model.clips.scamper.keys.some(frame=>Math.hypot(...frame.joints.rearPawL)>6),'donor Run drives a readable hind-paw cycle');
  assert.ok(model.clips.scamper.keys.some(frame=>Math.abs(frame.joints.tailTip[2])>5.8),'donor tail chain follows the running cycle');
  assert.ok(model.clips.freeze.keys.some(frame=>Math.hypot(...frame.joints.tailTip)>0.5),'donor Stand preserves subtle tail idle motion');
  assert.ok(model.clips.leap.keys.some(frame=>frame.joints.pelvis[2]>10),'leap lifts the full body');
});

test('llama art pass grows the fleece neck while preserving its authored skeleton and behavior', () => {
  const model=CREATURE_PACK.subjects.llama.defaults(),defaults=CREATURE_PACK.defaults.llama;
  assert.deepEqual(model.joints.neck.position,[0,4,16]);
  assert.deepEqual(model.joints.head.position,[0,8,19]);
  assert.deepEqual(Object.keys(model.clips).filter(name=>['trot','spit-warning','kick'].includes(name)),['trot','spit-warning','kick']);
  assert.equal(defaults.behaviors.flee,true);
  assert.equal(model.shape.neckLength,15);
});

test('events expose the requested habitat families and developer triggers', () => {
  const byKind = Object.fromEntries(CREATURE_PACK.events.map(event=>[event.wildlifePackKind,event]));
  assert.equal(CREATURE_PACK.events.length, expected.length);
  for (const kind of expected) assert.ok(byKind[kind],`${kind} has a triggerable event`);
  for (const kind of expected.filter(kind=>!['crab','golden_retriever'].includes(kind))) assert.equal(byKind[kind].devOnly,true,`${kind} dev event`);
  assert.ok(byKind.crab.weight>0,'beach pincher can enter the beach event pool');
  assert.ok(byKind.golden_retriever.weight>0,'house companion can enter the house event pool');
  assert.equal(byKind.penguin.environment,'ice');
  assert.equal(byKind.crab.environment,'beach');
  assert.equal(byKind.golden_retriever.environment,'house');
});

test('fox and spider donor provenance records verified requested motion', () => {
  assert.equal(WILDLIFE_DONOR_NOTES.fox_kit.verifiedLocally,true);
  assert.equal(WILDLIFE_DONOR_NOTES.jumping_spider.verifiedForRequestedDonor,true);
  assert.match(WILDLIFE_DONOR_NOTES.otherSpecies.transfer,/native Wildbound approximations/);
});

test('wildlife tick safely ignores unrelated actors and runs custom pounce phases', () => {
  assert.equal(CREATURE_PACK.tickActor({}, {kind:'unrelated'}, 1, []), false);
  const spider = { wildlifePackKind:'jumping_spider',x:0,y:0,hp:20,speed:58,state:'hunt',faceX:1,faceY:0 };
  const target = { id:42,x:80,y:0,hp:20 };
  assert.equal(CREATURE_PACK.tickActor({},spider,.016,[target]),true);
  assert.equal(spider.state,'pounce-windup');
});

test('retriever interaction consumes a bone and bonds the animal to its player', async () => {
  const { interactWildlifeActor } = await import('../../src/creature-packs/wildlife.mjs');
  const retriever = {wildlifePackKind:'golden_retriever',hp:60,x:0,y:0};
  const player = {id:7,name:'Tester',inventory:[{type:'bone',quantity:1}]};
  const result = interactWildlifeActor({players:[player],message(){},persist(){}},retriever,player);
  assert.equal(result.ok,true);
  assert.equal(retriever.allyOwner,7);
  assert.equal(player.inventory.length,0);
});

test('all 38 remaining new event cards spawn their roster and have editor/runtime registrations', () => {
  const added = EVENTS.slice(-38);
  assert.equal(added.length, 38);
  for (const event of added) {
    assert.ok(RIG_SUBJECTS[event.kind], `${event.name} has a Studio rig`);
    assert.ok(creatures[event.kind], `${event.name} has runtime stats`);
    const game = new Game(() => 0.51);
    game.enemies = [];
    game.spawnEvent(EVENTS.indexOf(event), { force: true });
    const count = (event.enemies || [{ count: event.count }]).reduce((sum, member) => sum + (member.count || 1), 0);
    assert.equal(game.enemies.length, count, `${event.name} spawns its complete group`);
  }
});

test('developer-triggered creatures stay out of ordinary encounter selection', () => {
  const added = EVENTS.slice(-38);
  const game = new Game(() => 0.5);
  for (let attempt = 0; attempt < 20; attempt++) {
    const index = selectEvent(game, added, () => true);
    assert.notEqual(index, null);
    assert.equal(added[index].devOnly, false);
  }
});

test('ice penguins seed on snowy banks beside frozen lakes', () => {
  const game = new Game(() => 0.42, { deferWorld: true });
  Object.assign(game, generateWorld(321, 'ice'), {
    seed: 321, generatedEnvironment: 'ice', environment: 'ice', phase: 'play', openingBoard: false,
  });
  game.enemies = [];
  seedWildFauna(game, true);
  const penguins = game.enemies.filter(actor => actor.kind === 'penguin');
  assert.equal(penguins.length, 3);
  for (const bird of penguins) {
    assert.equal(waterAt(game, bird.x, bird.y), 'snow');
    assert.ok([[32,0],[-32,0],[0,32],[0,-32]].some(([dx,dy]) =>
      ['water','shallow','ice'].includes(waterAt(game, bird.x + dx, bird.y + dy))));
  }
});
