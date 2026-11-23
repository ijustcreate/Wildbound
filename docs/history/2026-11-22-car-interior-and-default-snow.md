# Car cabin, seated occupants and default snowfall — November 22, 2026

Checkout C:/Users/New User/Desktop/Wildbound, Wildbound_worlds, origin https://github.com/ijustcreate/Wildbound.git. HEAD f0b787ff33c3ac8f3675b48504937ebda4f0dcb5 plus modified source. Other ongoing work, authored rigs, saves and editor drafts preserved. No commit/push requested.

## Car

The side windows were solid pale polygons; front/rear panes painted independent incomplete interiors. The old sit clip did not create a clear bent-knee seated silhouette. Keep the current green hatchback and broad paint clusters, fixed wheel openings and native articulated characters.

All visible glass now reveals one shared 2x cabin raster, bounded to a single reusable 640x480 surface. The side glazing uses inset frames; the roof and door sills occlude normally. The cabin includes four upholstered cushions, backrests and headrests, a dashboard/glovebox, instrument binnacle with broad gauge marks, vents, centre console, gear lever and tilted three-spoke steering wheel. Interior components and occupants sort by view depth. The steering spokes follow wheelAngle.

New car_sit and car_drive are normal editable animation keys on the existing player rig. They use bent thighs/knees and preserve limb lengths; the driver's hands reach the steering rim. Clip registration only supplies missing poses and retains authored car and train poses. Seat hip height matches the cushion; head height retains the previously raised framing. Heading is continuous through turns. No shared authored data is written.

## Snow level

The snow level now draws gentle viewport snowfall whenever no weather event is active. This does not create a timed blizzard or change snow depth, movement, saved weather or the hazard schedule. A real blizzard still draws denser, faster flakes, tint and its countdown; accumulation behavior is unchanged. Other biomes retain their weather. Existing local snow particle accents are preserved.

## Checks

78 targeted Node checks passed across car controls/interactions/water, winter behavior, native poses/limb lengths, edited clip retention, character details, train students, animation layers, native rig migration and project rig persistence. Muted isolated Electron review: 186 checks, zero renderer errors, including pixel differences proving every seat's occupant is visible from both profile sides, plus fresh ice-scene ambient snowfall with no hazard. Eight-view cabin/driver previews and snow-level captures are under ignored test-output/car-cabin-snow. Actual source render review confirms both side views, matching seat heights, dashboard/steering wheel and populated empty seats. This is developer-reviewed artwork, not user aesthetic approval.

Authored rigs SHA256 remains 9A2C55D1090231CE5EC11CF06091224A9EFB1B62A0C1BB0B3EB312A0CDAD0BE1. All test windows muted before game load and use temporary profiles. Normal sound preferences, saves and running player games untouched. Physical controller hardware, remote multiplayer and sustained FPS unmeasured. No full-suite rerun claimed for this focused follow-up.

## Verified desktop receipt

Version 1.2.104. Packaging syntax-checked 862 runtime files. The requested package dist/1.2.104-2026-11-22T16-47-52-436Z/Wildbound-win32-x64 passed all 186 car/snow Electron checks, exact content comparison (1,595 files, zero mismatches) and actual EXE boot (failed 0, lobby ready, muted test audio, zero renderer errors).

A concurrent local build completed slightly later, so the normal launcher selected dist/1.2.104-2026-11-22T16-48-02-722Z/Wildbound-win32-x64. Independently verified that exact selected build as well: all 186 Electron checks pass, all 1,595 files match current source, actual EXE boot failed 0 with no renderer errors. Manifest builtAt 2026-11-22T16:48:44.379Z, sourceCommit f0b787ff33c3ac8f3675b48504937ebda4f0dcb5, sourceDirty true, preview false.

Desktop shortcut C:/Users/New User/Desktop/Wildbound Worlds (1.2.104).lnk targets C:/Users/New User/Desktop/Wildbound/Play Wildbound.cmd, blank arguments, repository working directory, assets/wildbound-icon.ico. Launcher --check selects the independently verified later package above. Normal save profile; existing player process was left running. Reopen through the launcher to load the changes.

Receipts: test-output/car-cabin-snow-package.log, car-interior-snow-tests.log (31 checks), car-interior-pose-tests.log (22 checks), car-interior-rig-tests.log (25 checks), car-cabin-snow/report.json (186 checks), build1-2-104-content.json, and both packaged test-output/boot-smoke.json reports. No commit, push or web publication.

