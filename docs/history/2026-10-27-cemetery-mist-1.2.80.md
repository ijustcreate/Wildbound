# Cemetery woodland and pixel mist — 1.2.80

Reference: the user's dark winding woodland image, supplied October 27. Borrow
blue-black grouped woodland silhouettes, pale blue-grey paths, crooked bare
branches, and low, layered mist. Preserve native chunky pixels and readable
graves, actors and collision openings. This is a native scenery drawing pass,
not a replacement raster map or a change to saved expeditions.

## Changes

- Native cemetery trees share connected crooked trunks, reaching hooked forks,
  broad root masses and selective cool rims. Broadleaf cemetery canopies are
  bare; pine and willow keep sparse identifying silhouettes. Ground colors
  move to slate blue, with brighter path values. Sizes, root registration,
  felling pivots, tree collisions, graves and existing custom authored rigs remain.
- CemeteryFogRenderer uses one WebGL quad into a two-layer target, capped at
  320x360 total pixels (320x180 per layer). Three analytic advected density slices
  per layer suggest shallow volume; this is an approximation, not full 3-D
  volumetric ray marching. Nearest-neighbor compositing and restrained color
  steps retain the game's pixel character. Dense mist sits below scenery;
  thinner elevated mist sits above actors, below exploration darkness and HUD.
- Up to four selected carried/environment/cemetery lights scatter their actual
  color into the mist. A small 32x32 RGBA polar shadow atlas stores 32 bearings x
  eight radial samples at two heights per light, using native volume intersection.
  It distinguishes ground mist behind a grave from air above it; trunks and
  mausoleums block light. This is deliberately coarse, softly filtered lighting.
- Only one source shadow slice updates per frame. Static light/scenery signatures
  retain cached visibility. Moving sources and changed geometry refresh at a
  bounded cadence; slight shadow lag and softened small blockers are quality
  tradeoffs. Density refreshes at 24 Hz with padded world-space reprojection;
  large camera changes/resizing refresh immediately. Paused simulation freezes
  drift. Other biomes, lobby, victory, opening stage and all-underground parties
  do no fog work. No player lighting settings or system volume are changed.
- The normal Electron path renders into OffscreenCanvas and transfers a small
  GPU ImageBitmap, reusing it for both layers and closing the old bitmap. The
  compatibility path copies to one tiny cached 2-D atlas per fog update. Neither
  path reads pixels back to CPU in production. Overhead/out-of-range volumes
  are filtered once per cache update, and polar bearings are precomputed.
- One seed-generated 64x64 two-channel noise texture supplies hardware-filtered
  broad banks and counter-moving wisps, replacing repeated trigonometric hashes
  in each shader fragment. It is generated once per cemetery seed, not per frame.
- WebGL initialization/context failure skips this optional fog and retains
  native scenery; context restoration allows recreation. No CPU particle
  simulation, readPixels, per-frame texture allocation or full-resolution blur.

## Verification and delivery

The dedicated muted isolated Electron verifier checks actual shader compilation,
the real Renderer, resolution bounds, paused stability, drift, moving/colorful
lights and surface/interior exclusion. It saves cemetery/path and separate warm/
cool fog captures. Its benchmark separates cached work, moving-light shadow
refresh and capped surface compositing, using gl.finish; it excludes PNG encoding
and records the GPU. This measures effect cost in this environment, not whole-game
FPS, physical controller hardware, or performance on every supported computer.
The verifier also records forced Canvas readback separately (a deliberately
expensive diagnostic, absent from production), plus alternating fog-off/fog-on
real renderer frame pacing without readbacks. Do not confuse CPU submission
timings with total GPU/compositor completion or guaranteed frame rates.

Node regressions cover activation boundaries, bounded light priority and
height-dependent light occlusion/self-occlusion. Existing cemetery drawing,
generation, harvest, felling and lighting tests validate the isolated build.
The shared-checkout full suite failures are recorded separately; they are not a
passing result for the shared checkout. Exact results, final package path, source identity and launcher
checks go in test-output/cemetery-fog/ and the delivery receipt after rebuilding.

Editing checkout: C:/Users/New User/Desktop/Wildbound, Wildbound_worlds. Base
commit d2720a4da60b468884b350e422ae7ab875c31f61, modified source. Existing creature
and event work was already uncommitted and continued changing during the full
suite. It has unrelated wildlife/event-roster/spawn failures; the rebuild script
correctly stopped before packaging that checkout. Preserve those source files.

Native delivery is built in a separate detached worktree at
C:/Users/New User/Desktop/Wildbound Cemetery Build, starting at d2720a4 and
copying only this assignment's source, tests, verifier, version and handoff files.
The build excludes unfinished creature/event changes, which remain in the editing
checkout. Both contain the cemetery implementation. The isolated checkout reuses
the existing dependency installation through an ignored node_modules junction.
No saves, drafts, profiles or authored/rigs.json are migrated or replaced.
Normal desktop shortcut targets that checkout's Play Wildbound.cmd without
preview arguments. Final manifests identify modified source and exact content.
No commit, push, GitHub Pages deployment or downloadable release is implied by
the local native rebuild. Latest published web remains its separate target.
