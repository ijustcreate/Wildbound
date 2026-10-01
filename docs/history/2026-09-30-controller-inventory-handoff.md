# September 30, 2026: local testing handoff

Base revision: `493c3ea` (1.0.45). These changes were tested on the Windows PC during the September 30 evening session; build timestamps are October 1 UTC. This note distinguishes observed failures from things still requiring playtesting.

## Changes included

- Controller joins retain the first join press while the asynchronous desktop controller claim completes. Existing cross-process controller ownership remains in place.
- Lobby objects accept the primary face button without the old hold interaction. Labels use Xbox A / Switch B for the standard bottom-face mapping; controller-family label overrides are available. This does not guarantee arbitrary nonstandard hardware mappings.
- Nearby world doodads can consume the controller primary action without also charging an attack.
- Inventory uses one 24-slot backpack without category tabs. Directional navigation crosses between backpack and equipment; shoulder cycling remains available.
- Fixed incorrect `count(inventory, type)` calls: `count` expects the player. The quiver-render exception stopped the frame loop and looked like controllers were not being detected.
- Restricted the lobby's `display:flex` rule to its active screen. Previously the lobby remained visible after gameplay/forest audio started.
- Forest ferns are half-size, with eight shared cached sprites instead of rebuilding hundreds of leaf rectangles per visible plant per frame. Walking still bends them; settled springs sleep. No measured end-to-end FPS claim has been made.
- Board-center clipping now follows the artwork's inner stone rim. Needs visual confirmation in normal gameplay.
- Inventory has fixed action/notice space. An older inactive-sheet rule used `display:none` for the equipment action bar; switching sections changed the doll size. It now reserves space with hidden inactive controls. Background contrast was reduced. This is a targeted layout fix, not a complete redesign.

## Observations and verification

- Live diagnostics detected an Xbox 360 XInput pad and two Nintendo vendor `057e`, product `2009` wireless gamepads after the renderer fix. All three players joined; diagnostics showed gameplay without renderer errors.
- One wireless controller showed some stick drift. No hardware calibration change was made.
- Full Node test suite passed after the fern/board changes. After the final inventory CSS changes, nine focused controller/house tests passed and the build syntax-checked 166 runtime files.
- `scripts/verify-inventory-sizing.cjs` runs in an isolated Electron profile and measures actual rendered inventory geometry across selections, equipment/backpack focus and notices, at heights 850, 600 and 420. All three stayed stable. Six-player/chest/popover layouts and real-controller usability still deserve playtesting.
- Latest local packaged build: `dist/night-hunt-2026-10-01T01-29-21-571Z/Wildbound-win32-x64`. Desktop shortcut: **Wildbound Inventory Fix**. This includes the earlier fern, board, controller and lobby fixes.

## Unresolved: old house floorplan

The user reports that the house level uses an old floorplan. Current generation calls `activeHouse()` through `makeHouse()`; absent a valid saved library it uses `defaultHouse()` in `src/house-design.mjs`. The live expedition on this PC contained **The Living House**, the default layout.

Neither the `wildbound` nor `Wildbound Night Hunt Preview` Electron roaming profile had `house-designs-v1.json`. This is not proof the custom layout is lost: it could be in another computer's profile, a browser origin, an export, or older storage. No house data was overwritten or reset. Asked whether the newer layout was authored in this PC's House Builder, the browser, or the other computer; location is not yet established.

On the other computer, inspect House Builder's active saved version and these storage keys before choosing or transferring a layout:

- `wildbound-house-designs-v1` (library / active version)
- `wildbound-house-state-v1` (library and unfinished draft)
- Electron user-data `house-designs-v1.json` and backups, if present

Do not replace an unfinished draft with the default house. Custom house storage and expedition saves are not automatically synchronized by a Git pull.

## Reproduce / build on another PC

With project dependencies and Electron installed:

```sh
node --test tests/*.test.mjs
npx electron scripts/verify-inventory-sizing.cjs
node scripts/package.cjs --preview
```

The local npm Electron binary was missing on this PC; the sizing check was run using the cached Electron 41.10.7 runtime extracted into ignored `test-output`. Packaging succeeded with Electron 41.10.7. No Windows security settings were changed in these fixes.

Git contains source, tests and this handoff, not the ignored `dist` binaries, local shortcuts, profiles or diagnostic logs. GitHub Pages is not updated by this source push.
