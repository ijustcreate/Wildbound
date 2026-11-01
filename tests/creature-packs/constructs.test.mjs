import test from 'node:test';
import assert from 'node:assert/strict';
import { CREATURE_PACK } from '../../src/creature-packs/constructs.mjs';
import { facingIndex, poseAt } from '../../src/player-motion.mjs';
import { drawConstructHazardProjectiles } from '../../src/render.mjs';

const kinds = [
  'blaise','voodoo_doll','enchanted_book','gargoyle','crystal_golem',
  'skeleton_deckhand','ogre','jimothy','mindflayer','succubus_2',
  'mana_golem','enchanted_broom','forest_golem',
];
const directions = [[0,1],[-Math.SQRT1_2,Math.SQRT1_2],[-1,0],[-Math.SQRT1_2,-Math.SQRT1_2],[0,-1],[Math.SQRT1_2,-Math.SQRT1_2],[1,0],[Math.SQRT1_2,Math.SQRT1_2]];

function mockCanvas() {
  const pixels=[];
  return {pixels,fillStyle:'#000',fillRect(x,y,w,h){pixels.push([Math.round(x),Math.round(y),Math.ceil(w),Math.ceil(h),this.fillStyle]);}};
}

test('pack exposes the central integration contract and thirteen distinct subjects/events',()=>{
  assert.deepEqual(Object.keys(CREATURE_PACK).filter(k=>['subjects','defaults','events','tickActor','onSpawn'].includes(k)).sort(),['defaults','events','onSpawn','subjects','tickActor']);
  assert.equal(Object.keys(CREATURE_PACK.subjects).length,kinds.length);
  assert.equal(Object.keys(CREATURE_PACK.defaults).length,kinds.length);
  assert.equal(CREATURE_PACK.events.length,kinds.length);
  assert.equal(CREATURE_PACK.tickActor({},{kind:'outside-pack'},.1,[]),false);
});

for (const kind of kinds) test(`${kind} has editable native motion, authored 8-view art, and a dev event`,()=>{
  const subject=CREATURE_PACK.subjects[kind], model=subject.defaults();
  assert.ok(subject.name);
  assert.ok(model.joints && Object.keys(model.joints).length>=5);
  for(const clip of ['idle','walk','run','windup','attack','special','recover','hurt','death']) {
    assert.ok(model.clips[clip],`${kind} missing ${clip}`);
    const pose=poseAt(model,clip,Math.min(2,model.clips[clip].length-1));
    assert.ok(Object.keys(pose).length>=5,`${kind}/${clip} is not poseable`);
  }
  for(let d=0;d<8;d++) {
    const canvas=mockCanvas(),[faceX,faceY]=directions[d];
    subject.draw(canvas,{kind,x:80,y:80,faceX,faceY,animationAction:'idle'},0,model);
    assert.ok(canvas.pixels.length>12,`${kind} facing ${facingIndex(faceX,faceY)} rendered too few pixels`);
  }
  const descriptor=CREATURE_PACK.defaults[kind],event=CREATURE_PACK.events.find(e=>e.kind===kind);
  assert.equal(descriptor.baseKind,kind==='blaise'?'fire_elemental':kind==='skeleton_deckhand'?'skeleton':kind==='succubus_2'?'golem':'golem');
  assert.equal(descriptor.behaviors.customPackAI,true);
  assert.equal(event.devOnly,true);
  assert.equal(event.pack,'constructs');
  assert.ok(event.count>0 && event.name);
  assert.match(model.motionNotes.wowheadDonor,/not yet verified or imported/);
});

test('onSpawn initializes only this pack and tickActor replaces AI only for matching actors',()=>{
  const actor={kind:'blaise',x:0,y:0,hp:100,room:'crypt',stats:CREATURE_PACK.defaults.blaise.stats};
  const outsider={kind:'bat',x:2,y:0,hp:10,room:'crypt'};
  assert.equal(CREATURE_PACK.onSpawn({}, {pack:'elsewhere'}, [actor]),false);
  assert.equal(CREATURE_PACK.onSpawn({}, {pack:'constructs'}, [actor,outsider]),true);
  assert.equal(actor.constructAI.phase,'idle');
  assert.equal(outsider.constructAI,undefined);
  assert.equal(CREATURE_PACK.tickActor({},outsider,.1,[actor]),false);

  actor.constructAI.specialCooldown=0;
  const target={kind:'player',x:45,y:0,hp:100,room:'crypt'};
  const otherRoom={kind:'player',x:1,y:0,hp:100,room:'house'};
  assert.equal(CREATURE_PACK.tickActor({},actor,.1,[target,otherRoom]),true);
  assert.equal(actor.constructAI.phase,'specialWindup');
  const game={effects:[],fireballs:[],moveActor:(who,dx,dy)=>{who.x+=dx;who.y+=dy;},hurt:(who,n)=>{who.hp-=n;},shieldBlocks:()=>false};
  actor.constructAI.specialCooldown=0;
  for(let i=0;i<16;i++) CREATURE_PACK.tickActor(game,actor,.1,[target,otherRoom]);
  assert.ok(game.fireballs.length>0,'special windup should launch at a same-room target');
  assert.equal(target.hp,100,'projectile travel resolves later through the shared hazard system');
  assert.equal(otherRoom.hp,100,'other-room actors must not be hit');
});

