# Car falls and sinks before ejecting riders — 1.2.71

Supersedes the immediate water ejection in 1.2.70. Entering deep water now starts a roughly three-second sinking sequence. The car drops down with a small vertical compression, stays opaque and progressively disappears behind a waterline; repeated ripples mark the surface. Occupants remain seated and visible through the remaining windshield until full submersion. At sink=1 every rider is released, vehicle links clear, swimming starts according to their exit position and the wreck remains unavailable. Pedals cannot restart the engine or move the sinking car; manual exit waits for completion. Seated actors do not independently swim or dive during the sequence. Shallow water and bridges retain their prior behavior.

Verified package: dist/1.2.71-2026-10-26T20-04-54-369Z/Wildbound-win32-x64. Built UTC 2026-10-26T20:04:59.777Z from modified source at 1bd5ef027966e371f21cd0956b96b0aa4a62144b, Wildbound_worlds, origin https://github.com/ijustcreate/Wildbound.git. Correct checkout: Desktop/Wildbound Server Branch Build. No commit or push.

Desktop shortcut C:/Users/New User/Desktop/Wildbound Worlds (1.2.71).lnk targets C:/Users/New User/Desktop/Wildbound Server Branch Build/Play Wildbound.cmd, blank arguments, assets/wildbound-icon.ico. Normal save profile. Launcher --check verifies this package; actual packaged EXE boots ready with no renderer errors. No running player's game was stopped.

Full rebuild: 1,641 tests passed, 465 runtime syntax files checked. Packaged verification: 17 driving/game-update checks (including riders retained during sinking and ejected only after full submersion), 32 occupied/empty/sinking render cases across eight headings, 1,146 exact packaged file matches, successful actual-EXE boot. Evidence: test-output/rebuild-release-1.2.71.log, final-packaged-1.2.71.log, final-exe-1.2.71.log and car-water-ground/car-eight-views.png. Tests muted isolated Electron profiles; physical controller hardware and FPS were not measured.

Authored rigs remain SHA256 DC05411B47F02259BE95EA0ED22AEA375D76F79B55D7F0BDEC57DA5DF7ED7D71. Existing authored work, saves and editor drafts preserved.
