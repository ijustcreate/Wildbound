# Humanoid artwork

The source PNGs were produced with the built-in OpenAI image tool. Exact generation prompts are in `prompts.json`, `hair-rear-prompt.txt` and `hair-chunky-prompt.txt`. These are working assets, not a user-approved replacement style reference; the two original references are bundled in `.agents/skills/wildbound-pixel-assets/assets`.

The user rejected fine texture across the whole character. The current correction uses simple pixel eye templates on the existing facial handles, flat clothing colors, and four-shade hair. `hair-chunky.png` supplies simpler crop, long hair and ponytail silhouettes across five distinct views. Remaining styles use the first sheets with the same restrained palette. `heads.png` and `materials.png` are retained source experiments; their fine texture is no longer applied.

`src/humanoid-hd.mjs` owns measured atlas bands, transparent-bound crops, palette tinting, style dimensions and direction mapping. Atlas rows are not always evenly spaced. Hair uses separate front, front diagonal, profile, back and rear diagonal drawings, with mirrored opposite views. Asymmetric future styles should supply explicit opposite views.

Body, neck, hip, limb and gear silhouettes remain attached to the existing joints. Source pixels and flat ramps remain crisp through zoom; enlargement adds no fabric grain or bevels. Faces rasterize once before zoom/rotation to avoid seams between fractional rectangles. Inventory icons render at 96 pixels. Custom rig wearables and painted bone sprites remain supported.

Run `node node_modules/electron/cli.js scripts/verify-humanoid-hd.cjs` for assembled appearance/armor coverage and full eight-direction walk/run sheets. `scripts/preview-characters.cjs` creates the concise character study. Both use isolated profiles. For future assets use the versioned `wildbound-pixel-assets` skill; calibrate one assembled sample before making a catalog.
