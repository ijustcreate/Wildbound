# Wildbound 1.0.24 - Lobby inventory

Launch **Wildbound Latest (1.0.24)** on the Desktop. Once an explorer has joined the lobby, press **I** or the controller's mapped inventory button (View/Back by default) to open the backpack. Equip, unequip, split stacks, and organize items using the existing inventory controls. Press I again, Escape, controller B, or the close button to return to the lobby.

Equipment changes persist to the selected hero, update practice combat, and carry into the expedition. Opening inventory cancels readiness and blocks movement and attacks for that player. Dropping items, placing traps from the backpack, and salvaging remain expedition-only.

All 402 automated tests passed. A focused Electron check verified keyboard joining, inventory visibility, Escape closing, and I toggling. The rendered inventory was visually checked. The broader UI smoke failures reported for 1.0.23 were not addressed in this change.
