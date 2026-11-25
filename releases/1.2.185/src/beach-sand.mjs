const sandPalette = ['#dfbb82', '#e7c58c', '#edcd93', '#f1d59f', '#f5dca9', '#f8e2b5'];

function hash(x, y, seed) {
  let value = Math.imul(x, 0x1f123bb5) ^ Math.imul(y, 0x5f356495) ^ Math.imul(seed, 0x165667b1);
  value = Math.imul(value ^ (value >>> 16), 0x45d9f3b);
  value = Math.imul(value ^ (value >>> 16), 0x45d9f3b);
  return ((value ^ (value >>> 16)) >>> 0) / 0x100000000;
}

function smoothNoise(x, y, seed) {
  const ix = Math.floor(x), iy = Math.floor(y);
  const fx = x - ix, fy = y - iy;
  const dx = fx * fx * (3 - 2 * fx), dy = fy * fy * (3 - 2 * fy);
  const upper = hash(ix, iy, seed) * (1 - dx) + hash(ix + 1, iy, seed) * dx;
  const lower = hash(ix, iy + 1, seed) * (1 - dx) + hash(ix + 1, iy + 1, seed) * dx;
  return upper * (1 - dy) + lower * dy;
}

export function beachSandColor(x, y, seed) {
  const bank = smoothNoise(x / 49, y / 36, seed);
  const ripples = smoothNoise((x - y * .4) / 27, y / 10, seed + 101);
  const patches = smoothNoise((x - y * .25) / 9, y / 6, seed + 271);
  const grain = hash(Math.floor(x / 2), Math.floor(y / 2), seed + 433);
  const value = bank * .34 + ripples * .40 + patches * .21 + grain * .05;
  return sandPalette[Math.floor(value * sandPalette.length)];
}

// Chunks start on a 256-pixel world grid. Insetting the marks inside 16-pixel
// cells keeps each group on one chunk and gives neighboring chunks equal density.
export function drawBeachSandFlecks(c, x0, y0, isDry, seed) {
  for (let y = 0; y < 256; y += 16) for (let x = 0; x < 256; x += 16) {
    const col = (x0 + x) / 16, row = (y0 + y) / 16;
    const mark = hash(col, row, seed + 601);
    if (mark > .55) continue;

    const px = x + 3 + Math.floor(hash(col, row, seed + 719) * 7);
    const py = y + 3 + Math.floor(hash(col, row, seed + 809) * 8);
    if (!isDry(x0 + px, y0 + py) || !isDry(x0 + px + 4, y0 + py) || !isDry(x0 + px, y0 + py + 3) || !isDry(x0 + px + 4, y0 + py + 3)) continue;

    if (mark < .008) {
      c.fillStyle = '#c7a676';
      c.fillRect(px, py + 1, 5, 2);
      c.fillStyle = '#fbebc7';
      c.fillRect(px + 1, py, 3, 2);
      c.fillStyle = '#ead0a5';
      c.fillRect(px + 2, py + 1, 1, 1);
    } else {
      c.fillStyle = mark < .24 ? '#dcb982' : '#f9e3b8';
      c.fillRect(px, py, mark < .26 ? 2 : 1, 1);
      if (mark < .12) c.fillRect(px + 3, py + 2, 1, 1);
    }
  }
}
