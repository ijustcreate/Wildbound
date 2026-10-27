import test from 'node:test';
import assert from 'node:assert/strict';
import {Game} from '../src/core.mjs';
import {saveSession, restoreSession} from '../src/session.mjs';
import {propBase, tickEnvironment} from '../src/environment.mjs';
import {
  WALL_SECTION_SIZE, DESTRUCTION_PARTICLE_LIMIT, damageStructureMelee,
  damageStructureProjectile, sectionBlocked, stampedeDestruction,
  tickDestruction, destructionStats, drawBreakable,
} from '../src/structure-destruction.mjs';

function setup() {
  const g = new Game(() => .5);
  const p = g.addPlayer('keyboard');
  g.start();
  Object.assign(g, {phase: 'play', openingBoard: false, scenery: [], enemies: [],
    loot: [], weather: null, generatedEnvironment: 'house',
    house: {walls: [], doors: [], furniture: [], floors: [], pools: [],
      featuresVersion: 1, lightingVersion: 1}});
  g.terrain.fill('grass');
  Object.assign(p, {x: 300, y: 340, faceX: 1, faceY: 0,
    equipment: {hand1: 'sword'}, attack: 0, mana: 100});
  return {g, p};
}

const wall = (extra = {}) => ({kind: 'wall', x: 340, y: 280, w: 40, h: 120, ...extra});
const bolt = (extra = {}) => ({x: 360, y: 340, vx: 260, vy: 0,
  size: 6, damage: 110, structureCharge: .5, ...extra});

test('40-pixel sections accumulate sparse damage and invalidate collision only on breaking', () => {
  assert.equal(WALL_SECTION_SIZE, 40);
  const {g} = setup(), b = wall();
  g.house.walls.push(b);
  assert.equal(damageStructureProjectile(g, bolt({damage: 35})), true);
  assert.deepEqual(b.sectionDamage, {1: {damage: 35, broken: false}});
  assert.equal(g.house.destructionRevision || 0, 0);
  assert.equal(sectionBlocked(b, 360, 340, 8), true);
  assert.equal(damageStructureProjectile(g, bolt({damage: 165})), true);
  assert.equal(g.house.destructionRevision, 1);
  assert.equal(sectionBlocked(b, 360, 340, 8), false);
  assert.equal(sectionBlocked(b, 360, 300, 8), true);
  assert.equal(sectionBlocked(b, 360, 380, 8), true);
  assert.equal(sectionBlocked(b, 360, 322, 8), true, 'body still overlaps the intact cell above the gap');
  assert.equal(b.destroyed || false, false);
  const before = JSON.stringify(b), particles = destructionStats(g).particles;
  assert.equal(damageStructureProjectile(g, bolt()), false);
  assert.equal(JSON.stringify(b), before);
  assert.equal(destructionStats(g).particles, particles);
});
test('A window shatters in one hit and does not accept a second hit',()=>{
 const {g}=setup(),sounds=[];g.onSound=cue=>sounds.push(cue);
 g.house.walls.push(wall({kind:'window'}));
 assert.equal(damageStructureProjectile(g,bolt({damage:10})),true);
 g.time=.01;assert.equal(damageStructureProjectile(g,bolt({damage:20})),false);
 assert.deepEqual(sounds,['glassBreak']);
});
test('One sword strike shatters an overlapping window without also damaging its wall',()=>{
 const {g,p}=setup(),pane=wall({kind:'window'}),backing=wall();g.house.walls.push(backing,pane);
 g.attack(p);for(let i=0;i<6;i++)g.update(.02,{});assert.equal(pane.sectionDamage[1].broken,true);assert.equal(backing.sectionDamage,undefined);
});

test('the final partial-width cell must break before the entire asset is destroyed', () => {
  const {g} = setup(), b = wall({w: 95, h: 20});
  g.house.walls.push(b);
  for (const x of [360, 400]) assert.equal(damageStructureProjectile(g, bolt({x, y: 290,damage:200})), true);
  assert.equal(b.destroyed || false, false);
  assert.equal(sectionBlocked(b, 427, 290, 2), true);
  assert.equal(damageStructureProjectile(g, bolt({x: 427, y: 290,damage:200})), true);
  assert.equal(b.destroyed, true);
  assert.equal(Object.keys(b.sectionDamage).length, 3);
  assert.equal(g.house.destructionRevision, 3);
  assert.equal(sectionBlocked(b, 427, 290, 2), false);
});

