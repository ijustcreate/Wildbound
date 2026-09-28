import test from "node:test";
import assert from "node:assert/strict";
import { ITEMS, SAFARI_HUNTER_SET, freshCharacter, give, equip, fitsSlot, count, itemStats } from "../src/items.mjs";
import { equipmentAttack, equipmentLights, safariHunterLoadout } from "../src/equipment-runtime.mjs";
import { tryEquipmentAttack, tickNightEquipment, applyTorchHit, drawNightEquipment } from "../src/night-equipment.mjs";
import { directionalHelmet } from "../src/wearable-art.mjs";

function actor(id = 1) { return { ...freshCharacter(id, "Scout"), x: 100, y: 100, hp: 100, faceX: 1, faceY: 0, attack: 0 }; }
function game(p) { return { phase: "play", players: [p], enemies: [], scenery: [], terrain: Array(2500).fill("snow"), projectileBlocked: () => false, hurt: (t, n) => { t.hp -= n; } }; }
function rifle(p) { p.equipment = safariHunterLoadout(); give(p.inventory, "cartridge", 3); }

test("either-hand utilities, rifle displacement, safari gear and saves", () => {
  const p = actor();
  for (const id of ["lantern", "torch"]) for (const hand of ["hand1", "hand2"]) assert.ok(fitsSlot(id, hand));
  give(p.inventory, "lantern"); equip(p, p.inventory.findIndex(i => i?.type === "lantern"), "hand2");
  give(p.inventory, "rifle"); equip(p, p.inventory.findIndex(i => i?.type === "rifle"));
  assert.equal(p.equipment.hand2, "occupied"); assert.equal(count(p, "lantern"), 1);
  assert.equal(fitsSlot("rifle", "hand2"), false);
  for (const [slot, id] of Object.entries(SAFARI_HUNTER_SET)) {
    give(p.inventory, id); assert.ok(equip(p, p.inventory.findIndex(i => i?.type === id), slot));
  }
  assert.deepEqual(JSON.parse(JSON.stringify(p)).equipment, p.equipment);
  assert.match(itemStats("lantern"), /Damage 0/);
});
test("lantern consumes utility attacks without damage and exposes either-hand lights", () => {
  const p = actor(), g = game(p); p.equipment.hand2 = "lantern";
  assert.equal(equipmentAttack(p).damage, 0); assert.equal(tryEquipmentAttack(g, p, 1), true);
  assert.equal(p.attack, 0); assert.equal(g.rifleShots, undefined);
  assert.equal(equipmentLights(p, { hand2: { x: 3, y: 4 } })[0].x, 3);
  p.equipment.hand1 = "sword"; assert.equal(tryEquipmentAttack(g, p, 1), false);
  p.hp = 0; assert.deepEqual(equipmentLights(p), []);
});
test("rifle requires aim and ammo, reloads, hits nearest enemy, credits player", () => {
  const p = actor(), g = game(p); rifle(p);
  const near = { id: 2, x: 180, y: 100, hp: 100 }, far = { id: 3, x: 250, y: 100, hp: 100 };
  g.enemies = [far, near];
  tryEquipmentAttack(g, p, 0.2); assert.equal(count(p, "cartridge"), 3);
  tryEquipmentAttack(g, p, 0.6); assert.equal(count(p, "cartridge"), 2);
  assert.equal(g.noises[0].kind, "rifle");
  p.attack = 0; tryEquipmentAttack(g, p, 1); assert.equal(count(p, "cartridge"), 2);
  tickNightEquipment(g, 0.5); assert.equal(near.hp, 64); assert.equal(far.hp, 100); assert.equal(near.killedBy, p.id);
  assert.equal(near.flash, 0.2);
  tickNightEquipment(g, 0.7); tryEquipmentAttack(g, p, 1); assert.equal(count(p, "cartridge"), 1);
});
test("rifle microsteps stop at thin obstacles even with a long frame", () => {
  const p = actor(), g = game(p); rifle(p);
  const e = { x: 210, y: 100, hp: 100 }; g.enemies = [e];
  let checks = 0; g.projectileBlocked = x => { checks++; return x >= 150 && x <= 155; };
  tryEquipmentAttack(g, p, 1); tickNightEquipment(g, 1);
  assert.equal(e.hp, 100); assert.equal(g.rifleShots.length, 0); assert.ok(checks > 8);
});
test("hunter rifle targets players and cannot fire empty, dead or in lobby", () => {
  const p = actor(), hunter = actor(8), g = game(p); rifle(hunter);
  hunter.x = 40; g.enemies = [hunter];
  tryEquipmentAttack(g, hunter, 1); tickNightEquipment(g, 0.2); assert.equal(p.hp, 64);
  hunter.attack = 0; hunter.rifleReload = 0; hunter.inventory = [];
  tryEquipmentAttack(g, hunter, 1); assert.equal(g.rifleShots.length, 0);
  give(hunter.inventory, "cartridge", 1); hunter.hp = 0; tryEquipmentAttack(g, hunter, 1);
  assert.equal(count(hunter, "cartridge"), 1);
  hunter.hp = 100; g.phase = "lobby"; tryEquipmentAttack(g, hunter, 1); assert.equal(count(hunter, "cartridge"), 1);
});
test("torch burns enemies and scenery, fells trees, and melts ice", () => {
  const p = actor(), g = game(p); p.equipment.hand2 = "torch";
  const enemy = { hp: 100 }; assert.ok(applyTorchHit(g, p, enemy)); assert.equal(enemy.burning, 3);
  const tree = { x: 100, y: 100, kind: "tree", size: 64 }; g.scenery.push(tree);
  assert.ok(applyTorchHit(g, p, tree));
  const ice = { x: 300, y: 100, kind: "ice_spire", size: 32 }; g.scenery.push(ice);
  const tile = 3 * 50 + 3; g.terrain[tile] = "ice";
  tickNightEquipment(g, 3); assert.ok(tree.falling); assert.equal(g.terrain[tile], "shallow");
  assert.ok(applyTorchHit(g, p, ice)); assert.ok(ice.melted); assert.equal(ice.depleted, true);
  assert.equal(g.scenery.includes(ice), false); assert.ok(g.terrainRevision > 0);
  assert.equal(ITEMS.torch.damage < ITEMS.dagger.damage, true);
  assert.throws(() => tickNightEquipment(g, NaN), RangeError);
});
test("tree burn persists on falling transition, never on every burn frame", () => {
  const p = actor(), g = game(p); p.equipment.hand1 = "torch";
  const tree = { x: 200, y: 200, kind: "tree", size: 64 }; g.scenery.push(tree);
  let saves = 0; g.persist = () => saves++;
  applyTorchHit(g, p, tree);
  for (let i = 0; i < 10; i++) tickNightEquipment(g, 0.1);
  assert.equal(saves, 0);
  tickNightEquipment(g, 2); assert.equal(saves, 1); assert.ok(tree.falling);
  tickNightEquipment(g, 1); assert.equal(saves, 1);
});
test("world drawing restores context and safari helmet supports eight facings", () => {
  const p = actor(), g = game(p); p.equipment.hand1 = "lantern";
  g.scenery.push({kind:'tree',x:240,y:200,size:64,torchBurn:2});
  let depth = 0, rectangles = 0;
  const c = { save() { depth++; }, restore() { depth--; }, fillRect() { rectangles++; }, createRadialGradient() { return { addColorStop() {} }; }, beginPath() {}, moveTo() {}, lineTo() {}, stroke() {} };
  drawNightEquipment(c, g); assert.equal(depth, 0); assert.ok(rectangles);
  for (let d = 0; d < 8; d++) assert.equal(directionalHelmet(c, "safari_hat", { x: 0, y: 0 }, d), true);
});
