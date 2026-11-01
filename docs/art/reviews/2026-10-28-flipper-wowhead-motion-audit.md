# Flipper / Penguin — Wowhead motion donor audit

**Status: verified source and candidate clips; no runtime transfer.** Flipper remains on its native editable Wildbound rig and clips until the donor anatomy/pose mapping can be visually checked.

## Source verified

- Exact requested donor: [Wowhead NPC 169479 / Flipper](https://www.wowhead.com/npc=169479/flipper#modelviewer).
- Roster mapping: display 27433, model 2901, FileDataID 125405.
- Local source: `test-output/wow-motion-audit/125405.m2`; game `loadM2` parses 64 bones and 18 sequence rows.
- Existing source turnarounds: `test-output/modelviewer-references/169479-flipper-front-idle.png`, `169479-flipper-side-idle.png`, `169479-flipper-opposite-side-idle.png`, and `169479-flipper-rear-idle.png`.

## Candidate sequence evidence

| M2 row | Animation ID | Known standard label | Duration | Ground check |
|---:|---:|---|---:|---|
| 7 | 4 | Walk | 1,000 ms | foot pivot Z range 0.0056–0.0519 |
| 11 | 5 | Run | 500 ms | foot pivot Z range 0.0002–0.1614 |
| 15 | 16 | Swim Backwards | 1,200 ms | foot pivot Z reaches −0.0099 |

There is no standard Swim Idle (ID 14) or forward Swim (ID 15) row in this source. The Swimming Backwards sequence is a candidate for a submerged paddle, but it should not be presented as forward swimming without a preview.

## Why motion was not imported

The M2 has a custom 64-bone hierarchy without semantic bone names exposed by the project loader. The existing native penguin rig exposes pelvis/chest/neck/head, two wings, and two articulated legs; while hierarchy and weighted centroids suggest candidate body, wing, and leg chains, their assignment has not yet been checked against the source animation picker or an assembled eight-facing motion preview. The inspector's standard IDs establish Walk, Run, and Swim Backwards labels, but do not by themselves validate which source pivots should drive the Wildbound wing, head, and foot joints. Importing now risks reproducing the same generic or incorrectly mapped motion that the user flagged.

No runtime code, authored rig, clip routing, or save data was changed. To resume safely, capture the Wowhead Walk, Run, and Swim Backwards poses in its animation picker, map those chains to the native penguin rig, then inspect native-scale and enlarged eight-facing assembled previews before routing any donor clips.
