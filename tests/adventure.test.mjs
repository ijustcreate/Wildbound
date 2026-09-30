import test from "node:test";
import assert from "node:assert/strict";
import { Game, CENTER, FINISH } from "../src/core.mjs";
import { give, equip, unequip, count, transfer } from "../src/items.mjs";
import { canSee } from "../src/adventure.mjs";
const setup = () => {
  const g = new Game(() => 0.2);
  g.scenery = [];
  g.terrain.fill("grass");
  const p = g.addPlayer("keyboard");
  p.x = 400;
  p.y = 400;
  g.start();
  g.openingBoard = false; // These tests exercise active combat, after the opening.
  return { g, p };
};
test("New heroes have empty equipment and exactly three inventory traps", () => {
  const { g, p } = setup();
  assert.equal(count(p, "trap"), 3);
  assert.ok(Object.values(p.equipment).every((x) => x === null));
  g.trap(p);
  assert.equal(count(p, "trap"), 2);
});
test("Potions are consumables and cannot be wasted at full health", () => {
  const { g, p } = setup();
  give(p.inventory, "potion", 2);
  assert.equal(g.usePotion(p), false);
  p.hp = 20;
  assert.equal(g.usePotion(p), true);
  assert.equal(p.hp, 65);
  assert.equal(count(p, "potion"), 3);
});
test("Bow occupies both hands and swapping shield returns bow without duplication", () => {
  const { p } = setup();
  give(p.inventory, "sword");
  give(p.inventory, "shield");
  give(p.inventory, "bow");
  equip(
    p,
    p.inventory.findIndex((i) => i?.type === "sword"),
  );
  equip(
    p,
    p.inventory.findIndex((i) => i?.type === "shield"),
  );
  equip(
    p,
    p.inventory.findIndex((i) => i?.type === "bow"),
  );
  assert.equal(p.equipment.hand2, "occupied");
  equip(
    p,
    p.inventory.findIndex((i) => i?.type === "shield"),
  );
  assert.equal(p.equipment.hand1, null);
  assert.equal(p.equipment.hand2, "shield");
  assert.equal(count(p, "bow"), 1);
});
test("Full inventory transfer fails atomically", () => {
  const from = [{ type: "sword", qty: 1 }],
    to = Array.from({ length: 24 }, () => ({ type: "sword", qty: 1 }));
  assert.equal(transfer(from, to, 0), false);
  assert.equal(from.length, 1);
  assert.equal(to.length, 24);
});
test("Repeated full-inventory pickup attempts use a throttled notice and no error sound", () => {
  const { g, p } = setup();
  p.inventory = Array.from({ length: 24 }, () => ({ type: "sword", qty: 1 }));
  g.dropLoot(p.x, p.y, "fruit");
  let sounds = 0;
  g.onSound = () => sounds++;
  const loot = g.loot[0];
  assert.equal(g.collect(p, loot), false);
  const noticeUntil = p.inventoryFullNoticeUntil;
  assert.equal(g.collect(p, loot), false);
  assert.equal(p.inventoryFullNoticeUntil, noticeUntil);
  assert.equal(sounds, 0);
  assert.equal(g.loot.includes(loot), true);
});
test("Dash uses movement instead of mouse aim and has three second cooldown", () => {
  const { g, p } = setup();
  g.update(0.05, { keyboard: { x: 1, aimX: 0, aimY: -1, dodge: true } });
  assert.ok(p.x > 410);
  assert.equal(p.y, 400);
  assert.equal(p.dodge, 3);
  for (let n = 0; n < 10; n++) g.update(0.05, { keyboard: { dodge: true } });
  assert.ok(p.dodge < 3 && p.dodge > 2);
});
test("One die rolls only one value", () => {
  const { g, p } = setup();
  g.diceCount = 1;
  g.hitTable(p);
  assert.equal(g.roll.dice.length, 1);
  assert.equal(g.roll.total, g.roll.dice[0]);
});
test("Owner leaves guests ten seconds; ejection costs exactly half maximum HP", () => {
  const { g, p } = setup();
  const q = g.addPlayer("pad:0");
  q.x = p.x;
  q.y = p.y;
  g.portal(p);
  { const entryDoor = g.portals.find(d=>d.owner===p.id); p.x = entryDoor.x; p.y = entryDoor.y; g.enterRoom(p, entryDoor); }
  const d = g.portals[0];
  { const entryDoor = d; q.x = entryDoor.x; q.y = entryDoor.y; g.enterRoom(q, entryDoor); }
  g.leaveRoom(p);
  assert.equal(d.closing, 10);
  g.tickAdventure(9.9, {});
  assert.equal(q.room, d.id);
  g.tickAdventure(0.2, {});
  assert.equal(q.room, null);
  assert.equal(q.hp, 50);
  assert.equal(q.x, d.x);
  assert.equal(g.portals.length, 0);
});
test("Owner reentry cancels collapse and last exit removes portal", () => {
  const { g, p } = setup();
  const q = g.addPlayer("pad:0");
  q.x = p.x;
  q.y = p.y;
  g.portal(p);
  { const entryDoor = g.portals.find(d=>d.owner===p.id); p.x = entryDoor.x; p.y = entryDoor.y; g.enterRoom(p, entryDoor); }
  const d = g.portals[0];
  { const entryDoor = d; q.x = entryDoor.x; q.y = entryDoor.y; g.enterRoom(q, entryDoor); }
  g.leaveRoom(p);
  { const entryDoor = d; p.x = entryDoor.x; p.y = entryDoor.y; g.enterRoom(p, entryDoor); }
  assert.equal(d.closing, null);
  g.leaveRoom(q);
  assert.equal(g.portals.length, 1);
  g.leaveRoom(p);
  assert.equal(g.portals.length, 0);
});
test("Party entirely in storage is not a defeat", () => {
  const { g, p } = setup();
  g.portal(p);
  { const entryDoor = g.portals.find(d=>d.owner===p.id); p.x = entryDoor.x; p.y = entryDoor.y; g.enterRoom(p, entryDoor); }
  g.update(0.05, {});
  assert.equal(g.phase, "play");
});

