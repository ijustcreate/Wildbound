# Charged sword: thirteen-part polish pass

Delivered normal-profile desktop: **Wildbound Worlds 1.2.107**, launcher `Play Wildbound.cmd`, selected package `dist/1.2.107-2026-11-23T02-19-57-426Z/Wildbound-win32-x64`, modified source at `f0b787ff33c3ac8f3675b48504937ebda4f0dcb5`. Source and this exact launcher package each pass 35 native checks; see final receipt below.

Request: substantially improve the existing held sword charge, ground lane, release dash and swipe with coordinated programming, animation and art work.

## Thirteen improvements

1. Charge stages resolve from tempered bronze through pale teal to full-charge gold and ivory.
2. The reachable preview traces the actual player collision footprint and clips at obstacles; release recomputes that same reach.
3. Restrained exterior/inset rails preserve lane contrast against dark grass and bright sand without filling the whole area with light.
4. A compact blade/guard landing seal and fixed world-distance marks communicate direction and reach; amber denotes obstruction.
5. Sparse gathering motes and broken floor arcs gather energy around planted feet.
6. Traveling transverse blade bands, a moving glint and a restrained tip star follow the actual fitted hand/tip.
7. Full charge emits one finite ready flourish per sustained hold, rather than retriggering each frame.
8. A rest-relative coil blends in over 0.16 seconds, lowers the torso and keeps feet planted; quick taps capture their partial entrance.
9. A directional release snap and layered tapered crescent follow the same blended blade path.
10. A short bounded history of translucent native-pose afterimages tapers along the dash.
11. Longitudinal air streaks and outward/backward drifting dust replace the first draft's stacked arrowheads. Dust uses environment colors and finite 0.18-second patches.
12. Directional split-cut sparks replace the charged hit's generic four-way impact; the attacker pauses once per charged strike, not repeatedly in a crowd.
13. A grounded braking accent, smooth heavy-swipe recovery and short cancellation residue complete the lifecycle.

The player idle raster cache now excludes charging/polish states so blade bands and pose are rendered live. Gameplay range, charge cap, once-per-target damage, line-of-sight and wall collision remain authoritative. New cosmetic collections are bounded (72 effects globally, 18 per owner with slots reserved for significant cues; four afterimages per actor), expire, and clear on restore/world transitions. Ground cues draw below actors and contact sparks above them. Ordinary attacks, combos, ranged gear, authored wearables and chicken carrying remain supported.

## Visual contract and verification

Art direction and corrections are recorded in [the visual brief](../art/2026-11-22-sword-charge-polish.md). This is an implemented native-rendered draft; user aesthetic acceptance is not inferred from test counts. No authored rig/clip/atlas replacement. Authored rigs retain SHA-256 `9a2c55d1090231ce5ec11cf06091224a9efb1b62a0c1bb0b3eb312a0cdad0be1`.

Focused integration: 41 unique charge/combat/input/restore regressions pass across targeted runs (40 initially, then the final 8/8 lifecycle file including one additional buffered-follow-up regression). Animation checks cover 27 charge/release/recovery samples including quick taps, fixed support feet, original segment lengths, custom-data preservation and a maximum release discontinuity of 0.007 model pixels; 11 existing sword/native-jump regressions pass. Isolated muted Electron exercises actual Game/Animator/Renderer, source phase strips at gameplay and close scale, bright/dark ground, wall-clipped reach and two-player narrow layout. The first native pass recorded 27 checks and zero errors; final source/package receipts follow below.

Checkout: `C:/Users/New User/Desktop/Wildbound`, `Wildbound_worlds`, origin `https://github.com/ijustcreate/Wildbound.git`, base `f0b787ff33c3ac8f3675b48504937ebda4f0dcb5` plus substantial pre-existing modified source. Package version advanced concurrently to 1.2.107 by final delivery; no rollback or unrelated source replacement. Source/build/launcher identities will be recorded at delivery. No commit, push, web publication, personal-save replacement, system audio change or termination of a player's game by this assignment. Physical controller play, multiplayer and sustained FPS remain unverified.


