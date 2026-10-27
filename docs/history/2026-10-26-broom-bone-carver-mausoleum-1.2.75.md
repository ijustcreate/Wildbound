# Wildbound 1.2.75 — broom, Bone Carver, mausoleum and editor fixes

Verified on October 26, 2026 (America/Los_Angeles). Actual checkout: C:/Users/New User/Desktop/Wildbound Server Branch Build. Branch Wildbound_worlds; Git commit 1bd5ef027966e371f21cd0956b96b0aa4a62144b; packaged from modified tracked source, including uncommitted additions. No commit or push performed.

## Build and launcher
- Exact package: dist/1.2.75-2026-10-27T05-01-45-967Z/Wildbound-win32-x64
- Executable: dist/1.2.75-2026-10-27T05-01-45-967Z/Wildbound-win32-x64/Wildbound.exe
- Built UTC: 2026-10-27T05:01:59.691Z
- Desktop: C:/Users/New User/Desktop/Wildbound Worlds (1.2.75).lnk
- Target: C:/Users/New User/Desktop/Wildbound Server Branch Build/Play Wildbound.cmd
- Shortcut arguments blank; working directory is this checkout; icon assets/wildbound-icon.ico. Launcher --check succeeds and selects this exact current package. Normal save profile; no --preview. Automated checks used isolated profiles and muted windows.

## Included changes
- Flying broom inventory mount, crooked witch hat, ordinary editable broom_ride animation, lower shaft beneath pelvis, forward bent knees and hands aligned to the shaft. B/loot dismount returns the original broom to its reserved inventory slot, including full backpacks. Mounted reservations cannot be moved or sold. Character/session/profile round trips retain usable items. Outdoor flight and released captured pets perching behind are included. Cardinal perch normalization is corrected. Broom and hat are in a new mausoleum treasury chest; existing authored layouts and existing saved runs are preserved.
- Bone Carver: dev-only event named The Bone Carver, weight zero and no biome tie. Smaller ram horns, slimmer human silhouette, fitted leaf dress without a cape, dark hooked claws with a runtime 24x24 WebGL pink outline, matching drifting pink eye particles, and a minimal burned alchemical circle with faint pulse. No pink outline is painted into the claw source mask. Canvas glow fallback is retained if WebGL is unavailable; native packaged checks confirm WebGL shader initialization. Workbench and wandering fox retained. One bone shard + any of 11 captured animal species yields its unique carved bone relic; the empty jar/cage is returned, or dropped safely if necessary. Locked inputs and insufficient reward capacity are atomic. Relics prefer a carried Reliquary Bag. New encounter verse/tip/audio cue and distinct item icons are registered.
- Mausoleum: blue masonry, cyan lights, webs, chains, altars, gates and treasure, plus dark Abyss Watch bridge/altar annex. Pit cells are editable; falling shrinks/fades an actor, freezes actions, and returns it to the last safe ledge with 6% max-health loss, minimum two damage but nonlethal. Native scale and editor decoration registration match. Freshly generated mausoleums receive the new geometry; custom authored layouts and saved runs are not overwritten.
- Rig Studio: head/eye selection exposes actual face pixels, sorts visible face artwork first and marks empty layers. Edit pixels here opens the shared inline pixel editor with pencil/erase/fill/pick, brush size, colors, undo/redo and a persistent save/cancel footer. Saves preserve selected layer/facing pivots and other artwork. Existing standalone Pixel Workshop remains for sprite-library/import/footprint work. Stage drawing resets offscreen transforms/alpha/composition and restores state after rendering; switching subjects discards only the transient canvas. A corrupted-preview-state regression reproduces and verifies recovery without resetting a rig. Skeletal wizard and Krampus dropdown labels are fixed, with a fallback label for future entries.
- Lesser beholder: current beholder model, seven-stalk art and animation are shared in Studio and rendering. Existing lesser combat and render size remain. The old six-stalk data is readable only for compatibility; its active drawing path is retired.
- Slime crown: donor crest travel now contributes only bounded wobble to a lobe embedded in the dome, eliminating the floating cap. All seven biome palettes, all facings and idle/run/attack/death poses are checked. User said the revised slimes look better.
- Reliquary bag-first pickup from intermediate 1.2.74 is included, with backpack fallback when the bag is full and loot retained when both destinations are full.
- Rejected cute humanoid style experiment is removed. No broad character appearance replacement is included.

## Verification
- Full rebuild: 1,661 tests passed, zero failures; 478 runtime syntax files checked. An additional newly added slime crown connectivity regression passed 672 palette/view/action/frame combinations. It was added while the full run was already in progress, so it is reported separately from that suite count.
- Final package: 1,160 byte-identical source/assets files (206,671,317 bytes), matching manifest/version/commit/normal profile.
- Packaged native checks: broom/Bone Carver 13, pit runtime 7, editor/save/recovery 9, shared beholder 3, reliquary pickup/UI/simulated Xbox/Nintendo 21: 53 total. All renderer error arrays empty.
- Native review: broom+mouse/frog in 16 views, Bone Carver in eight views, full mausoleum/editor/abyss, slimes in seven palettes and eight views. Actual packaged Wildbound.exe --boot-smoke-test --mute-audio --software-rendering: ready, failed=0, no renderer errors, version 1.2.75.
- Rig guard passes with no allowed changes. Authored rigs SHA256 remains DC05411B47F02259BE95EA0ED22AEA375D76F79B55D7F0BDEC57DA5DF7ED7D71. Normal saves/drafts were not reset or migrated by tests.
- Physical controllers, remote multiplayer, FPS and long-session balance remain unverified. Native simulated input and focused state tests do not claim hardware playtesting.

## Screenshots and editing storage
- test-output/editor-final/rig-face-pixel-editor.png — actual packaged head layer editor, with Save pixels to rig.
- test-output/editor-final/rig-pixels-saved.png — successful isolated save shown on the rig.
- test-output/editor-final/item-pixel-editor.png — Items inline pixel tools (inventory icon); worn layers use the same tools.
- test-output/broom-carver/bone-carver-eight-views.png; test-output/broom-mount/broom-eight-views.png; test-output/blue-mausoleum/mausoleum-overview.png; test-output/slime-final/slimes-eight-views.png.
- Rig art saves in authored/rigs.json under boneSprites[layer][facing], with a local wildbound-rig-sprite-overrides backup. Item wornArt/artPixels are kept in local wildbound-design item definitions through Studio Save; they are not automatically stored in authored/rigs.json. Ordinary sprite-library art remains separate. New broom, Bone Carver and slime artwork is authored in native drawing modules (src/broom-art.mjs, src/bone-carver-art.mjs and src/slime-motion.mjs); the screenshots demonstrate editing their runtime parts, not generating the original artwork in the GUI. The standalone Pixel Workshop does not list all procedural runtime rig parts; Rig Studio now edits their captured current artwork directly. The screenshots/tests use isolated profiles and a captured save callback, preserving the real authored file.