test('melee strikes the nearest exposed cell and respects facing and intervening walls', () => {
  const {g, p} = setup(), front = wall(), behind = wall({x: 380});
  g.house.walls.push(front, behind);
  p.faceX = -1;
  assert.equal(damageStructureMelee(g, p, 20, 100), false);
  p.faceX = 1;
  assert.equal(damageStructureMelee(g, p, 20, 100), true);
  assert.deepEqual(front.sectionDamage, {1: {damage: 20, broken: false}});
  assert.equal(behind.sectionDamage, undefined);
  assert.equal(damageStructureProjectile(g, bolt({damage: 180})), true);
  assert.equal(sectionBlocked(front, 360, 340, 8), false);
  p.y = 300;
  assert.equal(damageStructureMelee(g, p, 20, 100), true);
  assert.equal(front.sectionDamage[0].damage, 20);
  assert.equal(behind.sectionDamage, undefined, 'intact neighboring section still shields the rear wall');
});

test('spin can hit behind the actor, while open doors and decorative furniture are exempt', () => {
  const {g, p} = setup(), b = wall({x: 240});
  g.house.walls.push(b);
  assert.equal(damageStructureMelee(g, p, 20, 70, false), false);
  assert.equal(damageStructureMelee(g, p, 20, 70, true), true);
  const door = wall({kind: 'door', open: true}), rug = wall({kind: 'rug'}), plant = wall({kind: 'plant'});
  g.house.doors.push(door);
  g.house.furniture.push(rug, plant);
  assert.equal(damageStructureProjectile(g, bolt()), false);
  for (const prop of [door, rug, plant]) assert.equal(prop.sectionDamage, undefined);
});

test('uncharged and charged healing/friendship projectiles leave damage, collision and debris untouched', () => {
  for (const extra of [{structureCharge: undefined}, {structureCharge: 0},
    {structureCharge: .499}, {structureCharge: 1, healing: true},
    {structureCharge: 1, friendship: true}]) {
    const {g} = setup(), b = wall();
    g.house.walls.push(b);
    assert.equal(damageStructureProjectile(g, bolt(extra)), false, JSON.stringify(extra));
    assert.equal(b.sectionDamage, undefined);
    assert.equal(g.house.destructionRevision || 0, 0);
    assert.equal(destructionStats(g).particles, 0);
  }
});

test('ordinary Game sword attacks create a local passable gap with solid neighbors', () => {
  const {g, p} = setup(), b = wall();
  g.house.walls.push(b);
  assert.equal(g.projectileBlocked(360, 340, 8), true);
  g.attack(p);for(let i=0;i<6;i++)g.update(.02,{});
  assert.ok(b.sectionDamage?.[1]?.damage > 0, 'normal attack must reach structure damage');
  assert.equal(b.sectionDamage[1].broken, false);
  for (let n = 0; n < 20 && !b.sectionDamage[1].broken; n++) {
    p.attack = 0;
    g.time += 1;
    g.attack(p);for(let i=0;i<6;i++)g.update(.02,{});
  }
  assert.equal(b.sectionDamage[1].broken, true);
  assert.equal(g.blocked(360, 340, 8, false, false, false, 0), false);
  assert.equal(g.projectileBlocked(360, 340, 8), false);
  for (const y of [300, 380]) {
    assert.equal(g.blocked(360, y, 8, false, false, false, 0), true);
    assert.equal(g.projectileBlocked(360, y, 8), true);
  }
  assert.deepEqual(Object.keys(b.sectionDamage), ['1']);
});
test('walls take ten melee strikes, fences/decor take five, and cracks appear at the requested hit counts',()=>{
 const hit=(g,b)=>damageStructureMelee(g,{x:300,y:340,faceX:1,faceY:0},80,100);
 const {g,p}=setup(),b=wall();g.house.walls.push(b);
 for(let n=1;n<=2;n++){assert.equal(hit(g,b),true);assert.equal(b.sectionDamage[1].broken,false);}
 assert.equal(b.sectionDamage[1].damage,40);
 for(let n=3;n<=9;n++)hit(g,b);assert.equal(b.sectionDamage[1].broken,false);
 hit(g,b);assert.equal(b.sectionDamage[1].damage,200);assert.equal(b.sectionDamage[1].broken,true);
 for(const prop of [{kind:'fence',x:340,y:280,w:40,h:16,destructionGroup:'walls'},{kind:'table',x:340,y:280,w:40,h:16,destructionGroup:'furniture'}]){
  const q=setup(),item=prop.kind==='table'?q.g.house.furniture:q.g.house.walls;item.push({...prop});const target=item[0];
  for(let n=1;n<=4;n++){assert.equal(damageStructureMelee(q.g,{...p,x:300,y:340,faceX:1,faceY:0},60,100),true);assert.equal(target.sectionDamage[0].broken,false);}
  damageStructureMelee(q.g,{...p,x:300,y:340,faceX:1,faceY:0},60,100);assert.equal(target.sectionDamage[0].damage,100);assert.equal(target.sectionDamage[0].broken,true);
 }
});
test('Wall cracks appear on hit three; fence and furniture cracks appear on hit two',()=>{
 const crackCount=b=>{let paths=0;const c=new Proxy({},{get:(_t,k)=>k==='beginPath'?()=>paths++:(()=>{}),set:()=>true});drawBreakable(c,{house:{temple:false}},b,()=>{});return paths;};
 for(const [prop,threshold]of [[wall(),3],[{kind:'fence',x:340,y:280,w:40,h:16},2],[{kind:'chair',x:340,y:280,w:40,h:16},2]]){
  const {g}=setup(),target={...prop};(target.kind==='chair'?g.house.furniture:g.house.walls).push(target);
  for(let n=1;n<threshold;n++){damageStructureMelee(g,{x:300,y:340,faceX:1,faceY:0},20,100);assert.equal(crackCount(target),1,target.kind+' should not crack yet');}
  damageStructureMelee(g,{x:300,y:340,faceX:1,faceY:0},20,100);assert.equal(crackCount(target),2,target.kind+' should show cracks at hit '+threshold);
 }
});

