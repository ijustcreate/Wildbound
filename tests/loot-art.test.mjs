import test from "node:test";
import assert from "node:assert/strict";
import { ITEMS } from "../src/items.mjs";
import { ITEM_ART_TYPES, paintItem } from "../src/item-art.mjs";
import { Game, CENTER } from "../src/core.mjs";
test("Every item has a unique transparent pixel silhouette within its 24px cell", (t) => {
  const Canvas = globalThis.OffscreenCanvas, Data = globalThis.ImageData;
  t.after(() => {
    if (Canvas) globalThis.OffscreenCanvas = Canvas; else delete globalThis.OffscreenCanvas;
    if (Data) globalThis.ImageData = Data; else delete globalThis.ImageData;
  });
  globalThis.ImageData = class {
    constructor(data) { this.data = data; }
  };
  globalThis.OffscreenCanvas = class {
    constructor(width, height) { this.width = width; this.height = height; }
    getContext() { return { putImageData: ({ data }) => { this.data = data; } }; }
  };
  assert.deepEqual([...ITEM_ART_TYPES].sort(), Object.keys(ITEMS).sort());
  const shapes = new Map();
  for (const type of ITEM_ART_TYPES) {
    const pixels = Array(576).fill("");
    const stack = [];
    let sx = 1, sy = 1, tx = 0, ty = 0;
    const c = {
      fillStyle: "",
      save() { stack.push([sx, sy, tx, ty, this.fillStyle]); },
      restore() {
        assert.ok(stack.length, type);
        [sx, sy, tx, ty, this.fillStyle] = stack.pop();
      },
      translate(x, y) { tx += x * sx; ty += y * sy; },
      scale(x, y) { sx *= x; sy *= y; },
      drawImage(image, x, y) {
        const fill = this.fillStyle;
        for (let row = 0; row < image.height; row++) {
          for (let col = 0; col < image.width; col++) {
            const i = 4 * (row * image.width + col);
            if (!image.data[i + 3]) continue;
            this.fillStyle = "#" + Buffer.from(image.data.subarray(i, i + 3)).toString("hex");
            this.fillRect(x + col, y + row, 1, 1);
          }
        }
        this.fillStyle = fill;
      },
      fillRect(x, y, w, h) {
        assert.ok([x, y, w, h].every(Number.isInteger), type);
        const left = Math.floor(Math.min(x * sx, (x + w) * sx) + tx);
        const right = Math.ceil(Math.max(x * sx, (x + w) * sx) + tx);
        const top = Math.floor(Math.min(y * sy, (y + h) * sy) + ty);
        const bottom = Math.ceil(Math.max(y * sy, (y + h) * sy) + ty);
        assert.ok(left >= 0 && top >= 0 && right <= 24 && bottom <= 24, type);
        for (let py = top; py < bottom; py++)
          for (let px = left; px < right; px++)
            pixels[py * 24 + px] = this.fillStyle;
      },
    };
    paintItem(c, type);
    assert.equal(stack.length, 0, type);
    const opaque = pixels.filter(Boolean).length;
    assert.ok(opaque > 20 && opaque < 400, `${type}: ${opaque} painted pixels`);
    const signature = JSON.stringify(pixels);
    assert.ok(!shapes.has(signature), `${type} shares its icon with ${shapes.get(signature)}`);
    shapes.set(signature, type);
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
