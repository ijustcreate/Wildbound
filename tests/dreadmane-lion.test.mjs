import test from "node:test";
import assert from "node:assert/strict";
import {
  tickDreadmaneLion,
  DREADMANE_EVENT,
} from "../src/dreadmane-lion-ai.mjs";
import {
  defaultDreadmaneLionMotion,
  validateDreadmaneLionMotion,
  dreadmaneLionAction,
} from "../src/dreadmane-lion-motion.mjs";
import { poseAt } from "../src/player-motion.mjs";
import {
  creatures,
  definitionPack,
  applyDefinitions,
  rules,
} from "../src/definitions.mjs";
import { Game, EVENTS } from "../src/core.mjs";
import { rigPack } from "../src/project-rigs.mjs";
function setup(range = 60) {
  const e = {
      kind: "dreadmane_lion",
      hp: 220,
      damage: 18,
      speed: 76,
      x: 400,
      y: 400,
      faceX: 1,
      faceY: 0,
      cooldown: 0,
      flash: 0,
      frozen: 0,
    },
    p = { id: "target", hp: 100, x: 400 + range, y: 400, invuln: 0 },
    hits = [];
  const g = {
    traps: [],
    effects: [],
    onSound() {},
    projectileBlocked() {
      return false;
    },
    blocked() {
      return false;
    },
    moveActor(a, dx, dy) {
      a.x += dx;
      a.y += dy;
      return Math.hypot(dx, dy);
    },
    hurt(a, n) {
      if (a.invuln > 0) return;
      a.hp -= n;
      hits.push({ n, time: g.time || 0 });
      a.invuln = 0.75;
    },
  };
  const tick = (dt) => {
    e.cooldown -= dt;
    p.invuln = Math.max(0, p.invuln - dt);
    g.time = (g.time || 0) + dt;
    tickDreadmaneLion(g, e, [p], dt, creatures.dreadmane_lion.stats);
  };
  return { e, p, g, hits, tick };
}
test("exact donor identity, aliases, external clips and every pose survive transfer", () => {
  const m = defaultDreadmaneLionMotion();
  assert.ok(validateDreadmaneLionMotion(m));
  assert.equal(m.provenance.displayId, 39134);
  assert.equal(Object.keys(m.joints).length, 37);
  assert.equal(Object.keys(m.clips).length, 49);
  assert.equal(m.provenance.distinctSequences, 38);
  assert.equal(m.provenance.externalAnimations.length, 8);
  for (const [name, c] of Object.entries(m.clips)) {
    assert.ok(
      Math.abs(
        (c.length - (c.loop ? 0 : 1)) / c.fps -
          m.provenance.clips[name].duration,
      ) < 1e-6,
      name,
    );
    for (let frame = 0; frame < c.length; frame++)
      for (const [joint, v] of Object.entries(poseAt(m, name, frame)))
        assert.ok(v.every(Number.isFinite), name + ":" + joint);
  }
  assert.deepEqual(m.clips.rip.keys, m.clips.claw_left.keys);
  assert.notDeepEqual(m.clips.walk.keys, m.clips.run.keys);
  assert.notDeepEqual(poseAt(m, "sleep", 0), poseAt(m, "idle", 0));
});
test("new enemy is independently registered, persisted and spawned", () => {
  assert.notEqual(creatures.dreadmane_lion, creatures.lion);
  assert.notEqual(creatures.dreadmane_lion.stats, creatures.lion.stats);
  const old = JSON.stringify(definitionPack(EVENTS, {}).lion),
    pack = rigPack(EVENTS, {});
  assert.ok(pack.dreadmane_lion);
  applyDefinitions(
    { version: 1, dreadmane_lion: pack.dreadmane_lion },
    EVENTS,
    {},
  );
  assert.equal(JSON.stringify(definitionPack(EVENTS, {}).lion), old);
  const g = new Game(() => 0.4);
  g.addPlayer("keyboard", "Tester");
  g.start();
  g.spawnEvent(EVENTS.findIndex((e) => e.kind === "dreadmane_lion"));
  const lion = g.enemies.find((e) => e.kind === "dreadmane_lion");
  assert.ok(lion);
  assert.equal(lion.hp, DREADMANE_EVENT.hp);
  assert.equal(
    dreadmaneLionAction({ ...lion, hp: 0, animationAction: "claw_left" }),
    "death",
  );
});
test("claw combo telegraphs and hits exactly twice through normal invulnerability", () => {
  const { tick, e, hits } = setup();
  tick(0.01);
  assert.equal(e.dreadAction, "claw_left");
  tick(0.4);
  assert.equal(hits.length, 0);
  tick(0.04);
  assert.equal(hits.length, 1);
  for (let i = 0; i < 17; i++) tick(0.1);
  assert.equal(hits.length, 2);
  assert.ok(hits[1].time - hits[0].time >= 0.75);
  assert.equal(e.state, "recover");
});
test("leaving the locked claw arc avoids its hit and hidden targets are not hit", () => {
  const { tick, e, p, hits, g } = setup();
  tick(0.01);
  p.y += 120;
  tick(0.5);
  assert.equal(hits.length, 0);
  p.y = 400;
  g.projectileBlocked = () => true;
  tick(0.6);
  assert.equal(e.dreadAction, "claw_right");
  tick(0.5);
  assert.equal(hits.length, 0);
});
test("roar waits for its impact, respects line of sight and immunity, then recovers", () => {
  const { tick, e, p, hits, g } = setup(110);
  e.dreadRoarCooldown = 0;
  tick(0.01);
  assert.equal(e.dreadAction, "roar");
  tick(0.8);
  assert.equal(hits.length, 0);
  tick(0.09);
  assert.equal(hits.length, 1);
  assert.equal(p.stun, 0.55);
  tick(1.3);
  assert.equal(hits.length, 1);
  assert.equal(e.state, "recover");
  for (const immune of [true, false]) {
    const a = setup(100);
    a.e.dreadRoarCooldown = 0;
    a.tick(0.01);
    if (immune) a.p.invuln = 10;
    else a.g.projectileBlocked = () => true;
    a.tick(1);
    assert.equal(a.hits.length, 0);
    assert.equal(a.p.stun, undefined);
  }
});
test("pounce locks its lane, has a crouch tell and hits a crossed target once", () => {
  const { tick, e, p, hits } = setup(170);
  e.dreadPounceCooldown = 0;
  tick(0.01);
  assert.equal(e.dreadAction, "cower");
  const x = e.x;
  tick(0.69);
  assert.equal(e.x, x);
  tick(0.02);
  assert.equal(e.dreadAction, "pounce");
  tick(1.2);
  assert.equal(hits.length, 1);
  assert.ok(e.x > x + 150);
  tick(0.4);
  assert.equal(hits.length, 1);
  const b = setup(170);
  b.e.dreadPounceCooldown = 0;
  b.tick(0.01);
  b.p.y += 100;
  b.tick(0.71);
  b.tick(1.2);
  assert.equal(b.hits.length, 0);
  assert.equal(b.e.y, 400);
});
test("pounce cannot tunnel through walls or hit targets beyond them on a long frame", () => {
  const { tick, e, hits, g } = setup(170);
  e.dreadPounceCooldown = 0;
  tick(0.01);
  tick(0.71);
  g.moveActor = (a, dx, dy) => {
    if (a.x + dx > 465) return 0;
    a.x += dx;
    a.y += dy;
    return Math.hypot(dx, dy);
  };
  g.projectileBlocked = (x) => x >= 465;
  tick(2);
  assert.ok(e.x < 465);
  assert.equal(hits.length, 0);
});
test("saving during a pounce preserves the one-hit registry", () => {
  const { tick, e, hits } = setup(130);
  e.dreadPounceCooldown = 0;
  tick(0.01);
  tick(0.71);
  tick(0.75);
  assert.equal(hits.length, 1);
  Object.assign(e, JSON.parse(JSON.stringify(e)));
  tick(0.7);
  assert.equal(hits.length, 1);
});
test("interrupt and capture traps cancel an active combo", () => {
  for (const variant of ["interrupt", "capture"]) {
    const { tick, e, g, hits } = setup();
    tick(0.01);
    g.traps.push({ x: e.x, y: e.y, life: 10, variant });
    tick(0.3);
    assert.equal(g.traps[0].life, 0);
    assert.equal(e.state, variant === "interrupt" ? "recover" : "snared");
    tick(1);
    assert.equal(hits.length, 0);
    if (variant === "capture") {
      assert.ok(e.timer <= rules.captureTime);
      tick(rules.captureTime);
      assert.equal(e.hp, 0);
    }
  }
});
test("taking a hit cancels a claw and exposes the hurt animation", () => {
  const { tick, e, hits } = setup();
  tick(0.01);
  e.flash = 0.2;
  tick(0.3);
  assert.equal(e.animationAction, "hurt");
  e.flash = 0;
  tick(0.7);
  assert.equal(hits.length, 0);
  assert.equal(e.state, "recover");
});
test("no target leads through sleep-down and sleep; target wakes the lion", () => {
  const { e, g, p } = setup(100);
  const t = (dt) =>
    tickDreadmaneLion(g, e, [], dt, creatures.dreadmane_lion.stats);
  t(6.1);
  assert.equal(e.dreadAction, "sleep_down");
  t(1.4);
  assert.equal(e.dreadAction, "sleep");
  tickDreadmaneLion(g, e, [p], 2.1, creatures.dreadmane_lion.stats);
  assert.equal(e.dreadAction, "sleep_up");
  tickDreadmaneLion(g, e, [p], 1.4, creatures.dreadmane_lion.stats);
  assert.equal(e.state, "hunt");
});
