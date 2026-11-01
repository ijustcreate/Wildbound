# Eldritch silhouette follow-up — draft

**Status:** Draft for user review; not approved. Artwork-only edits in `src/creature-packs/eldritch.mjs`. Rigs, clips, behavior, events, stats, and runtime placement were preserved.

## Visual contract

- Match the established chunky pixel density and native runtime footprint; use only nearest-neighbor enlargement for inspection.
- Treat source modelviewer Stand views as anatomy cues, not mesh or animation imports. Keep a small dark outline, broad material groups, and only a few identity details.
- Review S, SW, W, NW, N, NE, E and SE as a coherent turn. This pass is a draft and needs user art approval.

## Decisions

- **Blinky / Butterfly Dragon (`butterfly_dragon`):** Lengthened the connected body through its facing axis, strengthened the raised neck and wedge muzzle, retained four planted paws, and grouped the wings as two broad spotted sails. The tail stays in the body palette with one restrained band. This addresses the bug-like barrel silhouette while preserving all rig anchors.
- **Clinging Remains (`evil_hand`):** Replaced the eye-like rounded mark with a flat palm, ragged wrist, separated fingers and hooked thumb. Facing-space shapes point the fingers in the creature's travel direction. The archived source is a detached skeletal hand, so the review uses its bone material and hand anatomy while retaining the crawling identity requested by the game.
- **Blossoming Ancient / Tree Ent (`tree_ent`):** Strengthened the bark trunk, forked branch arms and root feet; tightened the canopy into two rising leaf clusters and joined them to the face with a visible wood neck. This keeps the tree-person body visible beneath its foliage.

## Review images

Cards show the existing drawing and draft at matched eight-facing, native and 2.3× nearest-neighbor scales beside four archived source Stand captures:

- Blinky: `test-output/creature-art-review/eldritch-batch2-butterfly_dragon-reference-before-after.png`
- Clinging Remains: `test-output/creature-art-review/eldritch-batch2-evil_hand-reference-before-after.png`
- Tree Ent: `test-output/creature-art-review/eldritch-silhouette-pass/tree_ent-reference-before-after.png`

Refreshed eight-facing runtime rows:

- `test-output/creature-art-review/eldritch-batch2-after-butterfly_dragon.png`
- `test-output/creature-art-review/eldritch-batch2-after-evil_hand.png`
- `test-output/creature-art-review/eldritch-silhouette-pass/tree_ent-after.png`

Source references:

- Blinky: `test-output/modelviewer-references/179589-blinky-{front,side,rear,opposite-side}-idle.png`
- Clinging Remains: `test-output/modelviewer-references/179179-clinging-remains-{front,side,rear,opposite-side}-idle.png`
- Tree Ent: `test-output/modelviewer-references/71488-blossoming-ancient-{front,side,rear,opposite-side}-idle.png`

## Verification and limits

- `node --test tests/creature-packs/eldritch.test.mjs tests/creature-packs/eldritch-art-quality.test.mjs` — 7/7 passed.
- Refreshed with isolated Electron through `CREATURE_PACK.subjects[kind].draw`; audio muted with `webContents.setAudioMuted(true)` and `--mute-audio`; renderer errors: 0.
- This is an idle artwork review. It does not verify gameplay animation quality, combat, hardware performance, or the visual clarity of every subject in a live scene. Remaining untouched pack subjects were not re-audited in this pass. Draft remains unapproved.
