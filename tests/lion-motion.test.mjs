import test from "node:test";
import assert from "node:assert/strict";
import {
  defaultLionMotion,
  validateLionMotion,
  lionAction,
  lionFrame,
  drawLion,
  upgradeLionMotion,
  LION_PARTS,
} from "../src/lion-motion.mjs";
import {
  poseAt,
  directionVector,
  projectPoint,
  setJointKey,
  defaultPlayerMotion,
  validatePlayerMotion,
} from "../src/player-motion.mjs";
test("Old lion rigs gain facial handles without losing edited head motion", () => {
  const old = defaultLionMotion();
  delete old.visibility;
  old.joints.head.position[0] = 3;
  for (const name of LION_PARTS) {
    delete old.joints[name];
    for (const clip of Object.values(old.clips))
      for (const key of clip.keys) delete key.joints[name];
  }
  const m = upgradeLionMotion(old);
  assert.ok(validateLionMotion(old));
  assert.equal(m.joints.earL.position[0], -1);
  for (const name of LION_PARTS)
    assert.deepEqual(
      m.clips.run.keys[2].joints[name],
      m.clips.run.keys[2].joints.head,
    );
  assert.equal(m.visibility.eyeR[2], false);
  assert.equal(m.visibility.eyeL[6], false);
  m.visibility.eyeL[0] = "yes";
  assert.equal(validateLionMotion(m), false);
});
test("Facial keys move one part independently and survive serialization", () => {
  const m = defaultLionMotion(),
    before = poseAt(m, "run", 2);
  setJointKey(
    m,
    "run",
    2,
    "earL",
    before.earL.map((v, i) => v + (i === 0 ? 3 : 0)),
  );
  const saved = JSON.parse(JSON.stringify(m));
  assert.ok(validateLionMotion(saved));
  assert.equal(poseAt(saved, "run", 2).earL[0], before.earL[0] + 3);
  assert.deepEqual(poseAt(saved, "run", 2).head, before.head);
});
test("Lion rig uses the shared pose evaluator with four paws and a connected tail", () => {
  const m = defaultLionMotion();
  assert.ok(validateLionMotion(m));
  for (const name of [
    "frontPawL",
    "frontPawR",
    "rearPawL",
    "rearPawR",
    "tailBase",
    "tailMid",
    "tailTip",
  ])
    assert.ok(m.joints[name]);
  assert.equal(m.joints.tailTip.parent, "tailMid");
  assert.equal(m.joints.tailBase.parent, "pelvis");
  const pose = poseAt(m, "run", 2);
  assert.ok(pose.frontPawR[2] > pose.frontPawL[2]);
  assert.ok(pose.rearPawL[2] > pose.rearPawR[2]);
  assert.deepEqual(poseAt(m, "run", 0), poseAt(m, "run", 8));
  setJointKey(m, "run", 3, "tailTip", [5, -28, 22]);
  assert.deepEqual(poseAt(m, "run", 3).tailTip, [5, -28, 22]);
});
test("Lion facing keeps feet below shoulders in all eight views and draws distinct silhouettes", () => {
  const m = defaultLionMotion(),
    pose = poseAt(m, "idle", 0),
    images = new Set();
  for (let d = 0; d < 8; d++) {
    assert.ok(
      projectPoint(pose.frontPawL, d).y > projectPoint(pose.shoulderL, d).y,
    );
    const [faceX, faceY] = directionVector(d),
      pixels = new Map();
    const ctx = {
      fillStyle: "",
      fillRect(x, y, w, h) {
        assert.ok([x, y, w, h].every(Number.isFinite));
        for (let yy = y; yy < y + h; yy++)
          for (let xx = x; xx < x + w; xx++)
            pixels.set(xx + "," + yy, this.fillStyle);
      },
    };
    drawLion(
      ctx,
      { faceX, faceY, animationAction: "run", playerFrame: 2 },
      0,
      m,
    );
    assert.ok(pixels.size > 150);
    images.add(JSON.stringify([...pixels.entries()].sort()));
  }
  assert.equal(images.size, 8);
});
test("Lion combat states select windup, pounce and recovery with normalized timers", () => {
  assert.equal(lionAction({ state: "windup" }), "windup");
  assert.equal(lionAction({ state: "charge" }), "pounce");
  assert.equal(lionAction({ state: "recover" }), "recover");
  assert.equal(lionAction({ moving: true }), "run");
  assert.equal(
    lionFrame({ state: "windup", timer: 1, motionDuration: 1 }, 0),
    0,
  );
  assert.equal(
    lionFrame({ state: "charge", timer: 0, motionDuration: 0.5 }, 0),
    5,
  );
  assert.equal(lionFrame({ animationAction: "run", playerFrame: 6 }, 100), 6);
});
test("Player and lion packages cannot silently replace one another", () => {
  assert.ok(!validatePlayerMotion(defaultLionMotion()));
  assert.ok(!validateLionMotion(defaultPlayerMotion()));
  const m = defaultLionMotion();
  m.shape.tailWidth = Infinity;
  assert.ok(!validateLionMotion(m));
  const broken = defaultLionMotion();
  broken.joints.tailBase.parent = "tailTip";
  assert.ok(!validateLionMotion(broken));
});
