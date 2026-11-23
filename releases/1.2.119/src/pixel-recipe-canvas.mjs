import { pixelRecipeFrameAt } from "./pixel-recipe.mjs";
import { spriteToRgba } from "./pixels.mjs";

const rasterizedFrames = new WeakMap();

function rasterize(sprite) {
  const canvas = typeof OffscreenCanvas === "function"
    ? new OffscreenCanvas(sprite.width, sprite.height)
    : Object.assign(document.createElement("canvas"), {
        width: sprite.width,
        height: sprite.height,
      });
  const pixels = new ImageData(spriteToRgba(sprite), sprite.width, sprite.height);
  canvas.getContext("2d").putImageData(pixels, 0, 0);
  rasterizedFrames.set(sprite, canvas);
  return canvas;
}

/** Draw a compiled recipe at its native pixel size relative to a scene anchor. */
export function drawPixelRecipe(context, recipe, elapsedMs, x = 0, y = 0) {
  const sprite = pixelRecipeFrameAt(recipe, elapsedMs);
  const raster = rasterizedFrames.get(sprite) ?? rasterize(sprite);
  context.save();
  context.imageSmoothingEnabled = false;
  context.drawImage(raster, x + (sprite.x ?? 0), y + (sprite.y ?? 0));
  context.restore();
}
