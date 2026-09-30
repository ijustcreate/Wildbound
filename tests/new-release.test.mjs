import { paintItem } from "../src/item-art.mjs";
import test from "node:test";
import assert from "node:assert/strict";
import { Game } from "../src/core.mjs";
import { ITEMS, rollGear } from "../src/items.mjs";
import { characterNameError } from "../src/profiles.mjs";
import {
  creatures,
  definitionPack,
  applyDefinitions,
} from "../src/definitions.mjs";
import { RIG_SUBJECTS } from "../src/rig-subjects.mjs";
import { poseAt, setJointKey, directionVector } from "../src/player-motion.mjs";
const setup = () => {
  const g = new Game(() => 0.5);
  g.addPlayer("keyboard");
  g.start();
  return g;
};
test("Character names reject case and whitespace duplicates", () => {
  assert.ok(characterNameError("  EMBER ", [{ id: "a", name: "Ember" }]));
  assert.ok(characterNameError("x", []));
  assert.equal(characterNameError("Scout", []), "");
});
test("Low-level victory rewards scale with party size and guarantee a rare", () => {
  const g = setup();
  g.sharedStash = Array.from({ length: 24 }, () => ({ type: "sword", qty: 1 }));
  g.dropLoot(400, 400, "hat");
  g.completeVictory();
  assert.deepEqual(g.loot, []);
  assert.equal(g.victoryRewards.length, 5);
  assert.equal(g.victoryRewards.filter((i) => ITEMS[i.type].rarity === "rare").length, 1);
  assert.equal(g.victoryRewards.filter((i) => ITEMS[i.type].rarity === "legendary").length, 0);
  assert.ok(g.victoryRewards.every((i) => i.qty === 1));
  const rewards = structuredClone(g.victoryRewards);
  g.completeVictory();
  assert.deepEqual(g.victoryRewards, rewards);
  const seed = g.seed;
  g.newExpedition();
  assert.notEqual(g.seed, seed);
  assert.deepEqual(g.loot, []);
  assert.deepEqual(g.victoryRewards, rewards);
  assert.equal(g.current, null);
});test("Ordinary loot and boss equipment never award legendary items", () => {
  for (let n = 0; n < 100; n++)
    assert.notEqual(ITEMS[rollGear(() => n / 100)].rarity, "legendary");
  const g = setup();
  g.random = () => 0; // Force rare item rolls to exercise their rarity rules.
  g.enemyLoot({ kind: "skeleton_boss", x: 400, y: 400, id: 70 });
  assert.ok(g.loot.length);
  assert.ok(g.loot.every((l) => ITEMS[l.type].rarity !== "legendary"));
});
test("Melee rejects targets behind or outside the facing cone even at close range", () => {
  const g = setup(),
    p = g.players[0];
  Object.assign(p, { x: 300, y: 300, faceX: 1, faceY: 0 });
  g.enemies = [
    { id: 1, x: 320, y: 300, hp: 100 },
    { id: 2, x: 290, y: 300, hp: 100 },
    { id: 3, x: 305, y: 320, hp: 100 },
  ];
  g.attack(p);
  assert.ok(g.enemies[0].hp < 100);
  assert.equal(g.enemies[1].hp, 100);
  assert.equal(g.enemies[2].hp, 100);
});
test("Board attacks require proximity and facing the smaller collider", () => {
  const g = setup(),
    p = g.players[0];
  Object.assign(p, { x: 800, y: 700, faceX: 0, faceY: 1 });
  assert.equal(g.canHitBoard(p), false);
  p.y = 750;
  assert.ok(g.canHitBoard(p));
  p.faceY = -1;
  assert.equal(g.canHitBoard(p), false);
});
test("Panther defaults pounce half as far and recover its cooldown faster", () => {
  assert.ok(
    creatures.panther.stats.dashDistance < creatures.lion.stats.dashDistance,
  );
  assert.ok(
    creatures.panther.stats.dashCooldown < creatures.lion.stats.dashCooldown,
  );
});
test("Plant poison projectile applies a timed debuff and resistant gear prevents it", () => {
  const g = setup(),
    p = g.players[0];
  p.x = 300;
  p.y = 300;
  g.poisonShots = [
    { x: 300, y: 300, vx: 0, vy: 0, life: 2, damage: 2, duration: 4 },
  ];
  g.update(0.05);
  assert.ok(p.poison > 0);
  const hp = p.hp;
  for (let n = 0; n < 25; n++) g.update(0.05);
  assert.ok(p.hp < hp);
  p.poison = 0;
  p.invuln = 0;
  p.equipment.chest = "ember_robe";
  g.poisonShots = [
    { x: 300, y: 300, vx: 0, vy: 0, life: 2, damage: 2, duration: 4 },
  ];
  g.update(0.05);
  assert.equal(p.poison, 0);
});
for (const kind of [
  "panther",
  "boar",
  "beetle",
  "crocodile",
  "skeleton",
  "archer",
  "skeleton_unarmed",
  "skeleton_boss",
])
  test(
    kind +
      " shares editable, saveable animation with finite rendering in eight facings",
    () => {
      globalThis.document ||= { createElement() { return { getContext() { return { fillRect() {} }; } }; } };
      const s = RIG_SUBJECTS[kind],
        m = s.defaults();
      s.replace(m);
      const p = poseAt(m, s.clip, 2)[s.selected];
      setJointKey(m, s.clip, 2, s.selected, [p[0] + 2, p[1], p[2]]);
      s.replace(m);
      const pack = JSON.parse(JSON.stringify(definitionPack([], ITEMS)));
      applyDefinitions(pack, [], ITEMS);
      assert.equal(poseAt(s.data, s.clip, 2)[s.selected][0], p[0] + 2);
      for (const action of Object.keys(m.clips))
        for (let d = 0; d < 8; d++) {
          const [faceX, faceY] = directionVector(d);
          let count = 0;
          s.draw(
            {
              drawImage() {}, save() {}, restore() {}, translate() {}, scale() {}, rotate() {},
              fillRect(...v) {
                assert.ok(v.every(Number.isFinite));
                count++;
              },
            },
            {
              kind,
              sprite: kind,
              faceX,
              faceY,
              animationAction: action,
              playerFrame: 3,
            },
            0,
            m,
          );
          assert.ok(count > 10);
        }
      s.replace(s.defaults());
    },
  );

