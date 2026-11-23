# Zoomed-out multiplayer rendering performance

Checkout: `C:/Users/New User/Desktop/Wildbound`, branch `Wildbound_worlds`, origin `https://github.com/ijustcreate/Wildbound.git`. Base commit `f0b787ff33c3ac8f3675b48504937ebda4f0dcb5`, with existing modified source. No commit/push requested. Existing artwork, editor drafts, saves and running player games are preserved.

## Measured causes and changes

- Profiling reproduced slow wide shared and split forest views. The expensive paths repeatedly transferred the water shader canvas for individual tiles, rebuilt shoreline clipping paths, applied a brightness filter to the small world board, painted static banks, and drew off-screen characters. Separate split renderers duplicated GPU grass contexts and scenery caches.
- The animated water shader now transfers once per 30 Hz water tick into a shared 2D surface; every water tile uses that surface. Native-resolution bounded forest water atlases share work between cameras, retain original tile ordering and four-pixel bank gutters, cache static banks separately and keep flow animated. Terrain, seed, weather and phase changes invalidate the atlas; monsoon flooding uses derived live terrain.
- Shoreline clipping uses bounded reusable Path2D masks and merged two-pixel row runs, preserving all 256 neighbor configurations. Custom board brightness is cached at source resolution with a 32 MiB / four-image cap. Default board brightness avoids filtering entirely.
- Split views share GPU grass geometry/context and scenery/ground caches, with separate per-canvas grass images so one camera cannot overwrite another. Merging releases child canvases while retaining the parent's reusable GPU resources. Off-screen players/boards and distant stations/platforms are culled conservatively; player simulation, input, revival markers and camera ownership continue unchanged.
- Zoomed-out railway scenery uses half-resolution native sprite rasters below 0.75 zoom while keeping their world-space dimensions. Nearby artwork retains full resolution. This quarters the sprite cache/worker bitmap footprint; both views receive their own scenery preparation schedule. Characters remain animated at the normal cadence.

## Verification and measurements

- 30 focused camera, shoreline, cache, terrain-worker and board regressions passed. The clipping test compares every cell for all 256 bank-neighbor patterns; station culling retains curved platforms at all station headings.
- Muted isolated source Electron: 47 checks passed with no renderer errors. Includes two/three/four viewports, shared GPU context with distinct per-view images, mouse projection, merging, panels, small windows, saved controls, real terrain worker, animated water, flooding and populated native railway forests at both raster scales, and cached/direct shoreline pixel equality (maximum premultiplied color/alpha difference: zero).
- At 1780x1000, the paired benchmark loaded the original delivered desktop package and then the updated source with the same scripted scene. Wide shared forest draw mean/p95: 98.59/176.2 ms → 60.49/113.5 ms. Two zoomed-out forest views: 65.33/109.3 ms → 38.76/63.1 ms (about 41% lower mean, 42% lower p95). Other isolated development runs reached 17.29 ms mean / 25.2 ms p95 for two views; timing varied with concurrent machine load. The paired figures are the conservative comparison.
- Large-world streaming-phase CPU draw samples improved from 31.52 to 12.81 ms mean at 0.65 zoom, but initial terrain preparation was still pending; these are not steady fully populated-world or hardware FPS measurements.
- Measurements are JavaScript draw timings, not presentation FPS or a guaranteed 60 FPS. Physical controller feel, sustained long-distance traversal on the user's active save and other hardware remain unverified. Initial shader/asset preparation can still take longer than steady rendering.
- Reports, CPU profiles and screenshots: ignored `test-output/camera-performance/`; source camera checks: `test-output/multiplayer-camera/source/report.json`.

## Final desktop delivery

- `scripts/rebuild-desktop.ps1 -TestConcurrency 8` succeeded: all 2,032 tests passed, zero failures; 905 runtime files syntax checked; packaging and shortcut creation completed.
- Packaged muted isolated Electron passed all 47 camera/rendering checks, zero renderer errors. Populated two-view forest screenshots were visually reviewed. Cached/direct shoreline pixels match exactly.
- Actual packaged executable boot smoke: `failed: 0`, lobby ready, no renderer errors, isolated test profile and muted audio.
- Verified output: `C:/Users/New User/Desktop/Wildbound/dist/1.2.108-2026-11-23T03-32-53-600Z/Wildbound-win32-x64/Wildbound.exe`.
- Build identity: `1.2.108`, source commit `f0b787ff33c3ac8f3675b48504937ebda4f0dcb5`, `sourceDirty: true`, built `2026-11-23T03:33:23.993Z`. Includes existing modified source; this task did not commit or push.
- Normal launcher and shortcut target: `C:/Users/New User/Desktop/Wildbound/Play Wildbound.cmd`. Desktop shortcut `C:/Users/New User/Desktop/Wildbound Worlds (1.2.108).lnk` has blank arguments, the repository working directory and `assets/wildbound-icon.ico`. `Play Wildbound.cmd --check` selects this exact output. Normal save profile, no `--preview`; existing running games and saves were preserved.
- Fourteen changed runtime/audio files exactly match the package by SHA-256. Consolidated receipts: `test-output/camera-performance/delivery.json`; full successful log: `test-output/camera-performance/rebuild-final.log`; packaged camera report: `test-output/multiplayer-camera/packaged/report.json`.

Sustained hardware FPS and physical controller play remain unverified; the reported speedups measure JavaScript rendering time.

The broad rebuild initially exposed two concurrent Crossfire encounter integration gaps. Its append-only card is now retained by legacy definition-pack imports, and `generate-encounter-audio.mjs --only-missing` added its distinct cue while preserving existing recordings. Both failing catalog/audio tests pass on rerun; no test assertions were weakened.
