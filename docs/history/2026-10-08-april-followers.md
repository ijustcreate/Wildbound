# April follower and villager camp

Symptoms: April followed without visible walk-frame progression and did not fight nearby hostiles. The seven villagers were scattered across the board, and April's dialogue presented six extra gesture choices. The debug camp view also manually spread the villagers out. Their camp remained visible after Wildbound was won.

Changes: `src/villagers.mjs` advances April's stride from actual movement in the world and rooms; she approaches and attacks nearby hostiles with a sword animation and 0.85-second cooldown. Camp placement chooses seven reachable positions around one safe anchor. Every villager now offers story, one personal interaction, and leave. `src/debug-tools.mjs` shows the real compact camp. `src/adventure.mjs` clears the camp, follower, and visit state on victory and on a new expedition.

Verification: 27 focused Node tests passed across villagers, NPC quests, and house worlds. Muted Electron QA passed against source and packaged ASAR, including visual walk frame advancement, combat, compact placement, three dialogue choices, save/restore, and victory cleanup. The full repository suite was not rerun; earlier unrelated failures on this shared dirty checkout remain unverified.

Build: `dist/1.0.109-april-followers/Wildbound-win32-x64/Wildbound.exe`, built 2026-10-08T19:10:57.413Z from commit `bc1b432d20f4b0de0b04d4d3b34600f7a9fe0a70` with modified tracked source. `Play Wildbound.cmd --check` passed. Desktop shortcut `Wildbound Latest (1.0.109-april-followers).lnk` targets `Play Wildbound.cmd`. A prior 1.0.108 game was running during packaging and was left untouched. Normal launch uses the normal save profile; `--preview` uses a separate profile. Changes remain uncommitted and unpushed.
