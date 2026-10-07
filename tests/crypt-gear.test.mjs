import test from 'node:test';
import assert from 'node:assert/strict';
import { ITEMS, freshCharacter, equip, unequip, give, fitsSlot, itemKind, itemStats, stat, rollGear } from '../src/items.mjs';
import { paintItem, ITEM_ART_TYPES } from '../src/item-art.mjs';
import { flamingMeleeHit, igniteSwordTree, onFlamingHarvest, tickFlamingTrees, drawCryptWeaponFlames, cryptSwordTip, registerCryptGearArt, CRYPT_FLAME_LIMITS } from '../src/crypt-gear.mjs';
import { damageEnemy } from '../src/enemy-damage.mjs';
import { initHazards, tickHazards } from '../src/hazards.mjs';
import { harvest, tickEnvironment, propBase } from '../src/environment.mjs';
import { treeFallPose } from '../src/forest.mjs';
import { defaultPlayerMotion, drawPlayer, directionVector, playerPose, projectPoint, playerEquipmentAction, playerJointAngle } from '../src/player-motion.mjs';
import { buildHeroGeneration } from '../src/hero-generation.mjs';
import { buildCombatPass, combatWeaponVector } from '../src/combat-animation.mjs';

const hero = () => ({ ...freshCharacter(1, 'Crypt scout'), inventory: [], equipment: {}, x: 100, y: 100, faceX: 1, faceY: 0, hp: 100, attack: 0.34 });
function world(p = hero()) {
  const g = { phase: 'play', time: 0, players: [p], enemies: [], ghosts: [], scenery: [], loot: [], effects: [],
    terrain: Array(2500).fill('grass'), house: { walls: [], doors: [], furniture: [], pools: [] },
    projectileBlocked: () => false, blocked: () => false, onSound() {}, persist() { this.saves = (this.saves || 0) + 1; },
    dropLoot(x, y, type, qty, source) { this.loot.push({ x, y, type, qty, source }); }, hurt(t, damage) { t.hp -= damage; } };
  initHazards(g);
  return g;
}
function foe(g, props = {}) {
  const e = { id: 2, kind: 'skeleton', x: 140, y: 100, hp: 300, maxHp: 300, ...props };
  g.enemies.push(e); return e;
}
const tree = (props = {}) => ({ kind: 'tree', x: 140, y: 90, size: 96, rootY: 114, ...props });

test('crypt boss gear uses normal sword/shield slots, effective stats, tooltips and exclusive loot', () => {
  assert.equal(itemKind('coffin_lid_shield'), 'shield'); assert.equal(itemKind('crypt_flame_sword'), 'sword');
  assert.equal(fitsSlot('coffin_lid_shield', 'hand2'), true); assert.equal(fitsSlot('coffin_lid_shield', 'hand1'), false);
  for (const slot of ['hand1', 'hand2']) assert.equal(fitsSlot('crypt_flame_sword', slot), true);
  const p = hero(); give(p.inventory, 'crypt_flame_sword'); give(p.inventory, 'coffin_lid_shield');
  assert.ok(equip(p, 0)); assert.ok(equip(p, 1));
  assert.equal(stat(p, 'armor'), 8); assert.equal(p.maxHp, 110); assert.equal(p.hp, 100);
  assert.match(itemStats('crypt_flame_sword'), /Damage 32.*Burn 3.*2 sec.*trees/);
  assert.match(itemStats('coffin_lid_shield'), /Armor \+8.*Health \+10/);
  for (const id of ['coffin_lid_shield', 'crypt_flame_sword']) {
    assert.equal(ITEMS[id].rarity, 'unique'); assert.equal(ITEMS[id].bossOnly, true); assert.equal(ITEMS[id].stack, 1);
    assert.match(ITEMS[id].description, /crypt boss/); assert.match(ITEMS[id].description, /enemies.*trees/);
  }
  for (const tier of ['common', 'rare', 'unique']) for (let n = 0; n < 1000; n++) {
    let call = 0; const id = rollGear(() => ++call === 1 ? 0.99 : n / 1000, tier);
    assert.ok(!id.startsWith('caught_')); assert.ok(!['coffin_lid_shield', 'crypt_flame_sword'].includes(id));
  }
  assert.equal(ITEMS.crypt_flame_sword.fire, undefined, 'sword must not enable torch light-fire or melting');
});

