import test from "node:test";
import assert from "node:assert/strict";
import { Game } from "../src/core.mjs";
import {
  give,
  count,
  splitStack,
  moveInventoryItem,
  sellStack,
} from "../src/items.mjs";
import {
  initializeField,
  craft,
  transferBatch,
  applyLoadout,
  searchStorage,
  choosePath,
  regroup,
  storageCapacity,
} from "../src/field-systems.mjs";
import { FixedClock, nearbyScenery } from "../src/performance.mjs";
const setup = () => {
  const g = new Game(() => 0.4),
    p = g.addPlayer("keyboard");
  g.start();
  g.openingBoard = false;
  return { g, p, f: initializeField(p) };
};
test("Fixed simulation catches up after a stall and bounds long suspension", () => {
  const c = new FixedClock();
  let t = 0;
  assert.equal(
    c.advance(0.1, (dt) => (t += dt)),
    6,
  );
  assert.ok(Math.abs(t - 0.1) < 1e-8);
  assert.equal(
    c.advance(60, () => {}),
    15,
  );
});
test("Spatial scenery query includes large props and rebuilds after collection changes", () => {
  const a = [
    { x: 50, y: 50, size: 200 },
    { x: 1000, y: 1000, size: 30 },
  ];
  assert.ok(nearbyScenery(a, 190, 50).includes(a[0]));
  assert.ok(!nearbyScenery(a, 50, 50).includes(a[1]));
  a.push({ x: 60, y: 60, size: 10 });
  assert.ok(nearbyScenery(a, 50, 50).includes(a[2]));
});
test("Crafting consumes exact materials and fails atomically with no room", () => {
  const { p } = setup();
  p.inventory = [];
  give(p.inventory, "stick", 4);
  give(p.inventory, "stone", 2);
  assert.equal(craft(p, "arrow"), "Trail arrows crafted.");
  assert.equal(count(p, "arrow"), 8);
  assert.equal(count(p, "stick"), 2);
  const before = structuredClone(p.inventory);
  assert.match(craft(p, "cover"), /Need/);
  assert.deepEqual(p.inventory, before);
});
test("Bulk deposit skips protected items and reports full destinations", () => {
  const { p, f } = setup();
  p.inventory = [
    { type: "sword", qty: 1 },
    { type: "fruit", qty: 2 },
  ];
  f.favorites = ["sword"];
  const to = [];
  assert.match(transferBatch(p, p.inventory, to, 24), /1 stack/);
  assert.equal(count(p, "sword"), 1);
  assert.deepEqual(to, [{ type: "fruit", qty: 2 }]);
  assert.equal(sellStack(p, 0), false);
});
test("Paged victory storage can split and drag past the first 24 cells", () => {
  const { g, p } = setup();
  const list = Array.from({ length: 30 }, () => ({ type: "sword", qty: 1 }));
  list[29] = { type: "arrow", qty: 8 };
  g.victoryRewards = list;
  assert.equal(storageCapacity(g, p, list), Infinity);
  assert.ok(splitStack(list, 29, 3, Infinity));
  assert.equal(list[30].qty, 3);
  p.inventory = [{ type: "fruit", qty: 1 }];
  assert.ok(
    moveInventoryItem(
      p,
      list,
      { mode: "pack", index: 0 },
      { mode: "chest", index: 40 },
      Infinity,
    ),
  );
  assert.equal(list[40].type, "fruit");
});
test("Loadout swaps atomically and missing equipment cannot consume items", () => {
  const { g, p, f } = setup();
  p.inventory = [{ type: "sword", qty: 1 }];
  p.chests[0] = [{ type: "shield", qty: 1 }];
  f.loadouts = [{ name: "Guard", gear: { hand1: "sword", hand2: "shield" } }];
  assert.equal(applyLoadout(g, p, 0), "Guard equipped.");
  assert.equal(p.equipment.hand2, "shield");
  f.loadouts[0].gear.head = "moon_circlet";
  const before = JSON.stringify([p.inventory, p.chests, p.equipment]);
  assert.match(applyLoadout(g, p, 0), /Missing/);
  assert.equal(JSON.stringify([p.inventory, p.chests, p.equipment]), before);
});
test("Search finds stored gear by name and stat", () => {
  const { g, p } = setup();
  p.chests[2] = [{ type: "shield", qty: 1 }];
  assert.equal(searchStorage(g, p, "armor", "Equipment")[0].name, "Chest 3");
});
test("Board choices are single use and recovery survives a new expedition", () => {
  const { g, p, f } = setup();
  f.choice = true;
  choosePath(g, p, "supplies");
  assert.equal(f.overflow[0].type, "potion");
  choosePath(g, p, "supplies");
  assert.equal(f.overflow[0].qty, 1);
  f.boon = "scout";
  g.newExpedition();
  assert.equal(f.boon, null);
  assert.equal(f.overflow[0].qty, 1);
});
test("Regroup refuses nearby threats and finds safe ground", () => {
  const { g, p } = setup();
  const q = g.addPlayer("pad:0");
  p.x = 400;
  p.y = 400;
  q.x = 700;
  q.y = 600;
  g.enemies = [{ x: 410, y: 410, hp: 10 }];
  assert.match(regroup(g, p), /safe/);
  g.enemies = [];
  assert.equal(regroup(g, p), "Rejoined the party.");
  assert.ok(!g.blocked(p.x, p.y));
});
test("Guest owner-only chest rejects both controller transfers and drag drops", () => {
  const { g, p, f } = setup();
  const q = g.addPlayer("pad:0");
  g.portals = [{ id: 10, owner: p.id }];
  q.room = 10;
  g.openInventory(q, 0);
  p.chests[0] = [{ type: "sword", qty: 1 }];
  f.access = "owner";
  q.ui.panel = "chest";
  g.inventoryAction(q, "use");
  assert.equal(count(q, "sword"), 0);
  assert.equal(
    g.moveInventoryItem(
      q,
      { mode: "chest", index: 0 },
      { mode: "pack", index: 1 },
    ),
    false,
  );
  f.access = "deposit";
  q.ui.panel = "chest";
  g.inventoryAction(q, "split");
  assert.equal(p.chests[0][0].qty, 1);
});
test("Barrier expires and blocks airborne shots while active", () => {
  const { g } = setup();
  g.barricades = [{ x: 500, y: 500, life: 0.02 }];
  assert.equal(g.projectileBlocked(500, 500), true);
  g.update(0.05, {});
  assert.equal(g.barricades.length, 0);
});

