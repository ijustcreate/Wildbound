import test from "node:test";
import assert from "node:assert/strict";
import { Game, CENTER } from "../src/core.mjs";
import {
  defaultFootprint,
  ensureFootprint,
  footprintHit,
  isOccluded,
  TABLE,
} from "../src/world.mjs";
import { TRAIL, boardPoint } from "../src/board.mjs";
import { validateSprite } from "../src/pixels.mjs";
function tree() {
  return ensureFootprint(
    {
      width: 48,
      height: 48,
      palette: ["transparent", "#526c3f"],
      pixels: Array(2304).fill(1),
    },
    "tree",
  );
}
test("Footprint collides with tree base, not canopy", () => {
  const s = tree(),
    p = { x: 300, y: 300, size: 96 };
  assert.ok(footprintHit(p, s, 300, 335, 3));
  assert.equal(footprintHit(p, s, 300, 275, 3), false);
});
test("Painted masks round-trip and malformed footprints are rejected", () => {
  const s = tree();
  s.footprint.fill(0);
  s.footprint[5] = 1;
  assert.ok(validateSprite(JSON.parse(JSON.stringify(s))));
  s.footprint[5] = 8;
  assert.equal(validateSprite(s), false);
});
test("Canopy fades only when a player is behind visible pixels", () => {
  const s = tree(),
    p = { x: 300, y: 300, size: 96 };
  assert.ok(isOccluded(p, s, { x: 300, y: 280 }));
  assert.equal(isOccluded(p, s, { x: 300, y: 370 }), false);
  assert.equal(isOccluded(p, s, { x: 500, y: 280 }), false);
  s.occludes = false;
  assert.equal(isOccluded(p, s, { x: 300, y: 280 }), false);
});
test("Player movement respects painted scenery during a dash", () => {
  const g = new Game();
  g.terrain.fill("grass");
  g.spriteLibrary.tree = tree();
  g.scenery = [{ kind: "tree", x: 300, y: 300, size: 96 }];
  const a = { x: 250, y: 320 };
  g.moveActor(a, 100, 0);
  assert.ok(a.x < 290);
  const b = { x: 250, y: 265 };
  g.moveActor(b, 100, 0);
  assert.ok(Math.abs(b.x - 350) < 1e-8);
});
test("Erasing footprint immediately opens the passage", () => {
  const g = new Game();
  g.terrain.fill("grass");
  const s = tree();
  g.spriteLibrary.tree = s;
  g.scenery = [{ kind: "tree", x: 300, y: 300, size: 96 }];
  s.footprint.fill(0);
  const a = { x: 250, y: 320 };
  g.moveActor(a, 100, 0);
  assert.ok(Math.abs(a.x - 350) < 1e-8);
});
test("Board has 49 linked positions and interpolated hopping figures", () => {
  assert.equal(TRAIL.length, 49);
  assert.deepEqual(TRAIL.at(-1), { x: 0, y: 0 });
  const a = boardPoint(7),
    b = boardPoint(7.5),
    c = boardPoint(8);
  assert.ok(b.hop > 0);
  assert.equal(b.x, (a.x + c.x) / 2);
});
test("Figure movement completes before event and next turn", () => {
  const g = new Game(() => 0.5);
  g.addPlayer("keyboard");
  g.start();
  g.hitTable(g.players[0]);
  for (let i = 0; i < 38; i++) g.update(0.05);
  assert.ok(g.current.boardProgress > 0 && g.current.boardProgress < 8);
  assert.equal(g.current.progress, 0);
  assert.equal(g.enemies.length, 0);
  for (let i = 0; i < 45; i++) g.update(0.05);
  assert.equal(g.players[0].progress, 8);
  assert.ok(g.enemies.length);
    assert.ok(g.roll.resolved,'Event is revealed on the board before play resumes');
    for(let i=0;i<120&&g.roll;i++)g.update(.05);
  assert.equal(g.roll, null);
});
test("Cat circles before pounce and recovers after charging", () => {
  const g = new Game(() => 0.5);
  const p = g.addPlayer("keyboard");
  g.start();
  p.x = 300;
  p.y = 300;
  g.spawnEvent(0);
  const e = g.enemies[0];
  e.x = 420;
  e.y = 300;
  e.tacticTime = 1;
  e.cooldown = 0;
  g.update(0.05);
  assert.notEqual(e.y, 300);
  e.state = "charge";
  e.dx = 1;
  e.dy = 0;
  e.timer = 0.01;
  g.update(0.05);
  assert.equal(e.state, "recover");
});
