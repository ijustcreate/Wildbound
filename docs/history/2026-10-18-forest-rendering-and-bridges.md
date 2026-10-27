# Forest rendering, crossings, and board shadows — GPU grass and desktop verification

Actual checkout: `C:/Users/New User/Desktop/Wildbound Server Branch Build`, branch `Wildbound_worlds`, modified source on `1bd5ef027966e371f21cd0956b96b0aa4a62144b`. The similarly named checkout under COdex SHell is not the running 1.2.36 source and was not edited. Existing unrelated changes, rigs, personal saves, and running games were preserved. No commit/push.

## Changes

- Forest grass uses WebGL2 instanced blade geometry: a continuous dense short field and taller cuttable patches, with coherent wind and actor bending in the vertex shader. Patch cut/burn/tint states use a tiny data texture and do not rebuild blade geometry. The field respects water, paths, the starting clearing and landmark paving. Native fallback remains available without WebGL. Depth-sort wrappers retain the original prop for drawing, preventing per-frame WeakMap cache misses.
- Tree trunks and branches cache independently of animated foliage and falling-tree transforms.
- Sun shadows retain a static height field and recompute only receivers within moving actors' bounded ray reach. Samples still use the combined field, so overlaps are not darkened twice. Jump, radius, and authored-map edits invalidate cached results. Unchanged height maps no longer decode/re-encode for validation every frame.
- Bridge rows meet without five-pixel gaps; exposed edges have fascia, end ramps, and restrained plank details. Existing and new forest worlds connect shallow bank tiles. Raised bridges no longer flood their dry landings during monsoons.
- Board table uses a rectangular sunlight caster and raised box volume in local-light occlusion; removed the oval blob. Dynamic-shadows-off/opening-stage fallback is rectangular too.
- Pixel lily pads replace canvas arcs/ellipses. Ferns draw at their actual pixel resolution. The user explicitly accepted the fern and lily pad, then clarified that grass must be a dense, smoothly reactive shader field rather than sprites. The earlier grass sprite studies were rejected and are not the active forest grass path.

## Verification

- Final focused suite: 54 passed; latest art/caching checks: 12 passed. New tests cover old bridge landing support, monsoon landings, pixel-raster reuse and edit/cut invalidation, directional board light geometry, and exact incremental-versus-full shadow masks across 45 heading/jump/position combinations.
- Muted isolated Electron rendered forest overview, clearing, river, grove, gameplay, and small viewport without captured renderer errors. Native vegetation review: `test-output/forest-landscape/vegetation-review.png`.
- Full serial suite completed: 1,441 passed, zero failures (525.45 seconds). Final shader/forest/interaction focused suite adds 18 passing checks, including two new grass-field tests. The full suite started before the new shader tests were created; it is not a claim that all shader behavior was covered by that run.
- Comparable software-renderer moving-player mean: published 1.2.36 **209.69 ms**, optimized **102.93 ms**; p95 **278.40 → 155.80 ms**. The first 10 of 45 frames were excluded. This is a profiled controlled CPU/software comparison, NOT a hardware FPS claim. GPU-enabled source run: mean 69.18 ms / p95 95.90 ms. No 60 FPS guarantee.
- Subsequent stable-prop cache fix was measured under full-suite contention: timings are noisy, recorded separately; don't compare that run as a controlled improvement. Detailed outputs and captured measurements are in `test-output/forest-landscape/measurement-summary.json` and `cached-results.json`.
- Repro scripts: `scripts/verify-forest-performance.cjs` (WILDBOUND_VERIFY_APP and WILDBOUND_PERF_LABEL supported), `scripts/preview-forest-fixes.cjs`. Always pass --mute-audio; scripts also mute before load.

## Delivery status

Version 1.2.37 is packaged and delivered via the refreshed desktop shortcut `Wildbound Worlds (1.2.37).lnk` → `Play Wildbound.cmd`, normal save profile. Package: `dist/1.2.37-2026-10-18T21-51-17-445Z/Wildbound-win32-x64/Wildbound.exe`. Muted packaged boot smoke passed with lobby ready, correct version, and zero errors. All 405 application runtime files (10,319,324 bytes) match source exactly. `Play Wildbound.cmd --check` confirms build identity and warns that modified source was included. No running application was terminated and no saves were changed. A GPU-enabled packaged renderer comparison measured mean 16.66 ms / p95 23.00 ms per moving-player frame versus 167.86 / 233.30 ms on 1.2.36; profiler enabled, first 10 of 45 frames discarded. This is renderer execution time, not a VSYNC FPS guarantee.

## Shader validation and final frame comparison

- Muted isolated Electron: 241,680 procedural blades in the dense fixture; wind and actor positions change the rendered geometry; normal sword cutting removes a tall patch; no instance-geometry uploads on cut; zero GL errors and zero captured renderer errors. Native animated demonstration: `test-output/forest-landscape/shader-grass-review.webm`. This is geometry rendered by a shader, not a blade or clump sprite atlas.
- Comparable GPU-enabled full-forest workload (same script, dimensions, 101 trees, moving player, first 10 of 45 frames discarded, profiler enabled): published 1.2.36 mean **167.86 ms** / p95 **233.30 ms**; shader source mean **18.67 ms** / p95 **26.80 ms**. Logs/JSON: `baseline-gpu-results.json` and `shader-final-results.json` under the forest output directory. These are measured renderer execution times, not a VSYNC FPS guarantee.
