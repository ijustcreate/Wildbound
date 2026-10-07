# 1.0.79 — The Keeper, editable branching quests and lobby alignment

## Changes

- Friendly event “The Keeper” creates a protected ally outside the enemy combat registry. It uses the normal humanoid rig, appearance controls and six real wearable rewards matching the supplied reference: crown/mask, teal charm robes, sash, bell staff, cyan sword and cyan-stone band. The band occupies the existing neck slot; robes occupy chest and sash occupies pants. Reference tabletop abilities and unimplemented volcano/plane quests are not silently claimed as game features.
- Personal six-stage chain offers two paths per stage, with collection, combat and waypoint-survey objectives. One piece is awarded per completed stage, then a new encounter unlocks the next. Accepted contracts retain a snapshot when editor definitions change. Ready rewards remain safe if the backpack is full. No random loot supplies these exclusive items.
- Contract progress persists in profiles and expedition saves, survives house-world revisits, and cannot be controlled by another device. Quest gear follows its owner across world snapshots, without resurrecting already-sold/dropped quest items from stale snapshots.
- Responsive parchment conversations display enlarged live player/NPC portraits, branching choices, progress/reward cards and explicit selected choices with Xbox/Switch labels. Party-slot placement remains stable. Tall crown has portrait framing allowance. Keyboard/mouse and menu actions are supported; physical controller hardware was not tested.
- Designer “NPC & quests” exposes appearance, equipment, backstory, dialogue graph, stages, branch descriptions/objectives/rewards and validated JSON import/export. Saves use the normal definition pack's `npcQuests` field. The internal NPC ID remains `rowan` solely for first-pass save compatibility; displayed persona is The Keeper.
- Starter chest and its collision footprint both move down 28 world units, matching the map-table/dice-tray row.
- Loading older definition packs now retains cemetery-specific appended events. The previous source baseline failed two import-regression tests because these were discarded. Tests expecting the previous map roster/pier representation/one global banshee event were updated to current graveyard and bridge content. Combat-focused roll tests explicitly select a combat encounter now that friendly NPC cards are valid outcomes.
- Preserved shared humanoid-detail artwork/integration already being edited in this checkout during the work. Those changes were not authored by the Keeper agents. Native portraits exercised the resulting renderer; full regression checks cover the integrated checkout.

## Verification and delivery

Full integration suite: 1,095 tests passed; the later added quest-gear displacement/anti-resurrection check passed in the nine-test quest suite as well. Focused integration suite: 129 passing tests, including both alternatives for every Keeper stage, exactly-once rewards, full backpack, ownership, save/reload, definition round-trip and house-world progress/gear continuity. Native isolated Electron checks cover two-player portraits, Xbox/Switch labels, mouse and menu-action transitions, stable placement, profile capture/assign, definition round-trip, actual editor gear validation and 640×480 layout with no renderer errors. Gear QA exercised 384 poses, both weapons and 10,001 random loot rolls. Existing desktop packaging and launch identity checks are used for delivery.

Generated screenshots/reports and isolated profiles remain ignored under `test-output`. Normal desktop launcher uses normal saves, not `--preview`. Source push does not modify either hosted web version. Follow the build manifest beside the executable for the exact source commit.

## First-pass boundaries

The six quests use playable supplies, existing enemies and route surveys; they are not the six bespoke environments described as flavor in the reference sheet. The editor supports collection of sticks/stones and combat against bats/skeletons/spiders with bounded counts, plus route surveys. Broader objective types can be added to the same contract system later. The NPC is currently stationary at a reachable campsite. Inventory capacity failure intentionally requires a free slot before consuming turn-in supplies.
