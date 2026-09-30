import test from "node:test";
import assert from "node:assert/strict";
import { createDebugCodeTracker, DEBUG_CODE } from "../src/debug-code.mjs";

test("cheat menu code matches d-pad, A, B, Back, Start", () => {
  let time = 0;
  const feed = createDebugCodeTracker({ now: () => time });
  const opened = DEBUG_CODE.map((token) => {
    time += 100;
    return feed(token);
  });
  assert.deepEqual(opened.slice(0, -1), Array(DEBUG_CODE.length - 1).fill(false));
  assert.equal(opened.at(-1), true);
});

test("extra A, B no longer opens the cheat menu", () => {
  let time = 0;
  const feed = createDebugCodeTracker({ now: () => time });
  const oldCode = ["up", "down", "left", "right", "a", "b", "a", "b", "select", "start"];
  const opened = oldCode.map((token) => {
    time += 100;
    return feed(token);
  });
  assert.equal(opened.some(Boolean), false);
});

test("cheat menu code resets after timeout", () => {
  let time = 0;
  const feed = createDebugCodeTracker({ now: () => time, timeout: 3500 });
  for (const token of DEBUG_CODE.slice(0, 4)) {
    time += 100;
    assert.equal(feed(token), false);
  }
  time += 3600;
  assert.equal(feed(DEBUG_CODE[4]), false);
  for (const token of DEBUG_CODE.slice(5)) {
    time += 100;
    assert.equal(feed(token), false);
  }
});
