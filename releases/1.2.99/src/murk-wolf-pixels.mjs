import { projectPoint } from "./player-motion.mjs";
import { pixelPolygon } from "./pixel-shapes.mjs";

const dot = (a, b) => a.reduce((n, v, i) => n + v * b[i], 0);
const sub = (a, b) => a.map((v, i) => v - b[i]);
const normalize = (v) => {
  const length = Math.hypot(...v) || 1;
  return v.map((n) => n / length);
};
const cross = (a, b) => [
  a[1] * b[2] - a[2] * b[1],
  a[2] * b[0] - a[0] * b[2],
  a[0] * b[1] - a[1] * b[0],
];
const middle = (a, b, t = 0.5) => a.map((v, i) => v + (b[i] - v) * t);
export { volume as drawOrientedPixelVolume };
function axes(right, forward) {
  const f = normalize(forward),
    u = normalize(cross(right, f));
  return [normalize(cross(f, u)), f, u];
}
function local(origin, basis, offset) {
  return origin.map(
    (n, i) => n + offset.reduce((v, x, k) => v + x * basis[k][i], 0),
  );
}

// The native pixel-volume technique used by the older animal rigs, oriented
// along the transferred bones. Four flat shades and whole-pixel spans only.
function volume(c, origin, basis, radii, d, palette) {
  const center = projectPoint(origin, d),
    angle = (d * Math.PI) / 4,
    co = Math.cos(angle),
    si = Math.sin(angle),
    ray = [si, co, 0.5];
  const projected = basis.map((v) => projectPoint(v, d));
  const rx =
    Math.ceil(projected.reduce((n, v, i) => n + Math.abs(v.x) * radii[i], 0)) +
    1;
  const ry =
    Math.ceil(projected.reduce((n, v, i) => n + Math.abs(v.y) * radii[i], 0)) +
    1;
  const a = basis.map((v, i) => dot(ray, v) / radii[i]),
    A = dot(a, a),
    ox = Math.round(center.x),
    oy = Math.round(center.y);
  for (let y = -ry; y <= ry; y++) {
    let start = -rx,
      previous = null;
    const flush = (x) => {
      if (previous) {
        c.fillStyle = previous;
        c.fillRect(ox + start, oy + y, x - start, 1);
      }
    };
    for (let x = -rx; x <= rx + 1; x++) {
      let color = null;
      if (x <= rx) {
        const base = [x * co, -x * si, -y],
          b = basis.map((v, i) => dot(base, v) / radii[i]),
          B = 2 * dot(a, b),
          C = dot(b, b) - 1,
          disc = B * B - 4 * A * C;
        if (disc >= 0) {
          const root = Math.sqrt(disc),
            t = (-B + root) / (2 * A),
            normal = [0, 1, 2].map((i) =>
              basis.reduce(
                (n, v, k) => n + (v[i] * (b[k] + t * a[k])) / radii[k],
                0,
              ),
            );
          const light =
            (-0.45 * normal[0] - 0.3 * normal[1] + 0.82 * normal[2]) /
            (Math.hypot(...normal) || 1);
          color =
            root / A < 1.1
              ? palette.outline
              : light > 0.65
                ? palette.light
                : light > 0.03
                  ? palette.body
                  : palette.shade;
        }
      }
      if (color !== previous) {
        flush(x);
        start = x;
        previous = color;
      }
    }
  }
}

export function drawMurkBody(c, pose, d, pal, width) {
  const basis = axes(
    sub(pose.shoulderL, pose.shoulderR),
    sub(pose.chest, pose.pelvis),
  );
  const length = Math.hypot(...sub(pose.chest, pose.pelvis));
  const coat = {
    body: pal.tail,
    shade: pal.shade,
    light: pal.head,
    outline: pal.outline,
  };
  const warm = {
    body: pal.legs,
    shade: pal.shade,
    light: pal.body,
    outline: pal.outline,
  };
  const neckBasis = axes(basis[0], sub(pose.head, pose.chest));
  const parts = [
    {
      center: pose.pelvis,
      basis,
      radii: [width * 0.45, width * 0.49, width * 0.48],
      palette: coat,
    },
    {
      center: middle(pose.pelvis, pose.chest, 0.52),
      basis,
      radii: [width * 0.54, length * 0.45, width * 0.54],
      palette: coat,
    },
    {
      center: local(pose.chest, basis, [0, -0.6, -0.5]),
      basis,
      radii: [width * 0.61, width * 0.45, width * 0.62],
      palette: coat,
    },
    {
      center: middle(pose.chest, pose.neck, 0.65),
      basis: neckBasis,
      radii: [
        width * 0.38,
        Math.hypot(...sub(pose.neck, pose.chest)) * 0.5 + 1.7,
        width * 0.4,
      ],
      palette: warm,
    },
  ];
  parts.sort(
    (a, b) => projectPoint(a.center, d).depth - projectPoint(b.center, d).depth,
  );
  for (const p of parts) volume(c, p.center, p.basis, p.radii, d, p.palette);
  // Short shoulder fur, attached to the chest rather than a shirt-shaped bib.
  for (const side of [-1, 1]) {
    const points = [
      [side * width * 0.25, 2, 2.5],
      [side * width * 0.55, 0.5, 1],
      [side * width * 0.61, -1, -1.2],
      [side * width * 0.47, -0.7, -0.6],
      [side * width * 0.47, -2.5, -2.2],
      [side * width * 0.27, -1, 0],
    ];
    pixelPolygon(
      c,
      points.map((v) => projectPoint(local(pose.chest, basis, v), d)),
      pal.body,
    );
  }
}

export function drawMurkSkull(c, pose, d, pal, scale) {
  const basis = axes(sub(pose.eyeL, pose.eyeR), sub(pose.nose, pose.head));
  const point = (v) =>
    local(
      pose.head,
      basis,
      v.map((n) => n * scale),
    );
  const coat = {
    body: pal.tail,
    shade: pal.shade,
    light: pal.head,
    outline: pal.outline,
  };
  const cheeks = {
    body: pal.cream,
    shade: pal.body,
    light: pal.cream,
    outline: pal.shade,
  };
  const parts = [
    { center: point([0, 0.8, 0.4]), radii: [5.8, 4.6, 5], palette: coat },
    ...[-1, 1].map((side) => ({
      center: point([side * 3.9, 1.8, -1.7]),
      radii: [2.5, 3.1, 2.6],
      palette: cheeks,
    })),
  ];
  parts.sort(
    (a, b) => projectPoint(a.center, d).depth - projectPoint(b.center, d).depth,
  );
  for (const p of parts)
    volume(
      c,
      p.center,
      basis,
      p.radii.map((n) => n * scale),
      d,
      p.palette,
    );
  // Broad cheek locks keep the silhouette canine without dense texture.
  for (const side of [-1, 1]) {
    const points = [
      [side * 4, 0.2, 1.3],
      [side * 6.7, -0.1, -1],
      [side * 5.3, 0.4, -1.5],
      [side * 6, -0.4, -3.5],
      [side * 3.8, 1, -2.8],
    ];
    pixelPolygon(
      c,
      points.map((v) => projectPoint(point(v), d)),
      pal.body,
    );
  }
}
