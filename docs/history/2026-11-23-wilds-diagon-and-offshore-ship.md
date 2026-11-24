# Wilds, Diagon Alley, and the offshore ship

## Expedition and railway

- Accept on the Adventure Board resumes the saved Wilds slot directly. A first visit creates a fresh expedition. The chooser keeps its styled error message if a checkpoint cannot be read.
- The railway draws its ground, tracks, and train while nearby scenery streams. The renderer waits for local collision and spreads higher-detail work across later frames. Three isolated, muted Electron trials reached player control in 0.59–1.55 seconds, compared with 15.64–16.74 seconds against the 1.2.120 package. Reports are in `test-output/railway-startup-probe/`.
- In the train, riders and furniture now share depth and reusable masks. The student pose rests on the cushion. The overlap and gangway sweep covered eight headings. The warmed interior fixture measured lower mask drawing time. Sustained hardware FPS and physical controller input were outside the checks.
- Each student gift is offered in dialogue with accept and decline replies. The offer remains available after a decline or a full backpack. Accepting adds the item and records the claim once per explorer.

## Diagon Alley

- Gringotts sits at the north end of the avenue. Nocturne Alley branches off to Nocturne Curios and Nightglass Apothecary, two furnished walk-in merchants. Dark service yards follow the map's walkable paving. Decorative shops have unsigned windows.
- Thirteen residents walk routes tied to the expedition clock, visit specific locations, speak with neighbors, and have their own dialogue and outfits. The new shops sell four wearables, a wand, a brooch, and a tonic.
- Thirteen street props compile from editable pixel recipes. Their locations, the uneven cobbles, and the bank view use the photographed set as reference. The [prop art notes](../art/diagon-alley-street-props.md) contain the placement references. [Paving photo](https://www.wbstudiotour.co.uk/wp-content/uploads/2026/02/diagon-alley-top-1920x1080-1.webp) · [Shopfront photo](https://www.wbstudiotour.co.uk/wp-content/uploads/2026/02/diagon-alley-shops-1920x1080-1.webp) · [Gringotts photo](https://www.wbstudiotour.co.uk/wp-content/uploads/2026/02/diagon-alley-gringotts-bank-1920x1080-1.webp)
- The two Floo fireplaces are in Nocturne Curios and the Wilds Homestead. Buy Floo Powder at Nocturne Curios, stand inside either hearth, and Interact to spend one pinch on the trip. The origin and arrival each show green fire. Travel has no prompt without powder.

## Eastern Wilds

- The map is 20 percent wider. Existing Wilds checkpoints keep their coordinates. Greywake Mountain rises east of Portal Island, with a lower coast trail that leads south to Smugglers’ Hollow and switchbacks that rise 465 world units to Greywake Summit. Players follow the grade, and the same terrain geometry controls rendered elevation, cliff collision, footstep surfaces, and the marked hostile groups’ paths. Monsters route around the pool and across the switchbacks when a direct lane is blocked.
- Smugglers’ Hollow has its own cave entrance and return passage, floor, rocky shelves, teal water, lanterns, cave acoustics, cache, and minimap. It preserves the actors in both areas when the party crosses the entrance. The new zone and acquired supplies can be saved and resumed.
- An original three-masted galleon is moored across a lowered plank from Portal Island. A weathered wreck sits in the cave harbor. Both have two connected rooms below deck, three rope climbs, elevated crow’s nests, and cannons that reload after a shot. Local co-op can split between decks, and both characters remain visible with split view disabled.
- Native implementation uses projected environment layers, shared collision for player and monster navigation, paint-order masks for ship riders, and local light and water effects. The two ships share movement and interaction rules, with distinct hull details and rigging treatments.

## Desktop build and verification

- Wildbound **1.2.121** was built at 00:38:13 UTC on November 24, 2026, from modified source on `Wildbound_worlds` at `5b244635ab78e5a3c8e78ef21fdbabf60e505fd7`. The normal-profile executable is `dist/1.2.121/Wildbound-win32-x64/Wildbound.exe`.
- `C:\Users\New User\Desktop\Wildbound Worlds (1.2.121).lnk` targets `C:\Users\New User\Desktop\Wildbound\Play Wildbound.cmd` and pins `dist\1.2.121\Wildbound-win32-x64`. The default and pinned launcher checks, executable version, icon, and muted lobby smoke test matched. The desktop content check compared 1,854 runtime and asset files byte for byte.
- The full suite passed 2,325 of 2,326 cases on its first pass. The gear test applied a short hat height allowance to the new pointed Inkcap. Its corrected eight-direction test passed with the rest of the gear and railway-scheduler suites. Packaging syntax-checked 1,019 files.
- The packaged Diagon/Floo, residents, ship, harbor, real terrain worker, inventory, student gifts, startup visuals, and train-layer verifiers passed 684 checks with zero renderer errors in muted Electron. The worker check moved through the extended east, entered and exited the Hollow, and saw no fallback or worker errors. Its cold eastern collision request completed in 11.99 seconds while local collision had already released the starting view.
- Saved riders were checked at both berths in all five states, including halfway up a rope. Transient cannon projectiles and reload timers reset when a checkpoint is reopened. The latency figures cover controlled Electron fixtures. Physical controller checks and sustained hardware FPS were outside the verification scope.
