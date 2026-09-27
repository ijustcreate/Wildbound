import test from "node:test";
import assert from "node:assert/strict";
import { Game, EVENTS } from "../src/core.mjs";
import { tickHazards } from "../src/hazards.mjs";
import { canSee } from "../src/adventure.mjs";
const setup = () => {
  const g = new Game(() => 0.2);
  g.terrain.fill("grass");
  g.scenery = [];
  const p = g.addPlayer("keyboard");
  p.x = 600;
  p.y = 500;
  g.start();
  return { g, p };
};
test("Monsoon reduces vision then expires", () => {
  const { g, p } = setup();
  const q = { x: p.x + 250, y: p.y };
  assert.equal(canSee(g, q), true);
  g.spawnEvent(EVENTS.findIndex((e) => e.type === "monsoon"));
  assert.equal(canSee(g, q), false);
  tickHazards(g, 46);
  assert.equal(g.weather, null);
  assert.equal(canSee(g, q), true);
});
test("Volcano is rare and produces connected flowing lava outside safe table clearing", () => {
  const { g } = setup();
  const index = EVENTS.findIndex((e) => e.type === "volcano");
  assert.ok(EVENTS[index].weight < 1);
  g.spawnEvent(index);
  for (let n = 0; n < 100; n++) tickHazards(g, 0.1);
  assert.ok(g.lava.length > 10);
  for (const c of g.lava) assert.ok(Math.hypot(c.x - 800, c.y - 800) >= 230);
  assert.equal(g.volcanoes.length, 1);
});
test("Stampede spawns twenty runners and only a struck rhino becomes aggressive", () => {
  const { g, p } = setup();
  g.spawnEvent(EVENTS.findIndex((e) => e.type === "stampede"));
  assert.equal(g.enemies.length, 20);
  const e = g.enemies[0],
    x = e.x;
  tickHazards(g, 0.1);
  assert.notEqual(e.x, x);
  assert.equal(e.aggro, false);
  e.x = p.x + 30;
  e.y = p.y;
  p.faceX = 1;
  p.faceY = 0;
  g.attack(p);
  assert.equal(e.aggro, true);
  assert.equal(g.enemies.filter((e) => e.aggro).length, 1);
});
test("Monkeys throw a separate banana projectile while pursuing", () => {
  const { g, p } = setup();
  g.generatedEnvironment="temple"; // Isolate monkey behavior without the temple walls.
  g.spawnEvent(EVENTS.findIndex((e) => e.kind === "monkey"));
  const e = g.enemies[0];
  g.enemies = [e];
  e.x = p.x + 150;
  e.y = p.y;
  g.update(0.05, {});
  assert.equal(g.bananas.length, 0);
  assert.ok(e.throwTime > 0 && e.pendingBanana);
  for (let i = 0; i < 5; i++) g.update(0.05, {});
  assert.equal(g.bananas.length, 1);
  assert.ok(g.bananas[0].vx < 0);
});
test("Golem slam knocks back and stuns with a decreasing duration", () => {
  const { g, p } = setup();
  g.spawnEvent(EVENTS.findIndex((e) => e.kind === "golem"));
  const e = g.enemies[0];
  e.x = p.x - 50;
  e.y = p.y;
  e.state = "windup";
  e.timer = 0.01;
  e.dx = 1;
  e.dy = 0;
  const x = p.x;
  g.update(0.05, {});
  assert.ok(p.x > x + 50);
  assert.ok(p.stun > 1);
  const t = p.stun,
    stunnedX = p.x;
  g.update(0.05, { keyboard: { x: 1, attack: true } });
  assert.ok(p.stun < t);
  assert.equal(p.x, stunnedX);
  assert.equal(p.charge, 0);
});
test("Victory clears weather, volcanoes and lava", () => {
  const { g } = setup();
  g.spawnEvent(EVENTS.findIndex((e) => e.type === "volcano"));
  g.spawnEvent(EVENTS.findIndex((e) => e.type === "monsoon"));
  g.completeVictory();
  assert.equal(g.weather, null);
  assert.equal(g.lava.length, 0);
  assert.equal(g.volcanoes.length, 0);
});
