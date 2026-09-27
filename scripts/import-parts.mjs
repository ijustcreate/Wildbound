import fs from "node:fs";
import { PNG } from "pngjs";
import { rgbaToSprite } from "../src/pixels.mjs";
const p = PNG.sync.read(fs.readFileSync("assets/explorer-parts-source-v1.png"));
const rows = [
  [
    [43, 42, 190, 190],
    [305, 56, 198, 176],
    [610, 48, 102, 194],
    [833, 70, 64, 163],
    [1100, 82, 120, 142],
    [1361, 89, 112, 112],
  ],
  [
    [42, 289, 195, 193],
    [308, 307, 197, 178],
    [615, 299, 97, 192],
    [833, 325, 65, 163],
    [1101, 333, 121, 137],
    [1355, 335, 116, 114],
  ],
  [
    [43, 535, 192, 194],
    [340, 548, 121, 183],
    [612, 547, 98, 187],
    [848, 532, 122, 210],
    [1082, 590, 164, 125],
    [1362, 589, 111, 110],
  ],
  [
    [41, 778, 195, 204],
    [338, 794, 121, 174],
    [613, 782, 96, 200],
    [847, 775, 125, 209],
    [1084, 830, 164, 122],
    [1367, 832, 112, 112],
  ],
];
const names = ["head", "body", "arm", "leg", "foot", "hand"],
  sizes = [
    [20, 20],
    [18, 16],
    [6, 13],
    [6, 12],
    [9, 5],
    [6, 6],
  ],
  facings = ["down", "up", "left", "right"];
const colors = {
    teal: [90, 173, 155],
    coral: [220, 121, 97],
    blue: [108, 157, 211],
    gold: [201, 170, 79],
    purple: [158, 120, 187],
    green: [146, 179, 104],
  },
  library = {};
for (const [color, rgb] of Object.entries(colors))
  for (let row = 0; row < 4; row++)
    for (let col = 0; col < 6; col++) {
      const [sx, sy, sw, sh] = rows[row][col],
        [w, h] = sizes[col],
        data = new Uint8ClampedArray(w * h * 4);
      for (let y = 0; y < h; y++)
        for (let x = 0; x < w; x++) {
          const i =
              (Math.floor(sy + ((y + 0.5) / h) * sh) * p.width +
                Math.floor(sx + ((x + 0.5) / w) * sw)) *
              4,
            d = (y * w + x) * 4;
          data.set(p.data.subarray(i, i + 4), d);
          if (
            (col === 1 || col === 2) &&
            data[d + 1] > data[d] * 1.25 &&
            data[d + 2] > data[d] * 1.2
          ) {
            const light = data[d + 1] / 155;
            for (let c = 0; c < 3; c++)
              data[d + c] = Math.min(255, Math.round(rgb[c] * light));
          }
        }
      library["part-" + color + "-" + names[col] + "-" + facings[row]] =
        rgbaToSprite(data, w, h);
    }
fs.writeFileSync("assets/parts.json", JSON.stringify(library));
fs.writeFileSync(
  "assets/explorer-parts-layout.json",
  JSON.stringify(
    { source: "explorer-parts-source-v1.png", rows, names, sizes, facings },
    null,
    2,
  ),
);
console.log(
  "144 editable body-part sprites generated with explicit crop manifest.",
);
