import test from "node:test";
import assert from "node:assert/strict";
import { ITEMS } from "../src/items.mjs";
import { ITEM_ART_TYPES, paintItem } from "../src/item-art.mjs";
import { Game, CENTER } from "../src/core.mjs";
test("Every item has a unique transparent pixel silhouette within its 24px cell", () => {
  assert.deepEqual([...ITEM_ART_TYPES].sort(), Object.keys(ITEMS).sort());
  const shapes = new Set();
  for (const type of ITEM_ART_TYPES) {
    const pixels = Array(576).fill("");
    const c = {
      fillStyle: "",
      fillRect(x, y, w, h) {
        assert.ok([x, y, w, h].every(Number.isInteger));
        assert.ok(x >= 0 && y >= 0 && x + w <= 24 && y + h <= 24, type);
        for (let py = y; py < y + h; py++)
          for (let px = x; px < x + w; px++)
            pixels[py * 24 + px] = this.fillStyle;
      },
    };
    paintItem(c, type);
    assert.ok(pixels.filter(Boolean).length > 20);
    assert.ok(pixels.filter(Boolean).length < 400);
    shapes.add(JSON.stringify(pixels));
  }
  assert.equal(shapes.size, ITEM_ART_TYPES.length);
});
test("Board rewards are identifiable and placed clear of board collision", () => {
  const g = new Game(() => 0.42),
    p = g.addPlayer("keyboard", "Scout");
  g.start();
  p.x = CENTER;
  p.y = CENTER;
  g.treasure(p);
  assert.equal(g.loot.length, 3);
  for (const item of g.loot) {
    assert.equal(item.source, "Board treasure");
    assert.equal(g.blocked(item.x, item.y, 12), false);
  }
  for (let a = 0; a < g.loot.length; a++)
    for (let b = a + 1; b < g.loot.length; b++)
      assert.ok(
        Math.hypot(g.loot[a].x - g.loot[b].x, g.loot[a].y - g.loot[b].y) >= 20,
      );
});
test("Enemy equipment drops retain item identity and source for the pickup prompt", () => {
  const g = new Game(() => 0.01);
  g.addPlayer("keyboard", "Scout");
  g.start();
  g.enemyLoot({ id: 100, kind: "skeleton", x: 500, y: 500 });
  const sword = g.loot.find((l) => l.type === "sword" && l.source === "Skeleton drop");
  assert.equal(sword.source, "Skeleton drop");
  assert.equal(sword.qty, 1);
});
