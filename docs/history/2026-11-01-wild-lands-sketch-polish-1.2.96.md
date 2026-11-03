# The Wild Lands — sketch geography and exploration polish (1.2.96)

- Replaced the superellipse island, circular ice patch and rectangular cemetery with polygon outlines based on the user's landscape sketch. Preserves the northwest jungle, northeast bayou, central ice, southwest cemetery, connecting forests, southern beaches and separate southeast portal island.
- The main river now runs between the bayou and forest, past the eastern ice edge, then bends southwest to a southern outlet. Connected bayou branches, open banks, three wooden foot crossings and linked worn trails provide walkable routes. Footbridge decks reuse the native bridge/swimming layers.
- Ten discoverable places: courtyard, forest camps, ice cache, burial ground, bayou camp, homestead, beach cove, crystal grotto and veil reliquary. Native supply chests open once per session and drop normal loot; camp/homestead rest restores a little health. Added landmark destinations to the dev travel selector. Broader clearings remain open; cemetery edging, modest native props and small structures add regional identity.
- Preserves 1.2.95 normal combat, dash, projectiles, companions, furnished stations, authored train art, original-expedition restoration and existing saves. The world remains a dev session, not a saved campaign. No commit/push or web publication requested.

## Rendering and measurements

- Geography queries share a small fixed tile raster; river/trail segment lookup uses spatial bins. Cached detailed floor tiles use a less costly sampling density. Minimap and full overview have separate bounded-size rasters so opening the world does not build every overview prop immediately.
- Cached distant locomotive/coach sprites preserve the native exterior at map scale. Full articulated art and animation resume at play distance; passenger actors remain live. Cache keys track heading, roof, engine and door states, and are cleared when a design is applied. World overview keeps the local collision scenery rather than replacing it with an empty list.
- Station geometry reuses its stop-array identity/revision instead of serializing the whole layout on every query. Replacement layouts and explicit revisions invalidate correctly. Meadow-distance cache evicts oldest entries at its bound instead of clearing its entire working set.
- Scripted muted Electron CPU draw measurements, same four camera setups and 16 warm draws per setup (not hardware FPS): close mean 30.47 → 10.88 ms; river 23.28 → 10.98 ms; spread co-op 39.25 → 21.36 ms; overview 63.94 → 12.08 ms. Cold close 777.4 → 356.2 ms; cold river 496.8 → 300.8 ms; cold spread 380.2 → 253.0 ms. The richer overview's first raster construction rose 66.6 → 107.7 ms; cold streaming can still hitch. Content changed with the rendering work, so these measure the complete resulting scenes rather than an isolated algorithm.
- Evidence: test-output/wild-lands-polish/before.json, after.json and after.cpuprofile. Updated actual game screenshots: test-output/wild-lands-review.

## Verification and build

- Focused layout, supply, room, bridge, station-cache and existing railway/combat checks pass. Muted native Electron: 162 checks pass, including normal input/gameplay, all station and surface/chamber supplies, real walking across a footbridge, swimming below decks, original-world restoration and actual dev-menu entry.
- Full-suite, packaged-content, actual EXE boot and launcher/shortcut receipts are recorded at delivery. Source base: 1b0eb96, modified source. Normal-profile launcher: Play Wildbound.cmd. Hardware controllers, remote multiplayer and hardware FPS remain unverified.

## Final desktop receipt

- Rebuild: 1,752 tests passed; 532 runtime files syntax checked. Packaged native verification: 162 checks passed with zero renderer errors. All 13 checked runtime files match source exactly; actual packaged EXE muted boot, launcher identity and shortcut target checks passed.
- Output: C:/Users/New User/Desktop/Wildbound/dist/1.2.96-2026-11-02T03-52-47-865Z/Wildbound-win32-x64. Built UTC 2026-11-02T03:53:12.833Z from modified source at 1b0eb966fc3255d3485f41f4a4e290e58c21374d. No commit or push.
- Normal-profile shortcut: C:/Users/New User/Desktop/Wildbound Worlds (1.2.96).lnk -> C:/Users/New User/Desktop/Wildbound/Play Wildbound.cmd; blank arguments. Existing games and normal saves were preserved.
- Receipts: test-output/wild-lands-1.2.96-final-receipt.json, wild-lands-1.2.96-final-verify.log, wild-lands-1.2.96-rebuild.log and wild-lands-review/report.json. World progress remains temporary to the dev session.
