# Diagon Alley edges, Gringotts vault, and carried torch

- Decorative façades, service yards, and props fill the exposed perimeter of Diagon Alley and Nocturne Alley. The Mage Garden and Ollivanders paths meet the avenue through fitted curbs, and staggered paving blends the Nocturne connector into the avenue. The rear lane and cemetery transitions interlock with the surrounding ground. The existing paths and collision layout define the pedestrian route.
- All seven Mage Garden trees use the native forest canopy and bark brushes. Their species colors, roots, owl perches, sway, and pond reflections are retained. The Nocturne connector wall has stone coping and 13 unique mounts, including a Sirius Black wanted sheet and several groups of wizard postings. A ginger tabby walks the coping and periodically lies down.
- Griphook offers a conversation from the teller aisle. He explains that the vault sends each visitor to their existing personal storage room. The bank still offers Dark Essence exchange. The vault has editable pixel recipes and animates its lock, bolts, and door before exposing the portal. Separate portal records retain each visitor’s safe arrival point and survive an expedition save and reload. The vault uses the same three chests, SCRAP-9, and vending machine as summoned storage.
- The held torch’s flame, smoke, and embers trail against the player’s actual travel and ease back toward vertical. Enlarged effect bounds and scene-level painting from the wick remove the abrupt glow cutoffs at the effect and actor raster edges. Fixture torches stay vertical.

## Verification

Muted, isolated desktop Electron reviewed 17 daytime and four nighttime alley views and passed six movement checks. Separate reviews covered tree canopies and reflections, six vault animation states, dialogue, torch motion, and all 13 wall props. The packaged vault and wall check passed 13 assertions with zero renderer errors. It exercised Interact and walk-in entry, concurrent storage rooms, SCRAP-9, the vending machine, both exits, and the walking and resting cat. The Node regression also verified movement held during the door animation, separate chest contents, the station gate while storage is occupied, and a save round trip with two bank routes plus a summoned portal.

Captures and reports are under `test-output/alley-vault-and-wall/`, `test-output/gringotts-vault/`, `test-output/gringotts-dialogue/`, `test-output/mage-garden-tree-art/`, and `test-output/torch-motion/`. Hardware controller and remote co-op play remain unverified.

## Desktop build

Version `1.2.176` was packaged from the modified `Wildbound_worlds` checkout at `a6cee9bc55ad12ed58df5c3d27b150449f31ef26`. Node parsed 1,252 runtime files. The packaged executable passed its muted lobby boot smoke test and the normal-profile launcher's `--check` resolved to `dist/1.2.176/Wildbound-win32-x64/Wildbound.exe`. The `Wildbound Worlds (1.2.176).lnk` shortcut targets `Play Wildbound.cmd` with `-BuildDirectory "dist\1.2.176\Wildbound-win32-x64"`. The full repository test run was stopped early. Focused Node tests and the desktop playthroughs above passed.

## Animated wanted portrait

Sirius Black blinks, glances left, and turns forward again on a 4.8-second loop. The six editable frames share the existing portrait palette and anchor. The wall painter overlays the animated 14×14 portrait on the cached poster using the game clock.

Muted source and packaged Electron sampled every frame in the Nocturne connector. The image returned exactly to idle, its screen anchor stayed fixed, and pixels outside the portrait remained identical. All 28 focused alley and pixel-recipe tests passed. Captures and the frame report are in `test-output/sirius-portrait-animation/`.

The normal-profile `1.2.178` package was used to verify the portrait before the checkout advanced to `1d7d016828832dde460986ddba403c30ee26799a`. Its executable passed muted lobby boot and all three portrait files matched the source.
