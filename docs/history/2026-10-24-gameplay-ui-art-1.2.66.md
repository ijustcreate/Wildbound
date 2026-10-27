# Wildbound 1.2.66 — accumulated gameplay, UI, artwork and car fixes

## Changes

- Field Kit Craft/Skills cards retain compact dimensions; hover and controller focus show floating details with native Craft/Train actions. Starter/private chest descriptions persist through redraws. Private storage windows are narrower, retain both full grids, and nearby chests display the configured interaction glyph.
- Map table has larger artwork wells, aligned two-column choices, description tooltips and a real Boundless switch. All ten destinations retain native selection callbacks.
- Storage portals have the requested taller silhouette, a bounded WebGL spiral shader with fallback, and editable native portal-runes particles.
- Vending catalog occupies the whole native machine window. Product and tray descriptions work on hover/focus, and individual collection plus Collect all remain reachable with Xbox/Nintendo controller navigation. Unaffordable/sold-out products can still be inspected.
- Beholder profile/rear stems and bulbs mask behind the orb. Away-facing rays remain visible; north-facing aim is exact. Lesser beholder retains its six-stalk artwork. Saved authored rig data is preserved.
- The displaced hero follows a controlled creature using normal collision/navigation with a stable gap, independent floor/water state and displacement-driven footsteps.
- User explicitly approved the axolotl draft with “Apply this draft.” Native cavern olm now uses its articulated eight-direction head, gills, limbs and tail, distance-driven gait and idle movement; custom authored olm sprites remain supported.
- Alan's leaf shoulders/cape are smaller and properly layered. Follow/patrol/farewell resolves his decision permanently; cancel remains reversible and story information remains available before a decision.
- Higher base nighttime visibility and smooth enemy sight-edge opacity, including segmented actors, replace edge popping.
- Cinder bolts burn local grass along their actual trajectory, preserve nearby blades, leave native fire particles and emit warm light. CPU and GPU grass paths use the same local burn marks, including persistent Boundless props. Projectiles and ground fires contribute dynamic lights.
- Beach pier uses the regular forest bridge/swimming support rules, with water beneath the transparent deck when swimming underneath.
- Car interaction now enters from the front or sides and enables gas/brake immediately, without an engine part or key. Legacy occupied cars also start on gas without gates. Existing keyboard/controller steering, braking, reverse, passengers and collision remain. Optional spare/key items are retained with updated descriptions. Car impacts respect rooted enemy anatomy.
- Car visual brief: retain its collision footprint and steerable axles; use a stepped tapered silhouette, forest-green paint masses, recessed blue glass, roof pillars, fenders, bumpers, inset lights and brake/reverse lamps. Night detection uses the real sky clock. Native assembled preview: test-output/car-april-review/car.png.
- April's equip/drag inventory transactions now publish replaced containers back to the controlled follower immediately. Her native posed renderer displays chest/pants materials, headwear, shoulders, gloves, boots, cape, necklace, back and offhand gear. Non-sword items draw at the hand's local origin; authored wearable overrides remain supported. Chosen or intentionally empty weapons survive control switching and saves. Hero gear/bag remain separate. Preview: test-output/car-april-review/april.png.

## Verification and build identity

- Branch Wildbound_worlds; source commit 1bd5ef027966e371f21cd0956b96b0aa4a62144b with modified/untracked source. No commit alone identifies this package.
- Normal-profile package: dist/1.2.66-2026-10-25T02-35-40-657Z/Wildbound-win32-x64; built UTC 2026-10-25T02:35:45.990Z (October 24 locally).
- Desktop Wildbound Worlds (1.2.66).lnk targets the repository's Play Wildbound.cmd, blank arguments and repository working directory. Launcher --check succeeds.
- Full desktop rebuild suite: 1,582 passed, zero failed, 248574.7 ms. Subsequent final focused car checks: seven passed, including rooted collision impact; combined final April/villager/car checks: 48 passed including inventory replacement, unequip, control switching and save/reload.
- Syntax: 418 runtime files. Exact packaged source/asset verification: 1,066 files, zero mismatches. Actual packaged executable boot: ready lobby, worlds available, zero failures/errors, muted test.
- Packaged muted isolated Electron: Field Kit/chest/map/portal/storage 49 checks; car/April 11; beholder 1,537; night/Alan/axolotl four; Cinder/pier four; Camp navigation 152; lobby/ready/menu 110; victory/replay/reward/crypt 65. Vending actual Xbox/Nintendo inputFrame controls and all four viewport checks pass. Every harness reports zero renderer errors.
- Packaged reports: test-output/packaged-1.2.66.log, build1-2-66-content.json, field-tooltips/report.json, car-april-review/report.json, and the corresponding review folders.
- Authored rig SHA256 remains DC05411B47F02259BE95EA0ED22AEA375D76F79B55D7F0BDEC57DA5DF7ED7D71.
No commit or push requested. Normal saves and authored/rigs.json preserved. Automated Electron windows are muted and use isolated profiles. Controller checks use synthetic native input; physical hardware and FPS have not been measured.
