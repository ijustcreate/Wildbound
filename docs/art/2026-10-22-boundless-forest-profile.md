# Boundless forest: pixel direction and performance assessment

Superseded implementation: [1.2.55 native locomotion and pixel forest](../history/2026-10-22-forest-and-native-locomotion-1.2.55.md) ships the revised meadow and measured optimization. The original exploratory assessment below remains for provenance.

## Scope and reference

The user's current forest screenshot and green meadow reference guide this study. Borrow the reference's broad irregular green masses, small palette, stepped edges and sparse grouped tufts. Preserve Wildbound's world lighting, readable paths, grass cutting and actor response. This is an assessment and isolated style experiment, not a shipped replacement.

Correct checkout: Desktop/Wildbound Server Branch Build, Wildbound_worlds, modified source on 1bd5ef027966, version 1.2.54. No production renderers, authored rigs or player data changed for this assessment.

## Measurements

Muted isolated Electron, Intel Iris Xe / ANGLE Direct3D11, 1.25 DPR, 1800x1125 backing surface, 1440x900 CSS canvas, camera zoom 1.05. Seed 42, Boundless forest, one explorer, eight loaded neighbor regions. Origin (810,890) and streamed region (2400,800). Roughly 2,100 loaded scenery props.

`scripts/profile-boundless-forest.cjs` captures Chrome CPU profiles, per-render timings, floor/grass/actor instrumentation, streaming timings and paired images. Ten warmup draws precede each sample window; first runs use 40 measured draws, later runs use 25. Initial rAF run is retained as raf-report.json; subsequent timer-yield runs are report.json. Scheduler intervals are not a measurement of game FPS. The timer-query extension is available, but GPU elapsed time was not collected. CPU submission timings cannot establish GPU utilization.

Across the initial two diagnostic passes:

| Location / control | Mean render CPU time |
| --- | --- |
| Origin, current renderer | 47.8–50.5 ms |
| Origin, shader grass off (Canvas fallback still present) | 29.9–40.0 ms |
| Origin, dynamic shadows off | 19.5–23.7 ms |
| Origin, both controls off | 16.6–17.4 ms |
| Streamed region, current renderer | 25.7–31.1 ms |
| Streamed region, both controls off | 15.3–17.7 ms |

These are diagnostic comparisons, not additive savings or promised frame rates. Order, caches, driver work and contention affect them: warmed baseline draws in the later style run were 22.1–24.4 ms at the origin and 27.1–28.3 ms outside. This variance is why a single favorable timing is insufficient for acceptance.

The current shader submits 306,292 blade instances at the origin and 298,360 outside. Every blade has 18 vertices and the draw is submitted twice, including the front-occlusion pass: around 11 million submitted vertices per rendered frame at the origin. Visibility rejection happens inside the vertex shader, after submission. Initial geometry generation costs about 547 ms of sampled CPU self time over the profiled run; it is not a per-frame average. Streaming update maxima across runs were 16.7–26.4 ms. The measured update calls include both chunk creation and already-loaded no-op calls.

CPU sampling also identifies Canvas fillRect/drawImage work, repeated sceneryNeedsDepthSort calls, paving painting and propLightGeometry classification. Both scenery render loops classify props before checking visibility. Shadow caster construction and grass signatures scan the full loaded scenery. Grass builds a full terrain string plus patch strings each back pass. These are concrete targets beyond reducing blade count.

## Draft result

The isolated draft replaces much short-blade coverage with cached broad color patches on a 4-world-unit grid, three/four grouped greens and sparse, wider stepped tufts. Grass raster resolution is halved relative to CSS pixels with nearest-neighbor compositing. The draft uses approximately 51,716 instances at the origin and 49,516 outside: an 83% reduction.

Latest paired timings: origin draft 23.0 ms versus baseline 22.1/24.4 ms; outside draft 33.5 ms versus baseline 27.1/28.3 ms. **No consistent total-render improvement is demonstrated.** A simpler initial sparse-blade draft did improve one outside run, but did not yet have the broad ground patches required by the reference. Do not cite that abandoned draft as the final study's performance result.

Visual review: the broad masses and quieter ground move toward the reference. Remaining defects are regularly spaced isolated dark tuft dots, abrupt route/terrain cutoffs and unchanged tiered tree silhouettes. The prototype ground cache only covers the central region; streamed region support and bounded cache invalidation are deliberately not implemented in the experiment. This draft is not ready to ship.

Preview: `test-output/boundless-forest-profile/grass-comparison.png`. Top is current; bottom is the draft at the same crop and scale. The full experimental scene's weather label was invalid because the harness used an incomplete weather object; the harness now uses no weather. This UI artifact is excluded from the comparison crop and is not a diagnosed game bug.

## Recommended implementation order

1. **Cull before classifying.** Test visibility before sceneryNeedsDepthSort, and obtain visible props/casters from a spatial grid. Keep tall canopy/shadow bounds large enough to prevent popping. Static classification should be cached against actual asset/property revisions.
2. **Separate static and moving lighting.** Cache static caster geometry per streamed region, update it on destruction/harvest/edit, and update only nearby moving actors per frame. Keep height-aware occlusion and the day/night response; avoid changing the saved quality setting to hide the cost.
3. **Use region grass batches.** Generate/upload buffers once per region; submit visible batches only. Keep geometry revisions separate from small cut/tint-state texture updates. Base cover must use the appropriate region plan, including negative coordinates: current continuous short-grass generation loops only over 0..1600.
4. **Build a cached pixel meadow.** Store broad green patch silhouettes as bounded small region textures, with a world-anchored pixel grid and nearest-neighbor sampling. Break edges with grouped teeth, not one random fleck per cell. Avoid simply posterizing the entire screen or lowering character/UI resolution.
5. **Animate selected tufts, not the carpet.** Use irregular groups of 3–5 broad blades, a small shared palette and grouped wind waves. Keep nearby bend/cut feedback and front occlusion; reduce distant coverage deterministically rather than randomly flickering between frames.
6. **Remove per-frame signatures over static data.** Replace terrain joins and scenery maps with explicit geometry/state revisions, including editor mutations, region unloads and save restoration. Bound all region texture/buffer caches.
7. **Budget streaming by elapsed time.** The current one-region-per-frame limit still permits 20+ ms spikes. Split generation/geometry work into smaller tasks, prefetch ahead of travel and schedule GPU uploads under a measured budget, preserving harvested edits.
8. **Resolve the surrounding artwork.** Break tree canopy cone bands into broad asymmetrical stepped foliage masses; soften grass/path boundaries with intentional clusters; preserve the bright route and dark tree framing. Small flowers and tufts should carry detail, while large surfaces stay quiet.

Acceptance should use repeated alternating baseline/candidate runs with longer warmup, a reproducible moving explorer crossing positive and negative region seams, active animals and combat, and explicit GPU timing. Compare native-size images, wind/actor response, cut/burn persistence, lighting, cache growth and input responsiveness. Target under 16.7 ms total frame budget for 60 Hz; CPU render time alone does not prove this target.

## Other work completed during this review

The prior join/nameplate fix is packaged separately in dist/1.2.54-2026-10-22T20-54-20-063Z. All 1,505 unit tests, 402 runtime syntax checks, 1,025 package-content checks, actual packaged boot, and 25 packaged Electron input/selection checks passed. The Desktop Wildbound Worlds (1.2.54) shortcut targets Play Wildbound.cmd with the normal save profile. No art study from this assessment is included in that package.
