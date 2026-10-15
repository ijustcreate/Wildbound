import test from "node:test";
import assert from "node:assert/strict";
import {
  defaultMurkWolfMotion,
  murkWolfMotion,
  validateMurkWolfMotion,
  replaceMurkWolfMotion,
  murkWolfAction,
} from "../src/murk-wolf-motion.mjs";
import { wolfMotion } from "../src/wolf-motion.mjs";
import { poseAt } from "../src/player-motion.mjs";
import { rigSubject } from "../src/rig-subjects.mjs";
import { rigPack } from "../src/project-rigs.mjs";
import { applyDefinitions, creatures } from "../src/definitions.mjs";

test("Murk Wolf transfers source motion into finite native poses", () => {
  const m = defaultMurkWolfMotion();
  assert.ok(validateMurkWolfMotion(m));
  assert.equal(m.provenance.sourceAnimations, 24);
  for (const name of ["idle", "run", "bite", "howl", "death", "pounce"]) {
    const clip = m.clips[name],
      a = poseAt(m, name, 0),
      b = poseAt(m, name, Math.floor(clip.length / 2));
    assert.notDeepEqual(a, b, name + " is animated");
    for (let frame = 0; frame < clip.length; frame++)
      for (const position of Object.values(poseAt(m, name, frame)))
        assert.ok(position.every(Number.isFinite));
  }
  assert.equal(m.joints.eyeL.parent, "head");
  assert.equal(m.joints.earR.parent, "head");
  assert.equal(m.joints.nose.parent, "muzzle");
  assert.equal(m.joints.jawTip.parent, "jaw");
  assert.notDeepEqual(
    poseAt(m, "howl", 0).jawTip,
    poseAt(m, "howl", 12).jawTip,
  );
});

test("Murk Wolf saves independently and preserves editable facial sprites", () => {
  const ordinary = structuredClone(wolfMotion),
    original = defaultMurkWolfMotion(),
    edited = defaultMurkWolfMotion();
  edited.boneSprites = {
    "Murk eye L": {
      0: {
        width: 2,
        height: 1,
        palette: ["transparent", "#abcdef"],
        pixels: [1, 1],
        x: -1,
        y: 0,
      },
    },
  };
  edited.visibility.earR[0] = false;
  edited.joints.eyeL.position[0] += 1;
  try {
    applyDefinitions(
      { version: 1, murk_wolf: edited },
      [],
      {},
      { spriteOverrides: false },
    );
    const pack = rigPack([], {});
    assert.deepEqual(pack.murk_wolf, edited);
    assert.deepEqual(wolfMotion, ordinary);
    assert.notEqual(murkWolfMotion, wolfMotion);
    assert.equal(rigSubject("murk_wolf").data, murkWolfMotion);
    assert.equal(creatures.murk_wolf.testOnly, true);
    assert.notEqual(creatures.murk_wolf.stats, creatures.wolf.stats);
  } finally {
    replaceMurkWolfMotion(original);
  }
});

test("Murk Wolf rejects invalid facial edits and uses native action names", () => {
  const m = defaultMurkWolfMotion();
  m.visibility.eyeL = [true];
  assert.equal(validateMurkWolfMotion(m), false);
  const s = defaultMurkWolfMotion();
  s.boneSprites = {
    "Murk eye L": {
      0: {
        width: 1,
        height: 1,
        palette: ["transparent"],
        pixels: [8],
        x: 0,
        y: 0,
      },
    },
  };
  assert.equal(validateMurkWolfMotion(s), false);
  assert.equal(murkWolfAction({ moving: true, hp: 80 }), "run");
  assert.equal(murkWolfAction({ animationAction: "attack" }), "bite");
  assert.equal(murkWolfAction({ hp: 0 }), "death");
});
