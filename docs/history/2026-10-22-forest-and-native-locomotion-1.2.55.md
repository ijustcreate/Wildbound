# Wildbound 1.2.55 — pixel meadow, Boundless forest and native locomotion

Correct checkout: `Desktop/Wildbound Server Branch Build`, `Wildbound_worlds`, modified source on `1bd5ef027966e371f21cd0956b96b0aa4a62144b`. The old COdex SHell 1.2.35 checkout is not involved. No commit/push, authored-rig overwrite, profile migration or save deletion.

## Forest implementation

- `pixel-meadow.mjs` paints cached world-anchored green masses with four broad colors and stepped edges, masked against terrain, paths, clearing and mosaic stones. Positive and negative streamed regions use their own terrain/route plan.
- `grass-field.mjs` replaces full-world blade submission with 256-unit visible batches, sparse three-blade accents and wider cuttable tall patches. Local geometry signatures exclude cut/tint state; small texture updates preserve cut/burn feedback without geometry uploads. Resident batches are capped at 128, with overview cameras using the existing prop fallback. Patch slots are bounded at 8,192 and reset safely.
- Grass raster buffers stay anchored to a world pixel grid and camera blocks. Ambient vegetation updates at 20 Hz; nearby actor movement and cutting invalidate it immediately. Front grass is skipped when no tall patch overlaps an actor. Characters and input retain the game's normal simulation/render clock.
- Paving is cached in bounded 32px tiles; signed-coordinate neighboring grass edges are correct. Scenery is spatially culled before classification. Static prop caster geometry and local-light geometry are reused until their primitive state changes.
- Static sun-shadow masks rebuild incrementally in the forest, keeping the preceding complete mask until the next is ready. Darkness changes composite opacity instead of rebuilding the field. Forest actors use soft swept silhouettes unioned with the static mask; exact height-field actor rendering remains the default for authoring and other environments. Per-foot contact shadows anchor the explorer. Reused shadow canvases/pixel buffers reduce allocation pressure.
- Forest region terrain rows and prop rows are generated as small resumable tasks, with a two-millisecond scheduling budget. Partial regions are never published. Support/depth queries use nearby scenery; stationary leaf physics and repeated fern conversion skip unnecessary work.
- Tree crowns use stepped interlocking masses and asymmetric pine clusters. World rendering retains two samples per logical pixel, sufficient for existing half-pixel character art, while removing extra OS-DPI supersampling. DOM UI, inventory, creator and lobby rendering retain their own resolution.

## Thirteen animation findings addressed

| QA finding | Implemented response |
| --- | --- |
| 1. Forward-heavy idle | New idle keys align the head and pelvis above the support stance. |
| 2. Compressed neck | Lower shoulders, quiet skull and small chest-led breathing preserve collar clearance. |
| 3. Floating run contact | Explicit stance/swing phases keep intended planted ankles at their rest height after IK. |
| 4. Foot skating | Distance-driven native strides replace the inherited 88px cycle; stance motion is linear through contact. |
| 5. Pedalling knees | Late recovery lift, extended trailing foot and a lower returning arc. |
| 6. Rigid torso | Small opposed hip/shoulder rotation, restrained head motion and contact compression. |
| 7. Punch-like free arm | Elbows remain beside the ribs and wrists swing below the chest. |
| 8. Sword across face | A low outward carry below the jaw, retaining blade reach, existing hand pivots and custom wearable overrides. Combat remains separate. |
| 9. Snapping start/stop | Render-only 110ms transitions preserve the previous gait frame and settle into the editable idle; input is immediate. |
| 10. Snapping turns | Shortest-arc continuous body turns with a faster head response; direction changes do not reset distance phase. |
| 11. Rigid cape paddle | Pinned collar and reduced, delayed traveling middle/hem folds. |
| 12. Excessive cape flare | Bounded velocity drive, reduced lateral lift and damped stop response. |
| 13. Floating/hard shadow | Soft forest actor silhouettes plus contact shadows beneath the same presented foot pose used by the animator. Grounded boot-angle keys keep soles flat. |

`native-locomotion.mjs` generates ordinary editable delta and foot-angle keys on the current Captain-derived native rig. Migration requires matching rest geometry and exact recognized shipping clips. Edited clips, custom rest geometry, facial art, all eight wearable views and other actions are preserved. Original migrated clips remain in `locomotionSource`; migration is idempotent. `authored/rigs.json` stays byte-identical to the pre-task file (SHA256 `dc05411b47f02259be95ea0ed22aea375d76f79b55d7f0bdec57da5df7ed7d71`).

## Verification and delivery

Focused checks cover planted ankle height, sole angle in all eight views, finite/fixed-length articulated poses, exact migration preservation, same-time render history, shadow union/no trails, complete incremental generation and signed meadow masking. Existing height-field equivalence tests remain intact. Electron review records complete walk/run strips, six action families, native/enlarged assembled views and an actual Animator start/turn/stop recording.

