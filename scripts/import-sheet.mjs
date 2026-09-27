import fs from "node:fs";
import { PNG } from "pngjs";
import { convertRegion } from "../src/pixels.mjs";
const [
  source = "assets/concept-sheet.png",
  manifestPath = "assets/sheet-layout.json",
  output = "assets/library.json",
] = process.argv.slice(2);
const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8")),
  png = PNG.sync.read(fs.readFileSync(source));
const library = {};
for (let i = 0; i < manifest.names.length; i++) {
  const r = manifest.rects?.[i] || {
    x: ((i % manifest.columns) * png.width) / manifest.columns,
    y: (Math.floor(i / manifest.columns) * png.height) / manifest.rows,
    w: png.width / manifest.columns,
    h: png.height / manifest.rows,
  };
  library[manifest.names[i]] = convertRegion(png, r, manifest.size || 48, {
    removeBackground: manifest.removeBackground ?? false,
    quantize: manifest.quantize ?? false,
  });
}
fs.writeFileSync(output, JSON.stringify(library));
console.log(
  `Imported ${Object.keys(library).length} sprites at ${manifest.size || 48}px into ${output}`,
);
