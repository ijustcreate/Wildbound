# Greyhaven’s six new residents

Greyhaven now has six additional residents with live dialogue portraits and encounters. The [visual research, original concept sheet, eight sprite facings and location guide](../design/greyhaven-cast/README.md) are available together. The costumes are native rig layers and keep using the existing mouth, eye, limb, equipment and locomotion poses.

Mim’s High Solar duel uses a lantern, two tongue-bait crocks and two destructible wooden screens. Sir Ector gives out a stable key for daytime chores and sends the party after Bracken on the night watch. Kay’s race uses a manually steered horse, flagged turns and two shortcuts Kay attempts when behind.

Robin lends his appearance and equipment for the rope-and-key archery trial while the explorer retains their own loadout. The pay train has a signal lantern and carriage strongbox with different jobs for the lookout and boarding explorer. Little John’s log supports normal travel and an optional staff duel against him or a second explorer. Marian’s banquet has an original fiddle cue and three guests to escort around guard patrols and dancers.

Quest progress and best results live in each explorer’s existing quest record. The timed challenges restart from a safe interaction after leaving their area. The normal desktop shortcut uses the regular save profile. All automated Electron windows were muted and used isolated temporary profiles.

## Source checks

- The cast walkthrough reached all six residents through the ordinary keyboard interaction and rendered their dialogue portraits. It also captured all eight native facings and sampled idle, walk, run, interaction or aim, and hurt poses. The scene and portrait captures are under `test-output/greyhaven-cast/source/`.
- The High Solar walkthrough passed 39 checks across Mim’s three forms. It verified the lantern window, both crocks, both collapsing screens, save requests and rematch dialogue. Captures are under `test-output/greyhaven-mim-review/source/`.
- The stable walkthrough passed 32 checks covering the key, the night watch, Bracken’s return, the seven-flag race and both shortcuts. A focused regression covers exit from a closed stable after a co-op checkpoint. Captures are under `test-output/greyhaven-stables-review/source/`.
- The outlaw walkthrough passed 21 checks covering both bow targets, the co-op train robbery, the co-op staff duel and downstream float, and all three banquet escapes. Captures are under `test-output/greyhaven-outlaw-gameplay/source/`.
- The eight existing Greyhaven and resident tests passed. Scripted input covered keyboard and co-op play.

## Verified desktop build 1.2.177

The executable is `dist/1.2.177/Wildbound-win32-x64/Wildbound.exe`. It was packaged from the modified `Wildbound_worlds` checkout at `a6cee9bc55ad12ed58df5c3d27b150449f31ef26`. The `Wildbound Worlds (1.2.177)` shortcut targets `Play Wildbound.cmd -BuildDirectory "dist\1.2.177\Wildbound-win32-x64"` and uses the normal profile. The launcher check and muted executable boot both passed.

The exact packaged renderer passed 135 checks with zero renderer errors. The cast review covered all six NPCs, their live portraits and the keyboard, Xbox and PlayStation prompt labels. The three gameplay walkthroughs covered Mim, Ector and Kay, and the outlaws. Each report records the `resources/app` path for 1.2.177. The encounter modules, costume artwork and banquet audio match the packaged copies. Other changes made later to the shared source files cover the minimap, scenery reveal and trade gestures.

All 22 focused tests passed. The whole-game suite was stopped during the broader rebuild attempt. Scripted input was used for the test passes.
