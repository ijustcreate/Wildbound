# Broad performance audit — November 23, 2026

## Changes

- Empty cars retain their completed, native CPU-quantized image (16 entries, 8 MiB maximum). Only appearance inputs invalidate it; continuously changing tyre/effect timers do not. Occupied cars bypass this cache so riders animate normally. Shadows, headlights and water effects still draw separately.
- Tree wood uses a bounded value cache (512 entries, 36 MiB maximum native pixel buffers for trunk/branch canvases, before browser overhead). Temporary wrapper objects reuse existing art, and branch-spread edits invalidate it. Six cloned tree variants produced 246 cache hits and six misses in verification.
- Forest water updates visible tiles once per 30 Hz sample across the current cameras. Bank painting is lazy per tile; newly revealed views and animation remain correct. Native tile gutters, palette and drawing order are retained.
- Realm animals share a fresh 64-unit spatial index of scenery footprints per simulation step. This replaces repeated full scenery scans and preserves strict collision edges, harvested props, editor movement and oversized-shape handling. Realm asset lookups also avoid temporary arrays.
- A train Path2D masking prototype and a GPU car quantizer were rejected after visual checks. The shipped train masking files match the pre-audit native implementation. The shipped car keeps its original CPU palette algorithm.

## Measurements

Unprofiled, sequential isolated Electron processes, 1426 × 754 backing canvas, scripted native scenes. Each used 60 fixed simulation warmup steps and 60 measured steps. These are CPU update/draw submission costs, **not gameplay FPS**. Runtime controls and rigs were frozen; assets used the same shared asset location. Unrelated local Node tests were running, so these samples are directional rather than clean-room hardware benchmarks.

| Scene | Draw CPU before → after | Update CPU before → after |
| --- | --- | --- |
| forest-close | 28.66 → 24.41 ms | 2.84 → 2.81 ms |
| forest-rain | 57.69 → 37.87 ms | 3.48 → 3.24 ms |
| house-combat | 156.51 → 90.60 ms | 28.08 → 27.59 ms |
| shadow | 35.78 → 34.42 ms | 11.03 → 4.23 ms |
| caverns | 12.05 → 12.90 ms | 2.88 → 1.77 ms |
| railway-split | 39.99 → 36.33 ms | 2.63 → 2.55 ms |
| tv-arena | 15.04 → 16.03 ms | 0.29 → 0.30 ms |

Rain drawing fell 34%, the crowded-house drawing stress case 42%, and Shadow simulation 62% in these samples. Cavern and TV drawing samples were approximately 7% slower; no improvement in every condition is claimed. The train-interior prototype measurement is excluded because that optimization was removed. Earlier profiler-on and simultaneous A/B runs are diagnostic only and excluded from delivered performance claims.

The visible, focused, muted 2/3/4-player FPS harness was attempted, but Windows delivered approximately 1 Hz. It rejected the first sample rather than misreporting desktop throttling as gameplay performance. Current gameplay FPS, frame pacing and hardware-controller testing remain unverified. Prior version 1.2.110 FPS results must not be reused for this build. Crowded articulated actors and dynamic shadow/fog composition remain worthwhile profiling targets on an unthrottled desktop.

Receipts: `test-output/performance-audit/comparison.json`, `final-control/report.json`, `final-candidate/report.json`; FPS rejection: `test-output/multiplayer-fps/performance-audit-final/failure.json`.

## Verification and desktop receipt

270 selected Node regression tests passed (forest, cars, realms, collision, scenery, cameras and trains). 497 source Electron pixel/cache checks passed, including 280 train masks at five car types/eight headings/seven rider states with repeated warm drawing, 144 water tile checks, car appearance transitions, idle effect timers and occupied-car redraw. Cached-car comparisons allow one channel value of canvas compositing rounding; other pixel comparisons are exact. All automated Electron windows are muted before load and use isolated profiles; normal saves and sound preferences are preserved.

Desktop output: `dist/1.2.113-2026-11-23T21-27-36-399Z/Wildbound-win32-x64`, built `2026-11-23T21:28:21.622Z`, version **1.2.113**, normal profile (`preview=false`). Package syntax check covered **997 runtime files**. Actual packaged EXE boot smoke passed: ready lobby, Worlds entry, muted test mode and zero renderer errors. All **497 packaged pixel/cache checks** passed with zero renderer errors. All eight optimized runtime files match the package by SHA256.

Pinned shortcut: `C:/Users/New User/Desktop/Wildbound - Performance (1.2.113).lnk`. Target: `C:/Users/New User/Desktop/Wildbound/Play Wildbound.cmd`; arguments: `-BuildDirectory "dist\1.2.113-2026-11-23T21-27-36-399Z\Wildbound-win32-x64"`. Pinned launcher identity check passed. The standard `Wildbound Worlds (1.2.113).lnk` was also rebuilt. Normal save profile is used for play; all automated checks used isolated profiles. Receipt: `test-output/performance-audit/desktop-receipt.json`.

The package records commit `34393ae3d2983b6a0022ec614d94c6c95cadffdf` with **sourceDirty=true**. A concurrent integration task advanced HEAD while this audit was underway; the commit alone does not identify this modified snapshot. The eight owned runtime hashes identify the delivered optimization files. Other ongoing edits were preserved; whole-checkout equality is not claimed.

This performance task did not commit or push. Working branch: `Wildbound_worlds`. The audit began at `f0b787ff33c3ac8f3675b48504937ebda4f0dcb5`; the delivered modified package records the concurrent integration revision above. Local saves, authored assets, drafts and saved sound settings were preserved.