test('offhand/full-pack swaps retain displaced equipment and sockets atomically', () => {
  const p = hero(); p.equipment = { hand1: 'crypt_flame_sword', hand2: 'coffin_lid_shield' };
  p.equipmentSockets = { hand1: ['azure_bead'], hand2: ['starheart'] };
  p.inventory = Array.from({ length: 24 }, () => ({ type: 'sword', qty: 1 }));
  const before = structuredClone(p);
  assert.equal(unequip(p, 'hand2'), false); assert.deepEqual(p, before);
  p.inventory[0] = { type: 'bow', qty: 1 }; const bowBefore = structuredClone(p);
  assert.equal(equip(p, 0), false, 'two displaced hands need two slots'); assert.deepEqual(p, bowBefore);
  p.inventory[1] = null;
  assert.ok(equip(p, 0)); assert.equal(p.equipment.hand2, 'occupied');
  assert.deepEqual(p.inventory.find(i => i?.type === 'coffin_lid_shield').sockets, ['starheart']);
  assert.deepEqual(p.inventory.find(i => i?.type === 'crypt_flame_sword').sockets, ['azure_bead']);
  assert.ok(equip(p, p.inventory.findIndex(i => i?.type === 'coffin_lid_shield')));
  assert.equal(p.equipment.hand2, 'coffin_lid_shield'); assert.equal(p.inventory.filter(i => i?.type === 'bow').length, 1);
  assert.ok(equip(p, p.inventory.findIndex(i => i?.type === 'crypt_flame_sword'), 'hand1'));
  assert.deepEqual(p.equipmentSockets.hand1, ['azure_bead']); assert.deepEqual(p.equipmentSockets.hand2, ['starheart']);
  const q = hero(); give(q.inventory, 'crypt_flame_sword'); assert.ok(equip(q, 0, 'hand2')); assert.equal(q.equipment.hand2, 'crypt_flame_sword');
});

test('caught crypt critters stack like caught items and default to canonical empty_jar', () => {
  const p = hero();
  for (const [id, name] of [['caught_grave_moth', 'Grave moth'], ['caught_crypt_beetle', 'Crypt beetle']]) {
    assert.equal(ITEMS[id].name, name); assert.equal(ITEMS[id].stack, ITEMS.caught_frog.stack);
    assert.equal(ITEMS[id].captureContainer, 'empty_jar'); assert.equal(ITEMS[id].slot, undefined);
    give(p.inventory, id, 2); give(p.inventory, id, 3);
    assert.equal(p.inventory.find(i => i?.type === id).qty, 5);
    assert.equal(p.inventory.find(i => i?.type === id).captureContainer, 'empty_jar');
    give(p.inventory, id, 1, 24, { captureContainer: 'critter_cage' });
    assert.equal(p.inventory.filter(i => i?.type === id).length, 2, 'actual capture container stays attached');
  }
  assert.equal(ITEMS.empty_bottle, undefined);
});

