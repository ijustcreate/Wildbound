# Squirrel bounding motion and editable rig — draft

**Status:** Draft for user review; not approved for release. The squirrel-specific art and clip set live in `src/creature-packs/wildlife.mjs`. Runtime selection is handled by the shared creature-pack router.

## Direction and implementation

- Uses the game's native editable quadruped joint names while tightening the squirrel's posture around alert haunches, tucked forepaws, high head, and oversized curled plume.
- Adds three pack-local clips: `scamper` (springing four-beat bound with a counter-moving plume), `freeze` (alert crouch with subtle head/ear checks), and `leap` (crouch, lift, apex, and recovery).
- The runtime router maps squirrel moving walk/run to `scamper`, idle to `freeze`, and airborne jump to `leap`. Special explicit actions remain in control.
- The profile tail retains a dominant rounded plume, but its width was moderated after the first motion preview made it occupy nearly three times the body mass. Body, hitbox, habitat, behavior and other wildlife are unchanged.

## Review and verification

- Static all-eight-facing tail review: `test-output/followup-roster-art/wildlife/squirrel-tail-pass5-reference-before-after.png`.
- Actual muted Electron motion strip for S/W/N/E: `test-output/followup-roster-art/wildlife/squirrel-scamper-motion-strip.png`.
- Capture metadata and errors: `test-output/followup-roster-art/wildlife/squirrel-scamper-motion-strip.json` (Electron audio muted; zero renderer errors).
- Pack tests: `node --test tests/creature-packs/wildlife-pack.test.mjs`.

The review strip samples clip poses; it does not establish in-game timing feel or hardware playtest behavior. User visual approval is still needed.