test('real charged Game bolts damage walls; uncharged, healing and friendship casts do not', () => {
  for (const [item, charge, damaging] of [['wand', 1.2, true], ['wand', 0, false],
    ['healing_wand', 1.2, false], ['friendship_wand', 1.2, false]]) {
    const {g, p} = setup();
    p.equipment.hand1 = item;
    assert.equal(g.fireSpell(p, charge), true, item);
    const shot = g.spells[0];
    assert.ok(shot, item + ' must produce a real bolt');
    if (damaging) assert.ok(shot.structureCharge >= .5, 'cast must retain charge for impacts');
    const b = wall({x: shot.x + 30, y: shot.y - 20, w: 20, h: 40});
    g.house.walls.push(b);
    g.tickAdventure(.25, {});
    assert.equal(g.spells.length, 0, item + ' should hit the wall');
    if (damaging) assert.ok(b.sectionDamage?.[0]?.damage > 0, 'charged bolt impact must damage wall');
    else {
      assert.equal(b.sectionDamage, undefined, item + ' charge=' + charge);
      assert.equal(g.house.destructionRevision || 0, 0);
    }
  }
});

test('session JSON round trips retain cracks and gaps, resume damage, and omit cosmetic debris', () => {
  const {g} = setup(), b = wall();
  g.house.walls.push(b);
  damageStructureProjectile(g, bolt({damage:200}));
  damageStructureProjectile(g, bolt({y: 380, damage: 45}));
  assert.ok(destructionStats(g).particles > 0);
  const saved = JSON.parse(JSON.stringify(saveSession(g)));
  assert.deepEqual(saved.state.house.walls[0].sectionDamage, {
    1: {damage: 200, broken: true}, 2: {damage: 45, broken: false},
  });
  const loaded = restoreSession(saved), restored = loaded.house.walls[0];
  assert.equal(destructionStats(loaded).particles, 0);
  assert.equal(sectionBlocked(restored, 360, 340, 8), false);
  assert.equal(sectionBlocked(restored, 360, 380, 8), true);
  assert.equal(damageStructureProjectile(loaded, bolt({y: 380, damage: 155})), true);
  assert.equal(restored.sectionDamage[2].broken, true);
  assert.equal(loaded.house.destructionRevision, 2);
  assert.equal(restored.sectionDamage[0], undefined);
  assert.equal(b.sectionDamage[2].damage, 45, 'restored damage must not mutate original game');
});

