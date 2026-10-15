# Wildbound 1.2.1 — recovered local work + offline worlds

Branch: `Wildbound_worlds`. Normal Electron profile. No hosted server required.

## Cause and recovery

The 1.2.0 executable matched its source, but that source lacked later laptop work.
The original local Wildbound checkout contained extensive uncommitted gameplay,
UI, artwork and rig changes beyond its `bc1b432` HEAD. Those were not lost from
disk and were not present in the GitHub commits previously compared.

Recovery snapshot `470c51390c9ba2ca7843823aa9a3ddc324899685` preserves that
working content as a merge parent without changing the original checkout's
working files, ordinary index, branch, profiles or saves. It was merged into the
offline-worlds branch; shared assets and authored rigs are included. The separate
local character-viewer project's dialogue-frame/close artwork and isolated
framing styles were also recovered without copying its older gameplay files.

Restored work includes:

- Split brown/green lobby floor, proximity-only labels, new lever and TV props,
  seated players, held controllers/cables, responsive starter-chest UI.
- Cemetery map and board textures, pumpkins, critters and associated gameplay.
- Merchant, board, victory, vending, player-panel and dialogue updates.
- Charmed/follower cycling, native attacks/animations, independent creature bags,
  the hero following behind, jump physics and protected permanent hero gear.
- Reaper, Captain, Dreadmane, villagers, slimes, shore goblins, transferred
  creature motion/art, event variety, expedition progression and sound cues.
- Destination-specific boundless generation, harvested-region edits and native
  ecology. Existing main-only Beholder/desert encounters remain appended so
  recovered event indices are not shifted.

Retained: local seeded world instances, compact checkpoints, offline catch-up,
ecology/director/content packs, and the compact side-by-side rig studio with an
empty controllable lobby-floor preview. Removed from the active tree: revived
persistent-server client/studio/startup code. Historical server work remains
recoverable through the snapshot parent, not required by the game.

## Integration repairs and checks

Reconciled streamed-region edits with local checkpoints (including completely
cleared chunks, additions and regrowth), central generation baselines, in-memory
missing rig-clip upgrades, event import preservation, TV fireballs, raised-rock
collision, inventory actions, local-world keyboard input and canvas/context room
rendering. Creature bags rebind after JSON restore and owned ecology companions
are not unloaded as distant wildlife.

Full Node suite: 1,285 passed before final focused save/room integration checks.
Final save/control tests: 19 passed. Muted isolated Electron checks passed for
offline creation/reopen/day advance, zero network requests, studio layout at two
sizes, keyboard movement/jump and synthetic controller movement/disconnection.
Recovered native-control Electron checks cover actual input-driven selection,
movement, following, jump, Captain attack, damage, reload and hero gear recovery.
Lobby/chest viewport and ownership checks, 54 cemetery/art/cat checks, victory
report viewports/contrast and Xbox/Switch vending-navigation checks passed.

Build with `node scripts/package.cjs`, then verify packaged content and run
`Play Wildbound.cmd --check`. The build's `wildbound-build.json` is authoritative
for the exact source commit and dirty status. Create Desktop shortcut with
`scripts/create-desktop-shortcut.ps1`: `Wildbound Worlds (1.2.1).lnk` targets this
checkout's `Play Wildbound.cmd` and uses normal saves, not `--preview`.

Hardware controllers and extended gameplay remain for the user's test. No
personal profile migration, profile deletion or existing-game termination was
performed. Reports/screenshots are local under ignored `test-output`.
