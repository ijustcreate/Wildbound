# Imported player gait and clay pot review

The old authored walk could place the knee behind the hip-to-ankle line during the stride. The player now uses the existing Captain Lancy Revshon import, verified in [motion provenance](../../assets/oathless-captain/motion-provenance.json). Forward Walk is animation 4 with 18 editable samples over 1 second, and forward Run is animation 5 with 12 samples over 0.666 seconds. The existing humanoid retargeter preserves player proportions and transfers the movement to the existing native rig. Ground correction lifts the pose only where the fitted ankle would penetrate the floor. Donor toe pitch contributes to side views, and contact boots stay aligned. The run retains its airborne phase. Gameplay uses 32- and 59-unit cycles measured from fitted contact travel and retains the existing movement controls.

Migration replaces the exact stock walk and run, including the precise run archived from the shared generation-4 player. Independent user edits to those clips retain ownership. The shared rig file, artwork, and other actions stayed untouched.

Redrew the existing breakable clay playground pots with a smaller body, open rim, grounded base, and three matching fragments after impact. See [the art brief](../art/playground-pot.md). The before/after renderer captures use the same generated instance and normal sword break. Its broken state survived a session round trip.

The walk and run comparison video is `test-output/player-wow-gait-review/wildbound-walk-run-desktop.mp4`. It shows all eight directions at matched travel speeds plus slow profile close-ups. Muted source Electron sampled 96 phases per gait, finding zero backward knee samples in either imported gait. The preceding walk had 38 reversals. The pot comparison is `test-output/playground-pot-art/comparison.png`. User visual approval is pending.

## Desktop verification

49 focused tests passed. A Game update test selected both gaits and measured the knees during idle, walk, and run transitions in all eight directions. The imported clip timings also appeared in the actual player Animation Studio. Automated Electron windows used muted audio and isolated profiles. Packaged pot art matched the reviewed pixels, and the actual executable booted to the lobby with exit code 0. The full suite was not run.

Both sides of the final video use the packaged renderer and art, with the pre-change rig inputs substituted only for the baseline. This keeps unrelated pixel differences between the in-progress source checkout and the package out of the comparison. Both capture reports have zero renderer errors.

Desktop output `C:/Users/New User/Desktop/Wildbound/dist/1.2.113-2026-11-23T20-43-29-206Z/Wildbound-win32-x64/Wildbound.exe`, version 1.2.113, built 2026-11-23T20:43:56.796Z from modified source at `f0b787ff33c3ac8f3675b48504937ebda4f0dcb5`. The Desktop shortcut `Wildbound - Walk Run and Pots (1.2.113).lnk` targets `Play Wildbound.cmd` with the build directory pinned and uses the normal save profile. Five reviewed runtime files matched by SHA-256, and syntax checking covered 992 runtime modules. No commit or publication.
