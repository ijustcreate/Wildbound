# Expedition polish — accepted rules and production checks

This pass follows the October 8 approval and corrections. There is no closing-board phase, mandatory regional guardian, injury veto, active-boss veto, or duplicate-relic restriction.

## Expedition flow and rewards

The director has three soft stages (opening before space 12, developing before 28, established thereafter). The expedition seed favors discoveries, dangerous encounters, or peaceful opportunities. Two high-pressure cards increase the chance of a quieter card; they do not prohibit another boss. Boss cards remain eligible with unresolved bosses, weather and downed heroes. The technical hostile population cap is 36, excluding peaceful actors and stampedes. Coverage survives temporary exclusions and a new expedition.

Regional objectives draw from different pools without repeating the previous objective. They use the existing defeat, protect, explore, rescue, ritual and survive mechanics. Space 40–47 has no special phase. Sealing remains the existing player-triggered action at space 48.

A shared trial ledger follows encounters across destinations and JSON saves. A combat trial resolves when its original group is defeated or captured. Summoned adds do not keep a defeated boss trial open. Surviving the Hunter also resolves his trial without awarding kill drops. Mysteries require their final interaction; underground discoveries require opening the treasure chest. Weather requires surface participation, and a later storm cannot complete an earlier skipped storm. Peaceful actors do not count toward pressure or trial marks.

Marks: ordinary, discovery and hazard = 1; elite = 2; boss = 3. Unresolved trials give no marks. Existing saves receive bounded legacy credit from previous clears; fresh expeditions reset their trial ledger. Resolved history can be compacted without losing credit, while unresolved encounters retain their identity.

Zero/one mark: a board letter, four arrows and two fruit. No completion XP. Higher marks increase gear quantity and rarity: rare gear begins at 6 marks, one legendary at 16. Initial rewards prefer the party's weapon type or chest armor. Reward copies are avoided within one chest; carried relics still stack normally. Choices unlock per three resolved trials, rather than three rolls. The challenge choice requires a subsequent clear before its charm drops.

## Combat and progression

One second of arrival damage protection, shown by a dashed ground ring. Hostile direct damage respects intervening solid geometry. Panther strikes check the same visibility path. Existing Hunter/plant locked aim remains intact. Armor can reduce a hit by at most 75%, before the existing difficulty multiplier. Damage feedback uses actual health lost, including fractional values. Second Wind keeps its longer protection window. Damage interrupts Reaper channels and normal enemies flash on successful hits. Boss warnings render above scenery, filtered by visibility; the existing dodges, recoveries and native animation timings remain intact.

Training uses one Training Point per rank, earned on level-up, rather than spending leveling XP. Legacy migration preserves XP and existing ranks and accounts for levels already earned. Newer bosses join the skill-scroll drop pool.

Every starter weapon sells for 3 gold and salvages into one Relic Dust. Dark Essence fits weapon sockets, including ranged weapons. A healing hit spends one essence, heals 20% of actual damage up to 8 HP, and refills from the backpack if stocked. Full health, practice targets, allies and stale/swapped projectiles do not consume essence. No permanent passive bonus is added.

The vending machine has twelve distinct products: potion, stamina potion, eight-arrow bundle, two traps, three fruit, six cartridges, jar, cage, torch, lantern, barricade, and the oversized mosquito charm (+8 max health). The charm has native inventory and worn artwork. Old factory stock upgrades without restoring depleted slots; custom stock and already-paid orders remain valid. Bundled quantities persist and collection is atomic.

## Artwork and sound

Use the user-provided April and villager references plus the native fitted character examples as the style baseline: readable silhouette, broad hair locks, flat palette clusters, independent eyes/ears/mouth, consistent outlines, nearest-neighbor enlargement, and anchored equipment. This pass flattens head skin shading to four levels and adds distinct native letter, essence, mosquito and Alan item icons. It does not replace authored sprites or motion tracks.

Art review: test-output/humanoid-hd-review.png (eight-direction characters); test-output/polish/rig-review.png (51 rig subjects, eight facings); test-output/polish/runtime.png (assembled game). The muted character audit checks 1,264 render combinations, 19 hair variants, 8 faces, 91 fitted equipment items, independent facial movement, Studio capture and custom-paint preservation. Technical checks do not substitute for the user's visual approval or a full art-director sign-off.

75 unique original encounter compositions, seven destination cues, two seal cues and defeat: 85 synthesized WAVs. No external recordings or recognizable movie/game music are used in these new cues. Every card has its own score, rhythm, accent pattern and texture. Scores/source records: assets/sfx/encounters/manifest.json and CREDITS.md. Reproduce with scripts/generate-encounter-audio.mjs. Explicit review player: encounter-audio-review.html. Runtime uses notification priority, ducking and reduced incidental spawn voices during announcements; existing cache, mute and voice limits remain bounded. Missing custom cues use the neutral board cue.

## Validation and practical limits

scripts/report-expedition-balance.mjs samples 100 seeds for each of 32 party/equipment/clear scenarios and director coverage across seven maps. Zero-clear expeditions average zero gear and 6 gold of basic supplies; all seven starter weapons total 21 gold. This is an economy/coverage model, not a human full-run combat simulation.

scripts/verify-expedition-polish.cjs uses isolated, muted Electron to decode all 85 cues, render 408 facing samples, verify actual travel/save credit, render the vending/Training Point/victory UI, and capture the review sheets. Normal player profiles are untouched. Run the complete Node suite, package, check launcher/build identity and update the dynamic desktop shortcut before delivering a build.

Human co-op playtesting remains necessary for final difficulty, controller feel and subjective sound/art approval. The older broad desktop smoke has known fixture failures (previous baseline 83 passes / 16 failures); this pass uses focused live UI checks and does not claim that broad harness is globally green.

Final validation: full Node suite 1,204 passed / zero failures. A subsequent 16-test focused pass verifies the letter Read control and inventory toolbar after the final UI adjustment; 26 focused audio/equipment tests also passed. Source Electron QA passed with zero renderer errors. Packaged verification and launcher identity are recorded after build below.

## Delivered desktop build

1.0.101-expedition-polish, built 2026-10-08T17:34:49.650Z from bc1b432d20f4b0de0b04d4d3b34600f7a9fe0a70 with modified source. No commit or push. The attempted 1.0.100 output encountered a locked app.asar; the finished version uses a fresh directory, with no player processes terminated.

Packaged Electron QA: 85 cues decoded; 51 subjects / 408 directions; trial travel and save, vending bundles, Training Points, victory debrief and actual letter Read button passed with zero renderer errors. All automated windows were muted before loading and used isolated profiles. Rig guard preserved all previously captured entries; the separately added Alan entry was retained.

Executable: dist/1.0.101-expedition-polish/Wildbound-win32-x64/Wildbound.exe. Desktop shortcut: Wildbound Latest (1.0.101-expedition-polish).lnk, pointing at the project’s Play Wildbound.cmd with the Wildbound icon, normal save profile. Play Wildbound.cmd --check and shortcut/build identity checks passed.
