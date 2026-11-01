# Great Owl art pass — draft for review

**Status:** Draft; not user-approved. Gameplay data and editable joints remain unchanged.

## Art contract

- **Reference:** Wowhead NPC 85676, Archimedes, captured at Stand from front, side, rear and opposite-side views in `test-output/modelviewer-references/`.
- **Borrow:** compact owl body, broad warm flight feathers with dark tips, pale face disk and breast, ear tufts, gold feet, long trailing tail feathers. Keep the existing Wildbound palette and pixel density; do not copy 3D surface detail.
- **Views/pivots:** retain the existing `great_owl` skeleton, named wing/foot/face pivots, hitbox and all eight facing IDs. Resolve lowered front wings, raised rear wings and a folded side-profile fan in drawing code around the same rig.

## What changed

The baseline read as a tall narrow body with thin, flat arm-like wings. The revision broadens the feather mass, groups a few flight-feather shapes, lowers the front-facing fan and raises it from rear views. Side profiles now get a compact upright folded wing and trailing tail, since both wing joints overlap when foreshortened. The body and face masses were rounded and shortened. No clip, behavior, event, joint, or other Eldritch creature was edited.

## Review captures

- `test-output/creature-art-review/great-owl-pass-before.png` — baseline from the current source, eight facings at native and 2.3× nearest-neighbor scales.
- `test-output/creature-art-review/great-owl-pass-after.png` — revised source, same runtime renderer and layout.
- `test-output/creature-art-review/great-owl-pass-reference-before-after.png` — labeled before/after plus actual four-view Wowhead Stand captures.
- Primary source images: `test-output/modelviewer-references/85676-archimedes-{front,side,rear,opposite-side}-idle.png`.

## Verification and limits

`node --test tests/creature-packs/eldritch-art-quality.test.mjs tests/creature-packs/eldritch.test.mjs` passes 7/7. The capture script uses a muted, isolated Electron process and the game’s `CREATURE_PACK.subjects.great_owl.draw` runtime renderer; its reported renderer errors are zero. This is an eight-direction idle art review, not a hardware/gameplay playtest. Wowhead source captures are all Stand, not animation donors. The art remains an unapproved draft.
