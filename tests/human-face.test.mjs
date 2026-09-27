import test from "node:test";
import assert from "node:assert/strict";
import {
  defaultPlayerMotion,
  upgradePlayerMotion,
  validatePlayerMotion,
  HUMAN_FACE_PARTS,
  poseAt,
  setJointKey,
  drawPlayer,
} from "../src/player-motion.mjs";
test("Old human rigs gain facial joints without losing edited head poses", () => {
  const old = defaultPlayerMotion();
  for (const n of HUMAN_FACE_PARTS) {
    delete old.joints[n];
    for (const c of Object.values(old.clips))
      for (const k of c.keys) delete k.joints[n];
  }
  delete old.visibility;
  old.joints.head.position[0] = 5;
  old.clips.run.keys[2].joints.head = [3, 2, 4];
  const before = structuredClone(old),
    m = upgradePlayerMotion(old);
  assert.ok(validatePlayerMotion(old));
  assert.deepEqual(old, before);
  assert.deepEqual(m.clips.run.keys[2].joints.head, [3, 2, 4]);
  for (const n of HUMAN_FACE_PARTS) {
    assert.deepEqual(m.clips.run.keys[2].joints[n], [3, 2, 4]);
    assert.equal(m.joints[n].parent, "head");
  }
  assert.equal(m.joints.eyeL.position[0], 3);
});
test("Eye keys move only the selected eye and survive export with visibility", () => {
  const m = defaultPlayerMotion(),
    before = poseAt(m, "run", 3);
  setJointKey(m, "run", 3, "eyeL", [
    before.eyeL[0] + 4,
    before.eyeL[1],
    before.eyeL[2],
  ]);
  m.visibility.eyeL[2] = false;
  const packed = JSON.parse(JSON.stringify(m));
  assert.ok(validatePlayerMotion(packed));
  const after = poseAt(packed, "run", 3);
  assert.equal(after.eyeL[0], before.eyeL[0] + 4);
  assert.deepEqual(after.eyeR, before.eyeR);
  assert.deepEqual(after.head, before.head);
  assert.equal(packed.visibility.eyeL[2], false);
});
test("Human facial pixels follow edited anchors and hidden eyes are removed", () => {
  const m = defaultPlayerMotion();
  m.joints.eyeL.position = [-12, 3, 31.5];
  const raster = () => {
    const pixels = new Map();
    const c = {
      fillStyle: "",
      fillRect(x, y, w, h) {
        for (let a = Math.floor(x); a < x + w; a++)
          for (let b = Math.floor(y); b < y + h; b++)
            pixels.set(a + "," + b, this.fillStyle);
      },
    };
    drawPlayer(
      c,
      { faceX: 0, faceY: 1, animationAction: "idle", playerFrame: 0 },
      0,
      m,
    );
    return pixels;
  };
  assert.equal(raster().get("-12,-30"), m.palette.outline);
  m.visibility.eyeL[0] = false;
  assert.notEqual(raster().get("-12,-30"), m.palette.outline);
});
