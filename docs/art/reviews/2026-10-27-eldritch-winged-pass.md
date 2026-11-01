# Eldritch winged-creature silhouette pass — draft

**Status:** Draft; not user-approved. `src/creature-packs/eldritch.mjs` SHA-256: `4E9622D3B8C775DE4E3307ADCE05EAE7C759B552DB694169C21AED8E07DFA489`.

## Selection and contract

The Scruffbeak and Tyri modelviewer turnarounds had complete, usable four-view Stand captures and the largest art/runtime silhouette gaps among this batch. The Cave Monster turnaround was unusable: its captured front, side and rear images show a Wowhead error/branding page rather than the creature, so it was left unchanged.

Use the source pixel density and current eight-facing rig. Borrow Scruffbeak's compact body, pale face/ruff, tufted crown, hooked beak and folded wings; borrow Tyri's large pale energy wings and armored robe masses. Keep geometry chunky with few broad material regions. Preserve joints, clips, behavior, events and stats; no donor animation transfer is attempted or claimed.

## Changes

- **Scruffbeak / `flying_raptor`:** replaced the warm-brown generic bird palette with charcoal/gray plumage, pale ruff and gold-brown beak/feet. Idle wings now fold close to the body and use grouped feather masses; flight/dive use the extended wing pose. Enlarged the breast and head read, added a stepped crown tuft, hooked beak and close tail fan.
- **Tyri / `archangel`:** replaced thin raised strokes with broad curved wing masses, grouped feather tips, and a muted inner shade. Strengthened chest armor, shoulder plates, tabard and halo visibility; profile facings use a single swept wing silhouette.
- **Cave Monster / `cave_monster`:** unchanged because the supplied capture archive has no usable model angle for this creature.

## Review captures

- `test-output/creature-art-review/eldritch-winged-pass/flying_raptor-reference-before-after.png`
- `test-output/creature-art-review/eldritch-winged-pass/archangel-reference-before-after.png`
- Matching raw runtime views: `flying_raptor-before.png`, `flying_raptor-after.png`, `archangel-before.png`, `archangel-after.png` in the same directory. Each uses eight directions at native size and 2.3× nearest-neighbor scale.
- Primary reference angles: `test-output/modelviewer-references/253399-scruffbeak-browser-stand-{front,side,rear,opposite}.png` and `79181-tyri-browser-stand-{front,side,rear,opposite}.png`.

## Verification and limits

`node --test tests/creature-packs/eldritch.test.mjs tests/creature-packs/eldritch-art-quality.test.mjs` passes 7/7. `node --check` passed for source and capture script. Render boards came from `CREATURE_PACK.subjects[kind].draw` in muted isolated Electron; capture reported `audioMuted: true`, `rendererErrors: 0`. The boards are idle-pose visual review, not an in-game combat test. Scruffbeak remains a compact stylized bird; Tyri's wings are flat color clusters rather than real-time glow effects. Art remains unapproved.
