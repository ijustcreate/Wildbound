# TV arena art, roster and crouch polish — 1.2.110

The TV arena now uses four coherent generated forest parallax layers, nearest-neighbor cached on a 512×256 grid, with procedural fallback. Exact builtin image-generation prompts and references are in `design/tv-arena/parallax/prompts.json`; runtime assets and hashes are in `assets/tv-arena/manifest.json`.

Bramblecap and Mossback were rebuilt as native editable parts through the in-game RigStudio pixel editor: 111 parts across eight directions, revised twelve-action animation sets, coherent shell retraction and planted feet. Only the two arena rigs were replaced; other authored data and local saves were preserved. Artwork has been internally reviewed, not user-approved.

Ten native enemies join gradually in four-species themed encounters: slime, bat, spider, beetle, frog, boar, snake, imp, skeleton and archer. They have side-view placement and collision adaptations, readable intent, finite archer ammunition, and attack-pose timing linked to AI timers. Flying enemies respect solid tubes. Native frog art has an opt-in side profile.

Down crouches and Down + Left/Right walks at half speed with a shorter hurtbox. Down + a fresh Jump drops through one-way platforms. Solid floors and tubes remain solid. Standing is prevented under solid ceilings; crouch poses retain native limb constraints. Input routing is verified for synthetic keyboard and gamepad states.

Validation: full project suite 2,116 passing before the final isolated attack-pose timer binding; all six TV-focused files then passed 112 tests including that binding. Final packaged muted Electron checks: 161 polish + 81 arena + 55 run = 297, no renderer errors. Actual EXE boot succeeded with muted test audio and an isolated test profile. All 969 checked runtime files match packaged source. Hardware controllers, multiplayer sessions and delivered FPS are not measured here.

Exact build: `dist/1.2.110-2026-11-23T16-30-32-350Z/Wildbound-win32-x64`, built UTC 2026-11-23T16:30:39.140Z from modified source at `f0b787ff33c3ac8f3675b48504937ebda4f0dcb5` on `Wildbound_worlds`. No commit or push was performed. The normal-profile desktop shortcut `Wildbound Worlds (1.2.110).lnk` targets `Play Wildbound.cmd` in this checkout, with no preview arguments. Launcher --check selects this exact build. Preserve concurrent changes in this shared checkout.

Receipts and screenshots: `test-output/tv-polish/final-receipt.json`, `final-file-receipt.json`, `final/report.json`; other native reports are `test-output/tv-arena/final/report.json` and `test-output/tv-arena-run/final/report.json`. Full suite log: `test-output/tv-polish/full-suite.log`. Native pixel-edit receipt: `test-output/tv-polish/pixel-editor-receipt.json`. Test-output files are local verification artifacts, not source assets.
