import test from "node:test";
import assert from "node:assert/strict";
import { Game, expeditionCameraTarget, EVENTS } from "../src/core.mjs";
import { saveSession, restoreSession } from "../src/session.mjs";
test("Opening stays tightly framed through dice and token movement, releasing at event spawn", () => {
  const g = new Game(() => 0.5);
  const p = g.addPlayer("keyboard");
  g.addPlayer("pad:0");
  g.start();
  const before = expeditionCameraTarget(g, 720, 426);
  assert.ok(before.zoom > 2.5, "Opening stage should tightly frame board and party");
  assert.equal(before.x, 800);
  p.x = 200;
  p.y = 200;
  assert.deepEqual(expeditionCameraTarget(g, 720, 426), before);
  g.hitTable(p);
  const landing = g.roll.landingAt;
  for (let t = 0; t < landing - 0.1; t += 0.05) g.update(0.05);
  assert.equal(g.openingBoard, true);
  assert.deepEqual(expeditionCameraTarget(g, 720, 426), before);
  while (!g.roll.resolved) g.update(0.01);
  assert.equal(g.openingBoard, false);
  assert.ok(g.enemies.length);
  assert.ok(expeditionCameraTarget(g, 720, 426).zoom < before.zoom);
  const loaded = restoreSession(JSON.parse(JSON.stringify(saveSession(g))));
  assert.equal(loaded.openingBoard, false);
  g.completeVictory();
  g.newExpedition();
  assert.equal(g.openingBoard, true);
  assert.deepEqual(expeditionCameraTarget(g, 720, 426), before);
});
test("Weather events also release the opening and six starting players can reach the table", () => {
  const g = new Game();
  for (let i = 0; i < 6; i++) {
    const p = g.addPlayer("pad:" + i);
    assert.ok(!g.blocked(p.x, p.y));
    assert.ok(g.canHitBoard(p));
  }
  g.start();
  g.spawnEvent(EVENTS.findIndex((e) => e.type === "monsoon"));
  assert.equal(g.openingBoard, false);
});
