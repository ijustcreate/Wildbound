# Grim Reaper native art

The user's final reference supplies the drooping charcoal hood, recessed ivory skull, flared robe and curved scythe silhouette. Artwork remains articulated on Wildbound's editable humanoid rig, not a baked character image.

Sources: `src/reaper-art.mjs`, `src/reaper-clips.mjs`, `src/reaper-motion.mjs`, shared `src/player-motion.mjs` attachments, and the `grim_reaper` entry in `authored/rigs.json`.

The hood attaches to head; ribs span chest/pelvis; sleeves and gloves follow elbows/hands; skirt follows pelvis and feet; Death's Shroud follows the cape cloth solver; scythe follows the right hand. Casting uses the left hand. Native procedural strokes use half-unit pixels for matching humanoid detail. Hood extent is approximately 18 by 20 logical units. Cloth ramp: #101114, #202127, #30323b, #484a52; ivory bones and cool silver blade use contrasting flat shades. All eight native direction IDs are rendered, including distinct side/rear occlusion. Painted overrides and equipment transforms remain in the shared renderer.

`portrait.png` shows the assembled set beside a player. `assembled.png` shows eight directions and idle, walk, run, both attacks, raising, channeling and death at enlarged and small scales. `preview.png` shows hand-to-chest drain; `banshee.png` shows the held frost shot and ice prison. `hood.png` and `manifest.json` are the checked eight-view diagnostic atlas. The runtime consumes native drawing routines rather than this diagnostic atlas.

Run `scripts/verify-reaper.cjs` in muted Electron for 832 frame renders, actual Game drain activation, studio, inventory, creator, exception checks and unchanged authored pose data. `report.json` records the latest result. Node behavior coverage is in `tests/reaper.test.mjs` and `tests/death-frost-skills.test.mjs`.
