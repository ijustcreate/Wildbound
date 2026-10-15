# Keeper refinement — source changes after 1.0.79

Requested: exactly two helm antlers, and an amulet rather than a band.

- Crown now has left/right temple stems only, with connected tines and restrained hanging keepsakes; no central third antler. Shared procedural art updates both fitted gear and inventory icons.
- Amulet of Open Doors is a cyan pendant on a gold chain, with front/profile attachment and a rear chain-only view. Retains `keeper_band` ID and neck slot for save/quest compatibility. Quest completion dialogue uses “amulet.”
- The assembled-render check exposed a missing humanoid `sprite` route on the quest NPC's world actor. Spawn and drawing now explicitly select `player`; drawing also fixes old NPC saves lacking this property.
- No animation joints, clips, authored overrides, stats, reward ordering or gameplay scale changed. Unrelated render-order and humanoid verification work in the checkout was preserved.

Checks: 36 focused Node tests, 48 isolated Electron assembled poses in all eight directions at native/enlarged scale, 17 NPC UI/editor checks, and a generated attachment-atlas contract check covering 16 views with no errors/warnings. Rig remained unchanged; screenshots and generated contract/report are ignored under `test-output/keeper-refinements`.

These are uncommitted source changes, not included in the existing packaged 1.0.79 launcher. No new package, source push, or web deployment was made for this narrow follow-up.

## Follow-up: horn silhouette and exposed face

Replaced the upright fork silhouette with two outward-sweeping, inward-curving tapered antlers, each with one small tine. Removed the skull-mask overlay entirely; a slim teal circlet sits above the normal animated face. Icon and fitted renderer share the same geometry. The pixel-assets workflow kept the existing head attachment and all eight directional views intact.

Verified 37 focused tests, including an explicit no-face-overdraw check in all eight directions, 48 assembled Electron poses, and the 16-view attachment contract (no errors or warnings). Inspected the assembled contact sheet. These additional changes remain source-only, not in the 1.0.79 launcher.

## Later user sketch: shorter branching antlers

The user explicitly confirmed the orange outline in their annotated wing comparison also corrects the crown. The antlers now end five native pixels lower, with compact curled tips and inward tines, retaining two temple roots and the open brow. The existing 54-test combined wing/Keeper check, 48-pose Electron assembly check and 16-view attachment contract pass. See `2026-10-06-succubus-wing-shape.md` for this combined correction and its packaged delivery identity; the earlier source-only statements above are historical.
