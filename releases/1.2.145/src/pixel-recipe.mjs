import { validateSprite } from "./pixels.mjs";

const hexColor = /^#[0-9a-f]{6}$/i;
const displayKeys =
  "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz!\"#$%&'()*+,-/:;<=>?@[\\]^`{|}~";

function checkObject(value, label, allowed) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`${label} must be an object`);
  }
  for (const key of Object.keys(value)) {
    if (!allowed.includes(key))
      throw new Error(`${label} has unknown field ${JSON.stringify(key)}`);
  }
}

function drawRows(sprite, keys, rows, x, y, width, height, label) {
  if (!Array.isArray(rows) || rows.length !== height) {
    throw new Error(`${label} must contain ${height} rows`);
  }
  rows.forEach((row, rowIndex) => {
    if (typeof row !== "string" || row.length !== width) {
      throw new Error(`${label}[${rowIndex}] must contain ${width} pixel keys`);
    }
    for (let column = 0; column < width; column++) {
      const key = row[column];
      if (key === ".") continue;
      if (!keys.has(key)) {
        throw new Error(
          `${label}[${rowIndex}][${column}] has unknown palette key ${JSON.stringify(key)}`,
        );
      }
      sprite.pixels[(y + rowIndex) * sprite.width + x + column] = keys.get(key);
    }
  });
}

function drawPatches(sprite, keys, patches, label) {
  if (patches === undefined) return;
  if (!Array.isArray(patches)) throw new Error(`${label} must be an array`);
  patches.forEach((patch, index) => {
    const at = `${label}[${index}]`;
    checkObject(patch, at, ["x", "y", "rows"]);
    const { x, y, rows } = patch;
    if (!Number.isInteger(x) || !Number.isInteger(y) || x < 0 || y < 0) {
      throw new Error(
        `${at} must have nonnegative integer x and y coordinates`,
      );
    }
    if (
      !Array.isArray(rows) ||
      typeof rows[0] !== "string" ||
      rows[0].length === 0
    ) {
      throw new Error(
        `${at}.rows must be a nonempty array of nonempty strings`,
      );
    }
    const width = rows[0].length;
    const height = rows.length;
    if (x + width > sprite.width || y + height > sprite.height) {
      throw new Error(
        `${at} exceeds the ${sprite.width}×${sprite.height} canvas`,
      );
    }
    drawRows(sprite, keys, rows, x, y, width, height, `${at}.rows`);
  });
}

export function compilePixelRecipe(spec, { base } = {}) {
  checkObject(spec, "Spec", [
    "width",
    "height",
    "palette",
    "rows",
    "base",
    "x",
    "y",
    "patches",
    "frames",
  ]);
  if (spec.base !== undefined && (typeof spec.base !== "string" || !spec.base.trim())) {
    throw new Error("base must name a native sprite");
  }
  if (spec.base !== undefined && base === undefined) {
    throw new Error("This recipe needs a native sprite base");
  }
  if (base !== undefined && !validateSprite(base)) {
    throw new Error("Invalid native sprite base");
  }

  const { width = base?.width, height = base?.height } = spec;
  if (
    ![width, height].every(
      (size) => Number.isInteger(size) && size >= 1 && size <= 128,
    )
  ) {
    throw new Error("width and height must be integers from 1 to 128");
  }
  if (base && (width !== base.width || height !== base.height)) {
    throw new Error("width and height must match the base sprite");
  }

  const { palette: basePalette, pixels: basePixels, ...metadata } = base ?? {};
  const palette = basePalette ? [...basePalette] : ["transparent"];
  const keys = new Map([["_", 0]]);
  const indices = new Map(
    palette.slice(1).map((color, index) => [color.toLowerCase(), index + 1]),
  );
  const colors = spec.palette === undefined ? {} : spec.palette;
  if (!colors || typeof colors !== "object" || Array.isArray(colors)) {
    throw new Error("palette must map single pixel keys to #RRGGBB colors");
  }
  for (const [key, color] of Object.entries(colors)) {
    if (
      !displayKeys.includes(key) ||
      key.length !== 1 ||
      typeof color !== "string" ||
      !hexColor.test(color)
    ) {
      throw new Error(
        `Invalid palette entry ${JSON.stringify(key)}. Use a single printable ASCII character other than . or _ and a #RRGGBB color`,
      );
    }
    const hex = color.toLowerCase();
    if (!indices.has(hex)) {
      indices.set(hex, palette.length);
      palette.push(hex);
    }
    keys.set(key, indices.get(hex));
  }

  const sprite = {
    ...structuredClone(metadata),
    width,
    height,
    palette,
    pixels: basePixels ? [...basePixels] : Array(width * height).fill(0),
  };
  for (const axis of ["x", "y"]) {
    const coordinate = spec[axis] === undefined ? base?.[axis] : spec[axis];
    if (coordinate === undefined) continue;
    if (!Number.isFinite(coordinate))
      throw new Error(`${axis} must be a finite sprite offset`);
    sprite[axis] = coordinate;
  }
  if (spec.rows !== undefined || !base) {
    drawRows(sprite, keys, spec.rows, 0, 0, width, height, "rows");
  }
  drawPatches(sprite, keys, spec.patches, "patches");
  if (!validateSprite(sprite))
    throw new Error("Art exceeds the native sprite format limits");

  let frames;
  if (spec.frames !== undefined) {
    if (!Array.isArray(spec.frames) || !spec.frames.length) {
      throw new Error("frames must be a nonempty array");
    }
    frames = spec.frames.map((frame, index) => {
      const at = `frames[${index}]`;
      checkObject(frame, at, ["duration", "patches"]);
      if (!Number.isSafeInteger(frame.duration) || frame.duration <= 0) {
        throw new Error(
          `${at}.duration must be a positive integer in milliseconds`,
        );
      }
      const drawing = { ...sprite, pixels: [...sprite.pixels] };
      drawPatches(drawing, keys, frame.patches, `${at}.patches`);
      return { duration: frame.duration, sprite: drawing };
    });
  }
  const duration = frames?.reduce((total, frame) => total + frame.duration, 0) ?? 0;
  if (!Number.isSafeInteger(duration)) throw new Error("Total animation duration exceeds the safe millisecond range");
  return { sprite, keys, frames, duration };
}

