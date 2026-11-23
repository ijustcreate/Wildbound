# Forest encounters with weapon combo routes

| Encounter | Route choices |
| --- | --- |
| Ember Clearing | A starter bow and arrows wait at the approach. The campfire sits on the open line to two slimes. Side gaps let explorers circle around the fire or approach the slimes from behind. |
| Snare Pass | A pair of low ruins frames a straight lane. Pick up snares, set one in the path, and lure a zombie through or charge a strike from the rear. The right path gives a solo explorer room to reposition and gives a co-op partner another way in. |
| Shieldgate Ruins | A shield and archer cover the left lane. The right lane has a campfire, Frost wand, and a stone backstop behind the charger. Both routes connect behind the center wall. |

Ordinary forest board rolls offer an undiscovered encounter when progress and space permit. Ember Clearing can appear from the first forest roll, Snare Pass from trail position 7, and Shieldgate from trail position 16. The roller stays in place. Encounters use clear terrain and the game falls back to the ordinary event pool when a layout cannot fit. Each layout uses the existing ruin footprints, light and arrows, loot pickup, enemy controllers, and player-placed trap rules. Restoring an expedition keeps the campsite, walls, and remaining supplies. A repeat visit reuses the layout without refreshing the supplies.

Studio → Events offers the same layouts for authored encounters. The preview shows the solid footprints, entry and flank routes, and the order in which enemy groups use the marked spawn points. Choosing a layout sets the forest location. Studio’s existing save and definition export paths store that choice. Existing authored rosters receive missing native cards by name without changing their previous order. The Dev menu’s event picker can spawn a selected layout on a clear forest map for a longer playtest.

## Verification

The 43 focused tests cover this feature alongside event selection, editor definitions, Crossfire roles, fire arrows, and weapon knockback. All 28 muted source Electron checks passed with zero renderer errors. They cover the normal board encounter path, Studio Events controls, walking both side routes with normal collision, ordinary loot pickup, campfire ignition, a partner’s trap, ruin-wall impact, and a save round trip. Captures and the native report are under `test-output/encounter-layouts/source/`.

Verification uses scripted play in an isolated Electron profile. The layout suite does not measure full-session balance or hardware controller feel. This pass did not create a desktop package or edit authored artwork. The checkout is `Wildbound_worlds` at `f0b787ff33c3ac8f3675b48504937ebda4f0dcb5` plus modified files.

## Release-sweep follow-up

The release suite caught a missing old-pack migration for the twenty biome patrol cards. Old definition packs now receive those cards by name in native roster order. The all-events regression now tests the new layouts in their actual generated biomes, while the boundless regression clears each completed setup before checking the next pressure-limited patrol. Those fixtures previously reused stale biome terrain or stacked every realm patrol at once.

The Dev event test board advances through the complete roster again. Explicit previews can resolve a safe outdoor layout in another biome, and a mixed preview uses ordinary test-board terrain fallback if the native unit surface is unavailable. Natural encounter eligibility and invalid-site checks still apply during normal play. All 14 Dev-board and layout checks passed, along with the three targeted realm, all-events, and legacy-definition regressions.

The board-loot regression now checks actual landings on spaces one and four. It allows Ember Clearing’s manual world pickups and verifies both landings leave the explorer’s inventory unchanged and the second landing adds no loot.