test('landed melee applies a bounded burn to the struck enemy alone, hazards owns damage', () => {
  const p = hero(), g = world(p); p.equipment.hand1 = 'crypt_flame_sword';
  const e = foe(g), neighbor = foe(g, { id: 3, x: 145 });
  damageEnemy(e, ITEMS.crypt_flame_sword.damage);
  assert.ok(flamingMeleeHit(g, p, e)); assert.equal(e.hp, 268, 'hook adds no immediate/global damage');
  assert.equal(e.burning, 2); assert.equal(e.burnDamage, 3); assert.equal(e.killedBy, p.id);
  for (let n = 0; n < 100; n++) flamingMeleeHit(g, p, e);
  assert.equal(e.burning, 2); assert.equal(e.burnDamage, 3); assert.equal(e.burnTick, 0.5);
  assert.equal(neighbor.burning, undefined); assert.deepEqual(g.firePatches, []);
  for (let n = 0; n < 4; n++) tickHazards(g, 0.5);
  assert.equal(e.hp, 256); assert.equal(e.burning, 0); assert.equal(neighbor.hp, 300);
  tickHazards(g, 20); assert.equal(e.hp, 256); assert.deepEqual(g.firePatches, []);
  assert.ok(ITEMS.crypt_flame_sword.damage + 4 * e.burnDamage <= ITEMS.sun_blade.damage);
});

test('misses, unequipped swords, inactive attacks, blockers, allies and players cannot ignite', () => {
  for (const setup of [
    (g,p,e) => { p.equipment.hand1 = 'sword'; give(p.inventory, 'crypt_flame_sword'); },
    (g,p,e) => { e.x = 900; }, (g,p,e) => { e.x = 60; }, (g,p,e) => { p.attack = 0; },
    (g,p,e) => { p.hp = 0; }, (g,p,e) => { e.hp = 0; }, (g,p,e) => { e.room = 1; },
    (g,p,e) => { p.room = 1; }, (g,p,e) => { e.faction = 'ally'; }, (g,p,e) => { e.practiceTarget = true; },
    (g,p,e) => { g.players.push(e); }, (g,p,e) => { g.enemies = []; },
    (g,p,e) => { p.equipment.hand2 = 'fire_wand'; }, (g,p,e) => { g.projectileBlocked = () => true; },
  ]) {
    const p = hero(), g = world(p); p.equipment.hand1 = 'crypt_flame_sword'; const e = foe(g); setup(g,p,e);
    const hp = e.hp; assert.equal(flamingMeleeHit(g,p,e), false); assert.equal(e.burning, undefined); assert.equal(e.hp, hp);
    assert.deepEqual(g.firePatches, []); assert.deepEqual(g.fireParticles, []);
  }
  const p = hero(), g = world(p); p.equipment.hand2 = 'crypt_flame_sword'; const e = foe(g);
  damageEnemy(e, 32); assert.equal(flamingMeleeHit(g,p,e), false); assert.ok(flamingMeleeHit(g,p,e,'hand2'));
  assert.equal(flamingMeleeHit(g,p,e,'head'), false);
  p.equipment.hand1 = 'staff'; p.mana = 0;
  assert.ok(flamingMeleeHit(g,p,e,'hand2'), 'staff melee fallback still contributes offhand sword damage');
  p.equipment.hand1 = 'crypt_flame_sword';
  for (const slot of ['hand1','hand2']) assert.ok(flamingMeleeHit(g,p,e,slot));
  assert.equal(e.burning,2); assert.equal(e.burnDamage,3, 'two flaming hands share one bounded burn');
});

test('charged sweep and body-edge contacts retain the normal melee geometry', () => {
  const p = hero(), g = world(p); p.equipment.hand1 = 'crypt_flame_sword';
  const edge = foe(g, { x: 179, hitRadius: 6 }); damageEnemy(edge, 32); assert.ok(flamingMeleeHit(g,p,edge));
  const behind = foe(g, { x: 45 }); assert.equal(flamingMeleeHit(g,p,behind), false);
  p.meleeSweep = true; damageEnemy(behind, 32); assert.ok(flamingMeleeHit(g,p,behind));
});

