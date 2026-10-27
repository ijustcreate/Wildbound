# Integrated swamp scene — draft for visual review

Real checkout: Desktop/Wildbound Server Branch Build / Wildbound_worlds.
User requested a single scene showing trees, moss, water and ground together,
using the supplied Desktop/pixel art ref 2 images as the new environment quality
target. This supersedes the earlier tree-structure gallery as a proposed look;
neither draft is approved for mass rollout.

## Small visual contract

Primary references: dani-riise-swamp-dock.jpg and
dani-riise-reed-thing-export.jpg; temple/stump references support grouped plant
shapes, weathered material planes and walkable negative space. Borrow design
principles, not pixels, watermarks or exact compositions.

- 640x400 logical pixels, nearest-neighbor 2x review image; existing hero renderer
  shown for scale, not a new character or a changed rig.
- Connected irregular crown silhouettes, stepped leaf sprays and selective
  upper-plane highlights; keep cool undersides contiguous rather than outline
  every primitive. Cypress and mangrove share a palette, not one canopy shape.
- Warm brown/ochre trunks against blue-green shadows; forks, tapered buttress
  roots and irregular moss curtains are separate editable native geometry.
- Teal creek with broken glints, lily pads and reflected trunk fragments;
  irregular shallow/mud/grass shore, grouped reed beds, ferns, stones and a short
  weathered landing. Open central walking shelf remains readable.
- Palette is explicitly recorded in SWAMP_SCENE_CONTRACT in the source.

## Scope and preservation

Only new opt-in source: src/swamp-scene-study.mjs. It is not imported by any
production entry point, biome generator, saved map or normal renderer.
No save, custom asset, authored rig, map collision, production art, shared
lighting implementation, package version or desktop shortcut was replaced.
Prior shadow ownership / animated-moss fixes remain intact.

Pre-review backup of the affected existing renderer/art/handoff/rig files:
test-output/swamp-scene-review/pre-review-source.zip.
Authored rig hash before and after:
dc05411b47f02259be95ea0ed22aea375d76f79b55d7f0bdec57da5df7ed7d71.

## Verification and remaining visual review

scripts/review-swamp-scene-quality.cjs boots the current source game in a muted,
isolated Electron profile, then uses its actual native hero renderer and the
existing WorldLightRenderer / worldLightField for this fixture. No replacement
lighting or per-frame ray tracer was added. One cached ground, seven cached tree
bodies, eight cached water phases, small cached moss ribbons; trailing ribbon
bands animate with pinned tops. Existing light budget and alpha-masked rims are
unchanged. The art itself contains no ground blob or extra glow/shadow pass.

22 focused tests pass (new scene contract/geometry and existing lighting budget,
height/occlusion and shadow ownership tests). Electron reports zero runtime
getImageData calls and no rebuilding static layers across 259 renders.
Software scene timings are in report.json; these are not whole-game FPS or
hardware performance claims. Current run median ~6.4ms / p95 ~8.7ms lit scene;
unlit p95 was noisy, so do not infer a precise lighting delta from that run.

Native and 2x images, 16 animation phases and an APNG loop are in
test-output/swamp-scene-review/. Animation is a 3.2s review loop. Its exporter
uses existing pngjs and standard APNG chunks, with no added dependencies.

Self-review: first render had horizontal foliage tiers and overly smooth banks;
replaced the row grid with interlocking leaf groups, deeper irregular crowns,
bank grass/reed interruptions and tapered root planes. Still a draft, not a
claim to have matched the reference quality. Full scenery-family application
is deliberately paused for the user's visual approval under the
wildbound-pixel-assets skill. No new desktop package, commit or push.
