# Wildbound 1.2.91 — railway/world polish and expanded inventory

## Symptoms and causes
- Backpack displayed 32 wells but capacity, storage transfers, rewards and controller traversal still used 24.
- Native rest-rig migration retained edited base clips in provenance, but replaced their live jump/locomotion clips. The authored rig file was not deleted or overwritten. This release preserves those clips and recovers recognized displaced clips from previous migrations without replacing later custom poses.
- Train test bypassed gait clocks, normal inventory handling, native forest grass, and continuous mechanical audio. Door boarding needed Interact; front walls could be overpainted by furniture. Tender coal and cups used coarse primitives.
- Swimming beneath piers ignored underlying shore depth. April used an elevated waterline and path cells did not validate intervening obstacles. Beach rock support and visible footprints disagreed; legacy humanoid feet offsets displaced collision from visible feet.

## Changes
- Complete 32-slot backpack storage, equip/unequip, rewards, bag extraction, transfers, carry/drop and controller traversal; chest capacity remains separately bounded.
- Jump-only boarding, correct walking animation, occupied roof removal and front-wall gradient fading, complete unoccupied exterior walls, reflected train glazing, corrected wheel rotation, cylindrical road-car tires, visible tender walkway and removal of external boarding steps.
- Front-chimney billowing exhaust, moving coal pixel clusters with a bounded GPU rattle/fallback, continuous riding/pass-by rolling and steam audio, whistle, night headlight, and two round lootable cocoa mugs. Cocoa heals 35; Happy lasts 300 simulation seconds, sparkles occasionally and adds 10% player damage. Only earned cocoa/healing/buff transfers back from the isolated test party.
- Large native forest railway uses the existing forest ground, grass GPU renderer, trees, water shader and sunlight. North lake station has a traversable waiting room, native house floors/windows/furniture, roof hiding, lights/contact shadows, platform, cats and 13 editable flavor props: five animated, four light/particle subjects and four static luggage/garden subjects. Railway editor includes Station controls and all original track/interior/eight-view/pixel/version/draft tools.
- Both station and house clocks display the local computer time. House wall clock is an additive, editable furniture upgrade.
- No slime footprints; wider ooze. Pigs drawn 30% smaller. Shallow water remains wadeable below bridges/piers; dry land cannot retain an underground swimmer. Beach rock collision/support follows its visible base; native humanoids use their visible feet for scenery/mausoleum collision. April uses native swimming/waterline and continuous-segment path checks. Campfire upright log removed and flame lowered between crossed logs.
- Includes earlier mode/table reset, two-row Classic map selector without House, Mario cavern collision/respawn/shell fixes, dev train transition and bridge swimming fixes.

## Preservation and verification
- Authored rigs.json retained at SHA-256 DC05411B47F02259BE95EA0ED22AEA375D76F79B55D7F0BDEC57DA5DF7ED7D71. No deleted tracked source/assets, resets, profile replacement or save migration. Unfinished railway/house editor drafts remain local and are preserved.
- Muted isolated Electron source verification: 49 checks, zero renderer errors; actual native grass shader, seven railway editor tabs, 32 usable inventory wells, live train audio lifecycle, all eight exterior/interior/seated directions, station day/night and under-bridge traversal. New capacity, cocoa, migration, clocks and shoreline regressions are included. Final full-suite/build/package/web receipts are in test-output and reported on delivery.
- Normal profile launcher is the repository Play Wildbound.cmd. Desktop shortcut targets that launcher with blank arguments and assets/wildbound-icon.ico. Generated builds, test profiles, personal saves and shortcuts are excluded from Git.
- Physical controllers, network multiplayer and measured FPS have not been verified. Artwork is revised for user playtesting; screenshots and automated checks do not constitute user aesthetic approval.
- Source identity is the commit containing this note. Clean-source desktop/web manifests record that exact commit. Source push, rebuilt desktop, and versioned GitHub Pages publication are separate verified operations; previous web snapshots are preserved.
