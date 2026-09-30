import test from "node:test";
import assert from "node:assert/strict";
import { Game } from "../src/core.mjs";
import {
  ITEMS,
  SLOTS,
  give,
  count,
  equip,
  splitStack,
  sellStack,
  migrateEquipment,
} from "../src/items.mjs";
import { saveSession, restoreSession } from "../src/session.mjs";
import { Profiles } from "../src/profiles.mjs";
const setup = () => {
  const g = new Game(() => 0.2);
  const p = g.addPlayer("keyboard");
  g.start();
  g.scenery = [];
  g.terrain.fill("grass");
  p.x = 400;
  p.y = 400;
  p.faceX = 1;
  p.faceY = 0;
  return { g, p };
};
test("Head, neck and cape equip independently; old head charms migrate", () => {
  const { p } = setup();
  p.equipment.head = "charm";
  migrateEquipment(p);
  assert.equal(p.equipment.neck, "charm");
  assert.equal(p.equipment.head, null);
  for (const id of ["hat", "cape"]) {
    give(p.inventory, id);
    equip(
      p,
      p.inventory.findIndex((i) => i?.type === id),
    );
  }
  assert.equal(p.equipment.head, "hat");
  assert.equal(p.equipment.neck, "charm");
  assert.equal(p.equipment.cape, "cape");
  assert.equal(SLOTS.length, 11);
});
test("Wands consume mana, reject exhausted shots, hit enemies and regenerate", () => {
  const { g, p } = setup();
  p.equipment.hand1 = "wand";
  g.enemies = [{ id: 100, x: 435, y: 400, hp: 100 }];
  assert.equal(g.fireSpell(p), true);
  assert.equal(p.mana, 88);
  g.tickAdventure(0.15, {});
  assert.equal(g.enemies[0].hp, 78);
  assert.equal(g.spells.length, 0);
  assert.equal(g.arrows.length, 0);
  assert.ok(p.mana > 88);
  p.mana = 0;
  assert.equal(g.fireSpell(p), false);
  assert.equal(g.spells.length, 0);
});
test("Magic stops at solid scenery and cannot tunnel through targets", () => {
  const { g, p } = setup();
  p.equipment.hand1 = "wand";
  g.blocked = (x) => x >= 425;
  g.enemies = [{ id: 100, x: 460, y: 400, hp: 100 }];
  g.fireSpell(p);
  g.tickAdventure(0.3, {});
  assert.equal(g.enemies[0].hp, 100);
  assert.equal(g.spells.length, 0);
});
test("Stack splitting preserves totals, validates amounts and fails atomically when full", () => {
  const list = [{ type: "potion", qty: 9 }];
  assert.equal(splitStack(list, 0, 3), true);
  assert.deepEqual(
    list.map((i) => i.qty),
    [6, 3],
  );
  assert.equal(splitStack(list, 0, 6), false);
  while (list.length < 24) list.push({ type: "sword", qty: 1 });
  const before = JSON.stringify(list);
  assert.equal(splitStack(list, 0), false);
  assert.equal(JSON.stringify(list), before);
});
test("Robot sells selected stacks, vending buys without losing coins on failure", () => {
  const { g, p } = setup();
  g.portal(p);
  { const entryDoor = g.portals.find((d) => d.owner === p.id); p.x = entryDoor.x; p.y = entryDoor.y; g.enterRoom(p, entryDoor); }
  g.openShop(p, "robot");
  p.inventory = [{ type: "sword", qty: 1 }];
  g.inventoryAction(p, "use");
  assert.equal(p.coins, 8);
  assert.equal(p.inventory.length, 0);
  p.coins = 20;
  g.openShop(p, "vending");
  g.inventoryAction(p, "use");
  assert.equal(p.coins, 10);
  assert.equal(count(p, "potion"), 0);
  g.tickAdventure(1.7, {});
  g.inventoryAction(p, "collect");
  assert.equal(count(p, "potion"), 1);
  p.inventory = Array.from({ length: 24 }, () => ({ type: "hat", qty: 1 }));
  g.purchaseVending(p,0);
  assert.equal(p.coins,0);
  g.tickAdventure(1.7,{});
  assert.equal(g.collectVending(p),false);
  p.inventory = [];
  p.coins = 9;
  g.purchaseVending(p,0);
  assert.equal(p.coins, 9);
});
test("Currency and new slots survive character profile capture and session reload", () => {
  const { g, p } = setup();
  p.coins = 47;
  p.equipment.neck = "charm";
  p.equipment.cape = "cape";
  const loaded = restoreSession(JSON.parse(JSON.stringify(saveSession(g))));
  assert.equal(loaded.players[0].coins, 47);
  assert.equal(loaded.players[0].equipment.cape, "cape");
  const profiles = new Profiles();
  profiles.save = () => {};
  profiles.data.heroes = [{ id: p.profileId }];
  profiles.capture(g);
  const q = {};
  profiles.assign(q, profiles.data.heroes[0]);
  assert.equal(q.coins, 47);
  assert.equal(q.equipment.neck, "charm");
});
test("Potions stay on ground until manually collected, including after reaching center", () => {
  const { g, p } = setup();
  p.progress = 48;
  p.x = 800;
  p.y = 890;
  g.loot = [{ id: 99, type: "potion", qty: 2, x: p.x, y: p.y }];
  g.tickAdventure(0.05, {});
  assert.equal(g.loot.length, 1);
  g.tickAdventure(0.05, { keyboard: { interact: true } });
  g.tickAdventure(0.05, { keyboard: {} });
  assert.equal(g.loot.length, 0);
  assert.equal(count(p, "potion"), 4);
  assert.equal(g.phase, "play");
  g.openInventory(p);
  p.ui.index = p.inventory.findIndex((i) => i?.type === "potion");
  g.inventoryAction(p, "dropOne");
  assert.equal(count(p, "potion"), 3);
  p.ui = null;
  g.tickAdventure(0.05, {});
  assert.equal(g.loot[0].qty, 1);
});