Performance harness: `scripts/verify-forest-motion-release.cjs`. It stops its unrelated lobby loop, then runs only its isolated expedition, using real Game updates, movement, negative/positive regions, a 27-animal stampede, seam travel, grass cutting and session round trips. GPU batch timers are sampled rather than timing every draw. Profiles, captures and JSON reports are under `test-output/forest-motion-release/`. Earlier exploratory reports with a background lobby loop are not final benchmark evidence.

Final benchmark, full build, package identity and executable verification are recorded below.

### Source benchmark and regression review

The matched baseline is the verified 1.2.54 package at `dist/1.2.54-2026-10-22T20-54-20-063Z`. Source measurements before packaging (Intel Iris Xe, 1.25 OS DPR) gave total CPU update+render means of 17.9 ms for positive-region roaming, 14.6 ms for negative-region roaming and 26.2 ms for the 27-animal stampede, versus 30.3, 35.5 and 46.6 ms in the baseline. These are measured scenarios, not a promise of 60 FPS in every encounter. The quiet clearing still includes first-use static-shadow work. The final package is checked separately below.

Only 1,792–2,037 grass instances are resident in these visible roaming views, versus roughly 300,000 submitted by the previous field. Sampled individual grass GPU batches are well below 0.02 ms after warmup, versus roughly 5 ms for an old full-field draw. A batch timing is not total GPU frame time. The world backing surface is now 1440x900 rather than 1800x1125 at this OS scale; the logical viewport and half-pixel source art are unchanged, with nearest-neighbor display.

The cape regression now requires a small but visible walk/run lift difference and bounded sideways displacement rather than the rejected large flare. The local-world clearing test waits for an actually completed incremental region load both before clearing and after restoration; it still asserts that deleted scenery does not return. An unrelated pre-existing winter/house lion routing test used a random world seed and failed once while passing other full runs and a focused retry. That fixture now uses seed 42; navigation/AI behavior was not modified.

The actual animation recording is captured in an unthrottled isolated Electron window with its unrelated lobby loop stopped. `test-output/native-locomotion/motion-filmstrip.png` shows the start, reversal and stop extracted from that recording. The first hidden-window recording was throttled and was replaced; it is not FPS evidence.

### Final desktop delivery

Final package: `dist/1.2.55-2026-10-22T22-20-14-817Z/Wildbound-win32-x64/Wildbound.exe`, built at 2026-10-22T22:20:23.558Z, normal profile, modified source at commit `1bd5ef027966e371f21cd0956b96b0aa4a62144b`. `Play Wildbound.cmd --check` and the Desktop `Wildbound Worlds (1.2.55).lnk` select this exact package. All 1,028 runtime content checks match source. Its actual muted executable boot reports version 1.2.55, ready lobby, Worlds enabled and zero failures/errors. No commit or push.

The complete rebuild passed 1,512 tests and syntax-checked 405 runtime files (`test-output/forest-motion-1.2.55-verified-build.log`). A final allocation-only follow-up reuses shadow scratch arrays and constant soft-shadow taps; all 23 focused lighting/shadow tests passed (`test-output/shadow-allocation-regression.log`) before repackaging. The immediately preceding 1.2.55 package also passed assembled art checks (19 hairstyles, eight views, six poses, editable Studio capture), shader cutting with zero geometry uploads/errors, five native locomotion checks and 25 simulated controller/selection checks. Physical controllers were not tested. The final package repeats real forest rendering, cutting, streaming, session round trip and boot checks with zero renderer errors.

Matched Intel Iris Xe profiles (`baseline-final/report.json` and `packaged-final/report.json` under `test-output/forest-motion-release/`) measure CPU update plus render cost; these are not complete GPU frame timings:

| Scenario | Previous mean ms | Final mean ms | Reduction |
| --- | ---: | ---: | ---: |
| Clearing | 44.90 | 25.38 | 43% |
| Positive-region roaming | 54.00 | 27.11 | 50% |
| Negative-region roaming | 51.03 | 26.64 | 48% |
| 27-animal stampede | 78.31 | 38.49 | 51% |
| Moving-camera cold seam with stampede | 134.92 | 55.04 | 59% |

The final seam p95 is 92.4 ms and maximum 258.6 ms (baseline maximum 948.8 ms). Stampede p95 is 64.1 ms. This materially reduces work and stutter but does not establish locked 60 FPS or eliminate cold-region hitches. Warm grass batches contain 1,792–2,037 instances; cuts perform zero geometry uploads. The world backing-size change described above contributes to the gain. Final captures are `packaged-final/clearing.png`, `outer-roam.png`, `negative-roam.png` and `stampede.png`; they were visually inspected alongside the native animation filmstrip.
