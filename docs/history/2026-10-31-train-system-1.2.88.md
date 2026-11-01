# Dev railway system and desktop build 1.2.88

October 31, 2026. Long coaches retained from the supplied reference. Scarlet steam locomotive homage with a separate coal tender, compartment coach and seated saloon coach. This supersedes the first train sandbox draft.

## Delivered

- Dev menu: Test train level, Train / track workshop, Return from train test, and a route selector for the next shared junction. The train starts parked; explorers spawn outside. The normal map chooser has no train destination.
- 6400 x 4400 grass-and-native-tree map, central river, sampled closed railway, graded track, automatic bridge decks, ramps and piers. Arc-length carriage spacing, bogie-aligned headings and route history keep carriages following a junction in sequence.
- Jump-gated raised side doors, independent local movement in moving vehicles, end gangways, tender walkway, compartment collision/doors, reserved seats and stand actions, cab start/stop, bounded throttle, braking and moving whistle. Each occupied roof fades independently.
- Eight views of chassis, wheels, body, furniture, machinery, trim and roof for all four vehicles. Red/brass engine, black smokebox, slate roofs, timber benches, blue side corridor and red compartment upholstery. Animated spokes/pistons, steam, smoke, coal fire, embers and turn sparks. Native editable train_sit clip retains existing custom clips and uses the current player skeleton.
- Full railway editor through the dev menu and House/Location picker: track geometry and route branches, scenery, interior geometry/collision, eight-view preview, per-part/per-view pixel editing, dimensions/tuning/palette. Undo/redo, recovered drafts, saved versions, safe selected-version updates, compressed artwork, import/export. Saving parks the train before applying new geometry.
- Steam/chuff/clack/brake/door/whistle synthesis routes through the current live SFX mixer. Riders' footsteps measure local carriage movement and use wood. No external train sound recordings.
- Isolated test player copies, blocked profile/session persistence, and original party/phase/clock restoration prevent this map from overwriting expedition saves.

Controls and system details: [railway-system.md](../railway-system.md).

## Verification

- Full desktop rebuild script succeeded: 1,705 tests passed; 521 runtime files syntax checked. The full suite includes the train tests.
- Final focused run: 29 tests passed (railway, audio and profile coverage).
- Final packaged review: scripts/verify-train-test.cjs, 28 checks passed, errors=[], muted=true. Checks exercise the real dev-menu entry, outside spawn, jump gate, coach boarding, compartment door, seat, independent driver/passenger, throttle/motion/effects, HUD, modal editor, all six editor tabs, placement, saving, pixel persistence, original-party restoration and narrow/wide windows.
- Actual packaged Wildbound.exe --boot-smoke-test --mute-audio --software-rendering: failed=0, ready=true, errors=[], audioMutedTest=true.
- All 17 relevant source/runtime files exactly match the packaged copies. Play Wildbound.cmd --check and shortcut target/icon/blank-argument checks passed.
- Source: d2720a4da60b468884b350e422ae7ab875c31f61, branch Wildbound_worlds, modified tracked/untracked source. No commit or push. Existing other work was preserved; authored/rigs.json unchanged from Git (SHA256 DC05411B47F02259BE95EA0ED22AEA375D76F79B55D7F0BDEC57DA5DF7ED7D71).

## Desktop identity

- Package: dist/1.2.88-2026-11-01T06-03-18-893Z/Wildbound-win32-x64/Wildbound.exe.
- Manifest builtAt: 2026-11-01T06:03:39.041Z, sourceDirty=true, preview=false.
- Normal launcher: C:\Users\New User\Desktop\Wildbound\Play Wildbound.cmd.
- Shortcut: C:\Users\New User\Desktop\Wildbound Worlds (1.2.88).lnk, blank arguments; working directory is the repository and icon is assets/wildbound-icon.ico.
- Normal save profile, not --preview. Verification used isolated profiles and muted windows. No running player's game was terminated.

## Review and limits

Ready for user playtesting. Native canvas captures in test-output/train-review: eight-views.png, coach-cutaway.png, train-interior.png, seated-eight-views.png, engine-bridge.png and track-editor.png. report.json, packaged-file-matches.json, rebuild.log and focused-tests.log retain checks. The packaged boot report is under the package's test-output/boot-smoke.json.

Artwork is implemented and self-reviewed; user approval has not been inferred. Hardware controllers, online replication, subjective audio playback, end-to-end FPS and extended user playtesting remain unverified. This is one train on closed itineraries with shared branch selection. Regular-map travel is a future integration, as requested; there is no dispatch AI/signalling or inter-map timetable. Pixel overrides select the nearest compass view between the continuously projected native directions.
