# Dense enchanted Shadow Realm understory

User requested fuller layered planting around trees and props, with paths and POI areas kept clear.

A new additive, versioned placement pass groups the existing forest-derived purple plants around existing tree, log, arch, stone and ruin roots. Taller bramble bushes sit behind the host, curled fronds at the sides, low fungi and drooping flowers in front. Sparse star shards and real glowing wisp lanterns accent the beds. Sizes and positions vary deterministically; no new artwork/catalog IDs or trees replace existing content.

Placement rules preserve the central board clearing, water, POI circles, shrine portal approach and main/branch routes. Each plant center stays at least 44 + 0.38 × size world units from a route, accounting for its silhouette rather than only its root point. POI clearance includes its saved radius plus plant radius; portal clearance is 84 plus plant radius. Every new plant has zero collision width/depth.

The pass adds at most 224 decorative plants per 1600-unit region, independent of the existing base-dressing cap. Default seed 42 adds 204 plants in 42 host groups (410 total scenery props); seeds 1 and 917 add 207 and 224. Existing placements and terrain are unchanged. A saved version prevents repeat growth and revival of removed plants. Authored layouts retain their opt-out. Boundless generation uses the normal scenery translation and route filtering.

Validation: 23 focused tests pass, including five seeded density/clearance checks, layered host groups, bounded count, once-only old-expedition upgrade, authored opt-out, save/restore and two-way portal behavior. The old-version candle fixture was corrected to exclude new thicket plants when simulating its pre-update scenery. The final muted source Electron review passes 82 checks with zero errors; new checks cover actual density, zero collision and route clearance. Visually reviewed the root thicket, Mirrorwater Glade and Whispering Grove.

Desktop verification: packaged muted Electron also passes all 82 checks with zero renderer errors. Actual EXE muted boot smoke passes with a ready lobby and no errors. Packaging syntax-checked 954 runtime files.

Build: `C:\Users\New User\Desktop\Wildbound\dist\1.2.111-2026-11-23T18-33-42-601Z\Wildbound-win32-x64\Wildbound.exe`, version 1.2.111, built 2026-11-23T18:37:45.387Z from commit `f0b787ff33c3ac8f3675b48504937ebda4f0dcb5` with modified tracked source. Normal profile, not `--preview`.

Shortcut `C:\Users\New User\Desktop\Wildbound Worlds (1.2.111).lnk` targets `C:\Users\New User\Desktop\Wildbound\Play Wildbound.cmd` with the repository icon. Launcher `--check` selects the exact package above.

Both changed placement modules match packaged source hashes. The post-build source scan contains 957 runtime files, with concurrent later changes in src/combat-tactics.mjs, src/diagon-wand-shop-layout.mjs, src/diagon-wand-shop.mjs, src/enemy-combat-catalog.mjs, src/enemy-group-combat.mjs and src/enemy-species-combat.mjs. This build does not claim those later edits. Manifest/hashes: test-output/shadow-underworld/dense-build-receipt.json. Native report: test-output/shadow-underworld/packaged/report.json; tests, boot and launcher logs use the dense-* prefix in test-output/shadow-underworld/.

Evidence: test-output/shadow-underworld/source/denseThicket.png, mirrorwater.png, overview.png and boardClearing.png. No hardware-controller or FPS claim. No commit/push; unrelated shared edits and personal saves preserved.
