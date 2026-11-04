import { projectPoint } from "./player-motion.mjs";
import { pixelPolygon } from "./pixel-shapes.mjs";
import { drawOrientedPixelVolume as volume } from "./murk-wolf-pixels.mjs";
const sub = (a, b) => a.map((v, i) => v - b[i]);
const unit = (v) => {
  const n = Math.hypot(...v) || 1;
  return v.map((x) => x / n);
};
const cross = (a, b) => [
  a[1] * b[2] - a[2] * b[1],
  a[2] * b[0] - a[0] * b[2],
  a[0] * b[1] - a[1] * b[0],
];
const middle = (a, b, t = 0.5) => a.map((v, i) => v + (b[i] - v) * t);
function axes(right, forward) {
  const f = unit(forward),
    u = unit(cross(right, f));
  return [unit(cross(f, u)), f, u];
}
const local = (o, b, p) =>
  o.map((v, i) => v + p.reduce((sum, x, k) => sum + x * b[k][i], 0));
const skin = (pal) => ({
  body: pal.body,
  shade: pal.shade,
  light: pal.head,
  outline: pal.outline,
});
function drawParts(c, parts, d) {
  parts.sort(
    (a, b) => projectPoint(a.center, d).depth - projectPoint(b.center, d).depth,
  );
  for (const p of parts) volume(c, p.center, p.axes, p.radii, d, p.palette);
}
export function drawDreadmaneBody(c, p, d, pal, width) {
  const b = axes(sub(p.shoulderL, p.shoulderR), sub(p.chest, p.pelvis)),
    length = Math.hypot(...sub(p.chest, p.pelvis)),
    coat = skin(pal);
  drawParts(
    c,
    [
      {
        center: p.pelvis,
        axes: b,
        radii: [width * 0.55, width * 0.6, width * 0.57],
        palette: coat,
      },
      {
        center: middle(p.pelvis, p.chest, 0.57),
        axes: b,
        radii: [width * 0.62, length * 0.43, width * 0.68],
        palette: coat,
      },
      {
        center: p.chest,
        axes: b,
        radii: [width * 0.65, width * 0.72, width * 0.72],
        palette: coat,
      },
      {
        center: middle(p.chest, p.head, 0.55),
        axes: axes(b[0], sub(p.head, p.chest)),
        radii: [
          width * 0.46,
          Math.hypot(...sub(p.head, p.chest)) * 0.55,
          width * 0.55,
        ],
        palette: coat,
      },
    ],
    d,
  );
}
export function drawDreadmaneMane(c, p, d, pal, size) {
  const b = axes(sub(p.eyeL, p.eyeR), sub(p.nose, p.head)),
    origin = local(p.head, b, [0, -3, -0.8]),
    palette = {
      body: pal.mane,
      shade: pal.outline,
      light: pal.maneLight,
      outline: pal.outline,
    };
  // Broad locks form one turning volume; no source textures or tiny fur noise.
  const outline = Array.from({ length: 24 }, (_, i) => {
    const a = (i * Math.PI) / 12,
      r = size * (i % 2 ? 0.95 : 1);
    return projectPoint(
      local(origin, b, [Math.cos(a) * r, -0.8, Math.sin(a) * r * 1.08]),
      d,
    );
  });
  pixelPolygon(c, outline, pal.outline);
  volume(c, origin, b, [size * 0.94, size * 0.7, size * 1.03], d, palette);
  for (const side of [-1, 1])
    pixelPolygon(
      c,
      [
        [side * size * 0.54, size * 0.44, 2],
        [side * size * 0.88, size * 0.32, -size * 0.33],
        [side * size * 0.66, size * 0.42, -size * 0.32],
        [side * size * 0.58, size * 0.37, -size * 0.74],
        [side * size * 0.33, size * 0.46, -size * 0.6],
      ].map((v) => projectPoint(local(origin, b, v), d)),
      pal.maneLight,
    );
}
export function drawDreadmaneSkull(c, p, d, pal, scale) {
  const b = axes(sub(p.eyeL, p.eyeR), sub(p.nose, p.head)),
    center = local(p.head, b, [0, 1.1, -0.3]);
  volume(c, center, b, [5.5 * scale, 4.5 * scale, 4.7 * scale], d, skin(pal));
  const cream = {
    body: pal.cream,
    shade: pal.body,
    light: pal.cream,
    outline: pal.shade,
  };
  for (const side of [-1, 1])
    volume(
      c,
      local(center, b, [side * 3 * scale, 2.4 * scale, -2.4 * scale]),
      b,
      [2.6 * scale, 2.6 * scale, 2 * scale],
      d,
      cream,
    );
}