test('successful harvest burns a visible rooted tree then normal environment fells it once', () => {
  const p = hero(), g = world(p); p.equipment.hand1 = 'crypt_flame_sword'; const t = tree(); g.scenery.push(t);
  const root = propBase(t); assert.ok(harvest(g,p,32,76,s => onFlamingHarvest(g,p,s)));
  assert.equal(t.cryptBurn, 6); assert.equal(g.loot.filter(l => l.type === 'log').length, 0);
  tickFlamingTrees(g,0.1); assert.ok(g.fireParticles.some(f => f.cryptTree)); assert.deepEqual(g.firePatches, []);
  for (let n = 0; n < 30 && !t.falling; n++) { g.time += 0.1; tickFlamingTrees(g,0.1); }
  assert.ok(t.falling > 0); assert.equal(t.depleted, undefined); assert.equal(t.cryptBurn, 0);
  assert.equal(treeFallPose(t).cutY, -9); assert.equal(onFlamingHarvest(g,p,t), false);
  tickEnvironment(g,0.6); const pose = treeFallPose(t); assert.ok(pose.angle > 0 && pose.angle < Math.PI / 2);
  tickEnvironment(g,1); assert.ok(t.depleted && t.fallen); assert.deepEqual(propBase(t), root);
  assert.equal(g.loot.filter(l => l.type === 'log').length, 1); assert.equal(g.loot.find(l => l.type === 'log').qty, 3);
  assert.equal(g.loot.find(l => l.type === 'log').manualPickup, true);
  for (let n = 0; n < 100; n++) { tickFlamingTrees(g,1); tickEnvironment(g,1); assert.equal(igniteSwordTree(g,p,t), false); }
  assert.equal(g.loot.filter(l => l.type === 'log').length, 1);
});

test('burning palms and snow trees finish within finite life; rocks and already-felled props stay inert', () => {
  for (const kind of ['tree', 'snow_tree', 'palm']) {
    const p = hero(), g = world(p); p.equipment.hand2 = 'crypt_flame_sword'; const t = tree({ kind, size: 192, coconuts: 2 }); g.scenery.push(t);
    assert.ok(igniteSwordTree(g,p,t)); tickFlamingTrees(g,60); assert.ok(t.falling); assert.equal(t.cryptBurn, 0);
    assert.ok(t.harvest <= 240); assert.ok(t.logCount <= 12); assert.equal(g.loot.length, 0);
    tickEnvironment(g,2); assert.equal(g.loot.filter(l => l.type === 'log').length, 1);
    assert.equal(g.loot.filter(l => l.type === 'coconut').length, kind === 'palm' ? 1 : 0);
  }
  for (const kind of ['leafless_tree','grave_forest_tree']) {
    const cemeteryHero = hero(), cemeteryWorld = world(cemeteryHero), cemeteryTree = tree({kind});
    cemeteryHero.equipment.hand1 = 'crypt_flame_sword'; cemeteryWorld.scenery.push(cemeteryTree);
    assert.ok(onFlamingHarvest(cemeteryWorld,cemeteryHero,cemeteryTree)); tickFlamingTrees(cemeteryWorld,6);
    assert.ok(cemeteryTree.falling); assert.equal(cemeteryTree.cryptBurn,0);
    assert.equal(onFlamingHarvest(cemeteryWorld,cemeteryHero,cemeteryTree),false);
  }
  for (const props of [{ kind:'rock' }, { kind:'frozen_log' }, { depleted:true }, { fallen:true }, { falling:0.5 }]) {
    const p = hero(), g = world(p); p.equipment.hand1 = 'crypt_flame_sword'; const t = tree(props); g.scenery.push(t);
    assert.equal(igniteSwordTree(g,p,t), false); assert.equal(t.cryptBurn, undefined);
  }
  const p = hero(), g = world(p), t = tree(); g.scenery.push(t);
  assert.equal(igniteSwordTree(g,p,t), false); assert.equal(onFlamingHarvest, igniteSwordTree);
});

