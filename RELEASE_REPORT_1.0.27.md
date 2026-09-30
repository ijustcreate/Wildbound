# Wildbound 1.0.27

Character detail generation 2: clearer directional faces, ears and noses; seven refined hair options; frame-driven hair motion; improved cloth, skin, and equipment detail. Existing authored animation curves, combat timings, equipment offsets, and custom wearable pixels remain in place.

## Reference Export

Open `art/player/detail-native-v2/index.html` directly in a browser. It includes animation selection, eight simultaneous facings, pause and frame scrubbing, before/after sheets, appearance studies, and equipment catalogs.

- `before/`: a snapshot of the renderer immediately before this upgrade, 36 base-rig sheets.
- `after/`: 396 contact sheets, covering all 36 current clips across 11 variants.
- `native/`: 396 transparent sprite sheets containing every source frame, with directions as rows and frames as columns.
- `all-hairstyles.png`, `face-variants.png`, `gear-catalog-*.png`: appearance and equipment studies.
- `manifest.json`: animation rates, variants, directions, and the 128-pixel cell format with ground anchor (64, 88).
- `rig-snapshot.json`: the authored player rig used for the export.

The original `base-native-v1` and gear reference folders are unchanged. Comparison assets are retained in the project but omitted from the desktop package.

Regenerate the new set with `electron scripts/export-player-generation.cjs`. Verify it with `electron scripts/verify-player-generation.cjs`. Do not rerun the old renderer export into `before/`, which is the preserved baseline.

## Verification

- 423 automated tests passed, including all authored clips and hairstyle/facing combinations, facial anchor editing, equipment icons, and animation-frame hair motion.
- 22,176 native sprite cells passed blank-image and cell-boundary clipping checks.
- Animated viewer tested at desktop and mobile sizes, including animation playback and frame scrubbing.
- Packaged smoke suite: 83/99 passed. The same 16 failures reproduce in the previous 1.0.26 package (lobby, opening-board, editor-interaction, and Field Kit checks); no additional failing checks were introduced by this update.
