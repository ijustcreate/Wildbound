# Banshee Queen source addition

Implemented from the user's attached character reference, using Wildbound's shared sculpted humanoid rig and native pixel equipment. Base checkout: `edc664ea35a4c75710570680dca26c6e1387f658` (`main`), with existing uncommitted work preserved. No commit, push, version bump, package, launcher change, authored-rig write, or personal-save change was performed for this feature. The existing 1.0.71 desktop package does **not** include this source addition; rebuild separately when integrating it.

## Gameplay and equipment

- Append-only **The Banshee Queen** event: one Queen, three armed skeletons and two unarmed skeletons. Existing event indices stay unchanged; older design packs retain the new event.
- Queen: 340 HP, speed 44, arrow damage 24, range 420, 0.8-second locked bow draw and 2.4-second recovery between shots. Uses existing navigation, doors, finite ammunition/retrieval, traps, freeze, hurt, death and reward processing. Charmed Queens cannot release hostile shots; standard friendly following remains in use.
- Five guaranteed Queen drops: `banshee_bow` (both hands; counts as one piece), `banshee_quiver` (back), `banshee_hood` (head), `banshee_cape` (cape), `banshee_shoulders` (shoulders). Each can be equipped independently. Queen-only cuirass, bracers, legguards and boots complete her outfit but are not additional set pieces or random drops.
- Any **two distinct pieces**: each player arrow has a **20% chance** to freeze a living hostile enemy for **1.5 seconds**. Bonus is captured when the arrow is released and rolled once on impact; it does not convert ordinary ammunition into ice arrows, shorten longer freezes, apply to practice targets/players/allies, or duplicate death rewards.
- **All five pieces**: icy footprints only. Floor-rendered trails use a render-local weak cache, maximum 48 stamps and 2.2-second lifetime, with no saved actors, terrain changes, slowing or damage. Actual displacement is required; standing, teleporting and airborne movement do not create trails. Hooks cover expedition/house ground, playable lobby, storage and upper-temple rooms. The separate TV platformer is unchanged.
- Queen rig is registered in Animation Studio and definition/project-rig exports as `banshee`; old authored packs without that field remain compatible. Existing `authored/rigs.json` was not changed.

## Files changed for this addition

New runtime modules:

- `src/banshee-queen.mjs`
- `src/banshee-motion.mjs`
- `src/banshee-gear-art.mjs`
- `src/banshee-steps.mjs`

Small integration edits within already-modified source files:

- `src/core.mjs`: appended event, Queen initialization and AI route.
- `src/definitions.mjs`: humanoid stats, five drop definitions, legacy-event retention and animation serialization.
- `src/rig-subjects.mjs`, `src/project-rigs.mjs`: humanoid renderer/studio registration and rig export.
- `src/navigation.mjs`: humanoid door navigation.
- `src/items.mjs`: five set pieces, four Queen costume pieces, two-piece set-stat support and random-loot exclusion.
- `src/adventure.mjs`: snapshot the arrow bonus at release; once-only freeze on enemy impact.
- `src/gear-art.mjs`, `src/wearable-art.mjs`, `src/item-art.mjs`: custom material ramps, fitted skull shoulders, hood, cuirass and inventory/ground-loot silhouettes.
- `src/human-head.mjs`: optional eye color; existing player eye colors stay unchanged.
- `src/player-motion.mjs`: fitted quiver clasp, new bow accents, widened torn cloak and cuirass skin color.
- `src/render.mjs`, `src/playable-lobby.mjs`, `src/hero-ui.mjs`, `src/temple.mjs`: floor-only cosmetic footprint hooks. Hero tooltips also display the two-piece bonus.
- `tests/banshee-queen.test.mjs`: 15 focused tests.
- `scripts/verify-banshee-queen.cjs`: isolated Electron QA using the local Electron binary via Node `spawnSync`.
- This note. The main development handoff and version files are unchanged by this addition.

## Verification

- `node --test tests/*.test.mjs`: **779/779 passed**, including existing anaconda, wildlife, creator, equipment, arrows, rooms and save regressions.
- `node scripts/verify-banshee-queen.cjs`: **16/16 real Electron checks passed**, including 48 native humanoid poses, the actual world actor queue, Queen bow timing/freeze pause, actual player-arrow freeze collision, reload, real world/storage/temple footprint hooks, fading pixels and live five-piece inventory tooltip.
- Screenshots visually inspected: Queen close-up, 48-pose/equipment sheet, event with five escorts, footprint trail and equipped-set inventory.
- QA artifacts: `test-output/banshee-queen-qa-1791324158249-14204/`, with `report.json` and screenshots. Profile is isolated beneath that directory; no user game was stopped.
- No physical-controller testing, multiplayer hardware testing, listening review, FPS claim or new packaged-game verification. Cosmetics intentionally are not saved; they regenerate locally from movement after reload/network updates.

## Integration

Keep the four new runtime modules, the small imports/routes listed above and the new test/QA script together. No additional renderer hook is pending: footprints already render on the floor independently of actor depth, using `drawBansheeSteps(ctx, game, options)`; Queen drawing routes through `rigSubject('banshee_queen')` and the existing humanoid renderer. Do not overwrite authored rigs or dirty source to integrate this patch. Rerun the tests and QA against the integrated source, then rebuild the desktop package as a separate step before claiming the executable contains this feature.
