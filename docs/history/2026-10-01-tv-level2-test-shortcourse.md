# October 1, 2026: shorter TV courses and level 2 transition

The 1.0.49 TV game returned to level 1 after beating level 2 because `LobbyTelevision.nextLevel()` still toggled from 2 to 1. That left the new 2D Wildbound mode unreachable through normal play. Each TV level also contained 24 sections, making the finish slow to test.

- `nextLevel()` now marks the TV complete after level 2, so `PlayableLobby` transfers the TV party into `TvWildbound` after the flag and castle sequence.
- Each level has five total sections for testing: the familiar starter section and four seeded sections. The existing flag, castle, pipe rooms, coins, enemies and level 2 cavern art remain.
- The level-finish tests now assert the new transition and the five-section course length. The focused tests and the full serial Node suite passed (581 tests). Source and packaged Electron checks reached the two-player 2D mode with no renderer errors.
- The normal Windows package is version 1.0.50 under `dist/1.0.50/Wildbound-win32-x64/Wildbound.exe`, built from commit `3c3fe40274558d9f62c0c8d62c9b1944e9c02eb0` plus uncommitted local source. The Desktop `Wildbound Latest (1.0.50).lnk` points to repository `Play Wildbound.cmd`, which launches the normal profile. Version 1.0.49 was running during the rebuild and was not stopped or overwritten. No commit or push was requested.

The packaged 1.0.50 smoke run completed 99 checks with 14 failures, the same count and failing areas recorded for the earlier package. These failures concern other lobby, rig-editor, controller and Field Kit checks; the focused TV transition checks passed. Real controller playtesting and a manual traversal of all five sections on both levels remain unverified.
