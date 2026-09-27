import test from "node:test";
import assert from "node:assert/strict";
import {
  defaultPlayerMotion,
  validatePlayerMotion,
  poseAt,
  facingIndex,
  directionVector,
  projectPoint,
  screenDelta,
  setJointKey,
  playerAction,
  playerFrame,
  descendants,
} from "../src/player-motion.mjs";

test("Player facing resolves all eight directions without rotating vertical anatomy", () => {
  const model = defaultPlayerMotion(),
    p = poseAt(model, "idle", 0);
  for (let d = 0; d < 8; d++) {
    const [x, y] = directionVector(d);
    assert.equal(facingIndex(x, y), d);
    assert.ok(projectPoint(p.head, d).y < projectPoint(p.pelvis, d).y - 10);
    assert.ok(projectPoint(p.pelvis, d).y < projectPoint(p.footL, d).y - 10);
  }
  assert.ok(projectPoint(p.handR, 0).x > 0);
  assert.ok(projectPoint(p.handR, 4).x < 0);
});
test("Run loop alternates planted and lifted feet and wraps continuously", () => {
  const m = defaultPlayerMotion(),
    a = poseAt(m, "run", 2),
    b = poseAt(m, "run", 6);
  assert.ok(a.footR[2] > a.footL[2] + 4);
  assert.ok(b.footL[2] > b.footR[2] + 4);
  assert.deepEqual(poseAt(m, "run", 0), poseAt(m, "run", 8));
  const before = poseAt(m, "run", 7.999),
    after = poseAt(m, "run", 0);
  assert.ok(
    Math.hypot(...before.handR.map((v, i) => v - after.handR[i])) < 0.02,
  );
});
test("Joint editing preserves other tracks and runtime samples the exact keyed pose", () => {
  const m = defaultPlayerMotion(),
    before = poseAt(m, "run", 3),
    target = [9, 4, 21];
  setJointKey(m, "run", 3, "handR", target);
  assert.deepEqual(poseAt(m, "run", 3).handR, target);
  assert.deepEqual(poseAt(m, "run", 3).footL, before.footL);
  assert.ok(validatePlayerMotion(m));
  assert.deepEqual(descendants(m, "elbowR"), ["elbowR", "handR"]);
});
test("Screen dragging is invertible for all eight facings", () => {
  for (let d = 0; d < 8; d++) {
    const p = projectPoint(screenDelta(5, -7, d), d);
    assert.ok(Math.abs(p.x - 5) < 1e-9);
    assert.ok(Math.abs(p.y + 7) < 1e-9);
  }
});
test("Combat and movement use one deterministic clip selector", () => {
  assert.equal(playerAction({ moving: true }), "run");
  assert.equal(playerAction({ moving: true, dashTime: 0.2 }), "dash");
  assert.equal(playerAction({ attack: 0.2 }), "punch");
  assert.equal(
    playerAction({ attack: 0.2, equipment: { hand1: "sword" } }),
    "slash",
  );
  assert.equal(
    playerAction({ charge: 0.5, equipment: { hand1: "bow" } }),
    "draw",
  );
  assert.equal(playerAction({ blocking: true }), "block");
  assert.equal(playerFrame({ animationAction: "run", playerFrame: 3 }, 100), 3);
  assert.equal(playerFrame({ animationAction: "run", step: 0.13 * 88 }, 0), 8);
});
test("Player packages reject broken topology, nonfinite keys and duplicate frames", () => {
  const m = defaultPlayerMotion();
  assert.ok(validatePlayerMotion(m));
  m.joints.head.parent = "head";
  assert.equal(validatePlayerMotion(m), false);
  const a = defaultPlayerMotion();
  a.clips.run.keys[0].joints.handR[0] = Infinity;
  assert.equal(validatePlayerMotion(a), false);
  const b = defaultPlayerMotion();
  b.clips.run.keys[1].frame = 0;
  assert.equal(validatePlayerMotion(b), false);
});
