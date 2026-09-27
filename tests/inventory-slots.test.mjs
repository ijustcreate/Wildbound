import test from "node:test";
import assert from "node:assert/strict";
import {
  freshCharacter,
  moveInventoryItem,
  give,
  take,
  equip,
  splitStack,
  sellStack,
  transfer,
} from "../src/items.mjs";
test("Explicit drag slots and gaps survive JSON saves, removals, sales and automatic additions", () => {
  const p = freshCharacter(1, "Tester");
  const chest = [];
  assert.ok(
    moveInventoryItem(
      p,
      chest,
      { mode: "pack", index: 0 },
      { mode: "pack", index: 17 },
    ),
  );
  assert.equal(p.inventory[0], null);
  assert.equal(p.inventory[17].type, "trap");
  give(p.inventory, "sword");
  assert.equal(p.inventory[0].type, "sword");
  equip(p, 0);
  assert.equal(p.inventory[17].qty, 3);
  assert.ok(
    moveInventoryItem(
      p,
      chest,
      { mode: "gear", slot: "hand1" },
      { mode: "chest", index: 22 },
    ),
  );
  assert.equal(chest[22].type, "sword");
  give(p.inventory, "potion", 4);
  splitStack(p.inventory, 0, 2);
  assert.equal(p.inventory[1].qty, 2);
  take(p.inventory, "potion", 4);
  assert.equal(p.inventory[17].type, "trap");
  const saved = JSON.parse(JSON.stringify({ p, chest }));
  assert.equal(saved.chest[22].type, "sword");
  assert.equal(saved.p.inventory[17].qty, 3);
  assert.ok(transfer(chest, p.inventory, 22));
  assert.equal(p.inventory[0].type, "sword");
  sellStack(p, 0);
  assert.equal(p.inventory[17].qty, 3);
});
test("Cross-container drag swaps exact cells and merges only into the selected stack", () => {
  const p = freshCharacter(1, "Tester");
  const chest = [];
  give(chest, "sword");
  assert.ok(
    moveInventoryItem(
      p,
      chest,
      { mode: "pack", index: 0 },
      { mode: "chest", index: 0 },
    ),
  );
  assert.equal(p.inventory[0].type, "sword");
  assert.equal(chest[0].type, "trap");
  give(p.inventory, "trap", 2);
  assert.ok(
    moveInventoryItem(
      p,
      chest,
      { mode: "pack", index: 1 },
      { mode: "chest", index: 12 },
    ),
  );
  assert.equal(chest[0].qty, 3);
  assert.equal(chest[12].qty, 2);
  assert.ok(
    moveInventoryItem(
      p,
      chest,
      { mode: "chest", index: 12 },
      { mode: "chest", index: 0 },
    ),
  );
  assert.equal(chest[0].qty, 5);
  assert.equal(chest[12], undefined);
});
