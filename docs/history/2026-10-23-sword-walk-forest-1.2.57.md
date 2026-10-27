# Wildbound 1.2.57 — native sword feel, walk and forest lighting

Correct checkout: `Desktop/Wildbound Server Branch Build`, branch `Wildbound_worlds`, modified source on `1bd5ef027966e371f21cd0956b96b0aa4a62144b`. No commit/push. The current native rig is retained; the old character-viewer checkout is not used. `authored/rigs.json` remains unchanged, SHA256 `dc05411b47f02259be95ea0ed22aea375d76f79b55d7f0bdec57da5df7ed7d71`.

## Combat and movement

The user's [Dribbble clip](https://cdn.dribbble.com/userupload/5847687/file/original-4dde0b49b72fa57db742dbf6ac561956.mp4) supplies the timing, short sword step, crescent, contact response and warm/cool light direction. No donor artwork, model or animation was copied. The implementation uses ordinary editable keys on the current Captain-derived native player.

`src/sword-feel.mjs` authors load/cut/follow-through/recovery keys only for recognized shipping sword clips. The exact older generation-4 shipping version with its previous IK poles is recognized separately; arbitrary edited clips remain intact. Source clips are retained in migration metadata. Custom rest geometry, wearable fitting and authored files are preserved. The fitted weapon vector and tapered pixel crescent share the same trajectory in eight directions. Left-hand and dual-sword return cuts use the corresponding hand.

Ordinary default light sword attacks last 0.30 seconds, default finishers 0.46 seconds. Contact occurs at 30%/38% of the respective action, with collision-resolved 7/10-unit steps distributed through the cut. Explicit custom durations remain. One attack resolves damage once, using the existing body/window/structure/grass predicates at the contact position. The existing single buffered next attack remains. Whiffs have no contact flash or impact hold. Hits add a small local star, existing directional knockback and a 35 ms attacker/55 ms target hold; the co-op simulation never freezes globally. Dash, menus, sleep/stun and changed equipment cancel pending contact. Improvised sticks retain their prior attack behavior. Room combat continues through its existing room-specific pipeline.

Walk revision 2 lowers foot lift, flattens the soles, restores a rise over the support foot and reduces the previous crouched shuffle. Distance-driven cycle lengths are 28 world units walking and 56 running; ordinary analog walking uses 72% of the previous walking speed, with run/dash speeds preserved. Start/stop blends and staggered body/head turning remain. Existing custom clips are preserved. The actual Animator review records start/walk/run/turn/stop, plus full eight-direction walk/run sheets.

R/right shoulder is dash in lobby and expedition; L/left shoulder holds and aims ranged weapons. The previously reversed saved shoulder pair migrates while retaining unrelated face mappings. Left menu remains inventory and right menu Pause. Automated Xbox/Switch routing and actual lobby movement are checked; physical hardware playtesting is not claimed.

## Lighting, branches and performance

Forest ground receives cached world-anchored broad warm light pools, with cooler green shade and restrained source-facing warmth on characters. The tiles keep the pixel grid and need no bloom pass. Shared day/night/weather behavior and finite-height carried-light occlusion remain.

The user's apparent branch-shadow bars were a tree drawing defect: `(x1,y1,x2,y2)` branch segments were being read as a height plus unrelated offsets, drawing right-side branches below the root plane. The five cemetery/woodland silhouettes now attach the correct rising segments, with tapered tips and angled joins. A regression checks branch ink stays above the root plane.

Optimization retains short grass, tall grass, cut stubble, recovered trails and shared wind. Static shadow geometry revisions now survive reconstruction of identical scenery arrays, avoiding repeated height-field rebuilds. Shadow caching no longer serializes all three encoded height planes on each moving frame. Moving soft shadows reuse bounded swept-footprint kernels, and the shared mask still uses maximum opacity rather than double-darkening overlaps. Pixel upload uses one packed write per texel. Meadow terrain-key scans share region plans. Grass density and viewport coverage are unchanged from 1.2.56. An experimental wider grass-chunk query increased offscreen work and regressed the packaged comparison; it was removed before the final release.