test('tree life, damage, particles and active-tree work remain bounded through repeats/long frames', () => {
  const p = hero(), g = world(p); p.equipment.hand1 = 'crypt_flame_sword';
  for (let n = 0; n < 80; n++) g.scenery.push(tree({ x: 140+n, size: 256 }));
  for (const t of g.scenery) igniteSwordTree(g,p,t);
  assert.equal(g.scenery.filter(t => t.cryptBurn > 0).length, CRYPT_FLAME_LIMITS.burningTrees);
  const t = g.scenery[0]; for (let n = 0; n < 100; n++) igniteSwordTree(g,p,t);
  assert.equal(t.cryptBurn, 6); assert.ok(t.cryptBurnRate <= 40);
  for (let n = 0; n < 10; n++) tickFlamingTrees(g,0.02);
  assert.ok(g.fireParticles.length <= CRYPT_FLAME_LIMITS.treeParticles); assert.ok(g.fireParticles.every(f => f.life <= 0.55));
  const progress = t.harvest; g.phase = 'paused'; tickFlamingTrees(g,10); assert.equal(t.harvest,progress);
  g.phase = 'play'; tickFlamingTrees(g,1e9); assert.equal(t.cryptBurn,0); assert.ok(t.harvest <= 240); assert.ok(t.falling);
  assert.throws(() => tickFlamingTrees(g,NaN), RangeError); assert.throws(() => tickFlamingTrees(g,-1), RangeError);
});

function canvasSpy() {
  const c = { calls: [], depth: 0, fillStyle: '', matrix:[1,0,0,1,0,0], stack:[],
    save() { this.depth++; this.stack.push({ matrix:[...this.matrix], fillStyle:this.fillStyle }); },
    restore() { this.depth--; Object.assign(this,this.stack.pop()); },
    translate(x,y) { const [a,b,c,d,e,f]=this.matrix; this.matrix=[a,b,c,d,e+a*x+c*y,f+b*x+d*y]; },
    scale(x,y) { const [a,b,c,d,e,f]=this.matrix; this.matrix=[a*x,b*x,c*y,d*y,e,f]; },
    rotate(angle) { const [a,b,c,d,e,f]=this.matrix,cs=Math.cos(angle),sn=Math.sin(angle); this.matrix=[a*cs+c*sn,b*cs+d*sn,-a*sn+c*cs,-b*sn+d*cs,e,f]; },
    fillRect(x,y,w,h) { const [a,b,c,d,e,f]=this.matrix; this.calls.push({x:a*x+c*y+e,y:b*x+d*y+f,w,h,color:this.fillStyle,local:[x,y,w,h]}); } };
  return c;
}

test('four new item icons use distinct bounded native pixel commands with wood/iron and warm steel', () => {
  const art = new Map();
  for (const id of ['coffin_lid_shield','crypt_flame_sword','caught_grave_moth','caught_crypt_beetle']) {
    assert.ok(ITEM_ART_TYPES.includes(id)); const c = canvasSpy(); paintItem(c,id);
    for (const {local:[x,y,w,h]} of c.calls) {
      assert.ok([x,y,w,h].every(Number.isInteger)); assert.ok(w>0 && h>0 && x>=0 && y>=0 && x+w<=24 && y+h<=24);
    }
    const coverage = new Set();
    for (const {local:[x,y,w,h]} of c.calls) for (let yy=y;yy<y+h;yy++) for (let xx=x;xx<x+w;xx++) coverage.add(`${xx},${yy}`);
    assert.ok(coverage.size > 20 && coverage.size < 400); assert.ok(c.calls.length < 400); art.set(id,c.calls);
  }
  assert.equal(new Set([...art.values()].map(v => JSON.stringify(v))).size,4);
  assert.ok(art.get('coffin_lid_shield').some(r => r.color==='#896143'));
  assert.ok(art.get('coffin_lid_shield').some(r => r.color==='#8e9895'));
  assert.ok(art.get('crypt_flame_sword').some(r => r.color==='#d4bea0'));
  assert.ok(art.get('crypt_flame_sword').some(r => r.color==='#af5f34'), 'orange embers retain their shaded pixel ramp');
});

