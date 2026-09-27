import test from "node:test";
import assert from "node:assert/strict";
import { Game } from "../src/core.mjs";
import { ITEMS, count, sellStack } from "../src/items.mjs";
import { roomBlocked, useStamina } from "../src/shops.mjs";
import { Profiles } from "../src/profiles.mjs";
import { rules } from "../src/definitions.mjs";
const setup = () => {
  const g = new Game(),
    p = g.addPlayer("keyboard");
  g.start();
  g.scenery = [];
  g.terrain.fill("grass");
  p.x = p.y = 400;
  g.portal(p);
  {
    const entryDoor = g.portals[0];
    p.x = entryDoor.x;
    p.y = entryDoor.y;
    g.enterRoom(p, entryDoor);
  }
  return { g, p };
};
test("Robot receives sold stacks and awards gold; sale fails atomically when stock is full", () => {
  const { g, p } = setup();
  p.inventory = [{ type: "potion", qty: 4 }];
  g.openShop(p, "robot");
  g.inventoryAction(p, "use");
  assert.equal(p.coins, 12);
  assert.equal(p.robotStock[0].qty, 4);
  assert.equal(p.inventory.length, 0);
  p.robotStock = Array.from({ length: 120 }, () => ({ type: "sword", qty: 1 }));
  p.inventory = [{ type: "hat", qty: 1 }];
  assert.equal(sellStack(p, 0), false);
  assert.equal(p.coins, 12);
  assert.equal(p.inventory.length, 1);
});
test("Paid vending order falls before collection; full backpack retains purchase and cannot duplicate", () => {
  const { g, p } = setup();
  g.openShop(p, "vending");
  p.coins = 40;
  g.purchaseVending(p, 1);
  assert.equal(p.coins, 25);
  assert.equal(p.vendingStock[1].qty, 4);
  assert.equal(count(p, "stamina_potion"), 0);
  assert.equal(g.collectVending(p), false);
  g.tickAdventure(1.7, {});
  p.inventory = Array.from({ length: 24 }, () => ({ type: "sword", qty: 1 }));
  assert.equal(g.collectVending(p), false);
  assert.equal(p.vendingOrders.length, 1);
  p.inventory = [];
  assert.equal(g.collectVending(p), true);
  assert.equal(count(p, "stamina_potion"), 1);
  assert.equal(g.collectVending(p), false);
});
test("Robot stock and paid tray orders persist in character data", () => {
  const { g, p } = setup();
  g.openShop(p, "vending");
  p.coins = 20;
  g.purchaseVending(p, 0);
  p.robotStock = [{ type: "sword", qty: 1 }];
  const profiles = new Profiles();
  profiles.data.heroes = [{ id: p.profileId }];
  profiles.save = () => {};
  profiles.capture(g);
  const q = {};
  profiles.assign(q, profiles.data.heroes[0]);
  assert.equal(q.vendingOrders.length, 1);
  assert.equal(q.vendingStock[0].qty, 4);
  assert.equal(q.robotStock[0].type, "sword");
  assert.equal(q.coins, 10);
});
test("Robot and machine collision stop room movement at their footprints", () => {
  const { g, p } = setup();
  assert.ok(roomBlocked(65, 184));
  assert.ok(roomBlocked(255, 156));
  p.roomX = 65;
  p.roomY = 150;
  for (let i = 0; i < 20; i++) g.tickAdventure(0.05, { keyboard: { y: 1 } });
  assert.ok(p.roomY <= 164);
  p.roomX = 255;
  p.roomY = 185;
  for (let i = 0; i < 20; i++) g.tickAdventure(0.05, { keyboard: { y: -1 } });
  assert.ok(p.roomY >= 173);
});
test("Stamina potion halves dash cooldown for 30 seconds then restores it", () => {
  const { g, p } = setup();
  g.leaveRoom(p);
  g.openingBoard = false;
  p.inventory = [{ type: "stamina_potion", qty: 2 }];
  p.dodge = 2;
  assert.ok(useStamina(p));
  assert.equal(p.staminaBoost, 30);
  assert.equal(p.dodge, 1);
  useStamina(p);
  assert.equal(p.dodge, 1);
  p.dodge = 0;
  g.update(0.05, { keyboard: { x: 1, dodge: true } });
  assert.equal(p.dodge, rules.dashCooldown / 2);
  p.staminaBoost = 0.01;
  g.update(0.05, { keyboard: {} });
  assert.equal(p.staminaBoost, 0);
  p.dodge = 0;
  g.update(0.05, { keyboard: { x: 1, dodge: true } });
  assert.equal(p.dodge, rules.dashCooldown);
});
test("Wand charge grows size and doubles damage but retains speed and exactly seven-square travel", () => {
  for (const charge of [0, 1.2]) {
    const { g, p } = setup();
    g.leaveRoom(p);
    p.equipment.hand1 = "wand";
    p.faceX = 1;
    p.faceY = 0;
    g.fireSpell(p, charge);
    const bolt = g.spells[0],
      start = bolt.x;
    assert.equal(bolt.remaining, 224);
    assert.equal(bolt.vx, 260);
    assert.equal(bolt.size, charge ? 14 : 6);
    assert.equal(bolt.damage, ITEMS.wand.damage * (charge ? 2 : 1));
    for (let i = 0; i < 30; i++) g.tickAdventure(0.05, {});
    assert.ok(Math.abs(bolt.x - start - 224) < 0.0001);
    assert.equal(g.spells.length, 0);
  }
});
