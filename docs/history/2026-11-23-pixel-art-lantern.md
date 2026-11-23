# Coordinate pixel editing and Ice lodge lantern

`node scripts/pixel-art.mjs <recipe.json> --out <directory>` edits an existing indexed sprite or builds one from a character grid. It writes native sprite or animation JSON, a coordinate ruler, and a nearest-neighbor PNG. A dot keeps the current pixel and an underscore erases it. Animation frames apply independent patches to the same base and retain its dimensions and origin. The command uses the existing sprite helpers and development PNG dependency.

The pilot is the northwest lamp on the Ice lodge approach. The six-frame, 710 ms loop changes only the flame inside the existing footprint. Runtime retains the native depth and light source, and an authored sprite override takes precedence. The recipe, exact route, and regeneration steps are in [Ice lodge lantern](../art/winter-lantern.md).

The local Wildbound Art Starter, Art Refiner, Pixel Assets, and Environment Art skills now refer to one shared workflow. All four passed skill validation, and the documented example compiled. The real lantern recipe compiled to the six frames loaded by the game.

32 focused Node tests passed, including CLI output, frame isolation, fixed sprite origin, timing, and winter lighting. The full repository suite was not run. Source Electron verified the winter scene and the six flame states in an isolated muted profile.

## Desktop verification

The packaged runtime passed 15 muted Electron checks with zero renderer errors. These cover day and night, the light pool, depth sorting, session restore, all six flame poses, and continued animation at the lower scenery detail level. The actual packaged executable booted to the lobby with exit code 0. Five touched files matched the reviewed source by SHA-256. Packaging checked the syntax of 988 runtime modules in one V8 process.

Build `C:/Users/New User/Desktop/Wildbound/dist/1.2.113-2026-11-23T20-08-54-926Z/Wildbound-win32-x64/Wildbound.exe`. Version 1.2.113. Built at 2026-11-23T20:09:34.963Z from commit `f0b787ff33c3ac8f3675b48504937ebda4f0dcb5` with modified source. The desktop shortcut `Wildbound - Ice Lantern (1.2.113).lnk` targets `Play Wildbound.cmd` with `-BuildDirectory "dist/1.2.113-2026-11-23T20-08-54-926Z/Wildbound-win32-x64"` and uses the normal save profile.

The in-game stills, GIF, and focused check report are in `test-output/pixel-art-lantern/packaged/`. The command preview and coordinate grid are in `test-output/pixel-art/lantern/`. No commit or publish. User artwork review remains pending.