## Final delivery receipts

- Source and packaged isolated Electron reviews each pass 35 checks with errors[] and failedRequests[]. Includes genuine eight-facing pose/IK review, live Animator blade-region pixel changes, partial/full charge, exact release endpoint, once-per-target impacts, wall-limited preview, bright/dark ground, two-player 660px viewport, carriage-floor lane visibility, moving-carriage anchoring and real end-wall/table clipping. Rider review uses deterministic synchronous terrain preparation; it does not measure worker-streaming latency.
- Intermediate canonical packaging passes syntax checks for all 884 runtime files. Package: `dist/1.2.107-2026-11-23T02-18-04-919Z/Wildbound-win32-x64`, built UTC `2026-11-23T02:23:55.055Z`, base commit `f0b787ff33c3ac8f3675b48504937ebda4f0dcb5`, sourceDirty:true, preview:false. Actual EXE boot smoke reports failed:0, ready lobby, errors:[], audioMutedTest:true.
- In the intermediate package, ten feature runtime modules and authored rigs match package/source byte-for-byte. The two shared renderer files subsequently received unrelated multiplayer-camera work in the checkout; inspected diffs and the integration receipt confirm all sword rendering changes are present in this package. These concurrent camera edits are preserved on disk and are not claimed as packaged by this assignment. Receipts: `test-output/sword-polish/package-hashes.json` and `shared-renderer-seams.json`.
- The first `Play Wildbound.cmd --check` selected that intermediate package. Desktop `Wildbound Worlds (1.2.107).lnk` points to repository `Play Wildbound.cmd`, blank arguments, project icon, normal save profile. Do not terminate an existing player session; restart normally to load the new effects.
- Broad-suite limitation: stopped only this assignment's run after 991 observed passing lines and 39 file-load failures involving a temporary tickAlley export mismatch and repeated missing spider-web-art module errors. Fresh current Game imports, the car-render file recheck, targeted sword/input/restore tests and normal source/packaged boot all pass. No clean complete full-suite result is claimed. Original logs and summary remain in `test-output/sword-polish-rebuild.log` and `sword-polish-broad-limit.json`; no unrelated source was replaced to make the run green.
- The first isolated package review exceeded its 30-second cold-start allowance while loading. Its receipt is retained as `test-output/sword-polish/packaged/cold-start-timeout.json`; the subsequent 60-second-allowance run passes all 35 checks. Actual EXE boot passed independently.
- Motion preview: `test-output/sword-polish/motion/sword-charge-dash.gif`, 42 actual Game/Renderer frames,720×420,2.1-second encoded loop. GIF frame timing is presentation timing, not a hardware FPS measurement; the secondary WebM preserves slower wall-clock capture under build contention. No dependencies were installed.

All normal saves, player sound settings and authored rigs were preserved. No commit, push or live web publication by this assignment. Physical hardware controllers, remote multiplayer, sustained performance and user aesthetic acceptance remain unverified.


### Final launcher-selected package (supersedes the intermediate output)

A concurrent build completed at delivery, so the launcher selected `dist/1.2.107-2026-11-23T02-19-57-426Z/Wildbound-win32-x64`, built UTC `2026-11-23T02:28:04.716Z`. Manifest: base commit `f0b787ff33c3ac8f3675b48504937ebda4f0dcb5`, sourceDirty:true, preview:false. All 12 feature runtime modules, including both shared renderers, and authored rigs now match the current checkout byte-for-byte. Hash receipt: `test-output/sword-polish/launcher-hashes.json`.

This exact package passes the full 35-check isolated native sword review with failed:0, errors:[] and failedRequests:[] (`test-output/sword-polish/launcher/report.json`). Its actual executable boot smoke reports failed:0, game ready, lobby visible, audio muted and errors:[]. The existing Desktop `Wildbound Worlds (1.2.107).lnk` still targets repository `Play Wildbound.cmd`, blank arguments, repository working directory and `assets/wildbound-icon.ico`; final launcher check selects this newer verified output. This includes the concurrent camera integration without discarding it or publishing source. The broad-suite limitation above remains unchanged.
