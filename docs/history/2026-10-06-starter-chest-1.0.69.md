# 1.0.69 — regular starter chest and level restock

## Request and behavior

Replace the lobby starter-gear button menu/sign with a real chest containing all starter gear, refreshed for each new level. The existing uncommitted 1.0.67–1.0.68 inventory, warlock, robot and companion changes are preserved. Base revision remains `edc664ea35a4c75710570680dca26c6e1387f658` on `main` tracking `origin/main`; nothing was committed or pushed.

- Lobby interaction opens the normal chest/backpack transfer UI: both containers show 24 occupied/empty slots, gold selection, withdraw/deposit selected and all, mouse controls and controller-family labels. Opening input does not also withdraw an item. Readiness is cancelled while preparing gear. Automatic controller tooltips no longer cover the starter choices; selected stats appear below the grid, with hover/focus details still available.
- Every existing `starter_` equipment option is included: boomerang, sword, dagger, shield, bow, wand and quiver, plus eight starter arrows. Stock is finite and player-owned, consistent with the prior individual starter-kit menu. One co-op player cannot consume another's choices.
- Each new lobby prepares its starter selection once. Fresh top-down expedition and TV World starts replenish it. Reopening the chest, changing focus or restoring the same expedition does not refill depleted stock. Existing deposited gear, sockets, container contents and excess arrows are kept. Refilling a full chest adds a page rather than deleting deposited items. Profiles persist the new starter chest separately from the three existing private chests; older profiles initialize safely.
- The visible prop now has pixel-native curved wood/plank detailing, metal hoops, rivets, feet, a brass lock, inner recess and hinged opening/closing motion. Its existing interaction/collision footprint is retained. The `STARTER` sign text is gone; the short caption says it restocks each level. No generated raster or new texture download is required.
- Very short chest panels use six columns/four rows rather than four columns/six rows, retaining all slots. Controller vertical movement follows the displayed column count. Other regular and victory chests keep their existing layouts.

## Verification

- Eight starter-chest regression cases cover the complete catalog, transfers, empty slots, full backpacks, favorites, independent stock, no reopening/save-restore duplication, level/TV refill, full-chest pagination, deposit metadata, profile persistence, lobby opening and the chest's open/closed art.
- `scripts/verify-starter-chest.cjs` uses isolated Electron data, actual synthetic Xbox/Switch `inputFrame`, a differently focused player's panel, mouse transfers and real rendering. Its window checks cover 1280×850, 780×600 and 600×430, with 48 visible slots, no collapsed/clipped item cells/actions and D-pad stride matching the resized grid.
- Source Electron regressions also pass: `verify-inventory-workbench.cjs`, `verify-inventory-refresh.cjs`, `verify-tv-wildbound.cjs`.
- Full Node suite: 684 tests passing (including all eight new starter-chest cases). The exact 1.0.69 ASAR also passes `verify-starter-chest.cjs` and `verify-inventory-workbench.cjs`; all 27 changed runtime files match their source byte-for-byte. Packaged syntax check: 195 runtime files.
- The previous release's known bundled full-game smoke-suite failures remain unresolved; see the 1.0.68 handoff. This turn does not claim full-game smoke success, physical controller playtesting or measured FPS improvements. No personal profiles or authored rigs were changed by QA.

## Desktop identity

Version `1.0.69`, normal target `dist/1.0.69/Wildbound-win32-x64/Wildbound.exe`. The adjacent manifest records the base revision above, modified source, `preview: false` and build time `2026-10-06T17:09:02.828Z`. Created and verified Desktop shortcut: `Wildbound Latest (1.0.69).lnk`, targeting this checkout's `Play Wildbound.cmd`, with repository working directory, project icon and no preview argument. `Play Wildbound.cmd --check` confirms the new target. It retains the normal Electron save profile. Existing running 1.0.68 games and older build directories were not terminated or replaced.
