# Shadow Realm — layered Underworld and pink/purple candles

Checkout: C:/Users/New User/Desktop/Wildbound; Wildbound_worlds; origin https://github.com/ijustcreate/Wildbound.git. Base f0b787ff33c3ac8f3675b48504937ebda4f0dcb5 plus modified source. Shared version advanced to 1.2.107 during concurrent game work and was preserved. No commit/push or web publication requested.

## Visual brief

The user requested the Underworld atmosphere from animated Hercules, then asked for design layers comparable to the Forest and glowing pink/purple candles. Inspected references: the monumental skull-faced cavern entrance above the River Styx and its cold blue river of pale souls. [Entrance reference](https://disneyshercules.wikia.com/wiki/Styx), [river reference](https://www.businessinsider.com/hercules-clever-interesting-details-that-went-over-your-head). Reference JPEGs remain in ignored test-output/shadow-underworld/.

Skill: wildbound-pixel-assets. Forest references: docs/FOREST_UPGRADE.md, forest-landscape.mjs and forest-art.mjs, especially continuous materials, paving, contextual litter, clustered landmarks, banks and separate atmosphere layers. Use broad native pixel silhouettes and restrained flat value groups. Palette: ink #0a121c, deep #101f2b, stone #283b49, face #41596a, rim #6c8794, river #234f5b, souls #94c9c7, blue fire #70c9ed, pink candlelight #ff75c8 and violet candlelight #c282ff.

## Layers and behavior

- Broad ash/mineral ground tones; worn flagstone paths and clearing paving; chipped ledges, striated cliff faces and bank scree.
- Small bones, rubble and urns; composed broken-column/candle groups; large rib arches and a skull-shaped gateway; low-contrast distant cavern buttresses.
- Seventeen editable indexed scenery kinds: eight existing resource IDs and nine new decorations. Gateway and buttress sprites are 128x128 logical pixels; others are 64x64. Existing custom sprite overrides, felling and mining behavior remain intact.
- Three uneven wax candles per cluster, native flickering pink/violet flames, soft local halos, real colored light sources and narrow reflections near river water. Blue braziers and pale crystals supply the contrasting cold light.
- Existing shadow_void becomes a lower soul river with flowing ribbons, scattered spirits and an eddy in the existing eastern shallow pool. Void collision and all route tiles are unchanged; the drop is not new swimmable water. Additional river mist is clipped below actors, with sparse foreground air ribbons below combat cues/HUD.
- Ground rasters are capped at 64 surfaces of 128x128 pixels (4 MiB RGBA data); keys include world coordinates, seed and neighbor terrain. At most 80 soul silhouettes are drawn in visible bounds. Rendering never consumes game RNG or creates saved ghost actors.
- shadow-underworld-layout.mjs adds composed dressing without moving or rewriting existing props or painting terrain. Older running shadow expeditions receive the upgrade once through a saved presentation version. Fixed authored scenery layouts opt out; their draft data stays exact. Default scenes stay within 158 props, with a maximum of 178 at higher density. New decorative groups add no collision blockers.
- Shadow-only exploration darkness leaves distant architecture faintly readable. Discovery data and enemy sight/culling stay unchanged. The existing ward event uses matching blue circles, and the status label reads THE UNDERWORLD.

## Review

The first actual Electron review caught overly opaque exploration darkness and evenly aligned soul rows. Adjusted distant readability and dispersed soul placement, size and lean. The user's layering/candle follow-ups added paving, contextual ruins, litter, distant architecture, river details and colored light. Existing foreground fade keeps explorers readable behind arches. A newer portal transition initially washed out QA screenshots when fixtures teleported; only the review fixtures clear that transient flash before capturing. Reviewed the full map, native prop board, gateway, river, board clearing, candle-lit ruins and small-window co-op. These are developer-reviewed previews, not user aesthetic approval.

## Verification and shared-checkout limits

Initial realm/boundless/art tests: 21 passed. The initial muted Electron pass had 19 successful checks; the final layered snapshot has 23, failed=0, no renderer errors. It covers real light sources in both pink and purple; blue braziers; layered scenery; gateway/depth/fade; route and void boundaries; soul animation/budget; cache budget; artwork overrides; exact saves and authored layout preservation; workshop assets; small-window co-op; and both existing realm encounters.

A focused realm/boundless/night/raven/projection run passed 53 checks. The final focused run includes two additional regressions for additive old-save dressing and fixed authored-layout opt-out; its final count is recorded in the desktop receipt below.

Concurrent shared edits caused transient startup failures during an early broad rebuild: a duplicate sword-release declaration, a temporarily unavailable stationPoint export and a JOINTS initialization cycle. The first two changed while other work was in progress. Pure actor-projection.mjs isolates the same facing/projection math used by snowy-owl-art, raven-art and pixel-shapes from the full rig initialization graph. Cold import-order and eight-view projection regressions cover this fix; no joint, animation or authored appearance data changes.

The shared-tree broad attempt was stopped. An isolated run was superseded by the user's layering/candle follow-ups. The last repository-wide run was stopped after the appropriate focused and Electron checks passed; no completed full-suite pass is claimed for this visual update. Final verification and packaging use the isolated dirty-source snapshot at tmp/shadow-underworld-build, excluded via local .git/info/exclude. Other chats' source, user profiles, house drafts, sound settings and running player games are preserved.

Final package identity, focused results and launcher receipts follow below.

## Final desktop receipt

Version 1.2.107; commit f0b787ff33c3ac8f3675b48504937ebda4f0dcb5, packaged from modified source in the isolated snapshot. Built 2026-11-23T02:42:26.172Z, normal profile (preview=false). Later concurrent checkout edits are not automatically part of this frozen build.

Output: dist/1.2.107-2026-11-23T02-41-59-713Z/Wildbound-win32-x64/Wildbound.exe. The desktop shortcut C:/Users/New User/Desktop/Wildbound Worlds (1.2.107).lnk targets C:/Users/New User/Desktop/Wildbound/Play Wildbound.cmd with no preview argument. Both shortcut creation and Play Wildbound.cmd --check selected this exact build.

Final focused run: 54/55 initially passed; the sole failure identified missing distant buttresses in streamed void regions. The snapshot's scenery filter now retains only explicitly distant underworld_buttress backdrops there, matching the concurrent main-tree correction. All seven tests in the affected boundless-realms file passed on recheck. The two added old-save/authored-layout regressions passed. No completed repository-wide suite is claimed.

Packaging syntax-checked 891 runtime files. All 13 feature runtime files in the copied package match the frozen snapshot byte for byte, including the corrected scenery filter. Actual copied packaged runtime: 23 checks passed, failed=0, errors=[], muted=true. Actual packaged EXE boot smoke: exit=0, lobby ready, version 1.2.107, errors=[], audioMutedTest=true. Captures and JSON report: test-output/shadow-underworld/packaged/. Clean visual review: candleRuins.png.

No commit or push performed. Existing normal saves, authored drafts, player audio settings and other running games were preserved. Hardware controller play, remote multiplayer and FPS were not measured for this visual update.