test('coffin shield fits the existing independent offhand renderer in eight views and preserves authored art', () => {
  const model=registerCryptGearArt(defaultPlayerMotion()),p=hero(); p.attack=0; p.equipment.hand2='coffin_lid_shield';
  for (let d=0; d<8; d++) {
    [p.faceX,p.faceY]=directionVector(d); const c=canvasSpy(); drawPlayer(c,p,0,model);
    assert.equal(c.depth,0); assert.ok(c.calls.some(r => r.color==='#352c27'));
    assert.ok(c.calls.some(r => r.color===(d===2||d===6?'#8e9895':d>=3&&d<=5?'#624735':'#896143')));
    const art=model.wearables.coffin_lid_shield[d].pixels; assert.equal(art.length,256);
    assert.ok(art.filter(Boolean).length>=40 && art.filter(Boolean).length<180);
  }
  const custom={pixels:Array(256).fill('#123456'),x:2}; model.wearables.coffin_lid_shield[0]=custom;
  registerCryptGearArt(model); assert.equal(model.wearables.coffin_lid_shield[0],custom);
});

test('analytic sword embers stay on the actual animated blade tip, translate/lift exactly and never accumulate', () => {
  const p=hero(),model=buildCombatPass(buildHeroGeneration(defaultPlayerMotion())); p.equipment={hand1:'crypt_flame_sword',hand2:'coffin_lid_shield'};
  for (let d=0; d<8; d++) for (const action of ['idle','swipe_one','swipe_two','swipe_big','sword_combo']) {
    [p.faceX,p.faceY]=directionVector(d); p.animationAction=action; p.playerFrame=3;
    const time=1.25,tip=cryptSwordTip(p,'hand1',time,model),c=canvasSpy();
    assert.equal(drawCryptWeaponFlames(c,p,time,model),12); assert.equal(c.depth,0);
    assert.ok(c.calls.every(r => r.local.every(Number.isInteger) && r.w<=2 && r.h<=2 && Math.abs(r.x-tip.x)<=5 && r.y<=tip.y+1 && r.y>=tip.y-11));
    if (action!=='idle') {
      const hand=projectPoint(playerPose(p,time,model).handR,d),equipment=playerEquipmentAction(p,time,model);
      const vector=projectPoint(combatWeaponVector(action,equipment.frame/(model.clips[action].length-1),'sword','R'),d);
      const angle=playerJointAngle(p,time,model,d,'handR')*Math.PI/180;
      assert.ok(Math.abs(tip.x-(p.x+(hand.x+vector.x*Math.cos(angle)-vector.y*Math.sin(angle))*43/48))<1e-8);
      assert.ok(Math.abs(tip.y-(p.y+(hand.y+vector.x*Math.sin(angle)+vector.y*Math.cos(angle))*43/48))<1e-8);
    }
    const moved=canvasSpy(); drawCryptWeaponFlames(moved,{...p,x:p.x+40,y:p.y+30,jumpHeight:10},time,model);
    assert.deepEqual(moved.calls.map(r => [r.x-40,r.y-20,r.w,r.h,r.color]),c.calls.map(r => [r.x,r.y,r.w,r.h,r.color]));
  }
  p.animationAction='idle'; p.equipment.hand2='crypt_flame_sword';
  for (let n=0; n<500; n++) { const c=canvasSpy(); assert.equal(drawCryptWeaponFlames(c,p,n*0.07,model),24); }
  assert.equal(p.cryptParticles,undefined);
  for (const props of [{hp:0},{swimming:true},{animationAction:'woodcut'},{attack:0,field:{cosmetics:{stow:true}}},{equipment:{hand1:'sword'}}]) {
    const c=canvasSpy(); assert.equal(drawCryptWeaponFlames(c,{...p,...props},2,model),0); assert.equal(c.calls.length,0);
  }
});
