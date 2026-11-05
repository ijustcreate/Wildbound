# TV arena jump clearance — 1.2.100

The user reported that the arena was too cramped and overhead platforms stopped players from jumping onto the next route. The original 76-unit tier increments and 28–32-unit-thick solids left as little as 44–48 units beneath some ledges for a 58-unit-tall player. The previous reachability test found theoretical routes using run-speed launches; it did not establish comfortable ordinary-input traversal.

## Changes

- Replace 22 crowded platform pieces with eight broad stone/bridge pieces on two suspended levels, at y=317 and y=197. Tier rises are 120 units; overlapping floors have 96–98 units of clear space below them. The board remains at the exact horizontal map center and on the original ground elevation.
- Suspended platforms catch descending feet and allow upward/side entry. Tubes and ordinary full solids retain their underside and side collision. The change is confined to the TV arena, not the main adventure collision system.
- TV jump impulse increases from 520 to 620 to give the new rises a usable landing window, including bounded 20 Hz updates. Normal adventure jumping is unchanged.
- Move upper tube endpoints, enemy alcoves, crown hearth, question blocks and pickups onto the revised routes. Preserve the three linked pairs, enemy roster, board waves, inventory and treasure behavior. Shared authored artwork and personal profiles are unchanged.
- A small vertical camera follow keeps upper jumps, including jumps off tube lips, below the fixed header. The background covers the newly exposed view. The route map moves beneath the ordinary play area; floating name/life tags hide near the header rather than covering the character or board status. The board's action label moves beneath its plinth so the lower bridge cannot cover it.

## Checks

37 focused TV tests pass. New checks require at least 90 units beneath overlapping suspended floors; test ascending passage and descending landing on every platform; preserve full tube collision; and use actual player commands for floor/bridge/crown and four side approaches at 60, 30 and 20 Hz, without run or dash. The route graph now uses ordinary walking speed and the same exported TV jump impulse as gameplay.

Muted Electron verification includes actual input-driven central and side ascents, upper/tube jump visibility, linked travel, enemies, editable parts and the two-player app route. Final full-suite, packaged-review, executable and launcher receipts follow below. Physical controller feel remains unverified.

Initial checkout: `C:/Users/New User/Desktop/Wildbound`, branch `Wildbound_worlds`, source `1eb3571f206bba61ea2977cbcdd20727e6a1e58a`. Only pre-existing untracked `tmp/` was present at assignment start; it is preserved. No commit, push, save migration or normal-player game termination was requested or performed. Automated windows are muted before load and use isolated profiles.


## Final desktop receipt

- Version 1.2.100, normal save profile. Output: `C:/Users/New User/Desktop/Wildbound/dist/1.2.100-2026-11-04T23-50-06-273Z/Wildbound-win32-x64`. Built UTC `2026-11-04T23:51:08.106Z`, from modified source at `1eb3571f206bba61ea2977cbcdd20727e6a1e58a`. No commit/push performed.
- Full rebuild: 1,800 tests passed, zero failures; 832 runtime files passed syntax checks. Focused TV suite: 37 passed.
- Final packaged muted Electron review: 81 checks passed, zero renderer errors. Includes normal-input floor-to-bridge, bridge-to-crown, both side routes and both arena approaches, full-player visibility while jumping off the highest tube, return landing on its lip, all linked tubes, board waves, eight-view rigs and editable prop propagation. Reviewed center, side-route, high-jump and integrated two-player screenshots.
- 859 runtime/content files match source, including the packager's expected package.json metadata pruning. Local .bak/.tmp/.log files are excluded from runtime comparison; they were preserved. All requested runtime files match exactly.
- The actual packaged EXE booted with ready=true, failed=0 and zero renderer errors in a muted isolated test profile. `Play Wildbound.cmd --check` passed. Desktop `Wildbound Worlds (1.2.100).lnk` targets `C:/Users/New User/Desktop/Wildbound/Play Wildbound.cmd`, blank arguments, repository working directory, `assets/wildbound-icon.ico`.
- Final receipts: `test-output/tv-headroom/final-receipt.json`, `rebuild.log`, `focused-final.log`, `file-receipt.json`, `final-boot.json`, `launcher-check.log`, `shortcut.json`. Packaged screenshots/report: `test-output/tv-arena/headroom-packaged/`.
- Launch the updated desktop build and re-enter the TV world to construct the revised arena. Existing heroes, inventory, shared artwork and saves remain in the normal profile. Physical controller playtesting remains unverified.
