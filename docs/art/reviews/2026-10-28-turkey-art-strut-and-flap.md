# Turkey silhouette, strut and attack flap — draft

**Status:** Unapproved art draft. Native-density drawing and editable clips are in `src/creature-packs/wildlife.mjs`.

This follow-up reduces the tail fan's width and height across all eight facings so it no longer overwhelms the bird. The torso is slightly fuller, with the head and red wattle kept clear of the rear fan layer. Orange shanks, feet and toes were tightened into small articulated shapes. The `strut` clip keeps the torso bounce restrained and uses an alternating neck/head motion for a more visible bob. `flap-attack` remains a distinct broad hinged wing beat. Existing wildlife routing and behavior are unchanged.

The primary reference is Wowhead NPC **62648 (Turkey)**, captured in Stand at front, side, rear and opposite views. The draft borrows its rounded upright body, broad raised tail fan, small head/beak and thin orange legs while retaining Wildbound's native pixel density and eight-view rig.

## Review evidence

- Matched archived-before and current-after eight-view comparison at native and 2.25× nearest-neighbor scale, plus NPC 62648 source captures: `test-output/followup-roster-art/wildlife/turkey-before-after-reference.png`.
- Actual muted Electron render study of `strut` and `flap-attack` across all eight facings: `test-output/followup-roster-art/wildlife/turkey-strut-flap-motion.png`.
- Capture report with source IDs and renderer error count: `test-output/followup-roster-art/wildlife/turkey-capture-report.json` (zero renderer errors; audio muted).
- Source modelviewer captures: `test-output/modelviewer-references/62648-turkey-stand-front.png`, `62648-turkey-stand-side.png`, `62648-turkey-stand-rear.png`, and `62648-turkey-stand-opposite.png`.

Focused QA: `node --test tests/creature-packs/wildlife-pack.test.mjs tests/creature-pack-animation-routing.test.mjs` passes (16 tests). This validates the eight-facing draw contract and existing movement/controlled-attack clip routing. It is not a hardware playtest.

The flapping cycle is clear at diagonal and rear views. The updated head bob reads more distinctly against the smaller fan. In-game timing and controller play remain unverified; user approval is still needed. Keep status **Draft / unapproved** until the user reviews the before/after evidence.
