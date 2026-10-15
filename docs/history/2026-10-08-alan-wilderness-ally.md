# Alan wilderness ally and Jumanji gear

Alan enters a Wildbound forest or jungle board after the second player roll there, with a board announcement. He uses the Oathless Captain animation rig fitted to normal player body anchors, fights hostile monsters, and offers follow or patrol choices through the NPC dialogue UI. A follower travels with the choosing player; a patroller stays on the board. The encounter is unique per campaign.

Alan wears a custom turtle-shell helmet, leaf mantle and cape, tunic, wraps, trousers, boots, medallion, and a curved Jumanji jungle knife. The helmet has a smooth shell edge without leaves, a back taper, a slight front rise, and a single front-to-back spine. A complete nine-piece player set makes a successful knife melee hit hold the target in vines for two seconds and heal eight HP, at most once every 12 seconds.

The side profile was refined against the user's green markup: the rear edge extends lower and farther back, the face-side edge ends earlier, and the crown has a short rounded plateau. The change is in `src/alan-gear-art.mjs` and is visible in `test-output/alan/hero.png`.

Relevant source: `src/alan-ally.mjs`, `src/alan-motion.mjs`, `src/alan-gear-art.mjs`, `src/jumanji-vines.mjs`, and integrations in `src/core.mjs`, `src/items.mjs`, `src/house-worlds.mjs`, the NPC dialogue modules, rig registry, and player equipment rendering. `authored/rigs.json` contains the editable Alan rig. No existing profile or save was migrated.

`scripts/verify-alan.cjs` passed in muted Electron against both source and the packaged ASAR, covering 1,704 animation frames, entrance timing, dialogue, follow/patrol, travel, combat, and the full-set effect with cooldown. It writes `test-output/alan/hero.png` and `assembled.png` for visual review. Packaging syntax-checked 316 runtime files. The repository-wide rebuild test phase did not pass on this shared dirty checkout; failures include unrelated boomerang, trap, event, loot, vending, villager, reaper, and panther tests. The packaged game was not validated by a complete manual playthrough.

Latest verified build: `dist/1.0.105-humanoid-ghost/Wildbound-win32-x64/Wildbound.exe`, packaged 2026-10-08T18:11:02.300Z from commit `bc1b432d20f4b0de0b04d4d3b34600f7a9fe0a70` with modified tracked source. `Play Wildbound.cmd --check` passed; Desktop shortcut `Wildbound Latest (1.0.105-humanoid-ghost).lnk` targets `Play Wildbound.cmd`. Normal launch uses the normal save profile; `--preview` selects a separate profile. Changes remain uncommitted and unpushed.