/** A local animation loop uses the author-selected holds in milliseconds. */
export function pixelRecipeFrameAt(compiled, elapsedMs = 0) {
  if (!compiled.frames) return compiled.sprite;
  let remaining = (Number.isFinite(elapsedMs) ? Math.max(0, Math.floor(elapsedMs)) : 0) % compiled.duration;
  for (const frame of compiled.frames) {
    if (remaining < frame.duration) return frame.sprite;
    remaining -= frame.duration;
  }
  return compiled.frames[0].sprite;
}

export function pixelRecipeText({ sprite, keys, frames }) {
  const sprites = frames ? frames.map((frame) => frame.sprite) : [sprite];
  const { width, height, palette } = sprites[0];
  const used = new Set();
  for (const sprite of sprites) {
    for (const pixel of sprite.pixels) used.add(pixel);
  }
  const keyByIndex = new Map([[0, "."]]);
  for (const [key, index] of keys) {
    if (key !== "_" && used.has(index) && !keyByIndex.has(index))
      keyByIndex.set(index, key);
  }
  const available = [...displayKeys].filter((key) => !keys.has(key));
  for (const index of [...used].sort((a, b) => a - b)) {
    if (!keyByIndex.has(index)) keyByIndex.set(index, available.shift() ?? "·");
  }
  const legend = [];
  for (const [index, key] of keyByIndex) {
    if (key !== "·") legend.push(`${key} ${palette[index]}`);
  }
  if (legend.length < keyByIndex.size) legend.push("· other palette colors");
  const indent = "    ";
  const ruler = [100, 10, 1]
    .filter((place) => place === 1 || width > place)
    .map(
      (place) =>
        indent +
        Array.from({ length: width }, (_, x) =>
          place === 1 || (x >= place && x % place === 0)
            ? Math.floor(x / place) % 10
            : " ",
        ).join(""),
    );
  const art = sprites.map((sprite, index) => {
    const title = frames
      ? `Frame ${index + 1} (${frames[index].duration} ms)`
      : "Sprite";
    const rows = Array.from({ length: height }, (_, y) => {
      const source = y * width;
      const pixels = sprite.pixels
        .slice(source, source + width)
        .map((pixel) => keyByIndex.get(pixel))
        .join("");
      return `${String(y).padStart(3)} ${pixels}`;
    });
    return [title, ...ruler, ...rows].join("\n");
  });
  return [legend.join("\n"), ...art].join("\n\n") + "\n";
}
