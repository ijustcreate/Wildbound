# Wilds art and directional minimap markers

The Stormwatch approach now opens between four pines so the crest, gatehouse, and drawbridge come into view together. The normal solo camera eases back at the bend. Its framing follows the explorer out of the approach, and the eastern stable entrance stays clear. Amber window light reaches the drawbridge steps at dusk and night. At Mermaid Lagoon, moonlight catches the cliff rims and animated waterfall spray.

The Tideglass coast blends meadow into shore with wind-bent plants, salt scrub, and slate chips. Low Greywake trails carry exposed roots and gravel near the foothills and acquire frost as they climb. Mossbell Hollow has hanging moss, flattened ferns, and slime on the roots around the edge. The subdued ground inside the clearing leaves Mireheart’s slam cue readable.

Dara Moss checks a letter satchel, and Arsenius Jigger lifts a small vial to inspect it. Hermione taps a tuning fork during her existing garden lamp-ward conversation. The poses use the native player rig and the dialogue portrait samples the same gesture timing as the world sprite.

Player markers are larger and use each player’s color, a light rim, and a dark outline. The rounded back and pointed tip rotate with world facing. The forest, boundless map, Wilds, railway, Greyhaven interior, and crypt use the same shape. The primary explorer draws above overlapping co-op markers.

## Verification

- All 71 focused Node tests passed. The art import-order check passed on its isolated rerun after a timeout in the full suite. The full run was stopped before it finished.
- Muted source Electron checks included 18 minimap direction and layering assertions, 31 Wilds clock and split-camera assertions, 21 terrain checks, 38 Mossbell combat and save checks, and eight streamed Greyhaven and Mermaid Lagoon checks. The resident review also exercised all 24 trade-prop facings and confirmed the fork appears in Hermione’s actual dialogue portrait.
- Source captures are in `test-output/environment-art-review/source`, `test-output/wildbound-art-approach/streamed`, `test-output/alley-trade-gestures`, and `test-output/minimap-directions/source`.

## Desktop 1.2.183

The package records commit `4f5a265aff90222b12527182211abf2c90c0ed17` and marks the source as modified at packaging time. All 20 runtime files changed for this art pass matched the reviewed source by SHA-256. The exact executable at `dist/1.2.183/Wildbound-win32-x64/Wildbound.exe` passed its muted lobby boot. Its app resources passed 204 scripted Electron assertions across the minimap, residents, Wilds terrain, Mossbell, Greyhaven, and Mermaid Lagoon, as well as the dedicated 24-view trade-prop and dialogue portrait review. These checks reported zero renderer errors.

The normal-profile `Wildbound Worlds (1.2.183).lnk` targets `Play Wildbound.cmd` with `-BuildDirectory "dist\1.2.183\Wildbound-win32-x64"`. The shortcut fields and the launcher’s `--check` output both resolved to the exact numbered build.
