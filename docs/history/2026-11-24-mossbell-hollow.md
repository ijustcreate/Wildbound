# Mossbell Hollow

Mossbell Hollow is a forest clearing northwest of Eastwood Lookout and west of East Forest station. Find it on the Wilds map and take the woodland footpath north past the Mossbell Lantern. Interact with the lantern to set a checkpoint. It supplies one Health potion to explorers who have none, once per attempt.

Step into the clearing to start the fight. Mireheart drops into the arena as four forest slimes gather. Mireheart closes distance with short hops and marks its next slam on the ground before jumping. The mark stays where it first appeared. Moving clear or jumping over the impact gives explorers time to strike during its recovery. Its health scales with up to four explorers present when the fight starts.

Leaving the hollow empty for two seconds resets the fight. After a party defeat, Continue regroups downed explorers from the clearing at the lantern if one of them activated it. Staying near a downed explorer still allows the normal co-op revive. Defeat Mireheart and all four slimes to earn one Amber reliquary. The checkpoint, ongoing fight, and reward carry over when the expedition is saved and resumed.

The muted Electron verifier passed 38 checks on the packaged game, including the walk to the lantern, the slam, the recovery opening, retreat, solo and co-op retries, and one-time loot across reloads. The deterministic encounter run uses the renderer with terrain workers disabled. The packaged executable also passed its muted boot smoke check. The focused Wilds, combat, and slime rig regressions passed. The full Node suite had yet to finish at handoff.

## Desktop 1.2.157

The executable is `dist/1.2.157/Wildbound-win32-x64/Wildbound.exe`. It was built from the modified `Wildbound_worlds` checkout at `a6cee9bc55ad12ed58df5c3d27b150449f31ef26`. The syntax check covered 1,216 files, and all 22 encounter runtime files match the package. `Play Wildbound.cmd --check` verified the pinned build. The desktop shortcut `Wildbound Worlds (1.2.157).lnk` uses the normal save profile and targets `Play Wildbound.cmd -BuildDirectory "dist\1.2.157\Wildbound-win32-x64"`.
