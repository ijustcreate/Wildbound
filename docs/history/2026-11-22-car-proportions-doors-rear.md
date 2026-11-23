# Larger car roof, rounded surrounds, doors and rear hatch — November 22, 2026

Checkout C:/Users/New User/Desktop/Wildbound, branch Wildbound_worlds, origin https://github.com/ijustcreate/Wildbound.git. Modified source at f0b787ff33c3ac8f3675b48504937ebda4f0dcb5. Other ongoing work preserved; no commit/push requested.

User feedback: roof too small, square-looking wheel surrounds, rear too plain, missing door seams. Keep the pixel treatment, current green hatchback, four-seat interior and fixed/steerable wheel distinction.

- The roof base is wider and about 39% longer; its crown is about 18% wider and 74% longer than the preceding revision. Retain the shallow chamfered shape, broad highlights and original height. Front/rear glass uses the actual roof vertices instead of duplicated numbers; side frames follow the larger roof. Reposition front/rear seat rows within the larger cabin so all occupants remain visible from both profile sides. Steering wheel follows the front row and the floor extends under the rear row.
- Remove the rectangular wheel-well backing flaps and straight-sided hole extensions. Backing is rounded, with a flattened ellipse bottom above the tyre contact patch. The body cutout and trim follow the circle down to the sill, ending at height 4. Body panels still mask tyres and steering never moves the arches.
- Each visible side has a restrained door outline, a centre split and two handles, clipped with the body skin so the lines never paint across tyres.
- Add an inset rear hatch panel, paired tail/reversing lamps, low dark bumper, handle, number plate, deck seam and short rear wiper. Remove the old extra top-deck tail lamps, retaining front headlamps. Rear-face details cull when facing away.

No world dimensions, car collision/physics, saves, authored rig data, normal sound settings or running player games changed. All automated Electron windows muted before loading and use temporary profiles. Artwork remains developer-reviewed pending the user's visual feedback; no hardware-controller or FPS claim.

## Checks and verified desktop

25 targeted tests pass, including the enlarged roof footprint, roof/glass registration and curved sill endpoints. Source and packaged Electron review pass 282 checks with zero renderer errors: 32 headings at three steering positions, crisp native pixel blocks, all four occupants visible from both profiles, actual input entry/exit, and default snow. The seven-stage pool/sinking check passes with zero renderer errors. Eight-view preview refreshed after the final lamp cleanup under test-output/car-seated-review-2026-11-22/seated-player-eight-views.png.

Build syntax checks cover all 891 runtime files with the Node V8 ESM/CommonJS parsers in one process. The slow serial check was intentionally replaced by the equivalent single-process runner in ignored tmp/package-car-proportions-fast.cjs; no persistent build-script edits or skipped files. Requested package dist/1.2.107-2026-11-23T02-15-51-597Z/Wildbound-win32-x64, built UTC 2026-11-23T02:23:09.348Z, passes 282 packaged checks, seven pool checks and actual EXE boot (failed 0, lobby ready, muted test audio, zero renderer errors).

A concurrent local package completed later and is selected by the normal launcher: dist/1.2.107-2026-11-23T02-18-04-919Z/Wildbound-win32-x64. Independently reran all 282 checks and actual EXE boot against that exact selected package; all pass, zero renderer errors. Built UTC 2026-11-23T02:23:55.055Z, version 1.2.107, sourceCommit f0b787ff33c3ac8f3675b48504937ebda4f0dcb5, sourceDirty true, preview false. All six car runtime files match current source exactly.

Desktop shortcut C:/Users/New User/Desktop/Wildbound Worlds (1.2.107).lnk targets C:/Users/New User/Desktop/Wildbound/Play Wildbound.cmd, blank arguments, repository working directory and assets/wildbound-icon.ico. --check selects the verified later package above. Normal save profile; existing running games were left open. Reopen the launcher to load this car revision.

Whole-current-checkout equality is not claimed: editor/camera/chat/train layout source continued changing during packaging. The own package comparison reported four newer unrelated paths; the later selected package reported eight newer unrelated paths. Those changes were preserved in the checkout and not overwritten. Both packages boot and pass the car review; no repeat full suite or hardware-controller/FPS claim.

Authored rigs SHA256 remains 9A2C55D1090231CE5EC11CF06091224A9EFB1B62A0C1BB0B3EB312A0CDAD0BE1. Receipts: test-output/car-proportions-tests.log, car-proportions-fast-package.log, car-pixel-roof/report.json, build1-2-107-content.json, and each package test-output/boot-smoke.json. No commit, push or web publication.

