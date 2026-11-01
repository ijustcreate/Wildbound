# Jammer / triceratops donor-motion pass

This is an unapproved review draft. The reported missing animation was caused by Jammer using the pack's authored approximation clips; it had no Wowhead motion integrated. This pass adds exact donor Stand, Walk, Run, and AttackUnarmed clips to Jammer's editable Wildbound joint rig. Native pixels and the existing warning, charge, headbutt, hurt, and death actions remain available.

## Donor and mapping

- Wowhead NPC 142151, Jammer; model 47236, FileDataID 660332.
- Donor M2: [public Wowhead model asset](https://wow.zamimg.com/modelviewer/live/m2/660332.m2); local review copy `test-output/wow-motion-audit/660332.m2`.
- SHA-256: `75bb856ed011f186f55dd008aea9d4b0b02818f21ca09f7538183755fdaf83a8`.
- The v274 file contains 92 bones and 37 sequences. Selected sequences: Stand ID 0/index 0; Walk ID 4/index 28; Run ID 5/index 22; AttackUnarmed ID 16/index 4. No external `.anim` files were required.
- Converter and reproducible mapping: `scripts/import-triceratops-wow-motion.cjs`; generated native keys/provenance: `src/triceratops-wow-motion-data.mjs`.
- The target keeps the existing eight-facing pixels, palette, parts, geometry, and native charge telegraph. Donor joints are position-retargeted at 3× scale; root translation is removed. Paw-down travel is limited to the rig's one-pixel ground clearance. Measured donor root drift was under 0.26 source units on the selected clips.

## Review capture and checks

- Eight-facing assembled preview: `test-output/jammer-wow-motion-runtime/eight-facings.png` (captured in a muted Electron renderer).
- Focused checks: `node --test tests/creature-pack-animation-routing.test.mjs tests/creature-packs/wildlife-pack.test.mjs` — **17 passed, 0 failed**.
- The new test checks donor provenance, finite/editable joint keys, actual idle/walk/run/attack routing, retained native charge actions, and paw ground clearance.

## Limits

This is positional retargeting, not donor-mesh skinning. The source-to-target mapping follows the Jammer skeleton's hierarchy and pivots; the horns/frill anchors are approximate. The 3D donor's visual style is not shipped, and the assembled eight-facing capture still needs human review for foot contact, silhouette, and attack readability. This does not transfer the baby triceratops, nor certify every other new creature's motion source.
