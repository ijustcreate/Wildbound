# Overhead chicken carry — November 17, 2026

Request: hold the chicken above the player's head with raised arms, like Zelda, correcting the previous chest-level interpretation.

Changes:
- Both hands reach above the head on the native editable rig. Elbows lift alongside the head; the lower chicken body follows the midpoint of the palms, with feet dangling beside the grip. Facing, walking and jump lift remain shared with the player.
- Throw keys start overhead, draw back slightly, then extend forward into release and follow-through. The existing delayed, once-only release now starts from overhead height (30 world pixels plus player elevation).
- Missing/default clips are generated against the final native rest geometry, so generic-to-native retargeting cannot lower the hands again. Exact previous shipping keys can upgrade; authored custom keys are preserved.
- Updated eight-heading/throw review and regression checks. Source authored/rigs.json is not edited.

Verification before packaging: 11 focused chicken/appearance tests passed. Muted isolated Electron review passes 44 checks, including eight actual facing directions and timed release; screenshots are in ignored test-output/storage-refresh/. The corrected carry sheet uses explicit preview actions so same-timestamp locomotion smoothing cannot disguise the eight headings.

Verified desktop receipt follows below. Source: Wildbound_worlds, f0b787ff33c3ac8f3675b48504937ebda4f0dcb5 plus modified source. Existing storage/house, artwork, vehicle, controller-icon and particle work is preserved. No source commit/push or save migration requested. Physical controllers, extended user playtesting, online replication and FPS are unverified.


## Verification and delivery
- The first broad run passed 1,835 tests and found one incompatible-animal-rig validation failure. Fixed the carry generator to skip non-player skeletons; all 17 focused chicken, appearance and lion validation checks then passed.
- A later broad run passed 1,822 checks but two files observed in-progress edits in the separate particle work: a temporary truncated fireflies module and an undefined options argument in water ripples. Those source files were already corrected when rechecked; 19 fauna tests and all 4 particle integration tests pass on the current source. This is not recorded as a clean full-suite run. No unrelated particle source was overwritten in this correction.
- Packaging completed after 844 runtime files passed syntax checks. Exact packaged app passes 44 muted isolated Electron checks with zero renderer errors. All eight preview directions use their actual heading, and throw release remains delayed and once-only. The packaged raster review also renders all 244 PixelFX defaults, zero failures.
- Actual packaged EXE --worlds-smoke-test --mute-audio exits 0; its test-output/worlds-desktop.json reports failed: 0, errors: [], requests: [] and audioMuted: true.
- Output: dist/1.2.101-2026-11-17T18-22-18-834Z/Wildbound-win32-x64/Wildbound.exe. Built UTC 2026-11-17T18:25:39.410Z, source f0b787ff33c3ac8f3675b48504937ebda4f0dcb5 plus modified source; preview false. The four changed carry/player runtime modules match source byte-for-byte (overhead-content.json).
- Play Wildbound.cmd --check selects the exact output above. Desktop C:/Users/New User/Desktop/Wildbound Worlds (1.2.101).lnk targets C:/Users/New User/Desktop/Wildbound/Play Wildbound.cmd, blank arguments, repository working directory and assets/wildbound-icon.ico. Normal save profile. Existing player game remains open; restart through the launcher to load the correction.
- Receipts: ignored test-output/storage-refresh/{rebuild-overhead.log,overhead-final-tests.log,overhead-fauna-recheck.log,overhead-pixelfx-recheck.log,overhead-packaged-pixelfx.json,overhead-content.json,package-overhead.log,shortcut-overhead.log,report.json,chicken-overhead.png} and the packaged EXE smoke report.
- No source commit/push, web deployment or personal save/rig replacement. Other active workspace edits are preserved. Physical controllers, online replication, FPS and extended user playtesting remain unverified.
