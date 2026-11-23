# Train angle regression repair

User reported new layering/rendering problems after the shared scene-layer pass, and requested a complete all-angle train audit. This supersedes the live scene strategy in 2026-11-23-train-scene-layering.md. Wildbound_worlds at f0b787ff33c3ac8f3675b48504937ebda4f0dcb5, origin https://github.com/ijustcreate/Wildbound.git; extensive unrelated working source and assets preserved. No commit or push requested.

## Causes and changes

- Removed the broad early-car scene pass and environment-wide compositor. Normal world subject ordering is restored. The character-only 192px compositor is restored as well; the unused train-scene-layers helper is retained for history, not imported by the live renderer.
- Stopped repainting the whole near body over a furnished carriage with riders. Rider-specific physical foreground masking handles the actual walls/doors instead.
- The engine previously painted hidden boiler and smokebox faces in fixed construction order. Hidden cylinder faces are now culled using the camera direction. Front smokebox/wreath/lamp faces are hidden from the rear hemisphere. Raised fittings are grouped and ordered from far to near, with buried stem/base geometry removed.
- Far handrails are painted before the boiler and fittings; near handrails are painted afterward. This prevents a far brass pipe from crossing the chimney opening.
- Coal is painted between the far and near bunker walls, rather than over all four rims. Its shader uses the same one-world-pixel grid as the native train.
- Seated students receive wall/roof/other-furniture masks at their physical seat point. Their own bench remains an explicit pose-contact exception so the raised seated rig's legs remain visible. Furniture exclusion is part of both the per-frame and reusable mesh cache keys, preventing one visitor's mask from leaking into another rider.
- Car shadows are put on the ground before the train subjects, so one carriage's shadow cannot darken another carriage's roof.

The artwork, authored sprite overrides, train design, interaction/support/collision dimensions and saved profiles are preserved. No user game process was terminated and no saved sound preference changed.

## Review and checks

80 focused tests passed. New regression cases check camera-facing boiler/smokebox surfaces, fitting order, pipe/chimney order, coal/rim order and independent seated mask caches. Existing cases cover support, tabletop jumps, gangway depth, input, students and scenery batching.

All 280 native source scenes were captured: five carriage types by eight headings by seven states (walk, seated/driving, raised, doors closed/open, roof fade/closed). All five complete 56-case contact boards were visually inspected, with additional full-size front/rear locomotive and compartment reviews. Source reports/captures: test-output/train-layer-matrix/angle-final-source and train-angle-audit-*.png. This visual review is not user acceptance. Curved gangway and final package verification are appended after completion.

Full repository suite, sustained FPS and physical hardware playtesting are not claimed. Prior counts/trace-only checks did not establish that all parts were correctly ordered, which this repair addresses with component-facing tests and visual angle boards.

## Verified desktop delivery

Normal build 1.2.113: `dist/1.2.113-2026-11-23T20-23-34-186Z/Wildbound-win32-x64/Wildbound.exe`, packaged at 2026-11-23T20:25:51.010Z from f0b787ff33c3ac8f3675b48504937ebda4f0dcb5 with modified source. The packager validated 989 runtime modules. A final rear boiler cap was added after packaging; the four component regression tests passed, the package received the exact final train-craft.mjs, and all 56 engine states were recaptured and visually re-reviewed. The build manifest records the finalized train files under verifiedAngleRepair. All six train runtime hashes match source.

Packaged results: 280 main native scene captures, 56 final engine recaptures, 40 curved gangway captures, 136 physical foreground pixel checks and 20 close art scenes; no renderer errors. All five complete angle/state contact boards and the curved connection board were visually inspected; the final engine board was regenerated from the exact package. Unique reviewed main/carriage and curved states: 320, with the final engine recapture replacing its earlier states. The actual EXE booted to the lobby after the last runtime patch, exit 0, in a muted isolated profile. Source unit suite: 80 passed; final four component cases were separately rerun after the boiler cap.

Exact receipt: test-output/train-angle-repair-delivery.json. Full source comparison checked the current runtime/assets snapshot; four unrelated modules (enemy-telegraphs.mjs, imps.mjs, native-locomotion.mjs and wild-fauna.mjs) changed concurrently and were not copied into this tested package. This is a verified train snapshot, not a claim that every ongoing task is included.

Pinned shortcut: `C:/Users/New User/Desktop/Wildbound - Train Rendering Fix (1.2.113).lnk`. Target `C:/Users/New User/Desktop/Wildbound/Play Wildbound.cmd`; arguments `-BuildDirectory "dist\1.2.113-2026-11-23T20-23-34-186Z\Wildbound-win32-x64"`; repository working directory; assets/wildbound-icon.ico. Launcher --check -BuildDirectory selects the exact executable above. Normal save profile, no --preview. The dedicated shortcut avoids concurrent builds changing which package a visual review opens.

Visual boards: test-output/train-angle-audit-{engine,tender,compartments,seats,caboose}.png and train-gangway-angle-audit.png. Visual/playtest review is pending; no office review delivery is claimed. No full-suite, sustained FPS, physical controller test, commit, push or web publication was performed in this correction.
