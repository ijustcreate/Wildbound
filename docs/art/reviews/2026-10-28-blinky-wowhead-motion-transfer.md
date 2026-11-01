# Blinky Wowhead motion transfer

Imported motion from Wowhead NPC 179589 (Blinky), FileDataID 4080510. The local v274 M2 is SHA256 `cd57a6b05977cb561a7ccadf9941c44e65127f116427fb78245eb48536fc8936`; it has 66 bones, 6,638 vertices, and embedded MD21 tracks.

## Verified mapping

The mapping uses the M2 parent/pivot hierarchy and direct per-vertex weights. The source model is X-forward, Y-left, Z-up; conversion is `[source Y, source X, source Z] * 14`, with root translation removed and each clip relative to its frame-zero pose. Key-bone lookup anchors head to bone 11 (key 6) and jaw to bone 19 (key 7).

| Wildbound joint | M2 bones | Evidence |
| --- | --- | --- |
| pelvis / chest / neck | 8 / 2,3 / 10 | body-to-neck parent chain and torso pivots; bones 8, 2, 3, 10 have direct vertex influence |
| head / snout and jaw | 11 / 19 | key-bone lookup 6 and 7; both directly weighted |
| wing roots / tips | +Y: 4→22; -Y: 5→23 | opposing parent chains, mirrored pivots and direct skin weights; +Y maps to Wildbound R |
| wing fingers | +Y: 49; -Y: 50 | child helper pivots on each wing root; these helper bones have no direct skin weights |
| forelegs | +Y: 7→15→25; -Y: 6→14→24 | mirrored shoulder/elbow/paw chains; terminal bones 24 and 25 carry key-bone indices 64/65 |
| rear legs | +Y: 17→27; -Y: 18→28 | mirrored hip/knee/paw chains and direct weights |
| tail | 26→29→30→31→32→33→34 | continuous rearward curled hierarchy; 26 and 34 map to tail base and tip |

Source sequence mappings: Stand (ID 0, sequence 0) → `idle`; Walk (ID 4, sequence 2) → `walk`; Run (ID 5, sequence 3) → `run`; AttackUnarmed (ID 16, sequence 6) → `breath`. The donor's apparent Fly animation ID 135 is an alias chain 4→5→3 and resolves to Run, so it is not independent flight. IDs 131 and 132 were not used as flight. Wildbound's existing editable `fly` clip remains intact.

In v274, `M2Vertex.boneIndices` directly index `bones[]`; the MD20 `+0x78` boneCombos array is not applied to vertex influences. This follows WhiteoutLib's M2 specification §8.1. Influence totals in the generated data were computed from the four embedded vertex weights and indices.

## Integration and checks

The donor clips are merged only into the Butterfly Dragon rig; its pixels, palette, behavior and native flight remain unchanged. Generated source: `src/blinky-wow-motion-data.mjs`; reproducible importer: `scripts/import-blinky-wow-motion.cjs`.

Focused coverage verifies clip routing, anatomical joint motion and rendered changes across all eight facings. The Owl/Blinky/eldritch/routing set passed 18/18 here; the parent later independently confirmed an expanded 21/21 focused suite. Four importer/capture scripts passed `node --check`. Muted Electron captured Stand, Walk, Run, AttackUnarmed, and retained Wildbound flight across eight facings with zero renderer errors: `test-output/wow-motion-audit/blinky-wowhead-motion-eight-directions.png`.

This verifies the converted motion on Wildbound's editable pixel rig. It does not claim pixel-perfect source reproduction or hardware/controller playtesting. No package or version was changed.
