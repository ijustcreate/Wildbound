# Wowhead motion transfer and creature polish — 1.2.84

Packaged the current dirty Wildbound_worlds source (`d2720a4da60b468884b350e422ae7ab875c31f61`) as a normal-profile Windows desktop build. The build is a review draft; it is not a published web release and source was not committed or pushed.

## Delivered

- Transferred Wowhead donor movement/action clips onto Wildbound's editable pixel rigs for Squirrel (NPC 61081), Great Owl (NPC 85676), Butterfly Dragon/Blinky (NPC 179589), Sheep (NPC 61170), and Highlands Skunk (NPC 62907). Per-species donor sequences, retarget evidence, limitations, and preview paths are in `docs/art/reviews/2026-10-28-*-wowhead-motion-transfer.md` (the Owl review is represented by its importer, generated data, and `test-output/wow-motion-audit/great-owl-wowhead-motion-eight-directions.png`). Existing pixels, native-only actions, behavior, and user-authored keys are retained where stated by each species review.
- Corrected the creature animation routing test so walking and running select separate Squirrel clips.
- Gave Blaise a narrower, more upright silhouette with a clearer flame core and shorter arms; kept the existing rig and action set. This draft remains unapproved.
- Kept prior roster and playtest work in the package. No user profile or authored local save was migrated.

## Verification

- Full suite: **1,694 passed, 0 failed** (`node --test`, run by `scripts/rebuild-desktop.ps1`).
- Syntax check: **502 runtime files**.
- Build identity: version `1.2.84`, built `2026-10-28T06:31:10.981Z`, `preview: false`, source dirty at package time.
- Package: `dist/1.2.84-2026-10-28T06-30-24-322Z/Wildbound-win32-x64/Wildbound.exe`.
- `Play Wildbound.cmd --check` selected that exact package. Desktop `Wildbound Worlds (1.2.84).lnk` targets the repository's `Play Wildbound.cmd`, with blank arguments and the repository as working directory.

## Review and limits

This work does **not** complete donor-motion mapping for every creature in the roster. The five named species received targeted transfers; remaining donor-to-rig assignments still need a systematic audit and visual review. Some source animation IDs alias other clips, and the species notes call out those cases and provisional anatomy anchors. A green test result verifies data/routing/render contracts, not approval of how each creature feels in play. Art/animation drafts are not approved. User playtesting, physical controllers, multiplayer and performance were not verified in this pass.

Useful review captures:

- Squirrel before/after: `test-output/squirrel-wow-motion-transfer/before-after-motion.png`; donor turnarounds: `before-after-source.png`.
- Great Owl: `test-output/wow-motion-audit/great-owl-wowhead-motion-eight-directions.png`.
- Blinky: `test-output/wow-motion-audit/blinky-wowhead-motion-eight-directions.png`.
- Sheep: `test-output/sheep-wow-motion-transfer/before-native-eight-directions.png` and `after-wowhead-eight-directions.png`.
- Skunk: `test-output/skunk-wow-motion-transfer/before-after-eight-facings.png`.
- Blaise: `test-output/blaise-compact-pass/reference-before-after.png` and `motion-8-views.png`.

No commit or push. Use the normal profile through `Play Wildbound.cmd`; do not use `--preview` unless you intentionally want a separate save profile.
