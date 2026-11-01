# Sheep Wowhead motion transfer — unapproved draft

## Result

Transferred the exact Sheep donor's embedded Stand, Walk, and Run tracks onto the existing Wildbound Sheep's editable joints and pixels. The motion preview is a draft for review, not sound-approved. No donor mesh, texture, or baked sprite was imported. The existing `graze`, `bleat`, and `bound` actions remain Wildbound-authored because the source has no matching action or jump.

## Source and sequence evidence

- Donor: Wowhead NPC 61170, FileDataID 1377131; local source `test-output/wow-motion-audit/1377131.m2`; SHA-256 `f48f27ea5f9a77491c01c13b582ed49618dcda15d655b1a4b2b991e7cc03b91d`.
- Parsed as v274 with 55 bones, 814 embedded vertices, and 9 sequences. No external `.anim` dependencies.
- Transferred source sequence index 0 / animation ID 0 `Stand` (2,000 ms), index 4 / ID 4 `Walk` (1,067 ms), and index 5 / ID 5 `Run` (400 ms). Converted at 24 fps to 48, 26, and 10 frames, respectively.
- Source sequence 1 is another 3.333-second Stand variant. Sequence 2 / ID 9 is `CombatWound`; sequence 3 / ID 1 is `Death`; sequence 8 / ID 16 is `AttackUnarmed`. These remain unused. Alias sequences 6 and 7 resolve to Run and are not distinct motions.
- Sequence names and IDs were cross-checked against TrinityCore's AnimationData reference and the M2 format references below.

## Evidence-backed retarget map

M2 `boneIndices` in v274 vertex records index the bones array directly. The MD20 array at `+0x78` is `boneCombos` for skin batches and is not used as a per-vertex remap. Vertex influence totals/centroids were recomputed from the four direct byte indices and weights (48-byte records). The bone key lookup maps key ID 6 to bone 3 (Head) and key ID 7 to bone 10 (Jaw).

| Wildbound target | Sheep donor bones | Evidence |
| --- | --- | --- |
| pelvis | 2 | Child of root 0; torso/rear weighted region, 34.02 total influence; centroid `(-0.104, 0, 0.640)` |
| chest | 1 | Child of root 0; forward torso weighted region, 52.85; centroid `(0.430, 0, 0.807)` |
| neck | 1 | Reuses the chest anchor because the current native rig has no source-equivalent neck pivot |
| head, eyeL, eyeR | 3 | Key-bone Head; parent 1; 238.07 weight; centroid `(0.659, 0, 0.847)`. Eye anchors share head translation so native eye pixels stay attached |
| muzzle | 10 | Key-bone Jaw; parent 3; 67.95 weight; centroid `(0.666, 0, 0.701)` |
| earR / earL | 7 / 8 | Paired head children with opposite Y pivots at `(0.517, ±0.063, 0.953)`; target suffix convention follows donor side |
| shoulderR / shoulderL | 4 / 5 | Paired foreleg roots; parent 2; 17.66 weight each; Y pivots `±0.143` |
| elbowR / elbowL | 11 / 12 | Foreleg children; parents 4 / 5; 27.50 weight each |
| frontPawR / frontPawL | 19 / 20 | Foreleg terminal children; 21.49 weight each; hooves near Z `0.028` |
| hipR / hipL | 13 / 14 | Paired hindleg roots; parent 6; 4.50 weight each |
| kneeR / kneeL | average 21+24 / 22+25 | Hindleg articulated chain; the native rig has one knee point for two intermediate donor joints |
| rearPawR / rearPawL | 26 / 27 | Hindleg terminal children; 21.49 weight each; hoof pivots near Z `0.070` |

Source +X forward, +Y left, +Z up converts to Wildbound `[Y, X, Z] × 20`; positive donor Y maps to Wildbound suffix R. Each clip uses its own frame-zero source pose as the delta reference. Bone-0 root translation is removed every frame so game movement continues to own travel. The implementation transfers animated joint origins, not vertex skin deformation.

Not mapped: bone 9 and unweighted helper/attachment bones 28–54 (with the exception of the mapped ear pivots 7/8 and the weighted articulations above). Source bone 6 is a shared hind-chain parent; its transform is already reflected in sampled world positions of descendants 13/14. The exact source geometry and original vertex skinning are not reproduced.

## Runtime and preserved content

- `idle → freeze`, `walk → walk`, and `run → run` route to donor clips.
- Native Sheep `graze`, `bleat`, `bound`, `jump`, `attack`, `hurt`, and `death` content remains available; the donor supplies no Sheep jump or graze/bleat action.
- Current Sheep palette, shape, leg art, face art, behavior, and event definitions are unchanged.

## Verification and preview

- Focused tests passed: `node --test tests/creature-packs/sheep-wow-motion.test.mjs tests/creature-pack-animation-routing.test.mjs tests/creature-packs/wildlife-pack.test.mjs` (19 passed, 0 failed).
- Muted Electron capture used the current `CREATURE_PACK.subjects.sheep.draw` renderer. All eight facings were captured at 0%, 25%, 50%, and 75% for each transferred clip; console error count was zero. This is renderer evidence, not a full gameplay/hardware test.
- Before comparison: `test-output/sheep-wow-motion-transfer/before-native-eight-directions.png` (native idle / graze / bound runtime clips).
- After comparison: `test-output/sheep-wow-motion-transfer/after-wowhead-eight-directions.png`.
- Larger mid-cycle preview: `test-output/sheep-wow-motion-transfer/muted-electron-motion-preview.png`.
- Capture metadata: `test-output/sheep-wow-motion-transfer/capture.json`.
- No desktop or web build was created.

## References

- Wowhead source asset: `https://wow.zamimg.com/modelviewer/live/m2/1377131.m2`.
- M2 v274 geometry and vertex format: [WhiteoutLib M2 File Format Specification](https://github.com/sc2-arcade-watcher/WhiteoutLib/blob/libmodkit/docs/M2_FILE_FORMAT_SPECIFICATION.md#geometry-and-rendering).
- Direct vertex influence indexing example: [warcraft-rs M2 model data example](https://github.com/wowemulation-dev/warcraft-rs/blob/main/file-formats/graphics/wow-m2/examples/access_model_data.rs).
- Animation ID cross-check: [TrinityCore AnimationData reference](https://trinitycore.atlassian.net/wiki/spaces/tc/pages/2129958/AnimationData).
