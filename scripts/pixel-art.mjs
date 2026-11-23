import {
  existsSync,
  mkdirSync,
  readFileSync,
  realpathSync,
  writeFileSync,
} from "node:fs";
import { dirname, join, parse, resolve } from "node:path";
import { PNG } from "pngjs";
import { spriteToRgba, validateSprite } from "../src/pixels.mjs";
import { compilePixelRecipe, pixelRecipeText } from "../src/pixel-recipe.mjs";

const usage = "Usage: node scripts/pixel-art.mjs <spec.json> --out <directory>";
function readJson(file) {
  try {
    return JSON.parse(readFileSync(file, "utf8").replace(/^\uFEFF/, ""));
  } catch (error) {
    throw new Error(`Could not read ${file}: ${error.message}`);
  }
}

function buildArt(specFile) {
  const spec = readJson(specFile);
  let baseFile;
  let base;
  if (spec?.base !== undefined) {
    if (
      typeof spec.base !== "string" ||
      !spec.base.trim() ||
      parse(spec.base).root
    ) {
      throw new Error(
        "base must be a native sprite JSON path relative to the spec",
      );
    }
    baseFile = resolve(dirname(specFile), spec.base);
    base = readJson(baseFile);
    if (!validateSprite(base))
      throw new Error(`Invalid native sprite: ${baseFile}`);
  }

  return { ...compilePixelRecipe(spec, { base }), baseFile };
}

function previewPng(sprites) {
  const { width, height } = sprites[0];
  const scale = Math.min(
    12,
    Math.floor(512 / Math.max(width, height)),
    Math.max(
      1,
      Math.floor(Math.sqrt(6_000_000 / (sprites.length * width * height))),
    ),
  );
  const gap = Math.max(4, scale);
  const cellWidth = width * scale + gap;
  const cellHeight = height * scale + gap;
  const columns = Math.min(
    sprites.length,
    Math.floor((1600 - gap) / cellWidth),
  );
  const png = new PNG({
    width: columns * cellWidth + gap,
    height: Math.ceil(sprites.length / columns) * cellHeight + gap,
  });
  const checker = [
    Buffer.from([148, 156, 164, 255]),
    Buffer.from([188, 195, 201, 255]),
  ];
  png.data.fill(Buffer.from([38, 45, 52, 255]));
  sprites.forEach((sprite, index) => {
    const image = spriteToRgba(sprite);
    const rgba = Buffer.from(image.buffer, image.byteOffset, image.byteLength);
    const startX = gap + (index % columns) * cellWidth;
    const startY = gap + Math.floor(index / columns) * cellHeight;
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const pixel = (y * width + x) * 4;
        const color = rgba[pixel + 3]
          ? rgba.subarray(pixel, pixel + 4)
          : checker[(x + y) % 2];
        for (let offset = 0; offset < scale; offset++) {
          const row = startY + y * scale + offset;
          const start = (row * png.width + startX + x * scale) * 4;
          png.data.fill(color, start, start + scale * 4);
        }
      }
    }
  });
  return PNG.sync.write(png);
}

function canonicalPath(file) {
  const path = existsSync(file) ? realpathSync.native(file) : resolve(file);
  return process.platform === "win32" ? path.toLowerCase() : path;
}

function main(args) {
  if (args.length === 1 && ["-h", "--help"].includes(args[0])) {
    console.log(usage);
    return;
  }
  if (args.length !== 3 || args[1] !== "--out" || !args[2])
    throw new Error(usage);
  const specFile = resolve(args[0]);
  const out = resolve(args[2]);
  const { sprite, keys, frames, baseFile } = buildArt(specFile);
  const sprites = frames ? frames.map((frame) => frame.sprite) : [sprite];
  const dataFile = frames ? "animation.json" : "sprite.json";
  const names = [dataFile, "preview.png", "pixels.txt"];
  const inputs = new Set(
    [specFile, baseFile].filter(Boolean).map(canonicalPath),
  );
  if (names.some((name) => inputs.has(canonicalPath(join(out, name))))) {
    throw new Error(
      "The output would overwrite an input. Choose a different --out directory",
    );
  }
  const data = [
    JSON.stringify(frames ? { frames } : sprite) + "\n",
    previewPng(sprites),
    pixelRecipeText({ sprite, keys, frames }),
  ];
  mkdirSync(out, { recursive: true });
  names.forEach((name, index) => writeFileSync(join(out, name), data[index]));
  console.log(`Wrote ${names.join(", ")} to ${out}`);
}

try {
  main(process.argv.slice(2));
} catch (error) {
  console.error(`pixel-art: ${error.message}`);
  process.exitCode = 1;
}
