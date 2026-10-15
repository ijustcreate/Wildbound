# 1.0.117 victory flow, followers, and playtest fixes

Versioned Windows desktop build: `1.0.117-victory-return`.

## Changes

- Victory opens a buttonless end-of-expedition report. It no longer opens the reward chest automatically; players dismiss the report with a controller/keyboard confirm or a click, return to the board, and interact with the chest themselves.
- Striking the board after victory opens a shared prompt to play another game, stay on the board, or return to the lobby.
- Wildbound map transitions carry living owned companions with their players: tamed creatures, April, raised pet allies, and the player-attached hunter/ritual pets. Controlled-follower position is restored on arrival, and companions are not duplicated in saved maps.
- Enemy body spacing stays active when pursuit is disabled, while hidden submerged players no longer cause surface enemies to slide around.
- This build also includes the requested chest item detail hover, shared ready screen/controller confirmation, closer opening-board camera, body spacing, randomized three-camper April event, follower control/death fallback, non-flyer deep-snow slowdown, Deadmane leap framing, controller quest turn-in, Oathless Captain swimming/jumping, and interact-only doors.

## Verification and launcher

- Full serial Node suite: **1,267 passed, 0 failed** (2026-10-08).
- `scripts/rebuild-desktop.ps1` completed packaging successfully and created the versioned Desktop shortcut.
- `Play Wildbound.cmd --check` identifies the package as `dist/1.0.117-victory-return/Wildbound-win32-x64/Wildbound.exe`.
- `Wildbound Latest (1.0.117-victory-return).lnk` targets the repository's `Play Wildbound.cmd`, with the repository as working directory. This keeps the regular save profile.
- Source is modified and uncommitted; the launcher reports commit `bc1b432d20f4b0de0b04d4d3b34600f7a9fe0a70` alongside a modified-source warning.
