# Reactive Shadow Realm ground fog

## Research and interpretation

User requested online research into the new Ocarina of Time ground fog and an implementation in the Shadow Realm. The exact proprietary Nintendo implementation was not verified. We used first-hand recreation descriptions and a published fluid method as references, then wrote original code for Wildbound's Canvas renderer.

- OrdinaryCicada, https://oddpotatodev.itch.io/godot-cheap-ground-fog : mesh/shader approximation, world-snapped coverage, carved trails, eddies and landing puffs. The author explicitly says this recreation is not true volumetric rendering.
- Recreation author Longjumping_Height30, https://www.reddit.com/r/godot/comments/1xqfc7m/i_tried_remaking_the_dynamic_fog_in_the_ocarina/ : first-hand explanation of a 2D fluid simulation, displaced plane, layered/parallax rendering, terrain heightmap and scrolling noise. This describes their recreation, not confirmed Nintendo source.
- Jos Stam, Real-Time Fluid Dynamics for Games, https://www.dgp.toronto.edu/public_user/stam/reality/Research/pdf/GDC03.pdf : density/velocity fields, semi-Lagrangian advection and pressure projection. Original implementation here adapts these concepts with a small visual-quality projection budget, procedural curl and replenishment.
- Game World Art video https://www.youtube.com/watch?v=YbOqNl_ggK4 was identified, but playback/transcript could not be retrieved, so no unverified internal-technique claim is based on it.

## Implementation

New src/shadow-ground-fog.mjs replaces the previous moving fog stamps. Local density and velocity grids advect mist, project velocity to reduce divergence, receive movement/attack/landing impulses, and slowly replenish. Movement carves continuous trails; lateral/radial forces curl the displaced fog. Teleports are ignored, elevated actors do not clear ground fog, and final short jump frames still produce a landing impulse. Existing motes and dust stay in src/shadow-atmosphere.mjs.

Three translucent density shells create depth: two below actors/scenery, one faint low shell above. Procedural world-space density, overlapping sample borders and soft texture filtering keep fog attached to the floor. Ground shading remains visible. This is a 2D renderer adaptation, not a 3D volumetric or raytraced fog port.

Simulation is stored in a WeakMap, never saved or added to gameplay actors. At most eight 52x52 fields, nine Float32 buffers per field, plus one 52x52 RGBA texture and ImageData per field; roughly 0.92 MiB typed-array/raster data at the cap, excluding Canvas/JS overhead. Visible-grid resolution coarsens for wide views. Simulation targets 30 Hz, caps catch-up at three steps, and advances only once per game time across split views. Rendering in other biomes is a no-op. No gameplay RNG, terrain, authored rig or player sound setting changes.

## Verification

First actual muted Electron review: 35 checks passed, no renderer errors. Includes real-canvas animation/visibility, carved density trails, refill, attack/landing impulses, split-view step protection, negative/extreme bounds and eight-field cap, saves, custom artwork, encounters and small-window co-op. Reviewed reactiveFog.png: floor is misty with visible stone detail and readable hero/scenery. Later corrected landing detection to use actual airborne-to-ground transition even below two pixels; final verification follows. Full repository test suite, hardware controls and game FPS are not claimed.

Numerical regressions: five passed, covering trail/refill, half-pixel landing and attack injection, teleport suppression, 30 Hz clock independence at 30/60 rendered frames, repeated views, travel/negative bounds and cache cap. A combined realm/chasm/ranged-origin/fog run initially exposed an unrelated wrong bow-aim import. arrowFlightGravity already existed in projectile-range.mjs; corrected only bow-aim's import source. All 23 focused checks then passed. Repackaging after this boot fix; the prior intermediate 03-03-10 package is superseded.

## Final desktop receipt

Version 1.2.108; source commit f0b787ff33c3ac8f3675b48504937ebda4f0dcb5 plus modified checkout. Output: C:/Users/New User/Desktop/Wildbound/dist/1.2.108-2026-11-23T03-05-19-882Z/Wildbound-win32-x64/Wildbound.exe. Built 2026-11-23T03:05:36.943Z, preview=false (normal profile). Manifest also records a concurrent trainConductorPatch at 03:05:50.662Z; that patch was preserved, and the final tests ran afterward.

Syntax checked 901 runtime files. Final packaged muted Electron review: 35 passed, failed=0, renderer errors=[], muted=true. Numerical trail sample: 0.5730 before walking, 0.0437 afterward; subsequent refill passed. Measured fog draw/update fixture average 1.725 ms over 20 frames in a 640x420 one-field test; this is not a whole-game FPS measurement or four-view performance guarantee. Report and captures: test-output/shadow-underworld/packaged/report.json and reactiveFog.png. Final review log: test-output/shadow-underworld/fluid-packaged.log.

Actual packaged EXE boot smoke: exit=0, ready lobby, version 1.2.108, errors=[], audioMutedTest=true. All four relevant runtime modules (shadow-ground-fog, shadow-atmosphere, render, bow-aim) match current source/package hashes. The normal desktop shortcut C:/Users/New User/Desktop/Wildbound Worlds (1.2.108).lnk targets C:/Users/New User/Desktop/Wildbound/Play Wildbound.cmd; launcher --check selected the exact output above.

No commit or push. Existing authored assets, saves, sound settings and other running games preserved. Full-suite completion and hardware-controller testing remain unverified.
