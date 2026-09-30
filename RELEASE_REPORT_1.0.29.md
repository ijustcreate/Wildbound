# Wildbound 1.0.29 - Character generation 3

This is a substantial native-pixel character and animation revision, not a claim
that the game has reached AAA production quality. Earlier comparison exports are
preserved. Existing saved appearance colors remain customizable and unchanged.

## Character Pass

1. Rebalanced the base skeleton, shoulder span, torso taper, and arm placement.
2. Added spine-relative torso volume that remains solid through bends and falls.
3. Reshaped the jaw, cheeks, nose, ears, eye clusters, and closed-eye poses.
4. Refined all seven hair silhouettes, crown planes, fringes, and rear masses.
5. Separated cloth, undershirt, leather shoulders, belt, hands, and boot values.
6. Authored a restrained idle and distinct walk and run cycles with alternating support.
7. Rebuilt jump anticipation, airborne poses, falling, landing, and dash recovery.
8. Added torso rotation, guard, anticipation, follow-through, and recovery to attacks.
9. Added rifle trigger/support grips, bow release poses, shield/parry weight, and casting reach.
10. Rebuilt death, sleep, get-up, hurt, and revive with lowered or grounded bodies.
11. Reworked swim strokes, carry, pickup, celebration, salvage, and gathering poses.
12. Added held utility props, fixed-length IK after blending, and elapsed-action timing.
13. Exported a separate review generation with all angles, native sprite sheets,
    equipment catalogs, appearance studies, comparison playback, and pixel-scale controls.

The ordinary rig editor still owns all generated keys. Generation is an explicit
offline script, never an automatic replacement of user-authored clips on load.
The source backup is `art/player/detail-native-v3/before-rig.json`.
The comparison viewer is `art/player/detail-native-v3/index.html`.

## Validation

- Six focused generation tests cover every clip at half-frame intervals, finite
  joints, fixed limb lengths, floor poses, grip constraints, action timing,
  preserved editor metadata, and the shipping authored model.
- Syntax check: 125 runtime files.
- Lobby inventory interaction and world-render integration checks pass.
- Non-player rig packages match the prior committed data.
- Full-suite validation is not yet clean: the latest run passed 441 of 442 tests,
  with the item-silhouette uniqueness test failing during concurrent item work.
  An earlier run also exposed an intermittent winter-loot assertion, which passed
  on the targeted rerun. These are not covered up by the focused visual checks.

## Scope And Remaining Review

The overhaul uses the existing procedural pixel renderer and editable joint rig.
It is not a hand-painted frame-by-frame replacement. Unusual combinations of
custom wearable transforms and extreme poses still deserve artist review;
custom headwear transforms deliberately retain their existing behavior.
No combat damage, hit windows, or non-sleep clip durations were intentionally changed.
The sleep loop now breathes over two seconds instead of two nearly static frames.
The large comparison exports are excluded from the packaged game.
