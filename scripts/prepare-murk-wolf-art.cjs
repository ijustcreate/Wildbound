// Measure generated cells and record attachment rectangles; preserve source alpha.
const fs = require("node:fs"),
  path = require("node:path"),
  { PNG } = require("pngjs");
const root = path.resolve(__dirname, ".."),
  dir = path.join(root, "assets/murk-wolf"),
  source = process.argv[2];
if (!source) throw Error("Pass generated atlas PNG");
fs.mkdirSync(dir, { recursive: true });
fs.copyFileSync(source, path.join(dir, "parts-source.png"));
const png = PNG.sync.read(fs.readFileSync(source)),
  cw = png.width / 4,
  ch = png.height / 4;
function rect(cell) {
  const cx = Math.round((cell % 4) * cw),
    cy = Math.round(Math.floor(cell / 4) * ch),
    w = Math.round(((cell % 4) + 1) * cw) - cx,
    h = Math.round((Math.floor(cell / 4) + 1) * ch) - cy;
  const seen = new Uint8Array(w * h);
  let largest = { count: 0 };
  // Ignore stray pixels and neighboring pieces crossing a cell boundary.
  for (let i = 0; i < w * h; i++) {
    if (
      seen[i] ||
      png.data[((cy + Math.floor(i / w)) * png.width + cx + (i % w)) * 4 + 3] <=
        80
    )
      continue;
    const stack = [i],
      component = { count: 0, x0: w, y0: h, x1: 0, y1: 0 };
    seen[i] = 1;
    while (stack.length) {
      const n = stack.pop(),
        x = n % w,
        y = Math.floor(n / w);
      component.count++;
      component.x0 = Math.min(component.x0, x);
      component.y0 = Math.min(component.y0, y);
      component.x1 = Math.max(component.x1, x);
      component.y1 = Math.max(component.y1, y);
      for (const [xx, yy] of [
        [x - 1, y],
        [x + 1, y],
        [x, y - 1],
        [x, y + 1],
      ]) {
        if (xx < 0 || yy < 0 || xx >= w || yy >= h) continue;
        const j = yy * w + xx;
        if (seen[j]) continue;
        seen[j] = 1;
        if (png.data[((cy + yy) * png.width + cx + xx) * 4 + 3] > 80)
          stack.push(j);
      }
    }
    if (component.count > largest.count) largest = component;
  }
  if (!largest.count) throw Error("Empty atlas cell " + cell);
  const { x0, y0, x1, y1 } = largest;
  return [
    cx + Math.max(0, x0 - 2),
    cy + Math.max(0, y0 - 2),
    Math.min(w, x1 + 3) - Math.max(0, x0 - 2),
    Math.min(h, y1 + 3) - Math.max(0, y0 - 2),
  ];
}
const headSizes = [
  [18, 15],
  [19, 16],
  [20, 17],
  [19, 17],
  [18, 17],
  [19, 17],
  [20, 17],
  [19, 16],
];
const manifest = {
  version: 1,
  subject: "murk_wolf",
  pixelDensity: 2,
  // The body now uses native wolf-style pixel drawing. Keep only skull views.
  parts: ["head"].map((id) => ({
    id,
    joint: "head",
    views: Array.from({ length: 8 }, (_, direction) => {
      if (id === "head" && direction === 1) return { direction, mirrorFrom: 7 };
      const r = rect(direction);
      return {
        direction,
        file: "parts-source.png",
        rect: r,
        pivot: [r[2] * 0.5, r[3] * 0.56],
        size: headSizes[direction],
        offset: [0, -1],
      };
    }),
  })),
};
fs.writeFileSync(
  path.join(dir, "atlas.json"),
  JSON.stringify(manifest, null, 2) + "\n",
);
fs.writeFileSync(
  path.join(root, "src/murk-wolf-atlas.mjs"),
  "// Measured source regions and rig-space pivots.\nexport default " +
    JSON.stringify(manifest) +
    ";\n",
);
console.log(
  JSON.stringify({
    image: [png.width, png.height],
    parts: manifest.parts.map((p) => ({
      id: p.id,
      views: p.views.map((v) => v.rect || "mirror " + v.mirrorFrom),
    })),
  }),
);
