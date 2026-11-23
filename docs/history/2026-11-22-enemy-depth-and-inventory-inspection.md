# Enemy depth, motion readability and quieter inventory inspection

Requests: deepen each Crossfire enemy; add three improvements to shared enemy systems; make inventory hover details less obstructive; review the affected units' animation.

## Shared enemy systems

1. Threat-based targeting: ordinary enemies, hostile fauna and wildlife-pack pursuit can remember recent attackers, retain a target through small co-op distance changes, and reconsider when damaged. Invalid/dead/room targets are discarded. Threat decays over eight seconds and retains at most eight source IDs. It serializes without actor references. Custom boss-specific target/phase rules retain ownership.
2. Crowd steering: shared navigation deflects pursuit around nearby hostile bodies, using up to eight close neighbors and deterministic opposite directions for exact overlaps. It preserves movement speed and uses the existing collision-checked movement. This complements the existing physical separation pass; allies, pets and ambient wildlife are excluded.
3. Pressure and resistance: four nearby physical hits, or a heavy hit followed by a light hit, can briefly flinch ordinary enemies and create a .65-second, rounded 15% damage opening. A 2.2-second resistance period prevents permanent stagger loops; separated hits lose pressure. Active charges, custom bosses and tactical-role phase machines retain ownership. The opening has a small body-attached gold cue, without a ground decal.

Implemented in the dependency-free `enemy-systems.mjs`, shared damage pipeline, navigation, common combat targeting, fauna and wildlife-pack pursuit. All three are gameplay systems, rather than additional floor effects.

## Deeper patrol roles

- Shield carrier: capped turning gives a real flank window; repeated frontal hits consume guard, and heavy attacks consume more. An exhausted guard breaks into an opening, returns partially recovered, and regenerates after a quiet interval. It interposes toward a pressured squad archer from an offset position that leaves a firing lane.
- Charger: makes room instead of beginning a rush at point-blank range; circles while a melee slot or lane is occupied; avoids starting through a squad mate. After a rush it changes circling side. Wall collisions expose longer recovery than an ordinary miss. The late tell and active rush remain committed, with swept collision and once-per-target damage.
- Archer: strafes to find an unobstructed shot, avoids allied bodies during both preparation and release, and repositions after a newly blocked draw without spending ammunition. It has a short, cooldown-limited diagonal retreat against close pressure or a charging sword. It retains finite arrows, retrieval, interruptible draw, locked aim and punishable recovery. Mixed melee commitments remain limited per player.

## Native animation pass

Style contract: preserve the existing articulated ivory skeletons, simple wooden shields/bows and grouped gold/brown lion silhouette. Readability comes from a guarded silhouette, held anticipation, committed motion, impact response and a visible recovery, without additional floor markings or finer surface noise.

The archer now samples its full draw, holds during aim commitment and plays its ranged release. Shield windup, cut, follow-through and lowered recovery connect continuously; fatigue lowers the shield, and blocks briefly brace the arm. Moving legs keep their gait under a held shield or ready bow, with directional foot displacement and native IK. Stagger holds a recoil before easing back. The lion coils before its rush, stays low during the punish window, rises late, and reacts visibly to wall impact or stagger. Explicit animation previews and authored clips remain intact. Runtime sampling/blending does not rewrite rig files or editable keys. Shared ordinary flinch reuses existing hit reactions.

Native review exports five states in all eight directions for each role and a recorded motion sequence: `test-output/combat-tactics/final-depth-source/`. These are self-reviewed runtime captures, not a claim of review by an external animator. Shared authored rig SHA-256 remains `9a2c55d1090231ce5ec11cf06091224a9efb1b62a0c1bb0b3eb312a0cdad0be1`.

## Inventory inspection

