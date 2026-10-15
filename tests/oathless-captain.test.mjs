import test from "node:test";
import assert from "node:assert/strict";
import {
  defaultOathlessCaptainMotion,
  validateOathlessCaptainMotion,
  captainAction,
  CAPTAIN_EQUIPMENT,
} from "../src/oathless-captain-motion.mjs";
import { tickCaptain } from "../src/oathless-captain-ai.mjs";
import { poseAt } from "../src/player-motion.mjs";
import { Game, EVENTS } from "../src/core.mjs";
import {
  creatures,
  applyDefinitions,
  definitionPack,
} from "../src/definitions.mjs";
import { rigPack } from "../src/project-rigs.mjs";
import { collisionOffset, usesDoors } from "../src/navigation.mjs";
function setup(distance = 65) {
  const e = {
      id: 2,
      kind: "oathless_captain",
      hp: 190,
      damage: 17,
      speed: 68,
      x: 400,
      y: 400,
      faceX: 1,
      faceY: 0,
      cooldown: 0,
      flash: 0,
      frozen: 0,
    },
    p = { id: 1, hp: 100, x: 400 + distance, y: 400, invuln: 0 },
    hits = [];
  const g = {
    time: 0,
    traps: [],
    effects: [],
    onSound() {},
    projectileBlocked: () => false,
    blocked: () => false,
    moveActor(a, x, y) {
      a.x += x;
      a.y += y;
      return Math.hypot(x, y);
    },
    hurt(a, n) {
      if (a.invuln > 0) return;
      a.hp -= n;
      a.invuln = 0.75;
      hits.push(n);
    },
  };
  const tick = (dt) => {
    e.cooldown -= dt;
    p.invuln = Math.max(0, p.invuln - dt);
    g.time += dt;
    tickCaptain(g, e, [p], dt, creatures.oathless_captain.stats);
  };
  return { e, p, g, hits, tick };
}
test("exact captain donor imports 31 timed clips with editable native parts and finite poses", () => {
  const m = defaultOathlessCaptainMotion();
  assert.ok(validateOathlessCaptainMotion(m));
  assert.equal(captainAction({hp:10,swimming:true,moving:true}),"swim");
  assert.equal(captainAction({hp:10,swimming:true,moving:false}),"swim_idle");
  assert.equal(captainAction({hp:10,jumpHeight:12}),"jump");
  assert.equal(m.provenance.npcId, 49877);
  assert.equal(m.provenance.displayId, 36758);
  assert.equal(m.provenance.skeletonFileId, 2137789);
  assert.equal(Object.keys(m.clips).length, 31);
  for (const [name, c] of Object.entries(m.clips)) {
    assert.ok(
      Math.abs(
        (c.length - (c.loop ? 0 : 1)) / c.fps -
          m.provenance.clips[name].duration,
      ) < 1e-6,
    );
    for (let f = 0; f < c.length; f++) {
      const p = poseAt(m, name, f);
      for (const v of Object.values(p)) assert.ok(v.every(Number.isFinite));
      assert.ok(
        Math.hypot(...p.swordTip.map((v, i) => v - p.swordGrip[i])) > 5,
      );
    }
  }
  assert.notDeepEqual(m.clips.slash.keys, m.clips.thrust.keys);
  assert.ok(
    m.joints.eyeL && m.joints.earL && m.joints.hair && m.joints.shieldGrip,
  );
  assert.equal(captainAction({ hp: 0, animationAction: "slash" }), "death");
});
test("separate persisted humanoid and appended encounter preserve old indices and player rig", () => {
  const pack = rigPack(EVENTS, {}),
    old = JSON.stringify(pack.player);
  assert.ok(pack.oathless_captain);
  assert.equal(EVENTS[69].type, "friendly_npc");
  assert.equal(EVENTS[70].kind, "dreadmane_lion");
  assert.equal(EVENTS[71].kind, "oathless_captain");
  applyDefinitions(
    { version: 1, oathless_captain: pack.oathless_captain },
    EVENTS,
    {},
  );
  assert.equal(JSON.stringify(definitionPack(EVENTS, {}).player), old);
  const g = new Game(() => 0.4);
  g.addPlayer("keyboard", "Test");
  g.start();
  g.spawnEvent(71);
  const e = g.enemies.find((e) => e.kind === "oathless_captain");
  assert.ok(e);
  assert.deepEqual(e.equipment, CAPTAIN_EQUIPMENT);
  assert.equal(creatures[e.kind].rig.type, "humanoid");
  assert.equal(collisionOffset(g, e), 0);
  assert.ok(usesDoors(e));
  const imported = structuredClone(EVENTS);
  applyDefinitions({ version: 1, events: EVENTS.slice(0, 70) }, imported, {});
  assert.deepEqual(
    imported.map((e) => e.name),
    EVENTS.map((e) => e.name),
  );
});
test("sword swing telegraphs, hits once and alternates into a different thrust after recovery", () => {
  const { e, tick, hits } = setup();
  tick(0.01);
  assert.equal(e.captainAction, "slash");
  tick(0.5);
  assert.equal(hits.length, 0);
  tick(0.06);
  assert.equal(hits.length, 1);
  tick(0.5);
  assert.equal(e.state, "recover");
  tick(0.9);
  tick(0.01);
  assert.equal(e.captainAction, "thrust");
  tick(0.43);
  assert.equal(hits.length, 2);
});
test("locked aim lets sidesteps escape and walls block melee", () => {
  for (const wall of [false, true]) {
    const { p, g, tick, hits } = setup();
    tick(0.01);
    if (wall) g.projectileBlocked = () => true;
    else p.y += 100;
    tick(0.7);
    assert.equal(hits.length, 0);
  }
});
test("shield bash only staggers after real damage and has a recovery window", () => {
  for (const immune of [false, true]) {
    const { e, p, tick, hits } = setup(50);
    e.captainBashCooldown = 0;
    tick(0.01);
    assert.equal(e.captainAction, "shield_bash");
    if (immune) p.invuln = 5;
    tick(0.44);
    assert.equal(hits.length, immune ? 0 : 1);
    assert.equal((p.stun || 0) > 0, !immune);
    tick(0.4);
    assert.equal(e.state, "recover");
    assert.ok(e.captainRecovery >= 1);
  }
});
test("charge has a locked tell, collision substeps, an end strike, and JSON-safe state", () => {
  const { e, p, g, tick, hits } = setup(180);
  e.captainChargeCooldown = 0;
  tick(0.01);
  assert.equal(e.captainAction, "guard");
  p.y += 70;
  tick(0.66);
  assert.equal(e.captainAction, "charge");
  let largest = 0;
  g.moveActor = (a, x, y) => {
    largest = Math.max(largest, Math.hypot(x, y));
    if (a.x + x > 460) return 0;
    a.x += x;
    a.y += y;
    return Math.hypot(x, y);
  };
  tick(0.7);
  assert.ok(largest <= 8);
  assert.ok(e.x <= 460);
  assert.equal(e.captainAction, "charge_end");
  tick(0.3);
  assert.equal(hits.length, 0);
  assert.ok(Array.isArray(JSON.parse(JSON.stringify(e)).captainHits));
});
test("freeze, damage and capture/interrupt traps cancel attacks without applying late hits", () => {
  for (const variant of ["capture", "interrupt"]) {
    const { e, g, tick, hits } = setup();
    tick(0.01);
    e.frozen = 1;
    tick(0.7);
    assert.equal(e.captainAge, 0);
    e.frozen = 0;
    g.traps = [{ x: e.x, y: e.y, life: 5, variant }];
    tick(0.01);
    assert.equal(e.state, variant === "capture" ? "snared" : "recover");
    tick(0.7);
    assert.equal(hits.length, 0);
  }
  const { e, tick, hits } = setup();
  tick(0.01);
  e.flash = 0.2;
  tick(0.6);
  assert.equal(e.captainAction, "hurt");
  assert.equal(hits.length, 0);
});
test("editor hunt/melee/dash toggles prevent custom attacks", () => {
  const { e, p, g } = setup(50);
  e.captainBashCooldown = e.captainChargeCooldown = 0;
  tickCaptain(g, e, [p], 0.1, creatures.oathless_captain.stats, {
    hunt: false,
    melee: false,
    dash: false,
  });
  assert.equal(e.captainAction, undefined);
  assert.equal(e.moving, false);
});
