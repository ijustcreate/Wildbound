# Cavern gameplay-perspective slice

Status: USER REJECTED. The generated cutouts and raster-to-indexed conversion do not match Wildbound's art style or asset construction. Retained only as historical studies. Do not ship or use these sprites as an approved reference. The replacement small native sample is documented in `CAVERN_NATIVE_SAMPLE.md`.

The user accepted the generated concept direction but required Wildbound's existing view/perspective. `src/cavern-slice.mjs` now constructs a two-chamber sample in the game's unrotated world coordinates. The actual Renderer, player animator, lantern/night lighting, HUD, scenery renderer, mining and support queries render/test the sample. No isometric projection or background concept painting is used.

Six separate generated cutouts were converted into the existing 128×128 indexed sprite format: two rock wall masses, a low shelf, stalagmites, crystals and fungi. The source sheet and native editable pixels are saved under `assets/concepts/cavern-slice/`. The conversion preserves aspect ratio, locates alpha bounds, registers the ground anchor at y=122, and uses a compact RGB palette. It runs only inside an isolated preview profile. Live authored assets and overrides are untouched.

The source artwork was generated with built-in image generation, then a second generation requested transparent cutouts/cell registration. Its alpha channel was verified. The sheet's actual irregular horizontal bounds are explicitly cropped in the preview script. No generated scene was substituted for editable level objects.

Self-review changes: removed broad circular floor patches in favor of subdued fractured bedrock; corrected the runtime preview's sprite-library binding so new minerals actually render; removed a malformed test weather fixture; used the real lantern for player lighting. Wall repetition and complete foreground cutaway treatment still need work after visual review; this is a small kit, not a finished cave catalog.

Verification entry point: `scripts/review-cavern-slice.cjs`. Muted isolated Electron produces a real gameplay capture, assembled overview, collision overlay and checks. It checks editable sprite validity, player spawn, chamber connection with a player-radius query, jumpable shelf support and crystal mining. Preview assets and layout are not automatically written to user saves or packaged builds.

Outputs: `test-output/cavern-slice/gameplay.png`, `overview.png`, `collision.png`, `checks.json`. Before expanding, compare the assembled normal-camera result with the user-supplied references. Pending work includes full wall boundary/occlusion integration, shape-versus-grid edge alignment, animated water/seep treatment, editor placement UI for the wall kit, more distinct formations, and complete Boundless integration. The earlier rejected native cavern study remains superseded.
