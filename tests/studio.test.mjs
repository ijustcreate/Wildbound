import test from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { Game } from "../src/core.mjs";
import {
  rules,
  creatures,
  rigPreset,
  validateRig,
} from "../src/definitions.mjs";
import { generateWorld } from "../src/world.mjs";
import { saveSession, restoreSession } from "../src/session.mjs";
import { give, count } from "../src/items.mjs";
import { drawRig } from "../src/rig-render.mjs";
import { cleanInput } from "../src/rooms.mjs";
test("All default rigs have valid acyclic attachment trees", () => {
  for (const c of Object.values(creatures))
    assert.ok(validateRig(c.rig), c.name);
  const r = rigPreset("humanoid");
  r.parts[0].parent = r.parts[1].name;
  assert.equal(validateRig(r), false);
});
test("Session restores gear, arrows, private storage and portal timers", () => {
  const g = new Game();
  const p = g.addPlayer("keyboard");
  g.start();
  give(p.inventory, "arrow", 7);
  give(p.chests[0], "sword");
  g.portal(p);
  { const entryDoor = g.portals.find(d=>d.owner===p.id); p.x = entryDoor.x; p.y = entryDoor.y; g.enterRoom(p, entryDoor); }
  g.arrows.push({ id: 42, x: 120, y: 340, stuck: true, enemy: 99 });
  const h = restoreSession(JSON.parse(JSON.stringify(saveSession(g))));
  assert.equal(count(h.players[0], "arrow"), 7);
  assert.equal(h.players[0].chests[0][0].type, "sword");
  assert.equal(h.portals[0].id, h.players[0].room);
  assert.equal(h.arrows[0].enemy, 99);
  h.trapCooldown = 0;
  h.players[0].room = null;
  h.trap(h.players[0]);
  assert.equal(h.players[0].traps, 2);
});
test("Seeded rivers and bridges are reproducible and span both banks", () => {
  const a = generateWorld(53),
    b = generateWorld(53),
    c = generateWorld(54);
  assert.deepEqual(a, b);
  assert.notDeepEqual(a.scenery, c.scenery);
  assert.equal(a.terrain.filter((t) => t === "bridge").length, 54);
  for (const row of [8, 24, 40])
    assert.equal(
      a.terrain.slice(row * 50, row * 50 + 50).filter((t) => t === "water")
        .length,
      0,
    );
  assert.equal(a.terrain[25 * 50 + 25], "grass");
});
test("Water blocks movement but bridge deck is passable", () => {
  const g = new Game(() => 0.2);
  g.scenery = [];
  const wi = g.terrain.findIndex((t) => t === "water"),
    bi = g.terrain.findIndex((t) => t === "bridge");
  assert.equal(
    g.blocked((wi % 50) * 32 + 16, Math.floor(wi / 50) * 32 + 2, 1),
    true,
  );
  assert.equal(
    g.blocked((bi % 50) * 32 + 16, Math.floor(bi / 50) * 32 + 2, 1),
    false,
  );
});
test("Up facing moves main-hand sword to opposite screen side", () => {
  const swordX = (face) => {
    let tx = 0,
      stack = [],
      color = "",
      sword;
    const c = {
      save() {
        stack.push(tx);
      },
      restore() {
        tx = stack.pop();
      },
      translate(x) {
        tx += x;
      },
      rotate() {},
      fillRect(x, y, w, h) {
        if (color === "#d4dfdb" && h === 22) sword = tx + x;
      },
      set fillStyle(v) {
        color = v;
      },
      get fillStyle() {
        return color;
      },
    };
    drawRig(
      c,
      { canvas: () => null },
      { equipment: { hand1: "sword" }, faceX: 0, faceY: face, moving: false },
      0,
      rigPreset("humanoid"),
    );
    return sword;
  };
  assert.ok(swordX(1) > 0);
  assert.ok(swordX(-1) < 0);
});
test("Behavior modules turn off pursuit and contact damage independently", () => {
  const g = new Game(() => 0.2);
  g.scenery = [];
  g.terrain.fill("grass");
  const p = g.addPlayer("keyboard");
  p.x = 500;
  p.y = 500;
  g.start();
  g.spawnEvent(0);
  const e = g.enemies[0];
  e.x = 520;
  e.y = 500;
  e.cooldown = 0;
  const before = structuredClone(creatures.lion);
  try {
    creatures.lion.behaviors = {
      hunt: false,
      circle: false,
      dash: false,
      melee: false,
    };
    for (let i = 0; i < 10; i++) g.update(0.05, {});
    assert.equal(p.hp, 100);
    assert.equal(e.x, 520);
  } finally {
    creatures.lion = before;
  }
});
test("Network input rejects nonfinite and unknown fields", () => {
  assert.deepEqual(cleanInput({ x: Infinity, y: 99, attack: 1, admin: true }), {
    x: 0,
    y: 1,
    attack: true,
  });
});
test(
  "Room transport joins with code, relays input, and carries authoritative state",
  { timeout: 6000 },
  async () => {
    const require = createRequire(import.meta.url),
      { RoomTransport } = require("../network.cjs");
    let resolveHello, resolveInput, resolveState;
    const hello = new Promise((r) => (resolveHello = r)),
      input = new Promise((r) => (resolveInput = r)),
      state = new Promise((r) => (resolveState = r));
    const host = new RoomTransport((d) => {
        if (d.type === "hello") resolveHello(d);
        if (d.type === "input") resolveInput(d);
      }),
      guest = new RoomTransport((d) => {
        if (d.type === "state") resolveState(d);
      });
    try {
      const { address } = await host.host();
      await guest.join("127.0.0.1:" + address.split(":")[1], "Ember");
      assert.equal((await hello).name, "Ember");
      guest.send({ type: "input", input: { attack: true }, peer: "spoofed" });
      assert.notEqual((await input).peer, "spoofed");
      host.send({ type: "state", state: { phase: "play", round: 2 } });
      assert.equal((await state).state.round, 2);
    } finally {
      guest.stop();
      host.stop();
    }
  },
);