test('swept stampedes destroy structures between endpoints and repeating a pass is idempotent', () => {
  const {g} = setup(), b = wall({x: 400, y: 330, w: 20, h: 20});
  g.house.walls.push(b);
  let saves = 0;
  g.persist = () => saves++;
  const runner = {kind: 'rhino', x: 520, y: 340}, from = {x: 300, y: 340};
  stampedeDestruction(g, runner, from);
  assert.equal(b.destroyed, true, 'collision must be swept across the whole route');
  const revision = g.house.destructionRevision, particles = destructionStats(g).particles;
  stampedeDestruction(g, runner, from);
  assert.equal(g.house.destructionRevision, revision);
  assert.equal(destructionStats(g).particles, particles);
  assert.equal(saves, 0);
  tickDestruction(g, 0);
  assert.equal(saves, 1, 'multiple impacts persist once at the end of the step');
  stampedeDestruction(g, runner, from);
  tickDestruction(g, 0);
  assert.equal(saves, 1, 'unchanged passes must not request another save');
});

test('repeated stampedes do not restart tree falls or duplicate the eventual logs', () => {
  const {g} = setup(), tree = {kind: 'tree', x: 420, y: 300, size: 64};
  g.scenery.push(tree);
  const base = propBase(tree), runner = {kind: 'elephant', x: base.x + 90, y: base.y},
    from = {x: base.x - 90, y: base.y};
  stampedeDestruction(g, runner, from);
  assert.ok(tree.falling > 0);
  tickEnvironment(g, .6);
  const falling = tree.falling, direction = tree.fallDirection, logs = tree.logCount;
  stampedeDestruction(g, {...runner, x: from.x}, runner);
  assert.equal(tree.falling, falling);
  assert.equal(tree.fallDirection, direction);
  assert.equal(tree.logCount, logs);
  tickEnvironment(g, .65);
  assert.equal(tree.depleted, true);
  assert.equal(g.loot.filter(l => l.type === 'log').reduce((n, l) => n + l.qty, 0), logs);
  tickEnvironment(g, .4);
  assert.equal(tree.fallen, true);
  const drops = JSON.stringify(g.loot);
  stampedeDestruction(g, runner, from);
  tickEnvironment(g, 2);
  assert.equal(tree.falling, 0);
  assert.equal(JSON.stringify(g.loot), drops);
});

test('airborne stampede creatures leave trees and structures untouched', () => {
  const {g} = setup(), b = wall(), tree = {kind: 'tree', x: 360, y: 317.6, size: 64};
  g.house.walls.push(b);
  g.scenery.push(tree);
  stampedeDestruction(g, {kind: 'bird', x: 450, y: 340}, {x: 280, y: 340});
  assert.equal(b.sectionDamage, undefined);
  assert.equal(tree.falling, undefined);
  assert.equal(destructionStats(g).particles, 0);
});

test('many distinct impacts cap debris at 160 without skipping damage, and expired debris frees capacity', () => {
  assert.equal(DESTRUCTION_PARTICLE_LIMIT, 160);
  const {g} = setup();
  for (let n = 0; n < 80; n++) g.house.walls.push(wall({x: 100 + n * 12, y: 200, w: 8, h: 8}));
  for (const b of g.house.walls) {
    assert.equal(damageStructureProjectile(g, bolt({x: b.x + 4, y: 204, size: 2,damage:200})), true);
    assert.equal(b.destroyed, true);
    assert.ok(destructionStats(g).particles <= 160);
  }
  assert.equal(destructionStats(g).particles,160);
  assert.equal(destructionStats(g).particleLimit,160);
  assert.ok(destructionStats(g).rasterBytes<=destructionStats(g).rasterByteLimit);
  assert.equal(g.house.destructionRevision, 80);
  tickDestruction(g, 2);
  assert.equal(destructionStats(g).particles, 0);
  const fresh = wall();
  g.house.walls.push(fresh);
  assert.equal(damageStructureProjectile(g, bolt({damage:200})), true);
  assert.ok(destructionStats(g).particles > 0);
});

test('headless breakable rendering clips surviving cells and omits the broken section', () => {
  const {g} = setup(), b = wall();
  g.house.walls.push(b);
  damageStructureProjectile(g, bolt({damage:200}));
  const rectangles = [], painted = [], debris = [];
  let current;
  const c = {save() {}, restore() {}, beginPath() {}, clip() {},
    rect(...r) { current = r; rectangles.push(r); },
    fillRect(...r) { debris.push(r); }};
  drawBreakable(c, g, b, (context, asset) => {
    assert.equal(asset, b);
    assert.equal(context, c);
    painted.push(current);
  });
  assert.deepEqual(rectangles, [[340, 280, 40, 40], [340, 360, 40, 40]]);
  assert.equal(painted.length,1,'one clipped source draw covers every surviving cell');
  assert.ok(debris.length > 0, 'broken cells retain rubble rendering');
});
