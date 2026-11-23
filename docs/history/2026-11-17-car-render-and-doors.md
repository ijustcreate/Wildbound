# Car rendering and door interactions — November 17, 2026

Checkout: C:/Users/New User/Desktop/Wildbound, branch Wildbound_worlds, origin https://github.com/ijustcreate/Wildbound.git. Source HEAD f0b787ff33c3ac8f3675b48504937ebda4f0dcb5; modified source, no commit/push. Existing unrelated work and running player game preserved.

## Evidence and fixes

Reviewed all 256 frames (33.71 seconds) of the supplied `car issues rendering and design.gif` in sequential frame sheets. Preserve the existing green hatchback, broad paint/shadow groups, oblique world projection and native seated actors.

- Wheel arches inherited front-wheel steering because their paths used carWheelGeometry.point. Arches and real body openings now use fixed body coordinates.
- Tyres sat too wide and were painted over solid panels. Axles move inward from .435 to .40 body width, half-thickness falls from 4.5 to 3.5, radius from 12 to 10. Near tyres paint behind body skin with actual clipped openings; wheel trails follow the new axle width. Wheel-face visibility follows the steered axle heading and spoke rotation uses the revised tyre radius.
- Floating arch trim and mismatched roof/window endpoints exposed disconnected masses. A 23-unit beltline encloses the openings, shared 38-unit cabin edges align the roof and glass, and thinner trim belongs to the body.
- Far side windows and both bumper faces painted over nearer surfaces. Cull hidden side windows and bumper faces; use outward normals for visible body panels. Assemble wheel/body layers before the cabin.
- Exit happened on button-down but the same button release could run the on-foot entry action. Entry/exit now consumes the press through release for drivers and passengers, with door entry taking the same priority as its prompt.
- Doors had no car interaction prompt, and entry always took the first empty seat. Shared nearest-free-door selection now drives the label and selected seat. Keyboard/controller-family labels show entry and exit actions; full and sinking vehicles have no entry prompt. Existing hood/centre entry remains compatible.
- Exit offsets pointed along the car rather than out through the chosen side, and the front passenger seat defaulted to the wrong side. Exit now uses the seat side, tries the opposite side if blocked, and clears the occupant snapshot immediately.

## Verification

21 focused Node checks pass, including four seats/eight headings, press/hold/release/new-tap sequences, stationary arch geometry while tyres steer, family labels, water entry, collisions and pedals. Muted isolated Electron: 176 new render/actual-inputFrame checks, 9 existing pedal checks, 7 pool entry checks, zero renderer errors in the new visual and pool checks. Captures under ignored test-output/car-render-interactions/: eight-views.png, door-prompts.png, car-turn-steer.gif and report.json. Eight views include native and enlarged renders; the 48-frame runtime turnaround includes steering and rolling. Arch pixels remain identical across opposite steering locks at all 48 headings.

Shared authored/rigs.json SHA256 unchanged: 9A2C55D1090231CE5EC11CF06091224A9EFB1B62A0C1BB0B3EB312A0CDAD0BE1. No saved sound settings, system volume, profiles, saves or editor drafts changed. Physical controllers and user aesthetic approval remain unverified. No FPS claim.

## Verified desktop receipt

Full rebuild: 1,829 tests passed, zero failed; 841 runtime files syntax checked. Packaged Electron rerun: 176 car render/input checks, zero renderer errors. Exact content comparison: 1,574 files matched, zero mismatches. Actual packaged EXE boot report has failed: 0, lobby ready, audioMutedTest true and no renderer errors.

Package: dist/1.2.101-2026-11-17T17-00-43-051Z/Wildbound-win32-x64. Built UTC 2026-11-17T17:02:22.790Z from modified source at f0b787ff33c3ac8f3675b48504937ebda4f0dcb5. Version 1.2.101; preview false.

Launcher: C:/Users/New User/Desktop/Wildbound/Play Wildbound.cmd. Verified --check selects that exact package. Desktop shortcut: C:/Users/New User/Desktop/Wildbound Worlds (1.2.101).lnk; target is the launcher, blank arguments, repository working directory, assets/wildbound-icon.ico. Normal save profile. Existing running player game was left open; reopen through the shortcut/launcher to load this build.

Receipts: test-output/car-desktop-rebuild-parallel.log, test-output/car-render-interactions/report.json, test-output/build1-2-101-content.json and packaged test-output/boot-smoke.json. No source commit, push or web publication.


## Follow-up: seated player height

User reported the player sat too low. Raised the car occupant render anchor from height 5 to 15 (10 world pixels), keeping the seated pose, size, seat positions and window clipping. Reviewed the raised head/shoulders in the native eight-view Electron capture. Seven focused tests and 176 packaged Electron render/input checks passed, zero renderer errors. All 841 runtime syntax checks passed; 1,576 packaged files matched exactly. Actual EXE boot: failed 0, lobby ready, muted test audio, no renderer errors.

Updated normal-profile package: dist/1.2.101-2026-11-17T18-11-05-817Z/Wildbound-win32-x64. Built UTC 2026-11-17T18:11:19.862Z from modified source at f0b787ff33c3ac8f3675b48504937ebda4f0dcb5. Desktop Wildbound Worlds (1.2.101).lnk still targets C:/Users/New User/Desktop/Wildbound/Play Wildbound.cmd, blank arguments, and --check selects this exact new package. No commit/push. Existing running game and normal saves preserved. Physical hardware and user visual approval remain unverified. The earlier full suite was not repeated for this render-offset-only follow-up.