test('broom is a distinct, non-humanoid enchanted actor with its own perch-free flight rig',()=>{
  const broom=CREATURE_PACK.subjects.enchanted_broom.defaults();
  assert.deepEqual(Object.keys(broom.joints).sort(),['bristles','eyeL','eyeR','handleBase','handleTip','ribbon','root'].sort());
  assert.equal(CREATURE_PACK.defaults.enchanted_broom.behaviors.fly,true);
  assert.equal(CREATURE_PACK.defaults.enchanted_broom.rigType,'broom');
});

function combatFixture(kind,targetDistance=46){
  const actor={kind,x:0,y:0,faceX:1,faceY:0,hp:200,room:'test',id:17,moving:false,stats:CREATURE_PACK.defaults[kind].stats};
  const target={kind:'player',x:targetDistance,y:0,hp:300,room:'test',rooted:0};
  const game={time:0,phase:'play',paused:false,effects:[],fireballs:[],firePatches:[],fireParticles:[],
    shieldBlocks:()=>false,moveActor:(who,dx,dy)=>{who.x+=dx;who.y+=dy;},
    hurt:(who,n)=>{who.hp=Math.max(0,who.hp-n);},
  };
  actor.constructAI={phase:'idle',timer:0,cooldown:0,specialCooldown:0,attacks:0};
  return {actor,target,game};
}
function resolve(kind,targetDistance=46){
  const f=combatFixture(kind,targetDistance);
  CREATURE_PACK.tickActor(f.game,f.actor,.1,[f.target]);
  for(let i=0;i<24;i++)CREATURE_PACK.tickActor(f.game,f.actor,.1,[f.target]);
  return f;
}

test('distinct ranged specials launch visible projectiles and keep their own impact cues',()=>{
  for(const [kind,count] of [['blaise',1],['enchanted_book',3],['crystal_golem',1],['mindflayer',0],['succubus_2',1],['mana_golem',1]]){
    const {actor,target,game}=resolve(kind,kind==='crystal_golem'?50:82);
    if(kind==='mindflayer')assert.ok(target.hp<300,'psionic pulse directly damages in its radius');
    else assert.equal(game.fireballs.length,count,`${kind} launches expected projectile count`);
    assert.ok(game.effects.some(f=>f.color),'${kind} should create a visible attack cue');
  }
  assert.equal(resolve('crystal_golem',50).game.fireballs[0].ice,true,'crystal shard projectile has the cold crystal visual');
  assert.equal(resolve('blaise',82).game.fireballs[0].burnDamage,5,'Blaise fire projectile carries burn damage');
});

test('construct projectile render pass draws unique pixel silhouettes and colors per spell',()=>{
  const colors=new Map();
  for(const kind of ['fireball','pageVolley','psionicPulse','heartBolt','arcBolt','shardBurst']){
    const pixels=[];
    const ctx={fillStyle:'#000',save(){},restore(){},translate(){},rotate(){},fillRect(x,y,w,h){pixels.push([x,y,w,h,this.fillStyle]);}};
    drawConstructHazardProjectiles(ctx,{fireballs:[{constructKind:kind,x:20,y:30,vx:1,vy:0}]});
    assert.ok(pixels.length>=3,`${kind} has a multi-pixel projectile silhouette`);
    const ink=new Set(pixels.map(p=>p[4]));assert.ok(ink.size>=2,`${kind} has highlight and base colors`);
    colors.set(kind,Array.from(ink).sort().join('|'));
  }
  assert.equal(new Set(colors.values()).size,colors.size,'each construct projectile has its own color identity');
});

test('fireTrail leaves damaging ember patches while Blaise is moving',()=>{
  const {actor,target,game}=combatFixture('blaise',270);actor.moving=true;
  CREATURE_PACK.tickActor(game,actor,.1,[target]);
  assert.equal(game.firePatches.length,1);
  assert.ok(game.firePatches[0].damage>=2);
  assert.ok(game.effects.some(f=>f.particle==='cinder-trail'));
});

test('curse roots a struck target and emits a purple curse pulse',()=>{
  const {target,game}=resolve('voodoo_doll',44);
  assert.ok(target.hp<300);assert.ok(target.rooted>=1.3);
  assert.ok(game.effects.some(f=>f.particle==='purple-aura'));
});

test('gargoyle dive dashes toward a warned target and deals impact damage',()=>{
  const {actor,target,game}=resolve('gargoyle',100);
  assert.ok(actor.x>0,'dive closes distance instead of being a stationary hit');
  assert.ok(target.hp<300);assert.ok(game.effects.some(f=>f.color==='#d5a783'));
});

test('ogre clubSlam damages and knocks back nearby targets',()=>{
  const {actor,target,game}=resolve('ogre',58),before=58;
  assert.ok(target.hp<300);assert.ok(target.x>before,'area slam pushes its target');
  assert.ok(game.effects.some(f=>f.particle==='rock-fragments'));
});

test('Jimothy feint repositions before its counterstrike',()=>{
  const {actor,target,game}=resolve('jimothy',47);
  assert.ok(Math.abs(actor.y)>0,'feint moves laterally');assert.ok(target.hp<300);
  assert.ok(game.effects.some(f=>f.color==='#c8d9c5'));
});

test('broom sweep pushes targets and forest rootSnare applies a real root',()=>{
  const broom=resolve('enchanted_broom',50);
  assert.ok(broom.target.hp<300);assert.ok(broom.target.x>50);
  assert.ok(broom.game.effects.some(f=>f.color==='#dfb371'));
  const roots=resolve('forest_golem',55);
  assert.ok(roots.target.hp<300);assert.ok(roots.target.rooted>=1.6);
  assert.ok(roots.game.effects.some(f=>f.color==='#9ad86d'));
});
