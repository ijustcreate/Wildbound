import test from "node:test";
import assert from "node:assert/strict";
import { Game } from "../src/core.mjs";
import { saveSession, restoreSession } from "../src/session.mjs";

test("Enemy item rolls are one tenth of former rates", () => {
  let seed = 42;
  const random = () =>
    (seed = (1664525 * seed + 1013904223) >>> 0) / 4294967296;
  const g = new Game(random),
    counts = {};
  g.dropXP = () => {};
  g.dropLoot = (_x, _y, _type, _qty, source) =>
    (counts[source] = (counts[source] || 0) + 1);
  for (let n = 0; n < 10000; n++)
    g.enemyLoot({ kind: "skeleton", id: n, x: 400, y: 400 });
  // Formerly every skeleton dropped a sword; gear had a 40% chance.
  assert.ok(counts["Skeleton drop"] > 900 && counts["Skeleton drop"] < 1100);
  assert.ok(counts["Enemy gear"] > 320 && counts["Enemy gear"] < 480);
});

test("XP remains in collectible orbs, survives saving, ignores full bags and is awarded once", () => {
  const g = new Game(() => 0.99);
  g.addPlayer("keyboard");
  g.addPlayer("pad:0");
  g.start();
  g.enemyLoot({ kind: "skeleton", id: 901, x: 400, y: 400 });
  assert.equal(g.loot.length, 0);
  assert.equal(g.players[0].xp, 0);
  assert.equal(g.xpOrbs.length, 1);
  const loaded = restoreSession(JSON.parse(JSON.stringify(saveSession(g))));
  const p = loaded.players[0],
    orb = loaded.xpOrbs[0];
  p.inventory = Array.from({ length: 24 }, () => ({ type: "sword", qty: 1 }));
  Object.assign(p, { x: orb.x, y: orb.y, hp: 0 });
  loaded.time = 1;
  assert.equal(loaded.collectXP(p, orb), false);
  p.hp = 100;
  assert.equal(loaded.collectXP(p, orb), true);
  assert.equal(loaded.xpOrbs.length, 0);
  assert.equal(p.inventory.length, 24);
  assert.ok(loaded.players.every((p) => p.xp === 10));
  assert.equal(loaded.collectXP(p, orb), false);
  assert.ok(loaded.players.every((p) => p.xp === 10));
});

test("Collecting a large combined orb can award multiple levels", () => {
  const g = new Game(() => 0.5),
    p = g.addPlayer("keyboard");
  g.start();
  g.dropXP(400, 400, 300);
  const orb = g.xpOrbs[0];
  Object.assign(p, { x: orb.x, y: orb.y });
  g.time = 1;
  assert.ok(g.collectXP(p, orb));
  assert.equal(p.level, 4);
  assert.equal(p.xp, 0);
});