Hover details now occupy a compact, stable shelf below the item grid. Name, key stats/comparison and set progress are visible without covering cells or the character. **Details** opens a bounded, scrollable full card; **Less / Escape** compacts it. Holding **Alt** temporarily expands only the inspected player's card, including mouse hover without keyboard focus; release or window blur restores compact display. Explicit full-card placement scores protected item grids, character and action areas to reduce obstruction. Moving an item or opening an inventory popover suppresses stale inspection, and transaction messages keep their own visible line.

Small panels preserve legible item cells in a scrolling backpack rather than flattening artwork to fit all rows. Controller selection scrolls to the selected cell. Two-player ownership and controller labels are preserved. `inventory-tooltip-layout.mjs` holds placement geometry; `inventory-tooltips.css` supplies the shelf/compact rules.

## Checks and limits

154 focused Node checks passed across shared enemy behavior, role AI, animations, fauna/wildlife, arrows, sword/melee, controller inventory, ownership, containers, drag and toolbar behavior. Native source review passes 16 combat/motion checks (including ordinary-enemy pressure and co-op threat targeting) and 99 inventory checks, including zero visible slot overlap, item-art readability, full/compact transitions, feedback, item moves, small windows and two players. The existing equipment-control review also passes Xbox/Switch/PlayStation input isolation, gear hover, linked hands/sockets, full-pack refusal and unequip checks. Its outdated 24-slot full-pack fixtures were corrected to use the existing exported `BACKPACK_SLOTS` (32); player inventory mechanics were not changed by that correction.

Automated Electron windows are muted before load and use isolated temporary profiles. Physical controller hardware, full repository test-suite success and performance improvements are not claimed. Source checkout: `C:/Users/New User/Desktop/Wildbound`, branch `Wildbound_worlds`, base `f0b787ff33c3ac8f3675b48504937ebda4f0dcb5` with existing modified source preserved. No commit/push requested or performed. Desktop receipts follow after packaging.


Initial desktop verification: `dist/1.2.109-2026-11-23T04-13-07-706Z/Wildbound-win32-x64`, built UTC `2026-11-23T04:13:34.555Z`, passes 926 runtime syntax checks and all 150 packaged native checks (16 combat/motion + 99 inventory + 35 sword). A concurrent addition of `resolvedDamageFeedback` to `enemy-damage.mjs` landed after this package was created; final packaging was restarted to include it rather than overwriting that work. Final launcher, source comparison and EXE boot receipts follow.


Final desktop receipts: canonical packaging passed 928 runtime syntax checks and produced `dist/1.2.109-2026-11-23T04-16-52-695Z/Wildbound-win32-x64`, built UTC `2026-11-23T04:17:08.547Z`, source commit `f0b787ff33c3ac8f3675b48504937ebda4f0dcb5`, sourceDirty:true, preview:false. All 18 relevant source files (including the concurrent damage-feedback module) match this package by SHA-256; receipt: `test-output/combat-tactics/final-packaged/source-hashes.json`. This exact packaged app passes all 150 native checks: 16 combat/motion, 99 inventory and 35 sword. Reports and captures: `test-output/combat-tactics/final-packaged/`, `test-output/inventory-tooltips/final-packaged/`, `test-output/sword-polish/final-packaged/`. The first folder includes the five-state/eight-direction boards, ordinary pressure reaction and `combat-motion.webm`.

Actual `Wildbound.exe --boot-smoke-test --mute-audio --software-rendering` reports failed:0, ready lobby, errors:[], audioMutedTest:true. The desktop shortcut `C:/Users/New User/Desktop/Wildbound Worlds (1.2.109).lnk` targets `C:/Users/New User/Desktop/Wildbound/Play Wildbound.cmd`, blank arguments, repository working directory, `assets/wildbound-icon.ico`. `Play Wildbound.cmd --check` selects this verified output. Restart via the normal launcher to use the updated game and normal save profile. Automated review profiles were isolated; no user game was terminated or player sound preference changed.

The 31 directly affected enemy/role/melee tests were rerun successfully after the concurrent damage-feedback change. The packaged inventory review was repeated on its own with a longer compositor-settle interval for fresh small-window screenshots; all 99 checks still pass.
