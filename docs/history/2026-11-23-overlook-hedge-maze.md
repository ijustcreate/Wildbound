# Overlook hedge maze and Cursed Axe

The Garden Villa now extends north of its original boundary. The original rear gate leads around the exterior to the north opening of the supplied Overlook plan. The Wilds places the same upright plan behind the Old Homestead south of the Frostmere railway. Both copies use one uniformly scaled trace of the 131 source wall runs. The layout preserves the long outer paths, all staggered breaks, the north entrance, and the central aisle from the reference.

The clipped crowns and shaded hedge faces reuse the forest brush's light direction and clustered colors. Individual sections expose trimmed stems and low debris when cut. The entrance uses shaped topiary ends, worn coping, and a carved sign. A small octagonal stone platform marks the chest in the center aisle. A nearby character partly obscured by a hedge remains visible through the leaf face.

The chest gives one Cursed Axe per site and allows a retry when the pack is full. The dark forged axe is a normal melee weapon. It changes the visible irises while drawn through the native player rig. Stock and spectral headgear and saved eye colors continue to use their existing presentation and save fields. Damage and the claim are stored with the villa or Wilds checkpoint. The wider villa camera, sight, minimap, and dropped loot use its extended northern boundary. Authored floorplans and original board coordinates remain in place.

## Native review

The original 452 × 678 attachment supplied the hedge footprint. The trace audit placed 99.76% of the thresholded green pixels within one source pixel of the traced strokes. The antialiased outlines resolve into straight hedge faces as shown in the diagram. Native muted QA followed the intact route from the rear gate to the chest in each map and exercised attack, pack capacity, axe equip, and checkpoint restoration. Rig checks covered all eight facings, both hands, stow, movement, and combat.

The final collision comparison matched all 405,528 poster-space mask samples across both sites, including the narrow rim of the two western corners. The terminal art left all 89 world units of the north opening clear. The packaged captures include the whole layout, the original gate approach, the clipped entry, the open chest, and the new axe in the player's hands.

## Desktop test build

The final package passed 52 muted maze checks and 22 muted axe and rig checks with zero renderer errors. Its actual executable reached the lobby with an isolated test profile. All 26 relevant runtime files matched source by SHA-256. The focused house, terrain, destruction, and Wilds regressions passed 52 checks. Tests used scripted movement and inputs.

Executable `C:/Users/New User/Desktop/Wildbound/dist/1.2.116/Wildbound-win32-x64/Wildbound.exe`. Assigned build version 1.2.116, source version 1.2.114, built at 2026-11-23T21:59:14.191Z, source commit c30e70eb53f557eb746f91968d6df7035a89bf67 on Wildbound_worlds, modified source, normal profile. `C:/Users/New User/Desktop/Wildbound Worlds (1.2.116).lnk` targets `C:/Users/New User/Desktop/Wildbound/Play Wildbound.cmd` with `-BuildDirectory "dist\1.2.116\Wildbound-win32-x64"`. The package, lobby, shortcut, and scene receipts are in `test-output/overlook-build-content.json`, `test-output/overlook-boot.json`, `test-output/overlook-shortcut.json`, `test-output/overlook-maze/finished-1-2-116`, and `test-output/cursed-axe/packaged`. No commit or push for this work.
