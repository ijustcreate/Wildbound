# Eldritch creature silhouette pass — draft

**Status:** Draft for user review; not approved. Source SHA-256 after this pass: `44B87E60A40DB8E2439CB9809EDAED7FD7C40C215D45A1B06BC472204732228B`.

## Art contract

- Keep the source pixel footprint and renderer scale. Review the native row first; enlarged rows are nearest-neighbor only.
- Resolve three weak reads against actual Wowhead Stand references, simplifying rather than copying surface detail.
- Preserve every existing rig joint, clip, behavior, event and gameplay stat. No donor animation mapping is claimed.

## Changes

- **Clinging Remains / `evil_hand`:** shifted the dominant material from purple flesh to old ivory and bone gray, reshaped the palm as a stepped plate, and separated the phalanges with dark joint gaps. Pink is now a small spectral tip accent. It reads as a hand rather than an eye-like mass at native size.
- **Blossoming Ancient / `tree_ent`:** strengthened the trunk and roots, broadened the shoulder boughs and added foliage at the shoulder and tips. The canopy keeps its simple connected foliage silhouette; its eight views still share a broad crown, so this remains the weakest of the three at a glance.
- **Brilliant Spore / `spore`:** removed the eye/pupil treatment and used irregular off-center cap/gill marks and dispersed pores instead. The radial quill silhouette remains consistent in all eight facings.

## Evidence

Actual modelviewer Stand captures (front, side, rear, opposite-side):

- `test-output/modelviewer-references/179179-clinging-remains-{front,side,rear,opposite-side}-idle.png`
- `test-output/modelviewer-references/71488-blossoming-ancient-{front,side,rear,opposite-side}-idle.png`
- `test-output/modelviewer-references/86719-brilliant-spore-{front,side,rear,opposite-side}-idle.png`

Matched before/after cards, with references:

- `test-output/creature-art-review/eldritch-silhouette-pass/evil_hand-reference-before-after.png`
- `test-output/creature-art-review/eldritch-silhouette-pass/tree_ent-reference-before-after.png`
- `test-output/creature-art-review/eldritch-silhouette-pass/spore-reference-before-after.png`

Eight-facing runtime rows at native and 2.3× nearest-neighbor scales are saved as matching `*-before.png` and `*-after.png` files in that same directory.

## Verification and limits

`node --test tests/creature-packs/eldritch.test.mjs tests/creature-packs/eldritch-art-quality.test.mjs` passes 7/7. The captures came from the game's `CREATURE_PACK.subjects[kind].draw` renderer in muted, isolated Electron; `audioMuted: true`, renderer errors: 0. These are idle art reviews, not combat/gameplay or hardware tests. Stand captures do not establish bone-to-anatomy mappings for donor animation transfer. The tree-ent crown remains broad and stylized; review before approval or further rollout.
