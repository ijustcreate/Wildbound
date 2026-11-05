# 1.2.101 — co-op camera streaming and train furniture depth

## Reported problems
Two players far apart, with the train moving, need smooth wide-camera rendering. The train table drew behind the overlapping seat cushions in a horizontal view. A supplied travel clip showed large rectangular patches of ground/grass arriving on screen.

## Changes
- Fixed the queued-job priority bug: a look-ahead request is promoted when it becomes visible. Stale view work expires. The planner follows camera motion and zoom, prepares ground/water/scenery outside the visible area and prepares detailed ground before zooming back in.
- Retains a bounded whole-world ground layer, with the same native meadow palette/clearance, rather than showing a flat minimap placeholder between detailed tiles. Detail changes blend across the view after a complete visible layer is ready.
- Ground preparation includes native meadow cover and basic grass geometry in one packet. An existing valid GPU grass mesh remains visible while refined patch data loads. Wind updates keep the last ready pose rather than resetting to a static pose between updates. Mutable harvested scenery is never replaced by worker snapshots.
- Removed per-frame GPU surface reallocations during tiny camera zoom changes. Grass uses one fixed backing surface and cropped, bucketed raster dimensions. This preserves the native world-pixel sampling and live wind/wake behavior.
- A worker-built 16-pixel rail-distance field matches the existing route-segment clearance. It avoids repeatedly searching the whole track while painting terrain. Macro meadow preparation reuses this field. Node checks compare clearance against the real track at sampled cells and all used margins.
- Sunlight prepares one image-data tile instead of thousands of fill operations, with the same RGBA ramps. Its bounded cache accommodates large co-op views. Distant scenery queries reuse stable spatial results; native tree species and autumn accents remain distinct.
- Tables, chair bases/cushions/backs and interior wall pieces now use physical separating-axis depth constraints. The raised tabletop correctly covers an overlapping lower chair edge. Near/far walls retain their order. Custom painted parts are preserved. The visibility-signature pass only evaluates relevant walls/doors rather than sorting all furniture geometry.
- Includes the completed local 1.2.100 TV arena clearance/camera work; its source and existing verification note are preserved. No personal profiles, shared rig artwork, house drafts or saves are replaced. Temporary output/tmp folders are excluded from publication.

## Verification
- Baseline moving two-player benchmark at 1780x1000 reproduced wide/transition spikes. After the GPU-buffer and scheduling correction, steady wide moving scenes measured approximately 8–10 ms mean CPU update/draw and 12–16 ms p95 in representative runs. These are scripted CPU timings, not a hardware FPS guarantee.
- The regression driver covers nearby riders, camera zoom-out, 7,000–9,000+ pixel party separation, the opposite side of the world, zoom-in, and two longer 9,180-pixel travel segments. Scene generation remains on the worker. Both players use real simulation updates while the train moves.
- Focused train/furniture/streaming/grass regressions pass. Native eight-heading review passes 18 checks and captures 54 scenes without renderer errors. The horizontal tabletop sample changes from chair/outline pixels to the correct wooden tabletop. All eight assembled views were inspected.
- Full rebuild, packaged test, content identity, web and live-publication results are recorded in ignored test-output/coop-streaming-1.2.101-delivery.json after verification. Automated Electron windows are muted before loading and use isolated profiles.

## Delivery identity and limits
Builds identify the clean source commit containing this note. Use the normal-profile Play Wildbound.cmd launcher; the desktop shortcut targets that script with blank arguments. Desktop packaging, source push and live Pages publication are distinct checked steps. Original/older web releases remain preserved. Physical-controller feel, exhaustive online replication and machine-specific FPS are not claimed.
