import test from "node:test";
import assert from "node:assert/strict";
import { RIG_SUBJECTS, rigSubject } from "../src/rig-subjects.mjs";
import { poseAt, setJointKey, directionVector } from "../src/player-motion.mjs";
import {
  defaultBatMotion,
  batFrame,
  batAction,
  validateBatMotion,
} from "../src/bat-motion.mjs";
import {
  defaultCreatureMotion,
  creatureAction,
  validateCreatureMotion,
} from "../src/creature-motion.mjs";
const kinds = [
  "bat",
  "snake",
  "monkey",
  "vine",
  "golem",
  "trap",
  "dragon",
  "fire_elemental",
  "water_elemental",
];
for (const kind of kinds)
  test(
    kind +
      " has editable keys, valid exports and renderable clips in all facings",
    () => {
      const subject = RIG_SUBJECTS[kind],
        m = subject.defaults();
      const valid = (model) =>
        kind === "bat"
          ? validateBatMotion(model)
          : validateCreatureMotion(kind, model);
      assert.ok(valid(m));
      assert.equal(rigSubject(kind), subject);
      const name = subject.selected,
        before = poseAt(m, subject.clip, 2)[name];
      setJointKey(
        m,
        subject.clip,
        2,
        name,
        before.map((v, i) => v + (i === 0 ? 2 : 0)),
      );
      assert.equal(poseAt(m, subject.clip, 2)[name][0], before[0] + 2);
      assert.ok(valid(JSON.parse(JSON.stringify(m))));
      for (const clip of Object.keys(m.clips))
        for (let d = 0; d < 8; d++) {
          const [faceX, faceY] = directionVector(d);
          let pixels = 0;
          const c = {
            fillStyle: "",
            beginPath() {},
            moveTo() {},
            lineTo() {},
            closePath() {},
            fill() {},
            fillRect(x, y, w, h) {
              assert.ok([x, y, w, h].every(Number.isFinite));
              pixels += Math.max(0, w * h);
            },
          };
          subject.draw(
            c,
            {
              kind,
              sprite: kind,
              faceX,
              faceY,
              animationAction: clip,
              playerFrame: 3,
            },
            0,
            m,
          );
          assert.ok(pixels > 20, kind + " " + clip + " " + d);
        }
      m.joints[name].position[0] = Infinity;
      assert.equal(valid(m), false);
    },
  );
test("Bat flaps while hovering and dives on the charge timer", () => {
  const m = defaultBatMotion();
  assert.notEqual(batFrame({}, 0, m), batFrame({}, 0.1, m));
  assert.equal(batAction({ state: "charge" }), "dive");
  assert.equal(
    batFrame({ state: "charge", timer: 0.25, motionDuration: 0.5 }, 0),
    1.5,
  );
  assert.notDeepEqual(
    poseAt(m, "fly", 2).wingTipL,
    poseAt(m, "fly", 6).wingTipL,
  );
  assert.equal(m.visibility.eyeL[4], false);
});
test("Snake coils, plant stays rooted, golem raises fists and trap closes jaws", () => {
  const snake = defaultCreatureMotion("snake");
  assert.notDeepEqual(
    poseAt(snake, "coil", 4).segment5,
    poseAt(snake, "slither", 4).segment5,
  );
  const plant = defaultCreatureMotion("vine");
  for (const clip of Object.keys(plant.clips))
    for (let f = 0; f < 8; f++)
      assert.deepEqual(poseAt(plant, clip, f).pelvis, [0, 0, 1]);
  assert.ok(
    poseAt(plant, "windup", 7).jawTop[2] > poseAt(plant, "idle", 0).jawTop[2],
  );
  const golem = defaultCreatureMotion("golem");
  assert.ok(
    poseAt(golem, "windup", 7).handR[2] > poseAt(golem, "windup", 0).handR[2],
  );
  assert.equal(creatureAction("monkey", { throwTime: 0.3 }), "throw");
  assert.equal(
    creatureAction("golem", { state: "recover", attack: 0.3 }),
    "slam",
  );
  const trap = defaultCreatureMotion("trap");
  assert.ok(poseAt(trap, "snap", 7).jawL[0] > poseAt(trap, "snap", 0).jawL[0]);
});
test("Dragon is in the main rig list and animates travel, breath and tail swipes", () => {
  const dragon = defaultCreatureMotion("dragon");
  assert.ok(RIG_SUBJECTS.dragon);
  assert.equal(creatureAction("dragon", { moving: true }), "run");
  assert.equal(creatureAction("dragon", { state: "breath" }), "breath");
  assert.equal(creatureAction("dragon", { state: "tailSwipe" }), "tailSwipe");
  assert.notDeepEqual(
    poseAt(dragon, "run", 2).wingTipL,
    poseAt(dragon, "run", 6).wingTipL,
  );
  assert.notDeepEqual(
    poseAt(dragon, "tailSwipe", 1).tailTip,
    poseAt(dragon, "tailSwipe", 6).tailTip,
  );
});
