# Wildbound 1.0.1 · Jungle Temple test build

Includes all 1.0.0 features and these additions:

- Lobby starts with two slots and reveals one spare slot as players join, up to six. Map, dice and difficulty each occupy a separate row. Up/down navigates; left/right changes the focused option.
- New character creation lives inside Choose character. With no saved characters, the player card instead offers Create new character directly.
- Jungle Temple map: stone interior, carved decorations, torch details and dense jungle outside. Walk onto the northeast staircase to enter the Upper Sanctum, a separate room the size of storage. Its south doorway and Return downstairs button take you back.
- Temple-only gorilla boss event with three monkey companions. The gorilla warns before a ground slam and pauses to recover. Monkey events are now temple-only.
- The shared upstairs ritual chest contains one legendary Ritual Dagger per expedition. Dagger kills summon the defeated enemy as a ghost ally for 30 seconds. Allies attack enemies, expire automatically, and are capped at six per wielder. The chest's looted state persists in expedition saves.
- Optional PvP checkbox in Settings, off by default. Player melee, arrows and spells can damage other players when enabled. Walls still block attacks and projectiles.
- Fixed excessive spacing above storage chest contents.

## Quick co-op test
1. Launch Wildbound 1.0.1 using the desktop shortcut.
2. Join, select your saved characters and ready up.
3. Choose Jungle Temple on the Map row, then Start Adventure.
4. Find the northeast stairs, open the upstairs ritual chest, take and equip the Ritual Dagger, then return downstairs.
5. Strike the board to roll events. The gorilla encounter appears in the temple's event pool.
6. Enable PvP in Settings only if you want friendly fire during the test.

Existing character and expedition save locations are unchanged. Temple generation requires a new expedition; Continue retains the saved map.

Validation: 222 automated tests; controller lobby flow for 0–6 players; temple, upstairs and chest render checks. Packaged smoke-test results are stored in test-output/results.json beside the executable.
