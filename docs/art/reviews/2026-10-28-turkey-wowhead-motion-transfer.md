# Turkey Wowhead motion transfer — isolated draft

## Status

**Integrated but unapproved.** Donor Stand is used for runtime idle. Donor Walk is retained as `wowhead-walk` for review, but it is not routed for gameplay because its foot pivots move below the ground baseline. Native `strut` remains the actual slow-walk fallback. Pixel art, rig joints, behavior and user-authored edits remain unchanged.

Five embedded source actions were converted for evaluation: Stand, Walk, Run, AttackUnarmed, and Death. Runtime uses only donor Stand for idle. Donor Walk remains a named review candidate because it fails the foot-contact check. Donor Run, AttackUnarmed, and Death remain data-only; the native Wildbound `strut`, `peck`, `flap-run`, `flap-attack`, hurt, and death actions remain available and unchanged. Controlled attacks continue to prioritize native `flap-attack`. The transfer is positional joint retargeting; no donor mesh or texture is imported.

## Source sequence evidence

- Donor: Wowhead NPC 62648, Turkey, FileDataID 126278; local M2 `test-output/wow-motion-audit/126278.m2`; SHA-256 `a6f9e1da28e907e8b93e11cc774123a8ea562f82643e8fbd2590cf90819dc1e2`.
- Source is M2 v274 with 48 bones, 333 embedded vertices, and 22 sequences. Motion tracks are embedded; no external `.anim` files are referenced.
- Selected sequence index 0 / animation ID 0 Stand (2,834 ms); index 6 / ID 4 Walk (1,000 ms); index 4 / ID 5 Run (700 ms); index 7 / ID 16 AttackUnarmed (1,000 ms); and index 9 / ID 1 Death (1,767 ms). Clips are sampled at 24 fps into 69, 24, 17, 24, and 43 frames.
- The source also contains a second AttackUnarmed sequence at index 8. This first draft uses index 7 only. Stand-family indices 1–3 alias to index 0, and Run index 5 aliases to index 4; aliases are not treated as separate motion.
- Animation IDs were checked against [TrinityCore AnimationData](https://trinitycore.atlassian.net/wiki/spaces/tc/pages/2129958/AnimationData).

## Retarget evidence and limitations

The source uses X-forward, Y-left, Z-up. Samples convert to Wildbound `[Y, X, Z] × 20`; every clip is relative to its own frame-zero pose, and bone-0 root translation is removed each frame so simulation movement still owns travel. For v274, vertex `boneIndices` directly index `bones[]`; the `boneCombos` array is not a per-vertex remap.

| Wildbound pivot | Source bone(s) | Evidence and caveat |
| --- | --- | --- |
| pelvis / chest | 4 / 3 | Adjacent lower/central torso pivots; both have direct weighted vertices (14.98 / 12.79 summed weights). |
| neck | average 21 and 24 | Along the forward chain from body bone 8 via 17; both have direct weights. One target neck pivot approximates multiple donor neck joints. |
| head | 26 | M2 Head key-bone lookup ID 6 resolves to bone 26; 20.51 summed vertex-weight units. |
| beak | 27 | Child of keyed head bone 26, forward/down pivot and 14.00 summed weights. |
| eyes | 28 / 29 | Paired head children at opposite source-Y pivots; each has 5.49 summed weights. Suffix follows source Y sign. |
| wings / tips | 7→13 and 6→12 | Paired children of chest bone 3, with mirrored Y pivots and direct vertex weights. Target `wingL` uses negative source Y; `wingR` uses positive source Y. |
| hips / knees / feet | 10→15→23 and 9→14→22 | Two lower-body chains under bone 4. Hip roots 9/10 are unweighted structural pivots; their knee and foot descendants are weighted. Source key lookup IDs 59/60 resolve to feet 22/23. |
| tail fan | average 18, 19, 20 | Grouped terminal pivots on the non-head branch 3→5→16; a single target fan cannot reproduce all donor feather articulation. This grouping is provisional. |

The mapped values are bone origins, not skinned vertices. Unmapped helpers and source anatomy are omitted. Native Wildbound wattle art follows its head joint; there is no separate mapped wattle pivot. The integrated donor Walk's lowest sampled foot pivot reaches **Z −3.5144**, below the floor baseline, so runtime uses the native strut for slow locomotion. The eight-facing capture shows the unselected donor candidate and fallback side-by-side; finer joint feel and tail-fan grouping still need play review. This renderer capture is a contact sheet, not hardware playtesting.

## Files and verification

- Reproducible importer: `scripts/import-turkey-wow-motion.cjs`.
- Generated donor data: `src/turkey-wow-motion-data.mjs`.
- Runtime clip helper: `src/turkey-wow-motion.mjs`.
- Detached-copy helper and source-data test: `src/turkey-wow-motion-draft.mjs`, `tests/creature-packs/turkey-wow-motion-draft.test.mjs`.
- Routing regression: `tests/creature-pack-animation-routing.test.mjs` asserts donor Stand for idle, native strut fallback due to floor penetration, retained native action clips, and flap-attack priority.
- Muted Electron runtime capture script: `scripts/verify-creature-packs/capture-turkey-wow-motion-runtime.cjs`.
- Stand turnarounds from the same reference catalog: `test-output/modelviewer-references/62648-turkey-stand-front.png`, `62648-turkey-stand-side.png`, `62648-turkey-stand-rear.png`, and `62648-turkey-stand-opposite.png`.
- Focused regression checks: `node --test tests/creature-pack-animation-routing.test.mjs tests/creature-packs/turkey-wow-motion-draft.test.mjs tests/creature-packs/llama-wow-motion.test.mjs` — **11 passed, 0 failed**. The Llama tests also remained green.
- Muted Electron rendered the integrated WildlifePack default through `CREATURE_PACK.subjects.turkey.draw`, with **0 renderer errors**, eight facings and four phases per comparison row. Outputs: `test-output/turkey-wow-motion-runtime/before-after-eight-facings.png`, `runtime-eight-facings.png`, and `capture.json` (including the −3.5144 donor foot minimum).
- Importer, runtime capture script, and `src/creature-packs/wildlife.mjs` pass syntax checks. No package version or desktop build was changed. The importer can be rerun with `node scripts/import-turkey-wow-motion.cjs`.

## References

- Source donor: `https://wow.zamimg.com/modelviewer/live/m2/126278.m2`.
- M2 v274 geometry and vertex format: [WhiteoutLib M2 File Format Specification](https://github.com/sc2-arcade-watcher/WhiteoutLib/blob/libmodkit/docs/M2_FILE_FORMAT_SPECIFICATION.md#geometry-and-rendering).
- Vertex influence indexing example: [warcraft-rs M2 model data example](https://github.com/wowemulation-dev/warcraft-rs/blob/main/file-formats/graphics/wow-m2/examples/access_model_data.rs).
