import test from "node:test";
import assert from "node:assert/strict";
import { Game, EVENTS } from "../src/core.mjs";
import {
  defaultCreatureMotion,
  upgradeCreatureMotion,
} from "../src/creature-motion.mjs";
import { tickHazards } from "../src/hazards.mjs";

test("Dragon anatomy uses ground-relative positions and upgrades old saved offsets once", () => {
  const model = defaultCreatureMotion("dragon"),
    j = model.joints;
  for (const name of ["frontPawL", "frontPawR", "rearPawL", "rearPawR"])
    assert.ok(
      j[name].position[2] >= 0 && j[name].position[2] < j.pelvis.position[2],
    );
  assert.ok(j.snout.position[1] > j.head.position[1]);
  assert.ok(j.tailTip.position[1] < j.pelvis.position[1] - 30);
  assert.ok(j.hornTipL.position[2] > j.head.position[2]);
  const old = {
    joints: {
      head: { position: [5, 7, 1] },
      frontPawL: { position: [-1, 4, -6] },
    },
  };
  const upgraded = upgradeCreatureMotion("dragon", old);
  assert.deepEqual(
    upgraded.joints.head.position,
    j.head.position.map((v, i) => v + (i === 0 ? 5 : 0)),
  );
  assert.deepEqual(upgraded.joints.frontPawL.position, j.frontPawL.position);
  assert.deepEqual(upgradeCreatureMotion("dragon", upgraded), upgraded);
});

const setup = () => {
  const g = new Game(() => 0.2);
  g.scenery = [];
  g.terrain.fill("grass");
  const p = g.addPlayer("keyboard");
  g.start();
  g.openingBoard = false;
  Object.assign(p, { x: 550, y: 300, faceX: 1, faceY: 0 });
  return { g, p };
};

test("Fire elemental shoots, leaves flame at its footsteps, and drops the fire wand", () => {
  const { g } = setup();
  g.spawnEvent(EVENTS.findIndex((e) => e.kind === "fire_elemental"));
  const e = g.enemies.find((e) => e.kind === "fire_elemental");
  g.enemies = [e];
  Object.assign(e, { x: 300, y: 300, fireCooldown: 0 });
  g.update(0.05);
  assert.ok(g.fireballs.length > 0);
  assert.ok(e.x > 300);
  assert.ok(g.firePatches.some((f) => f.x === 288 && f.y === 288));
  g.random = () => 0; // Force the now-rare item-drop roll to succeed.
  g.enemyLoot(e);
  assert.ok(g.loot.some((l) => l.type === "fire_wand"));
  g.enemies = [];
});

test("Fire wand hits apply a two-second damaging burn with visible particles", () => {
  const { g, p } = setup();
  p.equipment.hand1 = "fire_wand";
  p.mana = 100;
  const target = {
    id: 900,
    kind: "golem",
    x: 580,
    y: 300,
    hp: 200,
    step: 0,
    state: "snared",
    timer: 20,
    damage: 0,
  };
  g.enemies = [target];
  assert.equal(g.fireSpell(p), true);
  assert.ok(g.spells[0].fire);
  // Run projectile collision directly to measure the exact freshly applied duration.
  g.tickAdventure(0.05, {});
  assert.ok(target.hp < 200);
  assert.equal(target.burning, 2);
  const hitHP = target.hp;
  tickHazards(g, 0.05);
  assert.ok(g.fireParticles.some((p) => p.life > 0));
  for (let i = 0; i < 39; i++) tickHazards(g, 0.05);
  assert.equal(target.burning, 0);
  assert.ok(target.hp < hitHP);
  const finishedHP = target.hp;
  tickHazards(g, 1);
  assert.equal(target.hp, finishedHP);
});
