import test from "node:test";
import assert from "node:assert/strict";
import { Game } from "../src/core.mjs";
import {
  waterAt,
  harvest,
  tickEnvironment,
  propBase,
} from "../src/environment.mjs";
import { saveSession, restoreSession } from "../src/session.mjs";
function setup() {
  const g = new Game(() => 0.2),
    p = g.addPlayer("keyboard");
  g.start();
  g.scenery = [];
  g.terrain.fill("grass");
  p.x = 400;
  p.y = 400;
  p.faceX = 1;
  p.faceY = 0;
  return { g, p };
}
test("Monsoon expands water exactly one tile and submerges bridges without changing base map", () => {
  const { g } = setup();
  g.terrain[10 * 50 + 10] = "water";
  g.terrain[10 * 50 + 11] = "shallow";
  g.terrain[11 * 50 + 10] = "bridge";
  g.weather = { type: "monsoon", life: 10 };
  assert.equal(waterAt(g, 12 * 32 + 16, 10 * 32 + 16), "shallow");
  assert.equal(waterAt(g, 13 * 32 + 16, 10 * 32 + 16), "grass");
  assert.equal(waterAt(g, 10 * 32 + 16, 11 * 32 + 16), "floodbridge");
  assert.equal(waterAt(g, 10 * 32 + 16, 10 * 32 + 16), "water");
  g.weather = null;
  assert.equal(waterAt(g, 12 * 32 + 16, 10 * 32 + 16), "grass");
  assert.equal(waterAt(g, 10 * 32 + 16, 11 * 32 + 16), "bridge");
});
test("Shallow water slows walking; deep water blocks walkers but not flying creatures", () => {
  const { g, p } = setup();
  g.terrain[12 * 50 + 12] = "shallow";
  assert.ok(Math.abs(g.moveActor(p, 10, 0) - 5.5) < 0.01);
  p.x = 400;
  g.terrain[12 * 50 + 12] = "water";
  assert.equal(g.moveActor(p, 10, 0), 0);
  assert.equal(g.moveActor(p, 10, 0, true), 10);
});
test("Harvest respects facing, drops sticks then logs, removes footprint and persists depletion", () => {
  const { g, p } = setup();
  const tree = {
    id: "tree",
    kind: "tree",
    procedural: true,
    x: 432,
    y: 379,
    size: 100,
  };
  g.scenery = [tree];
  p.faceX = -1;
  assert.equal(harvest(g, p, 30, 49), false);
  p.faceX = 1;
  assert.ok(g.blocked(432, 400));
  for (let i = 0; i < 3; i++) harvest(g, p, 30, 49);
  assert.equal(g.loot.filter((l) => l.type === "stick").length, 3);
  assert.ok(tree.falling);
  assert.equal(g.blocked(432, 400), false);
  tickEnvironment(g, 1.3);
  assert.equal(g.loot.filter((l) => l.type === "log").length, 1);
  tickEnvironment(g, 0.3);
  assert.equal(g.scenery.length, 0);
  const saved = restoreSession(JSON.parse(JSON.stringify(saveSession(g))));
  assert.equal(saved.scenery.length, 0);
  assert.equal(saved.loot.filter((l) => l.type === "log").length, 1);
});
test("Mining awards one chunk per completed progress bar and eventually depletes rock", () => {
  const { g, p } = setup();
  const rock = {
    id: "rock",
    kind: "rock",
    procedural: true,
    x: 432,
    y: 407,
    size: 32,
  };
  g.scenery = [rock];
  harvest(g, p, 12, 49);
  assert.equal(rock.harvest, 12);
  assert.equal(g.loot.length, 0);
  harvest(g, p, 12, 49);
  harvest(g, p, 12, 49);
  assert.equal(g.loot[0].type, "stone");
  assert.equal(rock.chipped, 1);
  assert.ok(!rock.depleted);
  for (let i = 0; i < 3; i++) harvest(g, p, 12, 49);
  assert.ok(rock.depleted);
  assert.equal(g.loot.length, 2);
});
test("Footprints follow actual travel, water makes ripples and flying animals leave no prints", () => {
  const { g, p } = setup();
  tickEnvironment(g, 0.01);
  p.x += 16;
  tickEnvironment(g, 0.01);
  assert.equal(g.footprints.length, 1);
  g.terrain[Math.floor((p.y + 14) / 32) * 50 + Math.floor((p.x + 16) / 32)] =
    "shallow";
  p.x += 16;
  tickEnvironment(g, 0.01);
  assert.equal(g.footprints.at(-1).water, true);
  g.enemies = [{ id: 8, kind: "bat", hp: 20, x: 400, y: 400 }];
  tickEnvironment(g, 0.01);
  g.enemies[0].x += 20;
  tickEnvironment(g, 0.01);
  assert.equal(g.footprints.length, 2);
  g.time = 20;
  tickEnvironment(g, 0.01);
  assert.equal(g.footprints.length, 0);
});

test("Storage portal exits on touch without instant bounce on arrival", () => {
  const { g, p } = setup();
  g.portal(p);
  const d = g.portals[0];
  p.x = d.x;
  p.y = d.y;
  g.tickAdventure(0.01, {});
  assert.equal(p.room, d.id);
  g.tickAdventure(0.01, {});
  assert.equal(p.room, d.id);
  p.roomX = 160;
  p.roomY = 200;
  g.tickAdventure(0.01, {});
  assert.equal(p.room, null);
  g.tickAdventure(0.01, {});
  assert.equal(p.room, null);
});
test("Named private chests survive saves and reject guest renaming", () => {
  const { g, p } = setup();
  g.portal(p);
  const d = g.portals[0];
  p.x = d.x;
  p.y = d.y;
  g.enterRoom(p, d);
  g.openInventory(p, 1);
  g.inventoryAction(p, "rename: Weapons ");
  assert.equal(p.chestNames[1], "Weapons");
  const restored = restoreSession(JSON.parse(JSON.stringify(saveSession(g))));
  assert.equal(restored.players[0].chestNames[1], "Weapons");
  const q = g.addPlayer("pad:0");
  q.x = d.x;
  q.y = d.y;
  g.enterRoom(q, d);
  g.openInventory(q, 1);
  g.inventoryAction(q, "rename:Mine");
  assert.equal(p.chestNames[1], "Weapons");
});
