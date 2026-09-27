import test from "node:test";
import assert from "node:assert/strict";
import { Game } from "../src/core.mjs";
import { tickHazards } from "../src/hazards.mjs";

function setup() {
  const g = new Game(() => 0.5),
    p = g.addPlayer("keyboard");
  g.start();
  g.openingBoard = false;
  g.scenery = [];
  g.terrain.fill("grass");
  g.terrain[9 * 50 + 13] = "water";
  g.terrain[9 * 50 + 14] = "water";
  Object.assign(p, { x: 400, y: 300, faceX: 1, faceY: 0 });
  return { g, p };
}

for (const type of ["wand", "fire_wand"])
  test(type + " crosses deep water and hits the far bank", () => {
    const { g, p } = setup();
    p.equipment.hand1 = type;
    const target = { id: 70, x: 510, y: 300, hp: 200 };
    g.enemies = [target];
    assert.ok(g.blocked(450, 300));
    assert.equal(g.projectileBlocked(450, 300), false);
    assert.ok(g.fireSpell(p));
    for (let i = 0; i < 10; i++) g.tickAdventure(0.05, {});
    assert.ok(target.hp < 200);
    if (type === "fire_wand") assert.equal(target.burning, 2);
  });

for (const hostile of [false, true])
  test(
    (hostile ? "Enemy ice bolts" : "Player arrows") +
      " cross water without becoming ground loot",
    () => {
      const { g, p } = setup();
      const target = hostile ? p : { id: 70, hp: 100, x: 500, y: 300 };
      if (hostile) p.x = 500;
      else g.enemies = [target];
      const hp = target.hp;
      g.arrows = [
        {
          x: 400,
          y: 300,
          z: 24,
          vx: 200,
          vy: 0,
          vz: 20,
          damage: 10,
          hostile,
          ice: hostile,
        },
      ];
      for (let i = 0; i < 11; i++) g.tickAdventure(0.05, {});
      assert.ok(target.hp < hp);
    },
  );

test("Enemy fireballs cross water and hit the far bank", () => {
  const { g, p } = setup();
  p.x = 500;
  g.fireballs = [
    {
      x: 400,
      y: 300,
      vx: 190,
      vy: 0,
      life: 3,
      trail: 0,
      damage: 10,
      burnDamage: 3,
    },
  ];
  for (let i = 0; i < 11; i++) tickHazards(g, 0.05);
  assert.ok(p.hp < 100);
});

test("Projectile water exemption retains solid obstacles and world boundaries", () => {
  const { g, p } = setup();
  g.scenery = [{ kind: "tree", procedural: true, x: 450, y: 279, size: 100 }];
  assert.ok(g.projectileBlocked(450, 300));
  assert.ok(g.projectileBlocked(800, 800));
  assert.ok(g.projectileBlocked(-5, 300));
  assert.ok(g.projectileBlocked(1605, 300));
  const target = { id: 70, x: 510, y: 300, hp: 200 };
  g.enemies = [target];
  p.equipment.hand1 = "wand";
  g.fireSpell(p);
  for (let i = 0; i < 10; i++) g.tickAdventure(0.05, {});
  assert.equal(target.hp, 200);
  assert.equal(g.spells.length, 0);
});
