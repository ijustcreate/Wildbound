# Dynamic multiplayer dividers and delivered FPS

Checkout: `C:/Users/New User/Desktop/Wildbound`, branch `Wildbound_worlds`, origin `https://github.com/ijustcreate/Wildbound.git`, base commit `f0b787ff33c3ac8f3675b48504937ebda4f0dcb5` plus the existing modified source. No commit or push requested. Preserved other work, saves, profiles and running games.

## Behavior and design basis

- Two, three and four outdoor groups receive exact convex spatial cells. The divider rotates perpendicular to their relative positions; player ownership follows roster IDs as people cross directions. The system remains capped at four views.
- Damped springs settle the geometry without oscillation. Distance adds restrained thickness; smoothed radial velocity changes the small pulse rate/direction. There is a short bounded reveal overshoot, a fine player-color edge, and reduced-motion support. Teleports do not become extreme velocity pulses.
- On full reunion, every pane interpolates into the same world-to-screen transform during the configured fade interval (independent of the longer regroup dwell), the divider reaches zero opacity, and one fully aligned frame is presented before the shared camera takes over. Partial group merges have a short composed-frame crossfade.
- A teleport cuts only the traveling pane, never pans across the entire map or restarts another camera's flash. Its old image briefly crossfades into the destination. If destination floor textures are unavailable, only that pane holds a restrained travel veil; a failed worker or six-second timeout prevents a permanent freeze. Storage occupants use the existing native private-room panels and leave outdoor camera ownership. Outdoor players keep playing; exit restores ownership. Global party travel remains a party cut.
- Studio -> Camera includes dynamic/static dividers, response, pulse strength, reveal/fade timing and reduced motion, alongside the existing zoom, layout, grouping and merge controls. Its draggable 2/3/4-player preview uses the same spatial geometry and merge alignment. Settings remain local to the current profile.

