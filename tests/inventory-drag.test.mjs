import test from "node:test";
import assert from "node:assert/strict";
import { Game } from "../src/core.mjs";
import { equip, give, count, moveInventoryItem, ITEMS } from "../src/items.mjs";
import { saveSession, restoreSession } from "../src/session.mjs";
const setup = () => {
  const g = new Game(() => 0.2);
  const p = g.addPlayer("keyboard");
  g.start();
  g.scenery = [];
  g.terrain.fill("grass");
  p.x = 400;
  p.y = 400;
  return { g, p };
};
test("Swords equip in either hand; incompatible slots reject without modifying items", () => {
  const { p } = setup();
  p.inventory = [
    { type: "sword", qty: 1 },
    { type: "sword", qty: 1 },
  ];
  assert.ok(equip(p, 0));
  assert.ok(equip(p, 1, "hand2"));
  assert.equal(p.equipment.hand1, "sword");
  assert.equal(p.equipment.hand2, "sword");
  p.inventory = [{ type: "hat", qty: 1 }];
  const before = JSON.stringify(p);
  assert.equal(equip(p, 0, "hand2"), false);
  assert.equal(JSON.stringify(p), before);
});
test("Drag swaps hand weapons even with full pack, and unequip fails safely when full", () => {
  const { p } = setup();
  p.equipment.hand1 = "sword";
  p.equipment.hand2 = "dagger";
  p.inventory = Array.from({ length: 24 }, () => ({ type: "hat", qty: 1 }));
  assert.ok(
    moveInventoryItem(
      p,
      null,
      { mode: "gear", slot: "hand1" },
      { mode: "gear", slot: "hand2" },
    ),
  );
  assert.equal(p.equipment.hand2, "sword");
  assert.equal(p.equipment.hand1, "dagger");
  const before = JSON.stringify(p);
  assert.equal(
    moveInventoryItem(
      p,
      null,
      { mode: "gear", slot: "hand2" },
      { mode: "pack", index: 0 },
    ),
    false,
  );
  assert.equal(JSON.stringify(p), before);
});
test("Replacing a two-handed bow returns it once and removes the occupied marker", () => {
  const { p } = setup();
  p.equipment.hand1 = "bow";
  p.equipment.hand2 = "occupied";
  p.inventory = [{ type: "sword", qty: 1 }];
  assert.ok(
    moveInventoryItem(
      p,
      null,
      { mode: "pack", index: 0 },
      { mode: "gear", slot: "hand2" },
    ),
  );
  assert.equal(p.equipment.hand1, null);
  assert.equal(p.equipment.hand2, "sword");
  assert.equal(count(p, "bow"), 1);
});
test("Dragging rearranges pack, merges stacks and moves equipment through chests", () => {
  const { p } = setup(),
    chest = [];
  p.inventory = [
    { type: "sword", qty: 1 },
    { type: "potion", qty: 2 },
    { type: "potion", qty: 3 },
  ];
  assert.ok(
    moveInventoryItem(
      p,
      chest,
      { mode: "pack", index: 1 },
      { mode: "pack", index: 2 },
    ),
  );
  assert.equal(count(p, "potion"), 5);
  assert.equal(p.inventory[1], null);
  assert.equal(p.inventory[2].qty, 5);
  assert.ok(
    moveInventoryItem(
      p,
      chest,
      { mode: "pack", index: 0 },
      { mode: "gear", slot: "hand2" },
    ),
  );
  assert.ok(
    moveInventoryItem(
      p,
      chest,
      { mode: "gear", slot: "hand2" },
      { mode: "chest", index: 0 },
    ),
  );
  assert.equal(chest[0].type, "sword");
  assert.ok(
    moveInventoryItem(
      p,
      chest,
      { mode: "chest", index: 0 },
      { mode: "gear", slot: "hand1" },
    ),
  );
  assert.equal(chest.length, 0);
  assert.equal(p.equipment.hand1, "sword");
});
test("Offhand-only sword contributes full weapon damage to facing melee", () => {
  const { g, p } = setup();
  p.equipment.hand2 = "sword";
  p.faceX = 1;
  p.faceY = 0;
  g.enemies = [{ id: 10, x: 430, y: 400, hp: 100, stun: 0, kind: "lion" }];
  g.attack(p);
  assert.equal(g.enemies[0].hp, 100 - ITEMS.sword.damage);
});
test("Player drops never auto-pickup, even for another player with a charm or after saving", () => {
  const { g, p } = setup();
  const q = g.addPlayer("pad:0");
  q.x = p.x;
  q.y = p.y;
  q.equipment.neck = "charm";
  p.inventory = [
    { type: "fruit", qty: 4 },
    { type: "meat", qty: 3 },
    { type: "arrow", qty: 8 },
  ];
  g.openInventory(p);
  for (let i = 0; i < 3; i++) { p.ui.index = i; g.inventoryAction(p, "drop"); }
  p.ui = null;
  assert.equal(g.loot.length, 3);
  for (let i = 0; i < 60; i++) g.tickAdventure(0.05, {});
  assert.equal(g.loot.length, 3);
  assert.equal(count(q, "fruit"), 0);
  const saved = restoreSession(JSON.parse(JSON.stringify(saveSession(g))));
  assert.ok(saved.loot.every((l) => l.manualPickup));
  assert.ok(g.collect(q, g.loot[0]));
  assert.equal(count(q, "fruit"), 4);
});
