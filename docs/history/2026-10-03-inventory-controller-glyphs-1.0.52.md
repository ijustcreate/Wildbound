# Inventory paper doll and controller direction glyphs — 1.0.52

- Inventory equipment section now places the full character preview at left and a compact paper doll at right with all eleven equipment slots retained. Backpack remains one 24-cell, six-column grid; selection tooltip chooses a free side/above/below position and is constrained inside the panel.
- Added generated transparent atlas artwork for Xbox, Switch Pro, and keyboard/mouse. Shared per-player controller settings cards show D-pad directions and face-button physical positions independently for each mixed controller, plus WASD/arrows/mouse glyphs for keyboard players. Switch face positions use X top, Y left, A right, B bottom; Xbox uses Y top, X left, B right, A bottom.
- Inventory concept is saved in `docs/design/inventory-paper-doll-v2.png`; button atlases in `assets/controller-ui/`. Artwork assets were generated with the built-in image generator and placed into the project.
- Not pushed. No tests run in this turn.
