# Ritual tiger and separate loot popup — 1.0.57

Preserves the uncommitted 1.0.56 work. Source HEAD is 1891708d014594bd837f1a7049ecefa04d16dae4; build sourceDirty is true. No push requested or performed.

Equipped Ritual Dagger creates a separate owner-bound ritualPet, without replacing a Ranger companion. It leashes/teleports back, targets owner-hit enemies and recorded attackers, disappears on unequip, and uses the tiger animator instead of the generic hunter pet rig renderer. Room companions use room coordinates. Chest opening spawns two independent hostile ghost tigers; their fear behavior is removed, melee can kill them in the sanctum and outside it, and walking advances animation frames.

Chest storage renders a standalone loot row popup with rarity-colored names, quantity, individual pickup, Loot all, notice, close, and retained victory restart/lobby actions. No paper doll/backpack is embedded. Underlying transfers retain capacity/access checks. Popup controller movement is one row at a time. Legacy storage transfer APIs remain available; deposit UI is not exposed in this pickup popup.

Verification: full serial Node suite 605/605 passed; final small popup class cleanup, tiger animation step, and tooltip changes subsequently checked with focused tests/syntax. Electron boot and victory loot DOM assertions passed; screenshot inspected at test-output/ritual-loot.png. Physical controllers and full combat playthrough not tested.

Normal packaged output: dist/1.0.57/Wildbound-win32-x64/Wildbound.exe. Desktop Wildbound Latest (1.0.57).lnk targets repository Play Wildbound.cmd, uses project icon, normal save profile (no runtime --preview). Launcher build identity checked. Previous builds/saves retained.
