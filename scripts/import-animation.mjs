import fs from "node:fs";
import { PNG } from "pngjs";
import { rgbaToSprite } from "../src/pixels.mjs";
// Explicit row bounds and baselines; every frame shares one scale. Never trim frames independently.
const source = process.argv[2] || "assets/lion-walk-source-v2.png";
const manifest = JSON.parse(
  fs.readFileSync(process.argv[3] || "assets/lion-walk-layout.json", "utf8"),
);
const png = PNG.sync.read(fs.readFileSync(source));
const rows = manifest.rows.map(({ top, bottom, baseline }) =>
  Array.from({ length: manifest.columns }, (_, frame) => {
    const rgba = new Uint8ClampedArray(64 * 64 * 4),
      cell = png.width / manifest.columns;
    for (let y = 0; y < 64; y++)
      for (let x = 0; x < 64; x++) {
        const sx = Math.floor(cell * (frame + 0.5) + (x - 32) / manifest.scale),
          sy = Math.floor(baseline + (y - 48) / manifest.scale);
        if (
          sx >= frame * cell &&
          sx < (frame + 1) * cell &&
          sy >= top &&
          sy < bottom
        )
          rgba.set(
            png.data.subarray(
              (sy * png.width + sx) * 4,
              (sy * png.width + sx) * 4 + 4,
            ),
            (y * 64 + x) * 4,
          );
      }
    return rgbaToSprite(rgba, 64, 64);
  }),
);
const bank = {
  [manifest.name]: {
    walk: { action: "walk", fps: 8, rows, anchor: { x: 32, y: 48 } },
    idle: {
      action: "idle",
      fps: 2,
      rows: rows.map((r) => [r[0]]),
      anchor: { x: 32, y: 48 },
    },
  },
};
fs.writeFileSync(
  process.argv[4] || "assets/animations.json",
  JSON.stringify(bank),
);
console.log("Imported fixed-anchor directional animation: " + manifest.name);
