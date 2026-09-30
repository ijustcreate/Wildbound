import test from "node:test";
import assert from "node:assert/strict";
import { Game } from "../src/core.mjs";
import { give, count } from "../src/items.mjs";
const setup = () => {
  const g = new Game(),
    p = g.addPlayer("keyboard");
  g.start();
  g.portal(p);
  { const entryDoor = g.portals.find((d) => d.owner === p.id); p.x = entryDoor.x; p.y = entryDoor.y; g.enterRoom(p, entryDoor); }
  g.openInventory(p, 0);
  return { g, p };
};
test("Chest transfers move stacks both ways through A/Enter and shoulder/Tab actions", () => {
  const { g, p } = setup();
  give(p.inventory, "potion", 4);
  g.inventoryAction(p, "select:1");
  g.inventoryAction(p, "use");
  assert.equal(count(p, "potion"), 0);
  assert.equal(p.chests[0][0].qty, 6);
  g.inventoryAction(p, "panel");
  assert.equal(p.ui.panel, "gear");
  g.inventoryAction(p, "panel");
  assert.equal(p.ui.panel, "quiver");
  g.inventoryAction(p, "panel");
  assert.equal(p.ui.panel, "chest");
  g.inventoryAction(p, "use");
  assert.equal(count(p, "potion"), 6);
  assert.equal(p.chests[0].length, 0);
  g.inventoryAction(p, "panel");
  assert.equal(p.ui.panel, "pack");
  assert.equal(p.ui.index, 0);
});
test("X/R transfers in either direction and closing chest keeps inventory and room open", () => {
  const { g, p } = setup();
  const room = p.room;
  g.inventoryAction(p, "store");
  assert.equal(count(p, "trap"), 0);
  g.inventoryAction(p, "panel:chest");
  g.inventoryAction(p, "store");
  assert.equal(count(p, "trap"), 3);
  g.inventoryAction(p, "closeStorage");
  assert.equal(p.ui.storage, null);
  assert.equal(p.ui.panel, "pack");
  assert.equal(p.room, room);
});
test("A full destination reports failure without moving or duplicating items", () => {
  const { g, p } = setup();
  p.chests[0] = Array.from({ length: 24 }, () => ({ type: "sword", qty: 1 }));
  const before = JSON.stringify([p.inventory, p.chests]);
  g.inventoryAction(p, "store");
  assert.equal(JSON.stringify([p.inventory, p.chests]), before);
  assert.match(p.ui.notice, /Chest is full/);
  p.inventory = Array.from({ length: 24 }, () => ({ type: "hat", qty: 1 }));
  g.inventoryAction(p, "panel:chest");
  const second = JSON.stringify([p.inventory, p.chests]);
  g.inventoryAction(p, "use");
  assert.equal(JSON.stringify([p.inventory, p.chests]), second);
  assert.match(p.ui.notice, /Backpack is full/);
});
test("Shared and victory chests use the same two-way transfer actions", () => {
  const { g, p } = setup();
  for (const source of ["shared", "victory"]) {
    g.victoryRewards = [];
    g.openInventory(p, source);
    g.inventoryAction(p, "store");
    assert.equal(count(p, "trap"), 0);
    g.inventoryAction(p, "panel");
    g.inventoryAction(p, "panel");
    g.inventoryAction(p, "panel");
    g.inventoryAction(p, "use");
    assert.equal(count(p, "trap"), 3);
  }
});
