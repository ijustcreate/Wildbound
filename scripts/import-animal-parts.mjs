import fs from "node:fs";
import { PNG } from "pngjs";
import { rgbaToSprite } from "../src/pixels.mjs";
const image = PNG.sync.read(
  fs.readFileSync("assets/animal-parts-source-v1.png"),
);
const columns = [
    [40, 310],
    [375, 625],
    [710, 879],
    [945, 1142],
    [1234, 1388],
    [1506, 1683],
    [1770, 1967],
  ],
  names = ["head", "body", "leg", "foot", "tail", "tailEnd", "jaw"],
  sizes = [
    [26, 26],
    [20, 28],
    [7, 13],
    [9, 6],
    [8, 12],
    [7, 11],
    [14, 7],
  ],
  out = {};
for (let row = 0; row < 2; row++)
  for (let col = 0; col < 7; col++) {
    const [left, right] = columns[col],
      top = row ? 380 : 0,
      bottom = row ? 774 : 378,
      [w, h] = sizes[col];
    let x0 = right,
      y0 = bottom,
      x1 = left,
      y1 = top;
    for (let y = top; y < bottom; y++)
      for (let x = left; x < right; x++)
        if (image.data[(y * image.width + x) * 4 + 3] > 128) {
          x0 = Math.min(x0, x);
          y0 = Math.min(y0, y);
          x1 = Math.max(x1, x);
          y1 = Math.max(y1, y);
        }
    const data = new Uint8ClampedArray(w * h * 4);
    for (let y = 0; y < h; y++)
      for (let x = 0; x < w; x++) {
        const sx = Math.round(x0 + (x / (w - 1)) * (x1 - x0)),
          sy = Math.round(y0 + (y / (h - 1)) * (y1 - y0));
        data.set(
          image.data.subarray(
            (sy * image.width + sx) * 4,
            (sy * image.width + sx) * 4 + 4,
          ),
          (y * w + x) * 4,
        );
      }
    out["part-" + (row ? "crocodile" : "lion") + "-" + names[col]] =
      rgbaToSprite(data, w, h);
  }
fs.writeFileSync("assets/animal-parts.json", JSON.stringify(out));
fs.writeFileSync(
  "assets/animal-parts-layout.json",
  JSON.stringify(
    {
      columns,
      names,
      sizes,
      rowBounds: [
        [0, 378],
        [380, 774],
      ],
    },
    null,
    2,
  ),
);