test("Bramble slows walkers without consuming the trap; flash creates recovery", () => {
  const { g, p, f } = setup();
  g.scenery = [];
  g.terrain.fill("grass");
  p.x = 400;
  p.y = 400;
  const enemy = {
    id: 99,
    kind: "lion",
    x: 470,
    y: 400,
    hp: 100,
    maxHp: 100,
    speed: 60,
    damage: 5,
    state: "hunt",
    timer: 1,
    cooldown: 1,
    faceX: -1,
    faceY: 0,
    step: 0,
  };
  g.enemies = [enemy];
  g.traps = [{ x: 470, y: 400, life: 10, variant: "slow" }];
  g.update(0.02, {});
  assert.ok(enemy.slowUntil > g.time - 0.03);
  assert.ok(g.traps[0].life > 0);
  g.traps = [{ x: enemy.x, y: enemy.y, life: 10, variant: "interrupt" }];
  g.update(0.02, {});
  assert.equal(enemy.state, "recover");
  assert.ok(enemy.timer > 1);
});
test("Rescue objective requires nearby living interaction and pays once", () => {
  const { g, p } = setup();
  p.x = 400;
  p.y = 400;
  g.objective = {
    kind: "rescue",
    name: "Rescue",
    x: 400,
    y: 400,
    target: 0.05,
    progress: 0,
    done: false,
  };
  g.update(0.03, {});
  assert.equal(g.objective.progress, 0);
  g.update(0.03, { keyboard: { interact: true } });
  g.update(0.03, { keyboard: { interact: true } });
  assert.equal(g.objective.done, true);
  assert.equal(p.coins, 10);
  g.update(0.03, { keyboard: { interact: true } });
  assert.equal(p.coins, 10);
});
test("Protected items cannot use the normal chest transfer shortcut", () => {
  const { g, p, f } = setup();
  g.victoryRewards = [];
  g.victoryChest = true;
  p.inventory = [{ type: "sword", qty: 1 }];
  f.favorites = ["sword"];
  g.openInventory(p, "victory");
  p.ui.panel = "pack";
  g.inventoryAction(p, "use");
  assert.equal(count(p, "sword"), 1);
  assert.equal(g.victoryRewards.length, 0);
});
