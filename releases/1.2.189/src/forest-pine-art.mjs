// A bough points from its attachment to a hooked tip. Its smaller needle
// fans turn along that same axis, with shorter tips as they approach the stem.
const Bough = [
  [0,.12], [.15,-.3], [.27,-.40], [.36,-.69], [.44,-.48], [.56,-.89],
  [.61,-.59], [.76,-.76], [.82,-.43], [1,-.57], [.92,-.06], [.84,.24],
  [.76,.32], [.71,.60], [.61,.46], [.48,.76], [.40,.56], [.24,.58], [.11,.37],
];
const Face = [
  [.08,.03], [.25,-.25], [.36,-.53], [.48,-.35], [.56,-.68], [.63,-.43],
  [.75,-.58], [.81,-.32], [.94,-.45], [.84,-.03], [.69,.04],
  [.64,.26], [.51,.17], [.40,.38], [.29,.25],
];
const Tips = [
  [[.25,-.06], [.37,-.47], [.43,-.35], [.40,-.13], [.31,.03]],
  [[.43,-.16], [.57,-.66], [.64,-.43], [.58,-.20], [.53,-.31]],
  [[.64,-.25], [.76,-.58], [.83,-.34], [.93,-.43], [.84,-.13], [.75,-.17]],
];
const Snow = [[.22,-.26], [.35,-.59], [.42,-.43], [.55,-.81], [.61,-.55],
  [.73,-.68], [.80,-.41], [.88,-.43], [.80,-.14], [.68,-.21], [.61,-.08],
  [.53,-.23], [.43,-.09], [.40,-.23], [.29,-.12]];
const leftToRight = (a,b) => a-b;

function raster(c, profile, x, y, dx, dy, width, color) {
  const length = Math.hypot(dx, dy) || 1;
  const side = dx < 0 ? -1 : 1;
  const nx = -dy * side / length * width, ny = dx * side / length * width;
  let firstRow = Infinity, lastRow = -Infinity;
  const vertices = profile.map(([along, across]) => {
    const py = y + along * dy + across * ny;
    firstRow = Math.min(firstRow, py);
    lastRow = Math.max(lastRow, py);
    return [x + along * dx + across * nx, py];
  });
  const hits = [];
  c.fillStyle = color;
  for (let row = Math.floor(firstRow), end = Math.ceil(lastRow); row < end; row++) {
    hits.length = 0;
    const scan = row + .5;
    let previous = vertices.at(-1);
    for (const point of vertices) {
      if ((point[1] > scan) !== (previous[1] > scan)) {
        const t = (scan - previous[1]) / (point[1] - previous[1]);
        hits.push(previous[0] + (point[0] - previous[0]) * t);
      }
      previous = point;
    }
    if (hits.length > 2) hits.sort(leftToRight);
    for (let i = 1; i < hits.length; i += 2) {
      const left = Math.round(Math.min(hits[i - 1],hits[i])), right = Math.round(Math.max(hits[i - 1],hits[i]));
      if (right > left) c.fillRect(left, row, right - left, 1);
    }
  }
}

// Origin and tip are normalized to the tier. Yellow-green accents follow the
// upper branch faces, while the front boughs hang from lower attachments.
const fans = [
  [.04,-.37, -.76,-.61, .40, 3], [-.06,-.25, .72,-.57, .37, 3],
  [.02,-.14, 1.01,-.23, .50, 4], [-.02,-.04, -1.09,-.18, .56, 4],
  [.06,.06, -.68,.55, .56, 3], [-.06,.15, .70,.51, .57, 4],
  [.10,-.14, -.19,1.03, .48, 5],
];

export function paintPineTier(c, x, y, rx, ry, palette, seed, { top = false, snow = false } = {}) {
  const lean = Math.sin(seed * 9.7) * .11;
  const reach = Math.sin(seed * 7.3) * .13;
  const flip = lean >= 0 ? 1 : -1;
  function branch(startX, startY, tipX, tipY, width, shade, highlights, snowCap) {
    const bx = x + startX * rx, by = y + startY * ry;
    const dx = (tipX - startX) * rx, dy = (tipY - startY) * ry, depth = width * ry;
    raster(c, Bough, bx, by, dx, dy, depth, palette[shade - 3]);
    raster(c, Face, bx, by - .45, dx * .97, dy, depth * .88, palette[shade]);
    if (highlights) {
      for (let i = 0; i < Tips.length; i++) raster(c, Tips[i], bx, by - .2, dx, dy, depth * .9, palette[shade + Number(i === 1)]);
    }
    if (snow && snowCap) {
      raster(c, Snow, bx, by - 1, dx * .98, dy, depth * 1.13, '#849bb7');
      raster(c, Snow, bx, by - 2, dx * .94, dy, depth * .99, '#cadbec');
      raster(c, Tips[1], bx, by - 2.6, dx * .96, dy, depth * .90, '#edf3fa');
    }
  }
  if (top) branch(0,.65,lean * 2,-1.16,.29,4,true,true);
  for (const [i, [sx,sy,tx,ty,width,value]] of fans.entries()) {
    const side = Math.sign(tx);
    const bend = Math.sin(seed * 3.7 + i * 2.1);
    const shade = Math.max(3, value - Number(tx * flip > 0));
    branch(sx * flip, sy, tx * flip * (1 + reach * side), ty + lean * side + bend * .13,
      width * (1 + bend * .13) * (top ? .77 : 1), shade, i === 3 || i === 6,
      i === 2 || i === 3 || i === 6 || i === 1 && bend > 0);
  }
}
