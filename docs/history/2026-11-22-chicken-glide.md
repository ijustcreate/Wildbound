# Chicken wing flapping and slow glide — November 22, 2026

Request: while jumping with the chicken held overhead, flap its wings and glide down slowly like Zelda.

Changes:
- Automatically cap descending speed at 32 world pixels/second while carrying the chicken. Glide acceleration is 180 pixels/second squared, integrated with the existing small jump steps. Ascent and jump-release height behavior remain unchanged; releasing Jump does not cancel the glide.
- Existing horizontal air steering, raised-surface landing and normal ground contact remain authoritative. Throwing/placing/losing the chicken removes the glide without a separate saved flag. Swimming, broom/wing flight, vehicles, rooms and dead actors do not use the carry glide.
- The overhead chicken now flaps throughout ascent and descent. Lateral spread and vertical wing strokes animate on the original native editable wing joints in all eight views; wings rest on landing. No authored rig artwork or personal saves are replaced.

Initial verification: 14 chicken/jump/native-jump regressions pass. Muted isolated Electron checks pass 17 assertions through actual pickup, Game.update jump and high fall, horizontal movement, no held-Jump requirement, eight visible wing strokes, throw/release, and landing. Measured carried descent reaches but never exceeds -32 while an otherwise identical ordinary player lands. Evidence: ignored test-output/chicken-glide/.

Checkout: Wildbound_worlds, source f0b787ff33c3ac8f3675b48504937ebda4f0dcb5 plus modified source; current package version 1.2.103. Pre-existing source/assets/drafts are preserved. No commit/push or web publication requested. Full rebuild and exact packaged verification are recorded below after completion. Hardware controllers, extended user playtesting, online replication and FPS remain unverified.


## Final desktop receipt and verification limits
- Final carry regression file: all 8 tests pass, including clearing a missing/dead carried chicken before the next fall step. The earlier 7 ordinary/native jump tests also pass. No persisted glide flag or saved gravity setting is introduced.
- Broad rebuild run: 1,893 tests ran, 1,891 passed and 2 failed in house-door and native station-wall checks. Both complete files pass on isolated current-source rechecks (10 expansion checks and 12 train visibility/impact checks). These failures were not reproduced and no door/train code was changed for this assignment; this is not claimed as a clean full-suite pass. Logs: rebuild.log, expansion-recheck.log and train-recheck.log under test-output/chicken-glide/.
- Packaging passed 862 runtime syntax checks. Built dist/1.2.104-2026-11-22T16-47-06-626Z/Wildbound-win32-x64 from modified source at f0b787ff33c3ac8f3675b48504937ebda4f0dcb5; manifest builtAt UTC 2026-11-22T16:48:14.054Z, preview false. The shared checkout advanced from version 1.2.103 to 1.2.104 during the work; existing version/source work was preserved.
- The launcher then selected the newer concurrent package dist/1.2.104-2026-11-22T16-48-02-722Z/Wildbound-win32-x64/Wildbound.exe, built UTC 2026-11-22T16:48:44.379Z, same source commit plus modified source, preview false. All four changed chicken/glide runtime modules match source byte-for-byte in both packages; see content.json.
- Both exact packages pass the muted isolated Electron glide driver: 17 checks, no renderer errors, minimum fall velocity -32, full Game.update pickup/jump/steering/throw/landing and eight visible wing strokes. The latest report identifies the actual launcher-selected app path. Its glide.png and wings.png captures were retained.
- Both actual packaged executables --boot-smoke-test --mute-audio exit 0. Their test-output/boot-smoke.json reports failed 0, ready lobby, errors [] and audioMutedTest true.
- Verified launcher: C:/Users/New User/Desktop/Wildbound/Play Wildbound.cmd --check selects the newer output above. Desktop shortcut C:/Users/New User/Desktop/Wildbound Worlds (1.2.104).lnk targets that launcher with blank arguments, repository working directory and assets/wildbound-icon.ico. Normal save profile. Restart via the launcher to load the glide.
- No commit/push, web publication, authored-rig edits, personal save/profile replacements or saved audio-setting changes. Physical controllers, online replication, FPS and extended user playtesting remain unverified.
