# Wildbound sprite-stacking demos

Open [the comparison gallery](index.html) to turn the five replacement props together. Use the angle slider to inspect a particular side, **Auto-rotate** for a full turn, and **1×** to see the art on its logical pixel grid. Each prop includes links to its concept, cleaned orthographic input, generated input, and transparent slice strip.

| Replacement | Existing Wildbound prop | Slice tile | Layers |
| --- | --- | ---: | ---: |
| Crypt supply crate | Blue Crypt `crypt_crate`, [mausoleum art](../../../src/mausoleum-art.mjs) | 19 × 15 | 16 |
| Crypt cask | Blue Crypt `crypt_barrel`, [mausoleum art](../../../src/mausoleum-art.mjs) | 15 × 15 | 18 |
| Station lantern | Railway `lantern`, [station cargo art](../../../src/station-prop-art.mjs) | 26 × 14 | 44 |
| Old Well | Old Well entrance, [well renderer](../../../src/old-well.mjs) | 62 × 52 | 54 |
| Abyss obelisk | Abyss Watch `crypt_obelisk`, [mausoleum art](../../../src/mausoleum-art.mjs) | 17 × 15 | 23 |

The [reference board](wildbound-reference-board.png) and original sprites come from Wildbound’s current drawing functions, captured in an isolated, muted Electron window. Each original sprite guided a new concept in the built-in OpenAI ImageGen tool. A second ImageGen pass turned each concept into top, side, front, and back pixel art. The [exact prompts](prompts.json) record both passes.

## Rebuild the layers

The cleaned PNGs in `views/` are the ready-to-carve inputs. They preserve the generated material art with background removal and nearest-neighbor resizing to register the silhouettes. The obelisk’s warm bevel was brought into the Crypt’s cooler stone ramp.

Use [Daniel White’s MIT-licensed sprite-stacking slicer](https://github.com/danielwh2/sprite-stacking/tree/0cce02efe6aa81fffcd05744d7ab65d40f412de2) at revision `0cce02efe6aa81fffcd05744d7ab65d40f412de2`. For each input pass `--order reading --top-nose down --side-nose left --dark-thresh 0`, `--slices` from the table above, and `--preview` for the turntable contact sheet. The props use these additional flags and finishing steps.

| Prop | Flags and finishing |
| --- | --- |
| Crate | `--shade 0.08 --colours 22` |
| Cask | `--shade 0.08 --colours 22 --round` |
| Lantern | `--shade 0.2 --colours 24`. The narrow elevation was mirrored for a matching back and the hanger opening and thin rail were cleaned. The slicer outputs 14 × 26 tiles. Rotate each tile 90° counterclockwise and repack them into one row to place the lamp to the right of the pole at 0°. The rotation pivot is the pole’s foot at `(7.5, 7)`. |
| Well | `--shade 0.15 --colours 32`. Run `python refine-well.py carved-well.png slices/well.png` to open the basin above its floor and narrow the rope. The end-on view hides the rope behind a post. |
| Obelisk | `--shade 0.12 --colours 24` |

The gallery rotates each tile around the ground pivot, squashes its vertical screen axis for camera pitch and lifts it according to its layer index. The tiles are ground-first in each PNG, with nearest-neighbor sampling. The gallery runs from local files and provides a visual trial for the five replacement designs.

These five approved designs form the first batch of live replacements. The [production handoff](../../history/2026-11-24-merlin-and-prop-stacks.md) records their scene placements and verification.

## Game cost and verification

The five slice PNGs total 50,278 bytes on disk and about 0.78 MiB decoded as RGBA. The live turntable uses one draw per slice, or 16–54 draws per prop each time it redraws. For fixed scenery, bake the chosen angle to one sprite per variant and reuse it through Wildbound’s existing scenery raster or atlas path. A baked prop needs one sprite draw. The concept and review material is only used by the gallery.

The [preview](preview.png) was captured in muted Electron. The gallery check covers all five props, all 20 art links, rotation, auto-rotate, 1× to 3× scaling and a 430-pixel window. It recorded zero renderer errors. Verification covers the art trial and gallery. Gameplay frame times and actor occlusion remain unmeasured.

The [Wildbound art skill](../../../.agents/skills/wildbound-art/references/sprite-stacking.md) has the reusable procedure for other props.
