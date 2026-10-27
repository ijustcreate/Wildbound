# Leaf rustle and lobby shoulders — 1.2.58

User requests: leaf masses should rustle with the grass wind; controller L must hold position and R must dash in the lobby. Work is in Desktop/Wildbound Server Branch Build, Wildbound_worlds, modified source on 1bd5ef027966. No commit or push. Normal saves and authored rigs are preserved.

## Changes

- Oak, birch and pine crowns reuse their existing artwork as four or five independently moving cached fans. Two-pixel motion follows the shared world-space grass breeze with staggered flutter. Storm strength increases it within bounds. Wood stays fixed; winter deciduous trees remain bare and snow follows evergreen fans. A bounded 128-tree cache replaces the single crown sprite/shear; no per-frame painting, random speckles or grass density reduction.
- Controller hold-position is explicit, works with swords, shields and empty hands as well as ranged aim, and stops slide/forward sword travel while allowing either stick to turn. Keyboard bindings are preserved.
- The rig's saved older controller layout used dodge 6, block 7, board 4, potion 5, pause 8 and inventory 9. The previous shoulder migration missed that trigger ordering. It now migrates shoulders and menu buttons while preserving unrelated custom binds.
- Lobby menu release tracks individual held buttons instead of withholding every practice action until all controls are neutral. A fresh R after inventory can dash while an old attack remains suppressed. Closing accept/jump remains suppressed until release. Inactive practice cancels dash recovery and ice slide too.
- Finite cooldown fallback prevents malformed legacy timers from permanently disabling dash. Lobby help distinguishes shoulder R from keyboard Space and includes L hold.

## Verification

Build identity, final checks and performance comparison are recorded below after packaging. Source Electron review confirms visible leaf movement, fixed root pixels, bare winter crowns and no renderer errors. Preview: test-output/leaf-rustle/leaf-rustle.webm and forest.png.

Controller QA now selects characters using the actual pad menu, starts from the older saved mapping, and covers Xbox, Nintendo and PlayStation synthetic pads, sword holding, ranged aim, fresh R with attack held after inventory, inventory/pause ownership and expedition routing. Physical hardware remains untested. No player game is terminated or restarted by tests.

The first full run caught two menu-release regressions: an absent explicit false jump in menu input and inventory accept leaking into jump on close. Both were repaired before the final full rebuild. The three-player QA also required separate test lanes to avoid mistaking player collision for a failed dash; actual dash state was already positive in that case.

Authored rig SHA256: dc05411b47f02259be95ea0ed22aea375d76f79b55d7f0bdec57da5df7ed7d71.

## Final packaged result

- Exact executable: `dist/1.2.58-2026-10-23T19-10-10-401Z/Wildbound-win32-x64/Wildbound.exe`, built 2026-10-23T19:10:18.333Z. Desktop `Wildbound Worlds (1.2.58).lnk` targets this checkout's `Play Wildbound.cmd`; launcher identity passes. Normal profile, not preview.
- Full final suite: **1,536 passed**, no failures; **410 runtime syntax checks**. Log: test-output/leaves-1.2.58-build-final.log.
- Final content identity: **1,055 files match**, no mismatches. Actual packaged executable boot: lobby ready, Worlds enabled, muted test, no errors, failed=0. Logs: leaves-final-content.log, leaves-final-boot.log.
- Packaged Electron: **75** synthetic controller/selection/lobby checks; **76** settings/pause/ownership checks; **3** leaf renderer assertions with 10,415 changed crown pixels and zero changed root pixels. All renderer error arrays empty. Logs: test-output/leaves-final-qa-0.log through -2.log. Hardware pads remain untested.
- Final paired forest comparison: both complete packaged runtimes in one window, alternating adjacent draw order/foreground canvas, 50 warm-up and 100 measured frames per scene. Previous 1.2.57 → 1.2.58 CPU means: clearing **7.88 → 8.41 ms**, outer roam **11.18 → 10.92**, negative roam **8.71 → 8.82**, stampede **14.03 → 15.17**. Corresponding p95: 11.2→12.5, 15.9→15.4, 10.5→11.5, 20.2→21.6 ms. Grass counts identical (7,516 / 15,564 / 11,835 / 7,516), stampede enemies 27 in both. No renderer errors. The leaf effect has a modest added cost in clearing/stampede; this is not a claim of improved FPS or locked 60. Previous cold streaming hitch limitation remains. Report: test-output/leaf-forest-interleaved/report.json.

Review is implemented for user assessment, not marked user-approved. The already-running game is not hot patched; reopen using the desktop launcher to load 1.2.58.
