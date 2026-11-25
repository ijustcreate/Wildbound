// Native-pixel broadleaves step down from a branch tip. The lower sprays
// share a cooler, darker plane.
const BROADLEAF = [
  [-0.62, 0.10, 0.35, 0.43], [0.45, 0.43, 0.39, 0.44],
  [0.06, 0.49, 0.43, 0.41], [0.67, -0.12, 0.33, 0.45],
  [-0.28, 0.02, 0.42, 0.50], [0.29, -0.13, 0.45, 0.53],
  [-0.54, -0.37, 0.32, 0.41], [-0.13, -0.54, 0.40, 0.45],
  [0.27, -0.56, 0.36, 0.36],
];
const LEAVES = [
  [-0.72, -0.15, 0.33, 0.48], [0.54, 0.19, 0.43, 0.46],
  [-0.23, 0.42, 0.44, 0.48], [0.29, 0.43, 0.35, 0.47],
  [0.10, -0.12, 0.55, 0.50], [-0.53, -0.43, 0.40, 0.42],
  [-0.10, -0.62, 0.39, 0.41], [0.49, -0.47, 0.32, 0.42],
];
const LEAF_PROFILES = [
  [[0, 0.35], [-0.36, 0.72], [-0.78, 1], [-1, 0.84], [-0.76, 0.56], [-0.41, 0.15], [-0.19, -0.05]],
  [[-0.47, 0.11], [-0.82, 0.52], [-1, 0.78], [-0.81, 1], [-0.49, 0.76], [-0.21, 0.50], [0.04, 0.24]],
  [[-0.31, 0.43], [-0.69, 0.81], [-0.85, 1], [-1, 0.63], [-0.83, 0.45], [-0.59, 0.17], [-0.31, -0.11]],
];

function sample(seed, index) {
  const value = Math.sin(seed * 91.7 + index * 137.3) * 43758.5453;
  return value - Math.floor(value);
}

function paintLeaf(c, x, y, rx, ry, color, profile, facing) {
  const height = Math.max(2, Math.round(ry * 2));
  const top = Math.round(y - height / 2);
  c.fillStyle = color;
  for (let row = 0; row < height; row++) {
    const [a, b] = profile[Math.round(row * 6 / (height - 1))];
    const left = Math.round(x + (facing > 0 ? a : -b) * rx);
    const right = Math.round(x + (facing > 0 ? b : -a) * rx);
    c.fillRect(left, top + row, Math.max(1, right - left), 1);
  }
}

export function paintForestCanopy(c, x, y, rx, ry, palette, seed, { exposure = 0 } = {}) {
  const direction = sample(seed, 1) > 0.5 ? 1 : -1;
  const profile = LEAF_PROFILES[2];

  // The separate masses overlap at the center. Their tips and recesses set
  // the crown silhouette, including at the dark trailing edge.
  const clumps = BROADLEAF.map(([dx, dy, width, depth], i) => ({
    x: x + (dx * direction + (sample(seed, i + 2) - 0.5) * 0.19) * rx,
    y: y + (dy + (sample(seed, i + 21) - 0.5) * 0.18) * ry,
    rx: rx * width,
    ry: ry * depth,
    light: -dy - dx * direction * 0.25 + exposure,
    direction: dx * direction < 0 ? 1 : -1,
  }));
  paintLeaf(c, x, y, rx * 0.73, ry * 0.71, palette[0], profile, direction);
  for (const spray of clumps) {
    paintLeaf(c, spray.x, spray.y, spray.rx, spray.ry, palette[0], profile, spray.direction);
  }

  for (const [i, spray] of clumps.entries()) {
    const light = spray.light;
    const topColor = light > 0.62 ? 5 : light > 0.03 ? 4 : 3;
    paintLeaf(c, spray.x, spray.y - 0.7, spray.rx * 0.97, spray.ry * 0.92,
      palette[light > 0.03 ? 2 : 1], profile, spray.direction);
    for (const [j, [dx, dy, width, depth]] of LEAVES.entries()) {
      const roll = sample(seed + i * 7.3, j + 90);
      const leaf = LEAF_PROFILES[(i + j) % LEAF_PROFILES.length];
      const lx = spray.x + (dx * spray.direction + (roll - 0.5) * 0.24) * spray.rx;
      const ly = spray.y + dy * spray.ry;
      const color = j < 4 ? Math.max(1, topColor - (roll > 0.5 ? 2 : 1)) : topColor - (roll < 0.32 ? 1 : 0);
      const leafWidth = spray.rx * width * (0.84 + roll * 0.28);
      const leafHeight = spray.ry * depth * .88;
      paintLeaf(c, lx, ly, leafWidth, leafHeight, palette[color], leaf, spray.direction);
      if (color === 5 && j >= 5 && roll > 0.61) {
        paintLeaf(c, lx - leafWidth * 0.23, ly - leafHeight * 0.48,
          Math.max(1, leafWidth * 0.55), leafHeight * 0.32, palette[6], leaf, spray.direction);
      }
    }
  }
}
