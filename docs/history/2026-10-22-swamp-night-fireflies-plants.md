# Swamp bank fireflies and plant-variety follow-up

Real project: Desktop/Wildbound Server Branch Build, branch Wildbound_worlds,
modified source at 1bd5ef027966. Latest verified desktop remains 1.2.48; this
follow-up is source-only. No package, shortcut, version, save profile or authored
rig was replaced. Before-edit snapshot: test-output/swamp-night-review/pre-change-source.zip.

User references: five October 22 swamp-map images in this chat. Borrow bank
habitats, broken wetland planting, small night glows and plant variety; retain
Wildbound native pixel artwork. Do not copy map grids, labels or watermarks.

## Integrated gameplay

The pre-existing marsh_firefly fauna was visible in daylight and not net
catchable. src/swamp-fireflies.mjs now owns its bounded, deterministic bank /
shallow-water habitat migration, nocturnal motion, small cached halo and capture
transaction. Existing wildlife, including the 1.2.48 shadow stag/fairy dragon,
is untouched. faunaVersion remains 2; the independent fireflyHabitatVersion
prevents re-seeding captured wildlife or interfering with that upgrade.

- At most ten fireflies per region. Only active/drawn/catchable during the game's
  actual night phase (elapsed 300 through 449 of its 480-second cycle). Hidden
  and stationary throughout day, dusk and dawn. Captured inventory is preserved.
- Homes are bank tiles or shallows neighboring water, excluding deep water,
  bridges, map bounds and prop footprints. Motion stays in this habitat.
- The real Game.attack net path now recognizes fireflies. Either net hand works;
  bottles/jars and cages, legacy container migration and accessible bags work.
  Container consumption and inventory addition are atomic; failures lose nothing.
- Caught identity and container metadata survive saves. Release routes back to
  swamp banks at night and returns the actual container. Released insects can
  be recaptured, and hide with the rest of the population at dawn.
- Tiny shared 18px cached halo and 2px insect core. No new point-light sources,
  shadow maps, per-insect ray traces or pixel readbacks. A small post-night-tint
  emissive pass is camera-culled and restricted to player sight; it does not
  punch holes in the fog or illuminate the entire bank.

## Review-only artwork

The integrated opt-in swamp scene now includes duckweed mats, flowering water
lilies, arrowhead leaves, sedges, rushes and marsh irises alongside the existing
ferns, cattails and moss. Native shapes are grouped by wet/dry habitat and baked
into the existing static ground cache, leaving the walking shelf open.
New plant art / whole-scene redesign is still NOT imported by production map
generation. Preserve the user's earlier request to review before mass rollout.
The pixel-assets skill review gate remains in effect for that broader rollout.

Muted isolated Electron preview: scripts/review-swamp-scene-quality.cjs.
Day/night pair: test-output/swamp-scene-review/day-night-swamp.png.
Separate night view: test-output/swamp-scene-review/night-swamp-scene.png.
Those night scenes demonstrate the shared insect artwork; the review fixture
does not run capture gameplay. The actual Game.attack path is tested separately.

## Checks

- 29 focused tests pass: night/day habitat/render suppression, motion, actual
  net attack with both hands/containers, save/restore, failure safety, bag
  supplies, release/recapture; existing coastal/released critter, night cycle,
  scene and lighting-budget tests.
- 18 realm/Boundless tests pass, including three environments, existing shadow
  wildlife upgrade, streamed regions, saved fauna and persistent world packs.
- Isolated Electron verifies that real drawRealmLife produces no daytime
  firefly pixels and does produce night pixels, and renders the combined scene.
  Preview loop retains one ground build, seven tree builds and eight water
  phases, with zero runtime getImageData calls. Software timing is recorded in
  report.json, not a whole-game FPS or hardware-performance claim.
- Authored rigs remain at SHA256
  dc05411b47f02259be95ea0ed22aea375d76f79b55d7f0bdec57da5df7ed7d71.

No commit or push. No new desktop build requested or created in this turn.
