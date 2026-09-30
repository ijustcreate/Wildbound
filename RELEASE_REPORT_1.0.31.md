# Wildbound 1.0.31 - Combat Animation Review

Includes all current shared game changes as explicitly requested, plus the
generation-4 combat pass and corrected directional hair/ears.

## Animation

Reauthored melee, punch, uppercut, bow draw/release, casting, guard, and parry poses.
Blade arcs are now projected from model space; daggers thrust, dual weapons
alternate hands, and the whip trails its moving handle. Equipment follows the
combat layer in the air. Bow draw covers its full clip, the string releases,
rifle recoil follows its actual timer, and rendered wand tips match spell origins.
Combo classification now uses item metadata, fixing named blades and the whip
incorrectly selecting unarmed combinations.

Existing damage formulas, hit windows, combo durations, saves, noncombat clips,
and other creature rigs remain intact. In particular, melee damage still happens
at attack input rather than at the visible contact pose; this is a known remaining
gameplay-animation integration issue, not a completed polish item.

## Review Assets

- `art/player/detail-native-v4/index.html`: animated eight-direction comparison.
- 19 variants, all 36 clips: 684 contact sheets and 684 native sprite sheets.
- 52,440 sampled sprite cells, appearance studies, equipment catalogs, and six review boards.
- `art/player/detail-native-v4/CRITIQUE.md`: candid assessment of every animation.
- Generations 1, 2, and 3 are retained. Large review exports are not bundled in the executable.

## Verification

- Full Node suite: 455/455 passed after the packaged whip-classification fix.
- Native export scan: no empty or clipped cells.
- Animated viewer: desktop/mobile playback, scrub, comparison, pixel scale, and overflow checks passed.
- Syntax validation: 127 runtime files passed.
- Windows x64 Electron package completed. The packaged app loads combat revision 4,
  selects the correct live clips for six loadouts, and renders them in eight directions.
- Packaged world rendering checks passed. Shared cel-shading checks passed.
- Desktop shortcut: `Wildbound Latest (1.0.31).lnk`; project launcher resolves 1.0.31.
- Broad packaged smoke assertions: 81/99 passed, 18 failed. After normalizing
  versioned paths, the failure set matches 1.0.30. These include lobby portrait,
  board, inventory/editor, and Field Kit harness checks. This is not a fully green
  smoke release, despite the focused combat and Node checks passing.

## Build Location

`dist/1.0.31/Wildbound-win32-x64/Wildbound.exe`

The complete packaged directory is required. Git publishes source and review
assets; the Windows executable remains a local ignored build artifact.
