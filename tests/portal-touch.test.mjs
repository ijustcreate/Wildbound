import test from "node:test";
import assert from "node:assert/strict";
import { Game } from "../src/core.mjs";
const setup = () => {
  const g = new Game();
  const p = g.addPlayer("keyboard");
  g.start();
  g.scenery = [];
  g.terrain.fill("grass");
  p.x = p.y = 400;
  return { g, p };
};
test("Summoning stays outside until owner walks into the nearby portal", () => {
  const { g, p } = setup();
  g.portal(p);
  const d = g.portals[0];
  assert.equal(p.room, null);
  assert.ok(Math.abs(Math.hypot(d.x - p.x, d.y - p.y) - 56) < 0.001);

  g.tickAdventure(0.05, {});
  assert.equal(p.room, null);

  p.x = d.x;
  p.y = d.y;
  g.tickAdventure(0.05, {});
  assert.equal(p.room, d.id);
});
test("Approaching guest enters on touch; returning owner is not pulled back in", () => {
  const { g, p } = setup(),
    q = g.addPlayer("pad:0");
  q.x = 540;
  q.y = 400;
  g.portal(p);
  const d = g.portals[0];
  g.tickAdventure(0.05, {});
  q.x = d.x;
  q.y = d.y;
  g.tickAdventure(0.05, {});
  assert.equal(q.room, d.id);
  p.x = d.x;
  p.y = d.y;
  g.tickAdventure(0.05, {});
  assert.equal(p.room, d.id);
  g.leaveRoom(p);
  g.tickAdventure(0.05, {});
  assert.equal(p.room, null);
  assert.ok(d.closing < 10);
});
test("Players summoning beside an existing portal reuse the same storage room", () => {
  const { g, p } = setup(), q = g.addPlayer("pad:0");
  g.portal(p);
  const d = g.portals[0];
  q.x = d.x;
  q.y = d.y;
  g.portal(q);
  assert.equal(g.portals.filter((door) => !door.temple).length, 1);
  assert.equal(q.room, d.id);
});
