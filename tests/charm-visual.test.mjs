import test from "node:test";
import assert from "node:assert/strict";
import {
  drawPlayer,
  defaultPlayerMotion,
  poseAt,
  directionVector,
} from "../src/player-motion.mjs";
function render(d, gear, pose) {
  const pixels = new Map(),
    ctx = {
      fillStyle: "",
      fillRect(x, y, w, h) {
        for (let py = Math.floor(y); py < y + h; py++)
          for (let px = Math.floor(x); px < x + w; px++)
            pixels.set(px + "," + py, this.fillStyle);
      },
    };
  const [faceX, faceY] = directionVector(d);
  drawPlayer(
    ctx,
    { faceX, faceY, animationAction: "run", playerFrame: 2, equipment: gear },
    0,
    defaultPlayerMotion(),
    pose,
  );
  return [...pixels].filter(([, c]) => c === "#ffb43e");
}
test("Equipped amber pendant or rear clasp remains visible in all eight facings", () => {
  for (let d = 0; d < 8; d++) {
    assert.equal(render(d, {}).length, 0);
    assert.ok(
      render(d, { neck: "charm", chest: "armor" }).length >= 2,
      "Facing " + d,
    );
  }
});
test("Amber pendant follows the edited chest pose", () => {
  const pose = poseAt(defaultPlayerMotion(), "run", 2);
  const before = render(0, { neck: "charm" }, pose);
  pose.chest[0] += 9;
  const after = render(0, { neck: "charm" }, pose);
  const avg = (a) =>
    a.reduce((s, [key]) => s + Number(key.split(",")[0]), 0) / a.length;
  assert.ok(avg(after) - avg(before) > 6);
});