Primary design reference: TT Games' Jonathan Smith and John Hodskinson discuss independent exploration, the shared-camera streaming/FPS tradeoff, and dynamic splitting in [Game Informer's direct developer interview](https://gameinformer.com/b/features/archive/2013/01/14/ready-player-2-traveller-39-s-tales-and-co-op.aspx). The rotating relationship divider is also documented by [GameSpot's contemporary hands-on](https://www.gamespot.com/articles/lego-indiana-jones-2-the-adventure-continues-hands-on/1100-6237257/). The particular pulse vocabulary, spring tuning, storage treatment and bounded local travel veil here are our adaptation of those principles, not a claim that TT published this exact implementation.

## Rendering and streaming changes

- Native woodland floor requests use 800px textures per 1600-world-pixel chunk and pin the visible floors for the union of camera plans. The old full-resolution floors could exceed the worker bitmap cache and repeatedly evict visible chunks, preventing preparation from completing.
- Completed per-prop rasters no longer continually re-request evicted base images. Distant native trees keep their raster and a tiny continuous live sway; static distant runs are composited once. Runs break at every live depth subject and every tree near a subject, preserving ordering and player-dependent opacity. Interactive/falling/burning scenery stays live. Cache eviction never clears canvases still referenced by the current frame.
- The shared grass renderer retains up to four cameras' former per-view buffer capacity (512 chunks / 32768 state slots), with separate raster identities even when their 2D context is shared.
- Normal split cameras draw directly into clipped regions of the main canvas. Cel shading retains separate surfaces for its full-canvas pass. This preserves full output resolution and avoids per-pane composition copies. A lower-resolution probe did not materially improve FPS and was not made a game default.
- During a synchronous actor paint, native animation key lists are indexed once. Pose values, interpolation, IK and live editor changes remain identical; the scope is discarded before the next UI event. No animation sampling rate was reduced.

## Verification so far

- Source Electron: 63 checks passed, muted before load, isolated profile, zero renderer errors. Covers native 2/3/4 views, polygon pointer mapping, diagonal divider rotation, exact final regroup alignment/fade, local teleport snapshot cleanup, actual storage entry/exit and native UI, direct and cel-shaded render paths, static T junctions, editor persistence, small window, UI reservations, real terrain worker and water pixels/animation.
- Focused geometry, relative speed/cut, bounded travel wait, caching/depth ordering and pose equivalence tests pass. The full rebuild and final packaged measurements are recorded below when available.

## FPS method and limits

`scripts/verify-multiplayer-fps.cjs` opens a visible, muted, isolated Electron window at 1440x940. It runs real native railway woodland, four positions roughly 4500 world pixels apart, real simulation updates and small continuous player movement. It tests 2/3/4 players at fixed 0.65 and 0.35 zoom after preparing terrain. FPS is actual requestAnimationFrame delivery with simulation and drawing in the loop, not reciprocal JavaScript draw time. The 60 Hz display reports Windows scaling 1.25; the game canvas is 1426x754 in this window. Blank-window delivery varied roughly 48-60 FPS with machine load.

Intermediate runs exposed an occluded-window 1 Hz sample; it is invalid as gameplay performance. The harness now keeps the test visible on top, disables occlusion/background throttling, and rejects that pattern. It also refuses to label a terrain preparation screen as gameplay FPS. Profiling runs include profiler overhead and are not final performance figures. Do not compare isolated intermediate runs as a controlled percentage speedup.

This is scripted local simulation and renderer testing. Physical controllers, network play, sustained hours of travel, other hardware and external display capture remain unverified. Initial region/asset preparation can still take tens of seconds. Dense four-player forest rendering remains below a guaranteed 60 FPS on this machine; remaining frame-time spikes must be reported honestly with the final measurements.

## Final desktop receipt

- The full desktop rebuild passed all **2,114** regression tests, zero failures. Its wall duration includes machine suspension and is not performance evidence. The final independent-fade adjustment passed **25** focused tests; repackaging syntax checked **934** runtime files and created the shortcut.
- Final packaged Electron passed **68** camera/editor/portal/render checks, zero failures or renderer errors, muted with an isolated profile. The editor was shown in a real native window; desktop and small-window screenshots were visually reviewed. An overly strict two-player storage assertion was corrected to allow normal world-edge clamping while requiring the surviving player to stay in the central half of the view. A test capture wait was also removed; neither was accepted as a successful test until the final run passed.
- The actual packaged executable boot smoke passed (`failed: 0`), lobby ready, no renderer errors, muted isolated test profile.
- Final output: `C:/Users/New User/Desktop/Wildbound/dist/1.2.110-2026-11-23T16-24-46-224Z/Wildbound-win32-x64/Wildbound.exe`.
- Identity: version **1.2.110**, base commit `f0b787ff33c3ac8f3675b48504937ebda4f0dcb5`, `sourceDirty: true`, built `2026-11-23T16:24:55.012Z`, normal build. Includes existing modified source and concurrent TV work; no commit/push made.
- Launcher and shortcut target: `C:/Users/New User/Desktop/Wildbound/Play Wildbound.cmd`. Shortcut: `C:/Users/New User/Desktop/Wildbound Worlds (1.2.110).lnk`, blank arguments, repository working directory, `assets/wildbound-icon.ico`. Launcher `--check` selects the verified output. Normal save profile, no `--preview`; saves and existing games preserved.
- Consolidated receipt: ignored `test-output/multiplayer-fps/delivery-final.json`; full regression log `rebuild-final.log`; final targeted log `fade-final-tests.log`; packaging log `repackage-fade.log`; final camera log `camera-1.2.110-final.log`.

### Final delivered frame measurements

Each row is an eight-second visible, GPU-composited sample on the **final 1.2.110 package**, after 13.25 seconds of terrain preparation. The canvas remained 1426x754; no preparation screen or reciprocal CPU-time estimate was counted. All six rows report the expected view count, `preparing: false`, zero worker errors and zero renderer errors.

| Players | Zoom | Mean FPS | 1% low (1000/p99 interval) | p95 frame ms | Longest frame ms | Frames >50 ms | Frames >100 ms |
|---|---:|---:|---:|---:|---:|---:|---:|
| 2 | 0.65 | 54.6 | 28.3 | 18.2 | 46.1 | 0 | 0 |
| 3 | 0.65 | 54.9 | 31.0 | 18.3 | 45.3 | 0 | 0 |
| 4 | 0.65 | 43.8 | 16.3 | 40.1 | 67.2 | 9 | 0 |
| 2 | 0.35 | 52.8 | 23.3 | 18.6 | 47.3 | 0 | 0 |
| 3 | 0.35 | 44.7 | 15.0 | 45.1 | 71.7 | 8 | 0 |
| 4 | 0.35 | 42.9 | 20.0 | 43.2 | 59.3 | 5 | 0 |

No >100 ms frame occurred in the 48 measured seconds. Two players remained below 50 ms in both samples. Three/four-player scenes still produced occasional 50-72 ms frames; this is **not** a locked-60 or fully stutter-free result. Further reduction of those residual frame-time spikes remains outstanding. Intermediate slower results and profiling overhead are preserved in ignored diagnostics; they are not a controlled percentage comparison with the final sample. Final source/package FPS data: `test-output/multiplayer-fps/final-1.2.110/report.json` and six gameplay screenshots.

