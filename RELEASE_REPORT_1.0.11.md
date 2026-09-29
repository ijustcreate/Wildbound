# Wildbound 1.0.11

Held items sort independently at their hand depth. Shields narrow in profile and show rear straps; wand tips follow facing with matching spell emission points; swords have angled guards and grips; bows follow facing.

Relics no longer appear on the character. Inventory, relic effects and saved ownership are unchanged. The obsolete relic display selector has been removed.

Validated with 334 unit tests and a rendered 32-view equipment contact sheet covering wand/shield, sword/shield, bow and rifle across eight directions.

Build using `node scripts/package.cjs`, then create the versioned desktop shortcut with `powershell.exe -NoProfile -ExecutionPolicy Bypass -File scripts/create-desktop-shortcut.ps1`. Version comes from package.json. Existing builds and user saves are preserved.
