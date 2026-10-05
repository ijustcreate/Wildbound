# Necromancer automatic companion — 1.0.59

Enemy death processing uses player kill attribution (melee/projectile damage) and checks the currently equipped complete Necromancer set. It raises one skeleton only when that owner has no living skeleton. A dead skeleton does not block the next kill, and automatic replacement bypasses the manual skill cooldown. Manual Raise Skeleton remains available. Having gear in the backpack, partial sets, living targets, practice targets and another player's kills do not trigger it.

Skeleton companions are included among enemy AI/projectile targets and have damage/invulnerability handling, making death and replacement possible. Ghost update skips dead companions and advances their hit recovery.

Preserves all earlier uncommitted work. Focused tests and isolated Electron game-loop checks cover automatic kill trigger, no duplicates, death/replacement, and unequip. Full test results: test-output/necromancer-suite.log. No physical hardware playtest. No commit/push requested.

HEAD 1891708d014594bd837f1a7049ecefa04d16dae4, modified source. Normal Electron profile; dist/1.0.59/Wildbound-win32-x64/Wildbound.exe. Fresh Wildbound Latest (1.0.59) desktop shortcut targets repository Play Wildbound.cmd and uses project icon.
