# Wildbound 1.0.0

This release includes the preceding game, controller, inventory, rig, event, house and expansion changes, plus the following completed work.

## Characters and editor
- Character names now highlight a selection without immediately closing the picker. Use character confirms it; Delete targets that selection and requires confirmation.
- Studio tabs share one dark shell, fixed header, consistent controls and scrolling content. Keyboard arrow keys switch tabs.
- House pieces support direct dragging, snapped movement, corner resizing, rotation, duplication and undo. Saved versions are available to new expeditions.

## World and navigation
- Ice has connected frozen lakes, winter trees, ice formations, drifts, shrubs, frozen logs and supply caches. Ice preserves sliding momentum.
- The Ice-only blizzard accumulates snow, slows grounded actors and visually buries their bases. Snow gradually recedes afterward.
- Lions navigate around house walls, search open doors and patrol outside when no entrance is reachable. Door changes invalidate routes.
- House actor collision uses the rendered ground anchor. Pool drawing, water checks and collision share exact pool bounds.

## Audio
- CC0 recorded effects replace the original oscillator beeps. Enemy spawn, attack, injury and death cues cover 26 creature mappings, including the expansion creatures. Voices are stylized, with pitch and timing treatments; they are not species-specific field recordings.
- Weapon attacks, arrows, spells, impacts, shields, loot, drops, equipment, inventory, harvesting, doors, footsteps, hatching, progression and interface actions have cues.
- Rain and wind use crossfaded ambient loops. Sound playback has distance attenuation, stereo positioning, randomized variants, cooldowns, fade envelopes, a 24-voice budget and compression. Major event cues duck music.
- Settings expose master, music, effects, interface and ambience volumes, audio enable/disable, night mix and a test button. Preferences persist.
- Curious Groove is the menu soundtrack. Each expedition randomly chooses one of the other four songs, avoiding the immediately previous selection.
- See AUDIO_PLAN_1.0.0.md for the initial sound inventory and assets/sfx/CREDITS.md for source and license details.

## Verification
- 214 automated tests passed.
- 118 smoke checks passed in the packaged Windows executable.
- 97 active effect assets decoded successfully; all five music tracks passed decode checks.
- Twelve editor layouts checked at two window sizes; direct pointer movement, resizing and undo passed.
- Fourteen setup screenshots and independent player pickers checked; deletion confirmation, house version persistence and four expansion previews verified.

Physical controller feel and listening balance on the user's speakers remain subjective playtest checks. Automated checks do not replace a human audio mastering session.

Launch dist/1.0.0/Wildbound-win32-x64/Wildbound.exe. Keep the packaged folder together.
