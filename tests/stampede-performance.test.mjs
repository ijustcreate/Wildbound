import test from "node:test";
import assert from "node:assert/strict";
import { ellipse } from "../src/player-motion.mjs";
import { Animator } from "../src/animation.mjs";
import { invalidateRhinoFrames } from "../src/rhino-motion.mjs";

test("Scanline ellipses preserve every original pixel at fractional coordinates", () => {
  let seed = 81;
  const random = () =>
    (seed = (1664525 * seed + 1013904223) >>> 0) / 4294967296;
  const cases = [
    [0, 0, 1, 1],
    [0, 0, 2.5, 3.5],
    [0.5, -0.5, 4.5, 3],
    [1, 1, 0.5, 0.5],
  ];
  for (let n = 0; n < 250; n++)
    cases.push([
      random() * 20 - 10,
      random() * 20 - 10,
      random() * 20 + 0.1,
      random() * 20 + 0.1,
    ]);
  for (const [x, y, rx, ry] of cases) {
    const before = new Set(),
      after = new Set();
    for (let py = Math.floor(y - ry); py <= Math.ceil(y + ry); py++)
      for (let px = Math.floor(x - rx); px <= Math.ceil(x + rx); px++)
        if (((px - x) / rx) ** 2 + ((py - y) / ry) ** 2 <= 1)
          before.add(px + ":" + py);
    ellipse(
      {
        fillRect(x, y, w, h) {
          for (let j = 0; j < h; j++)
            for (let i = 0; i < w; i++) after.add(x + i + ":" + (y + j));
        },
      },
      x,
      y,
      rx,
      ry,
      "#ffffff",
    );
    assert.deepEqual(after, before);
  }
});

test("Stampede shares cached poses, bounds memory, refreshes edits and bypasses cache for hurt/editor poses", () => {
  const previous = globalThis.document;
  let rasterWrites = 0;
  const context = () => ({
    fillRect() {
      rasterWrites++;
    },
    clearRect() {},
    save() {},
    restore() {},
    translate() {},
    drawImage() {},
  });
  globalThis.document = { createElement: () => ({ getContext: context }) };
  try {
    const animator = new Animator({}),
      ctx = context();
    const actor = {
      kind: "rhino",
      state: "stampede",
      faceX: 1,
      faceY: 0,
      x: 100,
      y: 100,
      step: 1,
    };
    animator.draw(ctx, actor, 0);
    const first = rasterWrites;
    assert.ok(first > 0);
    for (let i = 0; i < 20; i++) animator.draw(ctx, { ...actor, x: i * 50 }, 0);
    assert.equal(rasterWrites, first);
    invalidateRhinoFrames();
    animator.draw(ctx, actor, 0);
    assert.ok(rasterWrites > first);
    for (const extra of [
      { flash: 0.1 },
      { animationAction: "run" },
      { playerFrame: 2.17 },
      { poseTime: 0.3 },
      { aggro: true },
    ]) {
      const before = rasterWrites;
      animator.draw(ctx, { ...actor, ...extra }, 0);
      assert.ok(rasterWrites > before);
    }
    for (let i = 0; i < 300; i++)
      animator.draw(
        ctx,
        { ...actor, step: i * 0.17, faceX: Math.cos(i), faceY: Math.sin(i) },
        0,
      );
    assert.ok(animator.stampedeFrames.size <= 64);
  } finally {
    if (previous) globalThis.document = previous;
    else delete globalThis.document;
  }
});
