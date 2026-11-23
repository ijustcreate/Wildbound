# Biome combat tell brief

User feedback: combat effects must match Wildbound pixel art, with clean ground.
Reference: native 48px creatures, forest scenery, and the bronze/teal sword palette
in `src/sword-charge-art.mjs`. Keep the creature pose as the main tell.

The footprint is one accurate lane, cone or circle. Round its contour after
rotation to one-world-pixel steps; use connected steps rather than large repeated
blocks. A thin bronze edge and subdued teal backing remain readable on snow and
stone. Fill stays faint. Do not add nested rings, glow, crosshairs or ground dust
to convey charge. Imp impact warnings and scorpion bites share this vocabulary.
Live fire remains a damaging native pixel patch, distinct from its warning.

Source: `src/enemy-telegraphs.mjs`, reused by `imps.mjs` and `wild-fauna.mjs`.
No sprite files, authored rigs, editable animation clips or damage shapes change.
Review script: `scripts/verify-biome-telegraph-style.cjs`; native captures and
nearest-neighbor enlargements are under `test-output/biome-telegraph-style/`.
The comparison is a study, not recorded user approval.
