# Car pixel shading, wheel ordering and roof shape — November 22, 2026

Checkout C:/Users/New User/Desktop/Wildbound, branch Wildbound_worlds, origin https://github.com/ijustcreate/Wildbound.git. HEAD f0b787ff33c3ac8f3675b48504937ebda4f0dcb5 plus modified source. Prior car cabin/default snowfall and unrelated ongoing changes retained. No commit or push requested.

## Visual contract

User reported remaining wheel layering, a car that looked too smooth for the pixel world, and an overly rectangular roof. Preserve the green hatchback, world size, native seated driver and four-seat cabin. Resolve a single car, using one world pixel per texel, broad shaded masses, a dark outer contour and restrained highlights. No grain, random texture, dithering, complete-character baked art or generated image replacement.

## Changes

- The previous painter redrew near tyres after the body top, letting upper tyre/tread edges paint over the deck. All tyres now render once behind the opaque shell. Dark fixed wheel-well backing prevents grass showing through the vacated portion of an opening at steering lock. Openings and arch trim stay fixed to the body.
- Cull invisible tread quads with the cylinder surface normal and sort the remaining tread faces. Rim faces follow the steered axle angle and disappear when viewed edge-on; rolling spokes remain native. No wheel placement, collision or steering physics change.
- A single reusable adaptive canvas renders the car at one world pixel per texel. The CPU pixel-shading pass snaps coverage to opaque/transparent, quantizes colour channels in eight-value steps while preserving skin/clothing hues, and composites with nearest-neighbour scaling. One bounded surface, no sprite catalog or persistent frame cache. Shadows, headlight beams and water effects remain outside the hard-alpha pass. No GPU/FPS claim.
- The roof now has an eight-corner chamfered base, shallow 2-unit crown, broad directionally shaded bevels and one quiet highlight. Front/rear glass shares the new roof attachment points; side frames and clear glazing follow the new corner profile. Glass reflections are lighter so they do not overpower occupants.

## Verification

24 focused Node checks pass across coverage/colour shading, roof-to-glass registration, fixed openings, native seating/limb lengths, edited pose retention, door interactions, controller pedals, collisions and water entry. Muted isolated Electron: 282 checks, zero renderer errors. Includes 96 heading/steering cases (32 headings, left/straight/right) asserting every opaque native car texel remains an exact 3x3 block at enlarged scale; all four seats remain visible from both profiles. Additional seven-stage pool-entry render check passes, zero renderer errors. Reviewed the native/enlarged eight views, full-turn steering cases and the car in the actual house/world renderer.

Captures/reports: ignored test-output/car-pixel-roof/, including eight-views.png, wheel-clearance.png, car-in-world.png, snow-level.png and report.json. Clean enlarged eight-view presentation: test-output/car-seated-review-2026-11-22/seated-player-eight-views.png. Artwork is developer-reviewed and awaits user aesthetic approval. No full-suite rerun claimed for this rendering-only follow-up.

Authored rigs SHA256 unchanged: 9A2C55D1090231CE5EC11CF06091224A9EFB1B62A0C1BB0B3EB312A0CDAD0BE1. Test windows muted before loading, isolated temporary profiles. Saves, unfinished editor drafts, sound preferences and existing player games preserved. No hardware-controller, remote multiplayer or sustained FPS claim.

## Verified desktop identity

Delivered package: dist/1.2.105-2026-11-23T01-41-28-245Z/Wildbound-win32-x64. Built UTC 2026-11-23T01:42:15.075Z (November 22 local date) from modified source at f0b787ff33c3ac8f3675b48504937ebda4f0dcb5; preview false. Build pipeline syntax-checked 866 runtime files. Packaged car review passes all 282 checks with zero renderer errors; actual EXE boot report has failed 0, lobby ready, audioMutedTest true and no renderer errors. All six car runtime files exactly match current source: car-art, car-interior, car-projection, car-clips, car-pixel-shader and car-roof.

Desktop shortcut C:/Users/New User/Desktop/Wildbound Worlds (1.2.105).lnk targets C:/Users/New User/Desktop/Wildbound/Play Wildbound.cmd with blank arguments, repository working directory and assets/wildbound-icon.ico. --check selects the delivered package above. Normal save profile. Existing player process left running; reopen through the launcher to load the revised car.

Whole-checkout comparison initially checked 1,601 files and found one unrelated mismatch, src/train-surfaces.mjs, which changed during packaging. Two subsequent attempts to refresh the entire shared checkout were interrupted by transient duplicate imports in ongoing train-world-art/core edits. Those errors had already been resolved by the time each file was inspected; this task did not overwrite those edits. Keep the working, boot-verified car package selected rather than claiming all newer unrelated source is packaged. No full-current-checkout byte-match claim. An additional 17 train-surface/furniture regression checks passed during this audit.

Receipts: test-output/car-pixel-roof-package.log, car-pixel-roof-tests.log (24 tests), car-pixel-roof/report.json (282 native checks), car-pool-entry capture/check output (7 stages), car-pixel-roof-train-surface-tests.log (17 tests), and the delivered package test-output/boot-smoke.json. The later refresh attempt logs retain their actual failures. No commit, push or web publication.

