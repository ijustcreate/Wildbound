# Wandmaker’s Garden benches

All four benches support two explorers in local co-op. Approach a bench from the front and use Interact to sit. Interact, a movement direction, or Jump stands the explorer up. The seat uses the existing player rig and projects it onto the slat while keeping its collision point on the lawn. Seated explorers hold their positions when another actor brushes past.

Garden cats occasionally walk to the occupied end of a bench and sit beside it. They resume their usual routes after a short visit or when the explorer stands. Routes check the pool, trees, benches, and fixtures. The west lamp moved up the lawn to keep the cat visible. A valid player seat survives loading a Wilds checkpoint. Visits start fresh on load.

## Verification

The source passed 43 focused Node checks and 39 muted Electron checks. The Electron run used the real Wilds gate, keyboard and virtual controller inputs, and the native renderer. It covered all four benches, both occupants sharing one bench, a third player being turned away, save and reload, and a rendered cat visit. Hardware controllers were outside the test.

## Desktop build 1.2.128

The normal-profile executable is `dist/1.2.128/Wildbound-win32-x64/Wildbound.exe`. It was built at 2026-11-24T05:58:55.475Z from modified `Wildbound_worlds` source at `5b244635ab78e5a3c8e78ef21fdbabf60e505fd7`. The `Wildbound Worlds (1.2.128)` desktop shortcut targets `Play Wildbound.cmd` with `-BuildDirectory "dist\1.2.128\Wildbound-win32-x64"`.

The pinned launcher and executable identity passed. The executable reached the lobby in muted smoke mode. All 39 garden checks passed against the packaged renderer. The package matched 1,918 of 1,923 checked runtime and asset files, including every file changed for seating and cat visits. Five unrelated runtime files changed in the shared checkout during packaging. The source comparison and packaged capture are in `test-output/mage-garden/`.
