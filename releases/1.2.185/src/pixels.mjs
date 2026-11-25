export const GAME_PALETTE = [
  "#14251e",
  "#203e2a",
  "#345334",
  "#526c3f",
  "#78934e",
  "#a9b768",
  "#d8d99a",
  "#f0e7be",
  "#33281f",
  "#55402b",
  "#775430",
  "#9b733e",
  "#c59a54",
  "#e4bd73",
  "#f2d39b",
  "#ffffff",
  "#633d35",
  "#9b5844",
  "#cc7658",
  "#f19b73",
  "#582d40",
  "#92556c",
  "#c67a91",
  "#4b4760",
  "#72668a",
  "#aa95bd",
  "#263743",
  "#3e6278",
  "#6495aa",
  "#9ec7cd",
];
export function hexToRgba(hex) {
  return [
    parseInt(hex.slice(1, 3), 16),
    parseInt(hex.slice(3, 5), 16),
    parseInt(hex.slice(5, 7), 16),
    255,
  ];
}
export function rgbaToSprite(data, width, height) {
  const palette = ["transparent"],
    map = new Map(),
    pixels = [];
  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] < 96) {
      pixels.push(0);
      continue;
    }
    const hex =
      "#" +
      [data[i], data[i + 1], data[i + 2]]
        .map((v) => v.toString(16).padStart(2, "0"))
        .join("");
    if (!map.has(hex)) {
      map.set(hex, palette.length);
      palette.push(hex);
    }
    pixels.push(map.get(hex));
  }
  return { width, height, palette, pixels };
}
export function spriteToRgba(sprite) {
  const data = new Uint8ClampedArray(sprite.width * sprite.height * 4);
  sprite.pixels.forEach((p, i) => {
    if (p && sprite.palette[p]) data.set(hexToRgba(sprite.palette[p]), i * 4);
  });
  return data;
}
export function validateSprite(s) {
  return (
    !!s &&
    Number.isInteger(s.width) &&
    Number.isInteger(s.height) &&
    s.width >= 1 &&
    s.height >= 1 &&
    s.width <= 128 &&
    s.height <= 128 &&
    Array.isArray(s.palette) &&
    s.palette.length <= 16385 &&
    s.palette[0] === "transparent" &&
    s.palette.slice(1).every((c) => /^#[0-9a-f]{6}$/i.test(c)) &&
    Array.isArray(s.pixels) &&
    s.pixels.length === s.width * s.height &&
    s.pixels.every(
      (p) => Number.isInteger(p) && p >= 0 && p < s.palette.length,
    ) &&
    (s.footprint === undefined ||
      (Array.isArray(s.footprint) &&
        s.footprint.length === s.width * s.height &&
        s.footprint.every((p) => p === 0 || p === 1))) &&
    (s.occludes === undefined || typeof s.occludes === "boolean")
  );
}
export function convertRegion(
  image,
  rect,
  size,
  {
    removeBackground = false,
    tolerance = 28,
    quantize = false,
    trim = true,
  } = {},
) {
  const x0 = Math.max(0, Math.floor(rect.x)),
    y0 = Math.max(0, Math.floor(rect.y)),
    w = Math.max(1, Math.min(Math.round(rect.w), image.width - x0)),
    h = Math.max(1, Math.min(Math.round(rect.h), image.height - y0));
  const crop = new Uint8ClampedArray(w * h * 4);
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      const i = ((y + y0) * image.width + x + x0) * 4;
      crop.set(image.data.slice(i, i + 4), (y * w + x) * 4);
    }
  if (removeBackground) {
    const bg = Array.from(crop.slice(0, 3));
    const visited = new Uint8Array(w * h),
      queue = [];
    const push = (x, y) => {
      const i = y * w + x;
      if (visited[i]) return;
      visited[i] = 1;
      const o = i * 4;
      if (
        crop[o + 3] < 96 ||
        Math.hypot(crop[o] - bg[0], crop[o + 1] - bg[1], crop[o + 2] - bg[2]) <=
          tolerance
      ) {
        queue.push(i);
        crop[o + 3] = 0;
      }
    };
    for (let x = 0; x < w; x++) {
      push(x, 0);
      push(x, h - 1);
    }
    for (let y = 0; y < h; y++) {
      push(0, y);
      push(w - 1, y);
    }
    for (let n = 0; n < queue.length; n++) {
      const i = queue[n],
        x = i % w,
        y = Math.floor(i / w);
      if (x) push(x - 1, y);
      if (x < w - 1) push(x + 1, y);
      if (y) push(x, y - 1);
      if (y < h - 1) push(x, y + 1);
    }
  }
  let left = w,
    top = h,
    right = -1,
    bottom = -1;
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++)
      if (crop[(y * w + x) * 4 + 3] >= 96) {
        left = Math.min(left, x);
        top = Math.min(top, y);
        right = Math.max(right, x);
        bottom = Math.max(bottom, y);
      }
  const output = new Uint8ClampedArray(size * size * 4);
  if (right < 0) return rgbaToSprite(output, size, size);
  if (!trim) {
    left = 0;
    top = 0;
    right = w - 1;
    bottom = h - 1;
  }
  const sw = right - left + 1,
    sh = bottom - top + 1,
    scale = Math.min((size - 4) / sw, (size - 4) / sh),
    dw = Math.max(1, Math.round(sw * scale)),
    dh = Math.max(1, Math.round(sh * scale)),
    ox = Math.floor((size - dw) / 2),
    oy = Math.floor((size - dh) / 2),
    colors = GAME_PALETTE.map(hexToRgba);
  for (let y = 0; y < dh; y++)
    for (let x = 0; x < dw; x++) {
      const si =
          ((top + Math.min(sh - 1, Math.floor((y + 0.5) / scale))) * w +
            left +
            Math.min(sw - 1, Math.floor((x + 0.5) / scale))) *
          4,
        di = ((oy + y) * size + ox + x) * 4;
      let color = Array.from(crop.slice(si, si + 4));
      if (color[3] >= 96) {
        if (quantize)
          color = colors.reduce(
            (best, c) => {
              const d =
                (c[0] - color[0]) ** 2 +
                (c[1] - color[1]) ** 2 +
                (c[2] - color[2]) ** 2;
              return d < best.d ? { d, c } : best;
            },
            { d: Infinity, c: color },
          ).c;
        output.set([color[0], color[1], color[2], 255], di);
      }
    }
  return rgbaToSprite(output, size, size);
}
export function floodFill(sprite, x, y, color) {
  const start = y * sprite.width + x,
    old = sprite.pixels[start];
  if (old === color) return;
  const stack = [start];
  sprite.pixels[start] = color;
  while (stack.length) {
    const i = stack.pop(),
      px = i % sprite.width,
      py = Math.floor(i / sprite.width);
    for (const n of [
      px ? i - 1 : -1,
      px < sprite.width - 1 ? i + 1 : -1,
      py ? i - sprite.width : -1,
      py < sprite.height - 1 ? i + sprite.width : -1,
    ])
      if (n >= 0 && sprite.pixels[n] === old) {
        sprite.pixels[n] = color;
        stack.push(n);
      }
  }
}
