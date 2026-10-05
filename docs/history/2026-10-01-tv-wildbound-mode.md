# October 1, 2026: TV World 2D Wildbound mode

## Symptoms and intent

The lobby television had a platform course but no transition into a separate Wildbound game after level 2. The requested follow-on mode needed side-view movement, a panoramic scrolling board, the existing character rigs, selected enemy families and goombas, while preserving the normal expedition.

## Changes

- The TV's second cavern course now finishes at its flag and castle. Its finish sequence marks the arcade complete and transfers the TV party into a separate `TvWildbound` state inside the lobby. The screen shows a Jumanji warning and pulls the players toward the TV before the new mode appears.
- The new mode has a 4,800-pixel scrolling side-view level, a horizontal 30-space board, physical tables that roll when hit, a final gate, two-player camera constraints and checkpoints. It renders each player's shared Wildbound rig and appearance. Skeletons and archers patrol, archers fire horizontally, lions and tigers chase, bats swoop, and goombas remain stompable.
- Mode physics, enemies, board progress and hit points are kept outside the regular `Game` state and its save profile. Returning to the lobby after sealing the board resets only this TV session.
- Controller and keyboard TV input routes X to attack in the new mode. The original TV game still uses X to run. The desktop rebuild script runs tests serially after an intermittent unrelated parallel-suite door test failure.

## Verification and limits

- Focused TV and transition tests passed, including level 2 finish, co-op transfer, dice hit gating, camera, enemy behaviors and the final gate.
- The complete Node suite passed serially (581 tests at handoff). An earlier parallel run had one intermittent door-interaction failure; that test passed alone and in the serial suite.
- Isolated source and packaged Electron checks rendered the warning, panorama, small viewport and actual two-player lobby transition with no renderer errors. The packaged executable launched in an isolated smoke profile and reported 14 failures of 99 checks, the same count previously documented for the older 1.0.45 package. Real controller playtesting and a full manual traversal of both TV courses remain unverified.
- Build identity: source commit `3c3fe40274558d9f62c0c8d62c9b1944e9c02eb0` plus uncommitted local source. The normal desktop package is `dist/1.0.47/Wildbound-win32-x64/Wildbound.exe`; its shortcut targets repository `Play Wildbound.cmd` and uses the normal Electron profile, not `--preview`. Rebuild after pulling source on another computer. No commit or push was requested.
