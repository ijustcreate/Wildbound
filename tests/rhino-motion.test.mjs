import test from "node:test";
import assert from "node:assert/strict";
import {
  defaultRhinoMotion,
  validateRhinoMotion,
  rhinoAction,
  rhinoFrame,
  drawRhino,
} from "../src/rhino-motion.mjs";
import { poseAt, setJointKey, directionVector } from "../src/player-motion.mjs";
test("Rhino has independent horn keys, eight facings and valid serialized clips", () => {
  const m = defaultRhinoMotion();
  assert.ok(validateRhinoMotion(m));
  const before = poseAt(m, "run", 2);
  setJointKey(m, "run", 2, "hornTip", [0, 34, 27]);
  assert.deepEqual(poseAt(m, "run", 2).hornTip, [0, 34, 27]);
  assert.deepEqual(poseAt(m, "run", 2).head, before.head);
  assert.ok(validateRhinoMotion(JSON.parse(JSON.stringify(m))));
  for (let d = 0; d < 8; d++) {
    const [faceX, faceY] = directionVector(d);
    let count = 0;
    const c = {
      fillStyle: "",
      fillRect(x, y, w, h) {
        assert.ok([x, y, w, h].every(Number.isFinite));
        count += w * h;
      },
    };
    drawRhino(
      c,
      { faceX, faceY, animationAction: "run", playerFrame: 2 },
      0,
      m,
    );
    assert.ok(count > 200);
  }
  m.joints.hornTip.position[2] = Infinity;
  assert.equal(validateRhinoMotion(m), false);
});
test("Stampeding rhinos use movement-driven charge motion and editable facial visibility", () => {
  const m = defaultRhinoMotion();
  assert.equal(rhinoAction({ state: "stampede" }), "charge");
  assert.equal(rhinoAction({ state: "snared" }), "snared");
  assert.ok(
    rhinoFrame({ state: "stampede", step: 8 }, 1) >
      rhinoFrame({ state: "stampede", step: 1 }, 1),
  );
  assert.notDeepEqual(
    poseAt(m, "charge", 2).frontPawL,
    poseAt(m, "charge", 6).frontPawL,
  );
  m.visibility.hornTip.fill(false);
  assert.ok(validateRhinoMotion(m));
  assert.equal(m.visibility.eyeR[2], false);
});
