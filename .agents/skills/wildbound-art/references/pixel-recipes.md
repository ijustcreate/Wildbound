# Pixel art and recipes

## Start or refine an asset

- **New art.** Study the closest in-game asset at the intended scale. Draw a recognizable outer shape with deliberate one-pixel steps. Use a compact ramp per material, with connected shadow and highlight clusters to describe the broad planes. Add one or two features that give the asset its identity.
- **Revisions.** Capture the existing artwork before changing it. Fix silhouette, proportion, or fit before tone and small detail. Preserve the original origin, native resolution, and successful parts. Use the smallest assembled sample that shows whether the correction works.
- **Integration.** Use the game's current sprite layers, anchors, and caches. If a procedural asset already shares a painter with related assets, reuse that painter where it fits.

## Build and preview a recipe

From the repository root, run the included Ice lodge lantern example.

```sh
node scripts/pixel-art.mjs assets/pixel-recipes/winter-lantern.pixel.json --out test-output/pixel-art/lantern
```

The command writes `preview.png` (a checkerboard preview at integer scale), `pixels.txt` (coordinates and palette keys), and either `sprite.json` or `animation.json` (native indexed sprite data). Use a separate output directory for each asset during review.

A fresh recipe has integer `width` and `height` from 1 to 128, `rows` sized to the canvas, and a `palette` mapping single printable ASCII characters to `#RRGGBB` colors. A `base` may instead point to a native indexed sprite JSON file relative to the recipe. Dimensions inherit from that file and any declared dimensions must agree. Root `x` and `y` set the sprite's anchor-relative offsets. Omit them to keep the base offsets.

To obtain a CLI base from a saved Workshop sprite, choose **Export Library JSON**. Copy the sprite's value under its name into a standalone JSON file and point `base` at that file. Keep its palette, pixel indices, offsets, and any footprint data together.

A patch is `{ "x": 2, "y": 1, "rows": ["ha", "_a"] }`. Its coordinates are zero-based from the top left of the sprite, independent of the sprite's origin. Rows must form a rectangle within the canvas. A dot keeps the pixel below it and an underscore erases it. Root `patches` apply to the shared sprite. Each optional animation frame starts with that shared sprite, applies its own patches, and has a positive integer `duration` in milliseconds.

```json
{
  "width": 5,
  "height": 5,
  "palette": { "k": "#33281f", "a": "#e4bd73", "h": "#f2d39b" },
  "rows": [".kkk.", "k...k", "k.a.k", "k.a.k", ".kkk."],
  "frames": [
    { "duration": 180 },
    { "duration": 120, "patches": [{ "x": 2, "y": 1, "rows": ["h", "a", "_"] }] }
  ]
}
```

Omit `frames` for a static sprite. The animation output has a `frames` array with `duration` and `sprite` on each entry. Small flame, bubble, blink, and glint loops can share a fixed silhouette and origin, with patches only where pixels move. Characters and creatures use [editable rig clips](rigged-art-and-motion.md) for articulated movement.

## Preview and apply a frame in Studio

1. Open **Sprite Workshop**. Select the sprite you want to edit or choose **New Sprite** to try a recipe on a fresh draft. For a rig part, open **Studio → Players** to enter Animation Studio. Select its subject, facing, and joint, then choose **Sprites → Edit pixels here** on the desired layer.
2. Open **Pixel recipe**, paste the JSON, and choose **Preview recipe**. For an animation, select a **Frame** or use **Play** and **Pause**. A recipe with a `base` field uses the current editor draft; the field's filename is interpreted only when the CLI loads a recipe from disk.
3. Choose **Apply frame to draft**. The draft takes the selected frame and can be undone. Inspect the draft and use **Save to Game** in Sprite Workshop or **Save pixels to rig** in Animation Studio when ready. Keep the current sprite dimensions when preserving an existing collision footprint.

This is a single-frame editing path. Use the scene integration below to play the complete timed recipe in the game.

## Play a recipe in a scene

In a renderer module under `src/`, import the JSON and compile it once. Pass elapsed milliseconds and the prop's existing world or local draw anchor. The renderer uses each indexed frame's own origin and timing.

```js
import recipe from '../assets/pixel-recipes/winter-lantern.pixel.json' with { type: 'json' };
import { compilePixelRecipe } from './pixel-recipe.mjs';
import { drawPixelRecipe } from './pixel-recipe-canvas.mjs';

const lantern = compilePixelRecipe(recipe);

export function paintLantern(context, elapsedMs, groundX, groundY) {
  drawPixelRecipe(context, lantern, elapsedMs, groundX, groundY);
}
```

The CLI preview files are review artifacts. Keep the recipe with the source and use the [native lantern integration](../../../../src/winter-night.mjs) to see how the game compiles it directly.

The isolated preview helps locate corrections. Check the assembled result with its normal background, lighting, neighboring assets, and outline density. The [winter lantern recipe](../../../../assets/pixel-recipes/winter-lantern.pixel.json) and [integration notes](../../../../docs/art/winter-lantern.md) show the complete in-game example.

When changing the recipe tools, run `node --test tests/pixel-art-command.test.mjs` for the shared compiler and command, and `node scripts/verify-pixel-recipe-editor.cjs` for muted Electron verification of both editor entry points.

The coordinate patch and preview workflow was inspired by [claude-pxl](https://github.com/crsolver/claude-pxl).
