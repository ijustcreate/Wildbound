import test from "node:test";
import assert from "node:assert/strict";
import { RigStudio } from "../src/player-studio.mjs";
import { projectPoint } from "../src/player-motion.mjs";
const setup = () => {
  const s = new RigStudio(() => {});
  s.refresh = () => {};
  s.animate = () => {};
  s.changed = () => {};
  s.$ = () => ({
    width: 560,
    height: 380,
    getBoundingClientRect: () => ({ left: 0, top: 0, width: 560, height: 380 }),
    setPointerCapture() {},
    classList: { add() {} },
  });
  s.playing = false;
  return s;
};
test("Zoom preserves the point under the cursor, clamps range and does not edit the rig", () => {
  const s = setup(),
    before = JSON.stringify(s.model),
    point = { x: 140, y: 160 },
    local = [(point.x - 280) / s.scale, (point.y - 315) / s.scale];
  s.zoomAt(2, point);
  assert.equal((point.x - 280 - s.panX) / s.scale, local[0]);
  assert.equal((point.y - 315 - s.panY) / s.scale, local[1]);
  s.zoomAt(100);
  assert.equal(s.scale, 56);
  s.zoomAt(0.0001);
  assert.equal(s.scale, 1.75);
  assert.equal(JSON.stringify(s.model), before);
  assert.equal(s.history.length, 0);
});
test("Pan changes only the view and reset restores default framing", () => {
  const s = setup(),
    before = JSON.stringify(s.model);
  s.startDrag({
    button: 1,
    clientX: 100,
    clientY: 100,
    pointerId: 1,
    preventDefault() {},
  });
  s.drag({ clientX: 150, clientY: 80 });
  assert.equal(s.panX, 50);
  assert.equal(s.panY, -20);
  assert.equal(JSON.stringify(s.model), before);
  s.command("reset-view");
  assert.equal(s.panX, 0);
  assert.equal(s.panY, 0);
  assert.equal(s.scale, 7);
});
test("Joint picking and subpixel dragging stay accurate after zoom and pan", () => {
  const s = setup(),
    original = structuredClone(s.model);
  s.scale = 28;
  s.panX = 47;
  s.panY = -31;
  s.selected = "handR";
  s.frame = 0;
  const old = s.pose().handR,
    q = projectPoint(old, 0),
    point = {
      button: 0,
      pointerId: 1,
      clientX: 280 + s.panX + q.x * s.scale,
      clientY: 315 + s.panY + q.y * s.scale,
      preventDefault() {},
    };
  try {
    s.startDrag(point);
    assert.equal(s.selected, "handR");
    s.drag({ ...point, clientX: point.clientX + 7 });
    assert.ok(Math.abs(s.pose().handR[0] - old[0] - 0.25) < 0.001);
  } finally {
    s.replace(original);
  }
});
