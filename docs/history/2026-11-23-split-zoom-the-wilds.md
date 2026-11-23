# Split camera zoom and a direct Wilds start

## Changes

- Split-screen player views frame about eight percent more of the scene. The threshold for splitting and the shared camera remain unchanged.
- Added a third Adventure Mode choice, **The Wilds**. Accepting it uses the existing `enterWildLands` entry path from the developer menu and then transitions to the train play screen. The usual Expedition choices and saved expedition remain available.

## Muted Electron review

- Split capture: `test-output/split-zoom-preview/split.png`; the two active views reported zoom 1.518 (default maximum 1.65).
- Menu capture: `test-output/the-wilds-menu-preview/menu.png`.
- Selecting **The Wilds** enabled Accept and hid the map chooser. Accept entered play with design name `The Wild Lands`, `wildLands: true`, and the expected welcome message. The renderer reported no errors.
- The muted isolated capture reached the normal “Preparing woodland railway…” screen, but the terrain remained in preparation at the six-second screenshot. Fully loaded gameplay was not visually reviewed. No test suites or desktop package build were run.
