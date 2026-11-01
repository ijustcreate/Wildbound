# Highlands Skunk Wowhead motion transfer — unapproved draft

Status: **unapproved**. This is a donor-motion sample for review, not a sound-approved art or animation revision. Native Wildbound skunk pixels, palette, curled tail drawing, flee/spray behavior, poison cloud and 60-second cooldown remain authored in Wildbound.

## Source evidence

- Donor: Wowhead NPC 62907, Highlands Skunk, FileDataID 125956. Local source: `test-output/wow-motion-audit/125956.m2`, M2 v272, 50 bones, 566 vertices; SHA-256 `0ff982fc49c05a1cdd4945b268e2aa3292896cb9cddadaa86cded7ec2d8943f8`.
- The selected native sequences are Stand ID 0 (index 2, variant 0, 2000 ms), Walk ID 4 (index 0, 1334 ms), Run ID 5 (index 1, 800 ms), AttackUnarmed ID 16 (index 3, variant 0, 1500 ms), CombatWound ID 9 (index 5, 1000 ms), and Death ID 1 (index 7, 1500 ms). Transfers are sampled at 24 fps. Names and IDs follow the primary TrinityCore AnimationData reference: <https://trinitycore.atlassian.net/wiki/spaces/tc/pages/2129958/AnimationData>.
- The M2 inventory also has swim forward/turn/backward sequences (IDs 42, 41, 45); swim-left and swim-right IDs 43/44 alias forward swim sequence 17. They are not transferred in this pass. Sit/sleep external AFID sequences 96–101 are also not selected. The source inventory maps `97:0→479788`, `96:0→479789`, `98:0→479790`, `100:0→479791`, `99:0→479793`, `101:0→479792`.
- Geometry evidence uses M2 v272's 48-byte vertex record, where the four bone-index lanes directly index `bones[]`; each lane's byte weight is divided by 255. No bone-combo lookup is applied. This agrees with the M2 geometry/skin format description in Warcraft-rs: <https://github.com/wowemulation-dev/warcraft-rs/blob/main/file-formats/graphics/wow-m2/examples/access_model_data.rs>.

## Provisional donor-to-Wildbound mapping

| Wildbound joint | M2 bone(s) | Evidence / limitation |
|---|---:|---|
| pelvis | 2 | Parent of torso, paired hind branches and tail connector; 39.57 summed vertex-weight units, centroid `(-.208,.017,.326)`. |
| chest | 5 | Weighted torso node (30.17 units, centroid `(.031,.026,.266)`) on the forward chain beneath connector 3. Connector 3 has no weight and remains omitted. |
| neck | 13 | Forward chain from chest to head; 20.18 units, centroid `(.178,.029,.257)`. |
| head, eyeL, eyeR | 18 | M2 Head key bone 6 resolves through keyBoneLookup to bone 18; 123.46 units, centroid `(.290,.012,.235)`. There are no independent eye bones in the mapped source. |
| muzzle | 44 | Unweighted child of head, key ID 21 and forward-most facial pivot. This is a positional proxy only; it is not claimed to be a named jaw. |
| shoulderR/L | 11 / 12 | Paired weighted branches under chest; 28.86 / 12.34 units. |
| elbowR/L | 16 / 17 | Distal forelimb branches; 30.33 / 14.18 units. |
| frontPawR/L | 21 / 22 | Distal forelimb endpoints; 29.47 / 27.48 units. |
| hipR/L | 4 / 6 | Paired child pivots under pelvis. Bone 4 has 8.49 weight units; bone 6 is unweighted, so the latter is a hierarchy/pivot-supported mirrored hip target, not a skinned region. |
| kneeR/L | [8,14] / [9,15] | Short Wildbound hind chain compresses two M2 intermediate pivots per side. Weights are 10.50 / 8.51 and 8.49 / 12.51 units. |
| rearPawR/L | 19 / 20 | Distal hind endpoints; 52.98 / 59.48 units. |
| tailBase / tailMid / tailTip | 7 / 10 / 35 | Bone 7 is an unweighted tail connector, bone 10 is the weighted plume (48.98 units; centroid `(-.625,.012,.654)`), and bone 35 is an unweighted upper-tail pivot. Tail-tip interpretation is provisional. |

Coordinate conversion: source +X forward, +Y left, +Z up → Wildbound `[Y, X, Z] × 20`. Each mapped joint is relative to its own frame-zero sample; source root-bone translation is removed so clips do not translate actors across the world. Bone/pivot semantics not explicitly named by source data are described as inferred from parent chain, pivot position and direct skin weights.

## Integration and review limits

- Converted data is reproducible from the local source with `node scripts/import-skunk-wow-motion.cjs`. It writes `src/skunk-wow-motion-data.mjs`; `src/skunk-wow-motion.mjs` returns independent clip clones.
- `freeze` / `idle`, `amble` / `walk`, and `scurry` / `run` use the donor Stand, Walk and Run. `attack`, `hurt` and `death` use distinct source actions. The wildlife visual router preserves attack priority and selects the skunk's donor gaits for controlled movement.
- The native `raise-tail` and `spray-warning` clips remain. Skunk behavior still flees, sprays only after being hit, creates the existing poison cloud, and retains its existing cooldown and damage cadence. No donor tail-spray animation exists.
- Exact geometry/weight readings and selected clips are included in generated `src/skunk-wow-motion-data.mjs`. Focused tests: `node --test tests/creature-packs/skunk-wow-motion.test.mjs tests/skunk-behavior.test.mjs`.
- Electron visual capture uses the existing pack renderer with `webContents.setAudioMuted(true)`, offscreen Electron and an isolated temporary userData path. It compares a reconstruction of the former generic native clips to the new donor tracks over eight facings and 0/25/50/75-percent phases. This is render evidence, not hardware playtesting or approval of the provisional hind-knee, side-sign and upper-tail mapping.
- See `test-output/skunk-wow-motion-transfer/before-after-eight-facings.png`, `muted-electron-motion-preview.png`, and `capture.json`.