The initial paired source comparison improved means in all four scenarios while retaining grass counts. The subsequent wider-query experiment regressed those results and was rejected. After restoring the original query, the source run measured means of 10.51/10.52/10.60/11.91 ms (clearing/outer roaming/negative roaming/27-animal stampede), with the original 7,516/15,564/11,835/7,516 grass counts. Cold seam maximum remained 131.3 ms in that source run. The exact final packaged comparison is recorded below after packaging; earlier candidate reports must not be presented as final build measurements. Measurements use Intel Iris Xe/D3D11, 1440×900 backing, DPR 1.25, sequential isolated runs with no full test suite running concurrently. These are CPU update+render costs, not complete GPU timings or a locked-60-FPS claim.

## Verification and build

Final executable: `dist/1.2.57-2026-10-23T18-12-06-286Z/Wildbound-win32-x64/Wildbound.exe`, built `2026-10-23T18:12:16.017Z`, normal profile, modified source. Desktop `Wildbound Worlds (1.2.57).lnk` targets this checkout's `Play Wildbound.cmd`; `--check` selects this exact package. Older same-version experimental packages are not the final launch target.

The full build passed **1,530 tests**. The final completion guard, branch attachment correction and removal of the wider grass query subsequently passed 17 focused sword/shadow/grass checks and eight branch/migration/control checks. Final packaging syntax-checks 409 runtime files; all 1,054 runtime/asset content checks match. The actual final executable boots to the lobby with zero errors and Worlds enabled. Final packaged QA passes 47 Xbox/Switch input and lobby checks, 76 settings/pause/ownership/layout checks, 31 woodland/grass/wind/table-light checks, and the native sword/lighting/branch review. The same-version native layer review confirms 42 player actions, 63 Captain actions, 68 villager actions and 12 captured native layers. Physical gamepads were not tested. Automated Electron windows use isolated profiles and muted audio; no existing user game is terminated.

Visual reviews: `test-output/sword-feel-review/` (eight-view sword phases, five tree silhouettes, actual forest contact and lighting), `test-output/sword-native-locomotion/` (walk/run sheets and captured motion). Representative forest contact removes nearby obstructing trees only inside the review harness so the hero remains visible; production scenery is unchanged. Art is implemented for user review, not claimed user-approved. The initial full run exposed tests expecting instant sword damage; those tests now advance through the active contact instead of treating wind-up as a hit. The 102 affected combat/terrain/locomotion checks then passed.

## Final performance evidence and limits

Separate sequential runs varied strongly with run order. In the forward exact-package pair, old/new means were 11.10/15.34, 11.77/19.90, 13.50/24.05 and 17.72/17.60 ms. Reversing order produced 16.46/10.41, 19.67/12.13, 17.45/10.37 and 23.47/12.25 ms. Those individual runs do not support a universal percentage improvement. Cold moving-camera seam maxima in the final package were 138.2 ms forward and 80.6 ms reverse; a cold-streaming hitch remains. Cut operations upload zero geometry and both runs report zero renderer errors.

To reduce that order bias, `scripts/compare-forest-interleaved.cjs` loads both complete packaged runtimes into one Electron window, verifies old/new native gait revisions 1/2, alternates adjacent draw order and which canvas is foremost every frame, warms 50 frames, then measures 100 per scene without the CPU profiler. Scenery/enemy counts and grass counts match exactly. Its final report is `test-output/forest-interleaved/report.json`.

| Scenario | 1.2.56 mean CPU ms | 1.2.57 mean CPU ms | Old/new p95 ms | Grass instances in both |
| --- | ---: | ---: | ---: | ---: |
| Clearing | 14.43 | 14.64 | 21.5 / 21.4 | 7,516 |
| Outer roaming | 13.21 | 12.73 | 18.4 / 19.2 | 15,564 |
| Negative roaming | 11.43 | 11.23 | 17.3 / 17.2 | 11,835 |
| 27-animal stampede | 14.28 | 12.51 | 16.9 / 15.5 | 7,516 |

The controlled result is roughly unchanged quiet-scene cost, small roaming reductions and about **12% less mean CPU cost in the stampede**, while keeping the full grass detail and adding the lighting pass. It is not proof of locked 60 FPS, complete GPU cost, or eliminated cold-streaming hitches. The latter remains the next performance target. Final sequential reports are `test-output/forest-motion-release/final-baseline-1.2.56/`, `final-release-1.2.57/`, `reverse-baseline-1.2.56/` and `reverse-release-1.2.57/`.
