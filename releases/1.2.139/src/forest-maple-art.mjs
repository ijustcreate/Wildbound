export const MAPLE_BARK = {
  shadow: '#3f352e', bark: '#6a4c36', highlight: '#bd8b59', rings: '#815c40', root: '#78553c',
};

export const mapleFoliageClusters = [
  [-21, -38, 16, 12], [20, -42, 18, 15], [13, -62, 19, 15],
  [-17, -54, 20, 16], [-8, -74, 16, 13], [5, -51, 15, 12],
];

const autumn = ['#57432e', '#8c5032', '#b76a37', '#d08b40', '#eab04e', '#f7c768'];
const summer = ['#344c37', '#465c36', '#62783e', '#7f9246', '#a4ad55', '#c6c86d'];

function pixelRect(ctx, x, y, width, height, color) {
  ctx.fillStyle = color;
  ctx.fillRect(Math.round(x), Math.round(y), width, height);
}

function stroke(ctx, fromX, fromY, toX, toY, startWidth, endWidth, color) {
  const steps = Math.ceil(Math.hypot(toX - fromX, toY - fromY));
  for (let step = 0; step <= steps; step++) {
    const t = step / steps;
    const width = Math.round(startWidth + (endWidth - startWidth) * t);
    const x = fromX + (toX - fromX) * t;
    const y = fromY + (toY - fromY) * t;
    pixelRect(ctx, x - width / 2, y, width, width, color);
  }
}

export function drawMapleTrunk(ctx) {
  const { shadow, bark, highlight, rings } = MAPLE_BARK;
  stroke(ctx, -1, -9, 0, -22, 12, 8, shadow);
  stroke(ctx, 0, -24, -3, -39, 8, 5, shadow);
  stroke(ctx, -2, -8, -1, -21, 8, 5, bark);
  stroke(ctx, -1, -22, -4, -38, 5, 3, bark);
  stroke(ctx, -4, -3, -3, -21, 2, 2, highlight);
  stroke(ctx, 1, -5, 1, -18, 2, 1, rings);
  pixelRect(ctx, -1, -16, 2, 3, shadow);
  pixelRect(ctx, -1, -12, 1, 2, highlight);
}

const limbs = [
  [-25, -40, -1, -22, 6], [26, -45, 1, -18, 7],
  [-19, -61, -3, -33, 5], [17, -64, -1, -31, 5], [-7, -73, -2, -36, 4],
];

export function drawMapleBranches(ctx, shape) {
  const { shadow, bark, highlight } = MAPLE_BARK;
  for (const [tipX, tipY, baseX, baseY, width] of limbs) {
    const x = tipX * shape.branchSpread;
    const elbowX = x * 0.59;
    const elbowY = tipY + 10;
    stroke(ctx, baseX, baseY, elbowX, elbowY, width, 3, shadow);
    stroke(ctx, elbowX, elbowY, x, tipY, 3, 1, shadow);
    stroke(ctx, baseX - 1, baseY, elbowX - 1, elbowY, width - 3, 1, bark);
    stroke(ctx, elbowX - 1, elbowY, x - 1, tipY, 1, 1, highlight);
    stroke(ctx, elbowX, elbowY, elbowX + Math.sign(x) * 2, tipY - 1, 2, 1, shadow);
  }
}

function mass(ctx, x, y, radiusX, radiusY, paletteColor, edge) {
  const height = Math.max(1, Math.round(radiusY));
  for (let row = -height; row <= height; row++) {
    const taper = 1 - Math.abs(row / (height + 1)) ** 1.55;
    const half = radiusX * Math.sqrt(taper);
    const step = (Math.floor((row + edge) / 2) % 4 + 4) % 4;
    const left = Math.floor(x - half + (step === 2 ? 2 : 0));
    const right = Math.ceil(x + half - (step === 0 ? 2 : 0));
    pixelRect(ctx, left, y + row, Math.max(1, right - left), 1, paletteColor);
  }
}

// Each branch ends in an uneven spray, with five leaf clumps sharing its silhouette.
const spray = [
  [0.30, 0.29, 0.53, 0.63], [-0.54, 0.07, 0.46, 0.61], [0.52, -0.18, 0.44, 0.62],
  [-0.21, -0.36, 0.60, 0.60], [0.16, -0.54, 0.41, 0.57],
];

function leafTip(ctx, x, y, color) {
  pixelRect(ctx, x + 2, y - 2, 1, 1, color);
  pixelRect(ctx, x + 1, y - 1, 3, 1, color);
  pixelRect(ctx, x, y, 5, 1, color);
  pixelRect(ctx, x + 1, y + 1, 3, 1, color);
}

export function paintMapleFoliageCluster(ctx, x, y, radiusX, radiusY, seed, shadeIndex, season = 'autumn') {
  const colors = season === 'summer' ? summer : autumn;
  const edge = Math.floor(seed * 7) + shadeIndex;
  const exposed = shadeIndex >= 2;
  mass(ctx, x, y, radiusX * 0.85, radiusY * 0.77, colors[0], edge);
  for (const [dx, dy, width, height] of spray) {
    mass(ctx, x + dx * radiusX, y + dy * radiusY, width * radiusX, height * radiusY, colors[0], edge);
  }
  for (let i = 0; i < spray.length; i++) {
    const [dx, dy, width, height] = spray[i];
    const cx = x + dx * radiusX;
    const cy = y + dy * radiusY;
    const rx = width * radiusX;
    const ry = height * radiusY;
    mass(ctx, cx, cy + 1, rx * 0.92, ry * 0.86, colors[1], edge + i);
    mass(ctx, cx - 1, cy - 1, rx * 0.88, ry * 0.77, colors[2], edge + i);
    mass(ctx, cx - rx * 0.19, cy - ry * 0.30, rx * 0.68, ry * 0.53, colors[3], edge + i);
    if (i > 0) {
      mass(ctx, cx - rx * 0.28, cy - ry * 0.49, rx * 0.52, ry * 0.29, colors[4], edge + i);
      const tipX = cx - rx * (0.5 + (edge + i) % 3 * 0.10);
      const tipY = cy - ry * 0.48;
      if (exposed && (edge + i) % 3 !== 0) leafTip(ctx, tipX, tipY, colors[5]);
      if ((edge + i) % 2 === 0) leafTip(ctx, cx + rx * 0.21, cy + ry * 0.02, colors[3]);
    }
  }
}
