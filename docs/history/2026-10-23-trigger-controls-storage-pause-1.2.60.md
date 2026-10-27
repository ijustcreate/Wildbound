# Trigger controls, storage scale and current pause menu — 1.2.60

Correct checkout: Desktop/Wildbound Server Branch Build, Wildbound_worlds, modified source on 1bd5ef027966. User clarified that L/R mean lower LT/RT triggers, not the bumpers. They also requested narrow same-scale private storage without bottom station buttons, and the current wooden menu design for expedition pause. No commit/push, no normal save/profile writes or authored rig edits.

## Controls

Xbox LT / Nintendo ZL / PlayStation L2 holds and aims; RT / ZR / R2 dashes. Xbox RB / Nintendo R / PlayStation R1 cycles owned/charmed creature control. D-pad Up opens/returns from storage; D-pad Left toggles the board. LB / Nintendo L uses a potion; D-pad Right toggles loot labels. Left menu opens inventory and right menu pauses as before.

The previously hardcoded D-pad Right creature route is now an explicit `controlCycle` binding, also available in lobby practice. Old saved layouts without that binding, shoulder-swapped layouts and old board-on-left layouts migrate to the clarified controls, preserving unrelated face choices. Explicit new-layout mappings remain editable. This also repairs the old swapped storage Up/Down mapping. Trigger dash does not drink a potion or cycle a follower; LT aim cannot open the board.

The earlier 1.2.59 candidate reproduced/fixed the board conflict with the then-assumed bumper layout, but was superseded before final delivery. Do not use it as the requested result.

## Storage

Private room-only overlays now use one representative panel per room. A partial party gets an edge window at most 420 CSS pixels / 32% of viewport width. All players in the same storage get one centered wider view. Different rooms remain separate. The same primary camera zoom and two-CSS-pixel logical convention render room actors at regular gameplay scale; the narrow camera pans/clamps instead of shrinking the entire room into a miniature preview.

Removed chest/shop/robot shortcut buttons beneath the room. Walk-up chest, vending, repair and return interactions remain in the existing storage simulation; the return icon and D-pad Up are retained. Inventory and actual shop interfaces are preserved.

## Pause

The shared lobby/expedition pause dialog uses the existing current wooden sign asset and legible ivory/gold styling, overriding the legacy parchment/green-button CSS. Sound/fullscreen/PvP/difficulty controls remain functional in a controller-navigable Quick Options disclosure. Settings, developer cheats, resume, new expedition, landing and Worlds remain visible main actions. The closed main menu fits desktop, 600×430 and portrait views without scrolling. No replacement raster artwork or gameplay handlers were introduced.

## Verification before packaging

- Focused controls/storage checks pass. New storage camera/grouping units and trigger/controller-label tests cover the clarified mappings, migration preservation and same-room behavior.
- Isolated muted Electron controller review passes Xbox, Nintendo and PlayStation simulated pads through actual character selection, LT wand aim, RT dash, D-pad board/storage, RB actually taking and returning creature control, inventory/pause and menu release. No physical hardware claim.
- Source storage/pause review passes 21 checks: narrow versus shared room layout, no station-button list, same zoom, in-room chest interaction, return control bounds and current pause sign/fit at three sizes. Screenshots: test-output/trigger-storage-pause/.

Exact build identity and final packaged verification are appended after completion. Preserve previous forest art, grass density, rustle, combat and performance limitations.

## Controlled anaconda and follower obstacle recovery

User additionally reported that the charmed anaconda model stays behind when directly controlled, and followers get stuck. Direct control copies the proxy player's world position onto the follower, bypassing `Game.moveActor(anaconda)` and the allied AI body-update branch. `syncControlledFollower` now updates the actual bounded world-space body trail immediately after position sync. Movement collision uses the controlled creature's own radius/floor offset and flight flag instead of the small hero proxy. The anaconda's zero X facing also incorrectly fell back to 1 in `atan2`, giving a diagonal head for due north/south; nullish fallback fixes art, initial tail direction and AI heading.

Boundless trails can initialize outside the old 0–1600 map and restore signed coordinates; finite local trail validation remains bounded. Clear following remains cheap direct movement. A grounded charmed follower blocked outside a house now requests routing instead of repeatedly walking straight into a tree. Shared navigation supplies an allied nearest-reachable approach when the goal grid cell is blocked, and bounded side steps at thin edges between grid centers. Snake/anaconda/April/Captain swimming routes use a separate appropriate grid, so land followers do not inherit water traversal. No catch-up teleport or collision bypass is introduced. This improves tested obstacle cases; it does not promise that every procedurally generated enclosure is traversable.

Final focused navigation/control/combat/house/jump checks: **66 passed**, including six new anaconda/follower regressions (four-turn direct trail, actual anaconda collision radius, signed Boundless restore, forest obstacle routing without a house, blocked goal cell, separate water/land routing). Muted Electron art review moves the snake about 98 units in each of four directions: head/body/proxy error remains zero, all 40 segments render, trail stays capped at 160, north-head pixels are vertical, and renderer errors are empty. Review images: test-output/controlled-anaconda/turns.png and world.png.

The final full rebuild run passes **1,545** tests. Final water/cardinal changes and the added water regression were then covered by the 66 focused checks and actual-renderer review before package verification. The earlier full attempt failed only an outdated bumper-dash expectation in sword-feel.test; it was updated to the user's explicit RT-dash requirement.

## Delivered fresh desktop build

- Exact executable: `dist/1.2.60-2026-10-24T00-32-55-036Z/Wildbound-win32-x64/Wildbound.exe`; built 2026-10-24T00:33:01.775Z (October 23 locally). Desktop `Wildbound Worlds (1.2.60).lnk` targets this checkout's `Play Wildbound.cmd`. Launcher identity passes; normal profile, not preview.
- Full rebuild **1,545 passed**, **411 runtime syntax checks**. Final updated navigation/anaconda/house/combat suite **66 passed**. Logs: test-output/triggers-storage-pause-1.2.60-build-final.log and anaconda-navigation-focused-final.log.
- Exact final package content: **1,057 files match**, zero mismatches. Actual packaged EXE boots to ready lobby with Worlds enabled, failed=0, no renderer errors, automated test audio muted. Logs: combined-1.2.60-content.log and combined-1.2.60-boot.log.
- Final packaged Electron: **102** controller/lobby/expedition/actual creature-control assertions, **76** settings/pause/controller ownership checks, **23** storage/pause layout/interaction assertions, plus moving anaconda world/turn render and north-facing pixel test. Every renderer error array is empty; anaconda head/proxy error stays zero through the moving four-turn sequence with a bounded 160-point trail. Logs: combined-1.2.60-qa-0.log through -3.log. Physical controllers were not tested.
- The private storage close icon stays in bounds, shared chest menus remain above the room view, and per-client-only room panels retain a representative view. Main pause actions fit without horizontal/vertical scrolling at 1280×850, 600×430 and 962×1635; Quick Options opens the retained audio/game controls.
- Authored rig SHA256 remains dc05411b47f02259be95ea0ed22aea375d76f79b55d7f0bdec57da5df7ed7d71. No save replacement or commit/push. No new FPS claim; earlier forest cold-streaming limits remain. Existing player game was not terminated. Reopen the normal desktop launcher to load this build.
