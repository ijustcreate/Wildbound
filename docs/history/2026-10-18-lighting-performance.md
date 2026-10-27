# Lightweight local-light rendering (published in combined 1.2.36)

Publication update: included in the verified combined 1.2.36 package. See
[combined release](2026-10-18-combined-1.2.36.md) for final identity and checks.
The pending-build discussion below records the earlier coordination stage.

Real checkout: Desktop/Wildbound Server Branch Build, Wildbound_worlds,
modified source on 1bd5ef027966. Version stays 1.2.35. Retains hood lining,
rear-neck cloth, front-only TV interaction/proportions, and map selection/input
release fixes from this chat. Concurrent environment work is preserved.

Cause: moving lights invalidated every prop's CPU pixel scan/raycast pass;
foliage recapture read RGBA back from canvas, and character rims scanned every
sprite pixel. Dynamic actor revisions also invalidated unrelated static lights.

Replacement:
- Zero sprite getImageData/putImageData in prop and character light passes.
  Cached original canvases, alpha-only compositing and shifted inner-rim masks.
- Maximum 48 height/occlusion samples per source/prop, two strongest nearby
  sources; smooth interpolated irradiance, not blurred sprite silhouettes.
- Six prop refreshes / 2ms soft CPU-submission budget, FIFO fairness and stale
  offscreen-work expiry; cold props remain visible while waiting. Foliage
  snapshots update incrementally instead of synchronously reallocating sprites.
- 8px light-position / 4px height bins, quantized intensity, static geometry
  revision separate from actor motion, periodic refresh for moving occluders.
- Ground textures reuse backing stores and invalidate only for nearby moving
  actors. Byte-bounded LRU (8 MiB ground / 24 MiB prop), no small-light thrash.
- Original 3-D blockers and gameplay visibility retained: trunks vs raised
  canopy, bushes/rocks, doors, broken wall sections, source-facing rims.
  Concurrent realmAsset classification remains intact.

Comparable muted isolated Electron software-renderer benchmark:
scripts/benchmark-point-lighting.cjs, 28 props / 72 moving-light frames, same
script against verified old package 1.2.35-2026-10-18T18-36-05-118Z and source.
test-output/lighting-perf/baseline-final-control.json vs optimized-final.json:

                         old           new
Typical moving light     41.1ms        4.5ms (about 9.1x cheaper)
95th percentile          73.4ms        9.5ms
Mean moving light        43.45ms       7.94ms
Character rim median     0.8ms         0.4ms
Sprite readbacks         277           0

These are controlled lighting-pass CPU/software measurements, NOT hardware FPS.
Other active work/tests introduce timing noise; optimized maximum had a 117ms
outlier. Real dense forest render's warmed prop-light pass measured 2.8–4.2ms
vs earlier 31.9–224.2ms; total software frame remains dominated by other scene
rendering (250ms-range baseline), so do not claim overall 9x FPS.

Checks: final focused suite 52/52 passes (lighting + budget/FIFO/no-readback,
hood and lobby/TV/menu regressions); isolated Electron directional rim/alpha
preservation and all ten environment passes pass, zero renderer errors;
jump-lighting 48 cases pass (no doubled ambient, carried-light height 190).
Ten-environment QA is recorded in test-output/world-lighting.

Build status: earlier hood/menu rebuild encountered concurrent realm import
changes. A second full rebuild started while environment expectations were
still changing; it was stopped as a redundant outdated test run (only this
chat's own process tree). No new package/shortcut has been published by this
lighting pass. Another active chat, Add swamp and cave environments, is running
the combined project suite. User confirmed parallel work. Do not overwrite or
roll back that work; run fresh combined verification before normal packaging.
No personal saves/drafts/authored rigs changed; no commit or push requested.