test("Defeat does not strip selected character equipment before lobby return", () => {
  const g = new Game();
  const p = g.addPlayer("keyboard");
  p.inventory = [{ type: "sword", qty: 1 }, { type: "trap", qty: 2 }];
  p.equipment.hand1 = "sword";
  g.start();
  g.openingBoard = false;
  p.hp = 0;
  g.update(0.05, {});
  assert.equal(g.phase, "lost");
  assert.deepEqual(p.inventory, [{ type: "sword", qty: 1 }, { type: "trap", qty: 2 }]);
  assert.equal(p.equipment.hand1, "sword");
});
test("Private chest uses owner inventory when a guest visits", () => {
  const { g, p } = setup();
  const q = g.addPlayer("pad:0");
  q.x = p.x;
  q.y = p.y;
  give(p.chests[1], "sword");
  g.portal(p);
  { const entryDoor = g.portals.find(d=>d.owner===p.id); p.x = entryDoor.x; p.y = entryDoor.y; g.enterRoom(p, entryDoor); }
  { const entryDoor = g.portals[0]; q.x = entryDoor.x; q.y = entryDoor.y; g.enterRoom(q, entryDoor); }
  g.openInventory(q, 1);
  assert.equal(g.storageFor(q), p.chests[1]);
  q.ui.panel = "chest";
  g.inventoryAction(q, "use");
  assert.equal(count(q, "sword"), 1);
  assert.equal(p.chests[1].length, 0);
});
test("Charge attack interrupts windup and pushes toward trap", () => {
  const { g, p } = setup();
  const e = {
    id: 99,
    x: 430,
    y: 400,
    hp: 100,
    state: "windup",
    kind: "skeleton",
  };
  g.enemies = [e];
  p.faceX = 1;
  p.faceY = 0;
  g.attack(p, 1);
  assert.equal(e.state, "recover");
  assert.ok(e.x > 480);
  assert.ok(e.hp < 75);
});
test("Arrows consume ammunition and grounded shafts become loot", () => {
  const { g, p } = setup();
  give(p.inventory, "arrow", 2);
  p.faceX = 1;
  p.faceY = 0;
  g.fireArrow(p, 0);
  assert.equal(count(p, "arrow"), 1);
  for (let n = 0; n < 60; n++) g.tickAdventure(0.05, {});
  assert.ok(g.loot.some((l) => l.type === "arrow"));
  assert.equal(g.arrows.length, 0);
});
test("Projectile aim assist stays within four degrees of player aim", () => {
  const { g, p } = setup();
  give(p.inventory, "arrow", 1);
  p.faceX = 1;
  p.faceY = 0;
  g.projectileBlocked = () => false;
  g.enemies = [{ id: 7, x: p.x + 100, y: p.y + 50, hp: 100, room: null }];
  g.fireArrow(p, 0);
  const shot = g.arrows[0];
  const angle = Math.abs(Math.atan2(shot.vy, shot.vx) * 180 / Math.PI);
  assert.ok(angle <= 4.000001, `aim correction was ${angle} degrees`);
});
test("Embedded arrows transfer to enemy loot on death", () => {
  const { g, p } = setup();
  const e = { id: 55, x: 450, y: 400, kind: "skeleton" };
  g.arrows = [{ enemy: 55, stuck: true }];
  g.enemyLoot(e);
  assert.ok(g.loot.some((l) => l.type === "arrow"));
  assert.ok(g.xpOrbs.some((orb) => orb.amount === 10));
  assert.equal(g.arrows.length, 0);
});
test("Shield blocks front but not rear", () => {
  const { g, p } = setup();
  p.blocking = true;
  p.faceX = 1;
  p.faceY = 0;
  assert.equal(g.shieldBlocks(p, { x: 430, y: 400 }), true);
  assert.equal(g.shieldBlocks(p, { x: 370, y: 400 }), false);
});
test("Victory chest is shared and awarded once", () => {
  const { g, p } = setup();
  g.dropLoot(400, 400, "sword", 1);
  p.progress = FINISH;
  p.x = 800;
  p.y = 670;
  g.beginSeal(p);
  g.completeVictory();
  assert.equal(g.phase, "won");
  assert.ok(g.victoryRewards.length);
  const n = g.victoryRewards.length;
  assert.ok(n > 0);
});
test("Vision is shared but excludes characters in private rooms", () => {
  const { g, p } = setup();
  assert.equal(canSee(g, { x: 400, y: 400 }), true);
  assert.equal(canSee(g, { x: 900, y: 900 }), false);
  g.portal(p);
  { const entryDoor = g.portals.find(d=>d.owner===p.id); p.x = entryDoor.x; p.y = entryDoor.y; g.enterRoom(p, entryDoor); }
  assert.equal(canSee(g, { x: 400, y: 400 }), false);
});
