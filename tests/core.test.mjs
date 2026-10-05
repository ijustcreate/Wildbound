import test from "node:test";
import assert from "node:assert/strict";
import {
  Game,
  CENTER,
  WORLD,
  FINISH,
  EVENTS,
  cameraTarget,
} from "../src/core.mjs";
import {
  convertRegion,
  rgbaToSprite,
  spriteToRgba,
  validateSprite,
  floodFill,
} from "../src/pixels.mjs";
function game() {
  const g = new Game(() => 0.5);
  g.addPlayer("keyboard", "Scout");
  g.addPlayer("pad:0", "Ember");
  g.start();
  return g;
}
function tick(g, seconds, inputs = {}) {
  for (let i = 0; i < seconds * 20; i++) g.update(0.05, inputs);
}
test("First hits establish order, repeated rolls wait until the next round", () => {
  const g = game(),
    [a, b] = g.players;
  g.diceCount=1;
  assert.equal(g.current, null);
  assert.ok(g.hitTable(b));
  assert.equal(g.hitTable(a), false);
  while(g.roll)tick(g,.05);
  while(g.rollCooldown>0)tick(g,.05);
  assert.equal(g.hitTable(b), false);
  assert.ok(g.hitTable(a));
  while(g.roll)tick(g,.05);
  while(g.rollCooldown>0)tick(g,.05);
  assert.deepEqual(g.turnOrder, [b.id, a.id]);
  assert.equal(g.current, b);
  assert.equal(g.hitTable(a), false);
  assert.ok(g.hitTable(b));
});
test("First round admits up to six unique devices then locks roster", () => {
  const g = game();
  g.diceCount=1;
  assert.equal(g.addPlayer("keyboard"), null);
  for (let i = 1; i < 5; i++) assert.ok(g.addPlayer("pad:" + i));
  assert.equal(g.players.length, 6);
  assert.equal(g.addPlayer("extra"), null);
  for (let i = 0; i < 6; i++) {
    g.hitTable(g.players[i]);
    while(g.roll)tick(g,.05);
    while(g.rollCooldown>0)tick(g,.05);
    for (const p of g.players) p.hp = 100;
  }
  assert.equal(g.round, 2);
  assert.ok(g.locked);
  assert.equal(g.addPlayer("late"), null);
  assert.ok(g.players.every((p) => p.rolls === 1));
});
test("Later rolls keep previously summoned creatures", () => {
  const g = game();
  g.hitTable(g.current || g.players.find((p) => !p.rolls));
  while(g.roll)tick(g,.05);
  const lionId = g.enemies[0].id;
  while(g.rollCooldown>0)tick(g,.05);
  g.hitTable(g.current || g.players.find((p) => !p.rolls));
  while(g.roll)tick(g,.05);
  assert.ok(g.enemies.some((e) => e.id === lionId));
  assert.ok(g.enemies.length > 1);
});
test("A roll still moves the piece and can summon another event over a live wave", () => {
  const g = game(),
    p = g.players[0];
  g.spawnEvent(0);
  const existing = g.enemies.length,
    startProgress = p.progress;
  assert.ok(g.hitTable(p));
  tick(g, 5);
  assert.ok(p.progress > startProgress);
  assert.ok(g.enemies.length > existing);
  assert.ok(g.eventTime > 0);
});
test("All events have working spawns, including mixed squads", () => {
  const g = game();
  for (let i = 0; i < EVENTS.length; i++) {
    g.enemies = [];
    g.mystery=null;
    g.generatedEnvironment=EVENTS[i].environment||'forest';
    g.spawnEvent(i);
    if(EVENTS[i].type==='mystery'){
      assert.equal(g.mystery.stage,1);
      assert.equal(g.enemies.length,EVENTS[i].mystery.goal==='recover'?0:EVENTS[i].mystery.count);
      if(EVENTS[i].mystery.goal==='recover')assert.ok(g.mystery.object);
      continue;
    }
    assert.equal(g.enemies.length, EVENTS[i].count+(EVENTS[i].spiderNest?3:0));
    if(EVENTS[i].spiderNest)g.enemies=g.enemies.filter(e=>e.kind!=='spider_egg');
    assert.ok(g.enemies.every((e) => e.hp > 0 && (EVENTS[i].squad ? EVENTS[i].squad.includes(e.kind) : EVENTS[i].mixedSkeletons ? ["skeleton","archer"].includes(e.kind) : EVENTS[i].wizardEscort ? ["skeleton_wizard","skeleton"].includes(e.kind) : e.kind === EVENTS[i].kind)));
  }
});
test("Traps capture creatures and remove them after a delay", () => {
  const g = game(),
    p = g.players[0];
  g.spawnEvent(0);
  const e = g.enemies[0];
  g.traps.push({ x: e.x, y: e.y, life: 30 });
  tick(g, 0.1);
  assert.equal(e.state, "snared");
  tick(g, 2.1);
  assert.equal(g.enemies.length, 0);
  assert.equal(g.cleared, 1);
});
test("Reviving needs a nearby living player holding interact", () => {
  const g = game();
  g.players[0].hp = 0;
  g.players[1].x = g.players[0].x + 20;
  g.players[1].y = g.players[0].y;
  tick(g, 1);
  assert.equal(g.players[0].hp, 0);
  tick(g, 1.8, { "pad:0": { interact: true } });
  assert.equal(g.players[0].hp, 55);
});
test("All players down ends expedition", () => {
  const g = game();
  g.players.forEach((p) => (p.hp = 0));
  g.update(0.05);
  assert.equal(g.phase, "lost");
});
test("A finisher holds interact to seal even with enemies and unfinished friends", () => {
  const g = game(),
    p = g.players[0];
  p.progress = FINISH;
  p.x = CENTER;
  p.y = CENTER - 100;
  g.spawnEvent(0);
  assert.equal(g.hitTable(p), false);
  assert.equal(g.phase, "play");
  tick(g, 2.6, { [p.device]: { interact: true } });
  assert.equal(g.phase, "sealing");
  tick(g, 3.1);
  assert.equal(g.phase, "won");
  assert.equal(g.enemies.length, 0);
  assert.equal(g.scenery.length, 0);
  const seed = g.seed;
  g.hitTable(p);
  assert.equal(g.phase, "play");
  assert.notEqual(g.seed, seed);
  assert.equal(p.progress, 0);
});
test("Movement respects world boundary and table collider", () => {
  const g = game(),
    p = g.players[0];
  p.x = WORLD - 25;
  p.y = 100;
  tick(g, 2, { keyboard: { x: 1 } });
  assert.ok(p.x <= WORLD - 24);
  p.x = CENTER - 150;
  p.y = CENTER;
  tick(g, 1, { keyboard: { x: 1 } });
  assert.ok(p.x <= CENTER - 88);
});
test("Camera zoom follows party spacing, follows remote cluster, stays on map", () => {
  const close = cameraTarget(
      [
        { x: 800, y: 800 },
        { x: 810, y: 810 },
      ],
      700,
      400,
    ),
    far = cameraTarget(
      [
        { x: 300, y: 300 },
        { x: 1300, y: 1300 },
      ],
      700,
      400,
    );
  assert.ok(close.zoom > far.zoom);
  const remote = cameraTarget(
    [
      { x: 400, y: 400 },
      { x: 420, y: 420 },
    ],
    700,
    400,
  );
  assert.ok(remote.x < 600);
  const edge = cameraTarget([{ x: 0, y: 0 }], 700, 400);
  assert.ok(edge.x >= 700 / edge.zoom / 2);
});
test("RGBA pixel assets preserve transparent pixels and colors", () => {
  const d = new Uint8ClampedArray([255, 20, 40, 255, 0, 0, 0, 0]);
  const s = rgbaToSprite(d, 2, 1);
  assert.ok(validateSprite(s));
  assert.deepEqual(Array.from(spriteToRgba(s)), Array.from(d));
});
test("Crop conversion fits exact dimensions and removes connected background", () => {
  const data = new Uint8ClampedArray(10 * 10 * 4);
  for (let i = 0; i < data.length; i += 4) data.set([255, 255, 255, 255], i);
  for (let y = 3; y < 7; y++)
    for (let x = 3; x < 7; x++) data.set([200, 20, 20, 255], (y * 10 + x) * 4);
  const s = convertRegion(
    { data, width: 10, height: 10 },
    { x: 0, y: 0, w: 10, h: 10 },
    32,
    { removeBackground: true, tolerance: 10 },
  );
  assert.equal(s.width, 32);
  assert.equal(s.pixels.length, 1024);
  assert.equal(s.pixels[0], 0);
  assert.ok(s.palette.includes("#c81414"));
  assert.ok(!s.palette.includes("#ffffff"));
});
test("Flood fill stays within connected region", () => {
  const s = {
    width: 3,
    height: 3,
    palette: ["transparent", "#ffffff", "#000000"],
    pixels: [0, 1, 0, 0, 1, 0, 0, 1, 0],
  };
  floodFill(s, 0, 0, 2);
  assert.deepEqual(s.pixels, [2, 1, 0, 2, 1, 0, 2, 1, 0]);
});
test("Malformed imported sprite data is rejected", () => {
  assert.equal(
    validateSprite({
      width: 999999,
      height: 1,
      palette: ["transparent"],
      pixels: [],
    }),
    false,
  );
  assert.equal(
    validateSprite({
      width: 1,
      height: 1,
      palette: ["transparent", "url(x)"],
      pixels: [1],
    }),
    false,
  );
});
test("Camera can frame players at opposite world corners", () => {
  const p = [
      { x: 24, y: 24 },
      { x: 1576, y: 1576 },
    ],
    c = cameraTarget(p, 700, 300);
  for (const q of p) {
    assert.ok(Math.abs(q.x - c.x) * c.zoom < 350);
    assert.ok(Math.abs(q.y - c.y) * c.zoom < 150);
  }
});
test("Enemies can navigate around the table", () => {
  const g = game();
  g.players.forEach((p, i) => {
    p.x = CENTER + i * 10;
    p.y = CENTER + 150;
  });
  g.generatedEnvironment="temple"; // Monkey events are temple-exclusive.
  g.spawnEvent(4);
  g.enemies = g.enemies.slice(0, 1);
  const e = g.enemies[0];
  e.x = CENTER;
  e.y = CENTER - 110;
  let reached=false;
  for(let i=0;i<100;i++){g.update(.05);if(e.y>CENTER+60)reached=true;}
  // A shorter detour can reach the player and start fleeing before five seconds.
  assert.ok(reached);
});
