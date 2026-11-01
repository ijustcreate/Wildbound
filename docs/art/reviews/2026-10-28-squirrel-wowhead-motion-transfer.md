# Squirrel Wowhead motion transfer — unapproved draft

This is a donor-specific motion pass for Wildbound's existing squirrel pixels and rig. It does not replace the squirrel artwork or behavior. The draft wires Wowhead NPC 61081, FileDataID 1129448, Stand, Walk and Run into `freeze`, `walk` and `scamper`; the existing native `leap` remains intact.

## Source and clip mapping

The local donor is `test-output/wow-motion-audit/1129448.m2`, parsed as M2 v274, with 46 bones and 10 embedded sequences. The source records the same SHA-256 in generated provenance: `bb72be54bce54181a735cf27d25b2fcb92e157a1b8acadbd5895614a105cf45e`.

Primary format references used for the M2 header, bone and vertex layouts: [WhiteoutLib M2 format specification](https://github.com/sc2-arcade-watcher/WhiteoutLib/blob/libmodkit/docs/M2_FILE_FORMAT_SPECIFICATION.md#geometry-and-rendering) and [warcraft-rs M2 vertex influence example](https://github.com/wowemulation-dev/warcraft-rs/blob/main/file-formats/graphics/wow-m2/examples/access_model_data.rs). The donor bytes and references are local; no runtime fetch is involved.

| Wildbound clip | Donor sequence index | Animation ID / name | Duration |
|---|---:|---|---:|
| `freeze` | 2 | 0 / Stand | 2.000 s |
| `walk` | 0 | 4 / Walk | 0.667 s |
| `scamper` | 1 | 5 / Run | 0.666 s |
| `leap` | native Wildbound clip | retained | native |

Sampled world-space source pivots are normalized to each selected clip's own frame-zero pose, then bone-0 root drift is subtracted. Coordinates convert from WoW `(X forward, Y left, Z up)` to Wildbound `[Y, X, Z] * 22`; positive donor Y maps to Wildbound `R`. This preserves the authored low squirrel pose instead of copying the donor's upright idle stance.

## Provisional anatomy map

Weight values below are summed fractional weights across 1,537 embedded vertices (the exact pivot, centroid, parent chain and weight records for every mapped bone are generated into `src/squirrel-wow-motion-data.mjs`). The vertex layout is the 48-byte v274 record with position at byte 0, four weights at 12, and four direct `boneIndices` at 16. The separate `boneCombos` table is not applied to `boneIndices`.

| Wildbound region | M2 source indices | Evidence / caveat |
|---|---|---|
| pelvis | 1 | Parent 0; 84.45 summed influence; weighted centroid `(-0.0399, 0.0005, 0.1283)`. |
| chest and neck | 4 | Child of 1; 87.47 influence; centroid `(0.0538, 0.0005, 0.1420)`. Shared for both target anchors because the donor exposes no separate weighted neck pivot. |
| head, muzzle, eyes, ears | 8 | Child of 4; keyed as Head; 325.60 influence. Facial subparts share the head pivot. |
| tail base / middle / tip | average(2,7) / average(13,18) / 21 | Chain `2 -> 7 -> 13 -> 18 -> 21`; base bones have 106.54/32.47 influence, middle 22.49/49.51, tip 109.45. |
| hind limbs R | 5 / 11 / 16 | Rear leg branch under connector 3; weights 64.47 / 64.47 / 58.96. |
| hind limbs L | 6 / 12 / 17 | Mirrored branch; weights 47.16 / 49.03 / 49.51. |
| forelimbs R | 9 / 14 / average(19,44) | Branch under 4; weights 47.16 / 49.03 / 60.42; 44 is a zero-weight terminal helper below 19. |
| forelimbs L | 10 / 15 / average(20,45) | Branch under 4; weights 47.16 / 49.03 / 60.42; 45 is a zero-weight terminal helper below 20. |

Bone 3 has zero vertex influence and only connects the hind-leg branches (`5/6 -> 11/12 -> 16/17`), so it is deliberately not assigned as chest. Bone 2 is now included as the tail-root region because its direct weight is high and it is the parent of the articulated tail chain. Other unmapped indices and all their source pivots/weights appear in generated provenance. No source mesh or skin profile is bundled in the game. The checked local turnaround captures are `test-output/modelviewer-references/61081-squirrel-{front-idle,side-idle,rear-idle,opposite-side-idle}.png`.

These assignments are still provisional: weights show which vertices are affected, but the current local source evidence does not include a rendered donor skeleton/skin overlay. The side turnaround shows the donor's face toward +X and large tail to the rear; hierarchy/pivots and turnarounds support the broad branches, but pixel-art-to-skeletal semantic correspondence still needs review before calling it approved.

## Verification artifacts

The comparison is explicitly marked unapproved and rendered by an Electron window muted before loading Wildbound. The regenerated before/after boards render both clip sets over the same current squirrel art and at the same scale. Eight facing views, plus S/W phase samples for idle, walk, run and native leap, are saved in `test-output/squirrel-wow-motion-transfer/`.

Focused checks:

```powershell
node scripts/import-squirrel-wow-motion.cjs
node --test tests/creature-packs/squirrel-wow-motion.test.mjs tests/creature-packs/wildlife-pack.test.mjs
$env:SQUIRREL_MOTION_STAGE='after'; & .\node_modules\.bin\electron.cmd .\scripts\verify-creature-packs\capture-squirrel-wow-transfer.cjs
```

Audio is muted by both Electron command switch and `webContents.setAudioMuted(true)`. This is not a packaged-build or hardware playtest.
