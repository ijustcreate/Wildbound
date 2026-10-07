# Varied Events test build and equipped-wing hover

Base `edc664ea35a4c75710570680dca26c6e1387f658`, dirty `main`. No commit/push, source version bump, global handoff edit, authored-rig edit, save migration on disk or replacement of earlier builds/shortcuts. No user game was stopped.

## Fixes

- The existing packaged 1.0.71 archive contained the original independent weighted picker, not the newer source event director. The source director previously excluded only three recent card names, so heavily weighted cards could still dominate long runs.
- Director version 2 records bounded per-name exposure counts, prioritizes the least-seen currently eligible cards, prefers a different lead species and excludes six recent names where the pool permits. Authored weights choose order among equally seen cards. The original biome/time/terrain, active merchant/mystery/weather, crowd and boss-spacing restrictions remain authoritative. Disabled events stay disabled. Small pools have safe fallback; rare or newly added cards are no longer indefinitely buried behind common ones.
- Removed the forced first lion/tiger override. New openers use the same safe varied selection as later rolls. Existing event indices are unchanged.
- Exposure and 24-card history persist in expedition snapshots and across `newExpedition()`. Version-one director saves retain their history/spacing; older packaged saves use their existing `encounteredEvents` map as migration evidence. Coverage has at most 256 keys. No normal profile was read or written by QA.
- Equipped `succubus_wings` now enable held-Jump flight: smooth 90-unit/second lift toward 42 units above the local support surface. Release or unequip ends hover and existing jump gravity handles descent/landing. Walking input still moves the ground anchor; normal geometry remains solid. Contact shadows, water, ground hazards and save/reload use the existing real jump elevation, not a visual-only height or wall-bypassing flight flag.
- Existing airborne humanoid pose and optional bat wings animate the hover. No default bones, automatic tails or passive flight are added to other characters. Death, rooms, UI/input capture, roots, stun, sleep, freeze, charm and the opening board prevent starting hover. Ordinary held jumps still land without repeated jumping when wings are absent. Item description explains the control.

## Exact edited/added paths for this request

Runtime: `src/event-director.mjs`, `src/core.mjs`, `src/items.mjs`, `src/player-motion.mjs`, `src/succubus-attachments.mjs`; new `src/wing-flight.mjs`.

Checks: new `tests/event-variety.test.mjs`, `tests/wing-flight.test.mjs`, `scripts/verify-event-variety.cjs`; updates to `tests/combat-expansion.test.mjs` (explicit tiger fixture replaces obsolete forced-opener expectation) and `tests/succubus.test.mjs` (no *automatic* flight).

Delivery: new `scripts/build-event-variety.cjs`, `scripts/launch-event-variety.ps1`, `scripts/create-event-variety-shortcut.ps1`, `Play Wildbound Varied Events.cmd`, and this note. Generated build identity, test logs and isolated profiles remain in ignored `test-output/`; the new executable remains in ignored `dist/`.

## Verification

- Final full Node suite **879/879 passed**, log `test-output/event-variety-wings-tests-1791330626338.log`. Focused flight/succubus/combat suite **46/46 passed**. Event-director/core focused suite **40/40 passed** before adding flight.
- Syntax checked **240 runtime files**. **252 shipped runtime/UI files** match source SHA-256 hashes recorded in the new `wildbound-build.json`. Windows archive lookup verification normalizes nested paths to native separators; the first verification attempt failed on that harness detail, not because files were absent. The incomplete new snapshot was verified and finalized without replacing any existing build.
- Source Electron **723 checks passed**, `test-output/event-variety-qa-1791330615858-712/`.
- Exact packaged `resources/app.asar` Electron **723 checks passed**, zero captured renderer errors, `test-output/event-variety-qa-1791330970972-5020/`. Actual desktop entry and save bridge booted in an isolated profile. Checks cover all six maps, eight distinct actual roll-resolution/spawn/render encounters per map, full daytime eligible-roster coverage, boss spacing, save/reload, new expeditions, forest night-card coverage, live held-Jump takeoff/movement/hover/release/landing/unequip, native wing flapping, no player tail and real ground-shadow separation.
- Fixed-source coverage simulations reached every eligible daytime card: forest 39 unique in 51 draws, jungle/temple 40 in 49, desert 36 in 42, ice 39 in 48, house 36 in 45, beach 35 in 44. Some repeats remain necessary while previously unseen bosses or active hazards are temporarily unavailable; this is intentional safety pacing, not an unrestricted no-repeat guarantee.
- Rendered screenshots inspected. No physical-controller, FPS, hardware, listening or long-form difficulty playtest claim. The broader game/board visual limitations documented in earlier notes are not claimed resolved by this request.
- Final identity recheck confirms all 252 archive files still match the manifest. Other ongoing workspace work changed several source files after this snapshot was finalized (including `core.mjs`/`items.mjs`); those later edits were preserved, not overwritten or silently folded into this already-tested package. The packaged encounter/hover checks above ran against the pinned archive, not those newer working files.

## Delivery identity

New non-overwriting snapshot: `dist/event-variety-2026-10-06T23-54-17-922Z/Wildbound-win32-x64/Wildbound.exe`.

Manifest: version `1.0.71`, variant `Varied Events Test`, `eventDirectorVersion: 2`, `wingHover: true`, modified source at the base commit above, finalized `2026-10-06T23:55:54.128Z`, `preview: false`.

Desktop `C:/Users/New User/Desktop/Wildbound Varied Events.lnk` targets this checkout's `Play Wildbound Varied Events.cmd`, working directory this checkout, empty arguments and Wildbound icon. The launcher reads `test-output/event-variety-build.json`, validates the exact event-variety snapshot/manifest, and launches that executable with **normal existing Wildbound saves, no runtime `--preview`**. `--check` reports the exact executable/build/profile. Existing Creature Test and Latest shortcuts remain unchanged.

To reproduce: run the full Node suite, then `node scripts/build-event-variety.cjs --electron-zip-dir <existing Electron 41.10.7 ZIP directory>`, run `node scripts/verify-event-variety.cjs --app-path <new snapshot>/resources/app.asar`, and create a uniquely named shortcut only after success. Keep the complete packaged folder together. Do not overwrite earlier releases or reset unrelated dirty work.
