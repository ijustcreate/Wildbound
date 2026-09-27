# Wildbound 1.0.4 · Character carousel and particle studio

Launch **Play Wildbound.cmd** or **dist/1.0.4/Wildbound-win32-x64/Wildbound.exe**. Close an older running version and relaunch to use these changes.

## Lobby

- The character name is focusable with a controller or keyboard. Activating it asks whether to edit; confirming opens the existing name keyboard. The separate lobby Edit name button is removed.
- Choose character opens a portrait carousel ordered A–Z, ignoring case. Left/right arrows disappear at the ends. Dots show more entries. Clicking the displayed name, or pressing A on it, assigns that character immediately. Each player's carousel remains independent; characters in use by another player cannot be assigned.
- New, Delete and Back remain available. Deletion retains its explicit confirmation and Cancel focus.
- Difficulty explanations describe the actual damage rules: Gentle deals one damage per hit, Adventure reduces damage by 35%, and Wild uses full damage. Setup buttons are shorter and narrower. Header artwork fills the lobby width without the small centered image box.

## Particles

Open **Rig studio → Particles**. Choose a preset or create a new effect. Adjust particle count, lifetime, velocity, emitter width, gravity, size, orbit, shape, blend and colors. Preview, pause/restart, save locally, restore presets, and import/export JSON.

Temple torches and knocked-out-player stars now use this shared renderer. Saving those presets applies the effect in gameplay. The rain study demonstrates falling streaks in the editor only; the existing weather renderer and gameplay rain are unchanged. Custom effects are saved in the editor library and exported as JSON; they are not automatically assigned to world objects.

## Verification

- 232 unit tests passed, including deterministic and bounded particles, import validation and persistence.
- 118 smoke checks passed in the packaged Windows app, including controller character creation and selection.
- Fourteen setup screenshots across 1440×940 and 1000×700 verified independent carousels and layout.
- Dedicated Electron checks verified alphabetical browsing, end arrows, direct name selection, rename confirmation, difficulty explanations, particle controls and saving. Deletion confirmation was checked separately.

Visuals: `test-output/carousel-lobby.png`, `test-output/particle-editor.png`, `test-output/lobby-compact.png`.
