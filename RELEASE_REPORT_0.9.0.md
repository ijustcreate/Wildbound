# Wildbound 0.9.0 — implementation report

This release addresses all seven review categories. The 91-item ledger below records the concrete implementation for each idea, including cases where inspection showed an existing feature or shared compatibility code should be retained rather than deleted.

## Build and controls

- Windows build: `dist/0.9.0/Wildbound-win32-x64/Wildbound.exe`.
- Updated root launcher: `Play Wildbound.cmd`.
- Field Kit: **G / R3**, remappable through the existing controller settings. **LB/RB** switches tabs; **D-pad/stick** moves focus; **left/right** changes choices; **A** activates; **B** closes.
- Field Kit selects the controller owner's hero and pauses the local expedition. Existing backpacks still support simultaneous party use.
- All added art is local pixel geometry or established game assets. See `assets/FIELD_KIT_ASSETS.md`.

## Validation

- 183 logic tests pass. The original baseline had 160 passes and 9 failures. Outdated assumptions were corrected, real spawn/art issues were repaired, obsolete helper-only tests were retired with the removed implementation, and new transactional/storage/gameplay/save tests were added.
- All 99 Electron integration checks pass in the packaged Windows executable (0 failures). Tests include controller-owned Field Kit opening, trap selection and focus retention, controller creation navigation/cancellation, all five Field Kit tabs, and six non-overlapping player panels, alongside the existing application smoke checks.
- Field Kit screenshots checked at 1440×940 and 1000×700. Eight-facing outfit contact sheet generated and inspected.
- Same-process before/after stress comparison, 120 measured frames per build after warmup: six heroes, twenty stampeding rhinos, monsoon, canvas completion readback. Mean drawing **18.91 → 13.88 ms** (about **26.6% lower**); 95th percentile **20.90 → 17.10 ms**. Simulation mean **0.207 → 0.229 ms** with the additional systems. These are offscreen measurements of that scene, not a universal FPS guarantee. The alternate spawn/framing benchmark produces different timings.
- Hardware acceleration beat forced software rendering in the initial comparison. It is enabled by default; `--software-rendering` remains available.
- Physical controller hardware, extended couch sessions, and balance tuning are not covered by automated tests. Existing direct-network tools remain experimental; the new systems target local co-op.

## 1. Frame rate and programming — 13 items

| # | Implementation |
|---|---|
| 1 | Bounded frame diagnostics for frame intervals, simulation, world drawing, inventory UI, actor rasterization and saves, with mean/p95 display. Added full-world comparison harness. |
| 2 | Benchmarked acceleration modes; removed unconditional software rendering and added an explicit fallback flag. |
| 3 | Fixed 60 Hz simulation accumulator with bounded catch-up after stalls. Rendering remains on requestAnimationFrame. |
| 4 | Weakly held spatial scenery grids for nearby footprint collision queries; rebuild when the scenery collection changes. |
| 5 | Nearby loot selection is computed once per player for each rendered frame instead of inside every loot-item comparison. |
| 6 | Inventory UI uses state/revision tokens instead of serializing whole inventories/chests every frame. Interactive nodes remain stable. |
| 7 | Bounded static ground-chunk cache separates ground colors from water, grass, flooding and quicksand animation. Corrected random-desert rendering to use the generated environment. |
| 8 | Bounded idle-player and lion/wolf pose caches supplement the rhino cache. Equipment/appearance and rig revisions affect keys; editor/hurt/cape-sensitive paths bypass inappropriate caching. |
| 9 | Rain-canopy queries use the spatial grid. Soft fog renders at half mask resolution, reducing blur/compositing pixels by 75% while preserving world-space vision. |
| 10 | Reused actor queue, one computed depth per queued actor, and direct use of stable scenery when the bloom/sealing transform does not require rebuilding it. |
| 11 | Additional viewport checks for ground loot, XP, projectiles and traps; gameplay simulation remains active. |
| 12 | Queued/coalesced profile and expedition saves, unchanged-profile suppression, asynchronous serialized disk writes, temporary files and validated backups. |
| 13 | Restored passing regression baseline; split Field Kit UI, field rules, pixel assets, control labels, performance helpers, save store and test tooling into dedicated modules. |

## 2. Gameplay — 13 items

| # | Implementation |
|---|---|
| 1 | Rolling with living enemies earns 2 gold; Field Kit explains the risk and current creature count. |
| 2 | Every third personal roll enables a supplies/challenge/bargain choice. Rewards go to Recovery; the bargain applies an expedition-length damage penalty. |
| 3 | Six objective types: defeat, protect a jade relic, explore, rescue an explorer, disrupt a ritual and survive. Nearby interaction drives rescue/ritual progress; completed objectives pay once. |
| 4 | Automatic encounter pressure limit scales with living players outside storage; additional creature arrivals wait when pressure is already high. |
| 5 | Forest stoneguard patrols combine a golem with archers; desert ember packs combine a fire elemental with wolves, with separate member stats. Existing mixed skeleton/healer groups remain. |
| 6 | Snare capture, bramble area slowing, lure attraction and flash interruption, selected in Craft and represented with distinct local markers. |
| 7 | Recipes consume harvested materials atomically to make arrows, traps, tonics and barricades. Failed recipes preserve ingredients. |
| 8 | Environment-specific encounter weights and tips complement forest cover/water and desert quicksand. Generated-environment floor colors are consistent. |
| 9 | Block + Interact + movement drags a nearby downed ally. Nearby blocking teammates reduce incoming damage. Rescue/guard actions contribute to expedition statistics. |
| 10 | At space 12, choose Guardian, Scout or Trapper for that expedition. Boons and bargain penalties reset for the next expedition. |
| 11 | Flash traps create long recovery windows; blocking a telegraphed attack can force recovery. Existing increased damage against recovering enemies provides the payoff. |
| 12 | Party-spread warning, world/minimap pings and voluntary safe regroup. Regroup refuses nearby threats and checks the destination for collision. |
| 13 | Saved expedition debrief includes rescues, damage blocked, traps, bold rolls and shared exploration; objective and loot counters are also tracked. |

## 3. UI — 13 items

| # | Implementation |
|---|---|
| 1 | Standard, Large and Couch UI presets scale Field Kit, status text, inventory text and player HUD. |
| 2 | Site-style header is hidden during play and the game fills the viewport. Menus retain workshop access. |
| 3 | Persistent compact status strip shows the active turn without opening the board. |
| 4 | Compact/expanded board presentation setting; compact mode reduces panel size and secondary caption clutter. |
| 5 | Event text has restrained contrast backing and selectable 7/12/20-second duration. |
| 6 | Shared binding labels feed gameplay guidance, pickup/shop/victory prompts and Field Kit; menu navigation retains consistent fixed controls. |
| 7 | Stable player grid for simultaneous inventory/room panels; six-panel non-overlap is integration-tested. |
| 8 | Inventory layout separates scrollable content from notices; item grids have bounded scrolling and action areas remain grouped. Small Field Kit viewport verified. |
| 9 | Comparison text shows equipment deltas, two-handed consequences and carried-relic storage effects in item descriptions and Field Kit. |
| 10 | Strong focus outlines, selected-item treatment, active tabs and player symbols; focus survives Field Kit dropdown rebuilding. |
| 11 | Empty gear slots do not offer Unequip, offhand appears for compatible one-handed gear, and splitting appears for actual stacks. Advanced tasks live in Field Kit tabs. |
| 12 | Party symbols, portal markers, pings, downed highlights and a compact legend improve minimap interpretation. |
| 13 | Saving indicator and persistent save-failure status, Save now, portable backups and an explicit recovery action. |

## 4. Deprecated elements — 13 dispositions

| # | Disposition |
|---|---|
| 1 | Removed the unreachable old inventory UI branch after the current shop/non-shop routes. |
| 2 | Audited associated CSS. Shared item-grid and paper-doll selectors remain because the current interface uses them; no blanket deletion of shared styles. New layout overrides are isolated in field.css. |
| 3 | Removed obsolete buyPotion and its fallback dispatch. Tests now use the real dispensing/collection path, including paid orders retained when the pack is full. |
| 4 | Removed unreachable legacy explorer, skeleton, snake, cat, monkey, golem and vine drawing branches. Retained the active wasp and arbitrary-image fallback. |
| 5 | Removed obsolete direct renderer imports/helpers associated with the deleted paths. |
| 6 | Removed renderer-constructor scenery generation that was immediately replaced by game scenery. |
| 7 | Moved application smoke helpers into dynamically loaded debug-tools.mjs; ordinary startup no longer parses/runs the large test-helper body. |
| 8 | Moved Electron screenshot/smoke orchestration into scripts/smoke-runner.cjs. |
| 9 | Replaced stale latest-build instructions with 0.9.0 and updated the root launcher. Archived the older README. |
| 10 | Current README and generated guidance agree on RT dodge and the remaining default actions. |
| 11 | Replaced the blanket planned/not-implemented network description with an accurate experimental/local-focus description. |
| 12 | Verified the designer already routes registered subjects to their shared rig studio before exposing alternate render modes. Kept effective modes for other/custom subjects; did not remove functioning custom-asset support. |
| 13 | Archived 47 older version folders beneath dist/archive. Kept 0.8.11 as the immediate rollback. Packaging excludes archives, tests, progress pictures and one-off implementation tools. |

Old-save/rig migrations, frame importing and custom sprite support are deliberately retained. They are compatibility features, not proven dead code.

## 5. Character creation — 13 items

| # | Implementation |
|---|---|
| 1 | Eight-facing creation and Look previews. |
| 2 | Idle, run, slash and block previews; creation animates while its dialog is open. |
| 3 | Controller creation navigation, cancellation, dropdown editing, suggested names and a letter-entry selector. |
| 4 | Curated controller-selectable color swatches plus optional custom color controls. |
| 5 | Randomize unlocked traits, with trait locks retained for the current appearance object. |
| 6 | Explorer, Sunward and River presets remain editable. |
| 7 | Classic, freckles, scar and beard face details using the animated head anchor. |
| 8 | Standard, broad and slender cosmetic silhouettes; collision remains unchanged and supplied rig poses are not mutated. |
| 9 | Six party symbols alongside existing player colors, used across world/HUD/minimap/portal/Field Kit. |
| 10 | Creation armor and magic equipment preview choices. |
| 11 | Existing characters can edit appearance in Look without resetting progress. |
| 12 | Classic, Blade, Archer and Trapper starter kits with explicit contents; no gear is silently granted to classic characters. Balance remains subject to playtesting. |
| 13 | Up to eight local appearance presets can be saved and reapplied separately from character progression. |

## 6. Gear display — 13 items

| # | Implementation |
|---|---|
| 1 | Live equipped-character preview inside the existing paper-doll window. |
| 2 | Direction-aware side/rear helmet assets, including cap brim, hood drape, circlet band and horns. |
| 3 | Visible chest plates/straps/belt details layered before the neck accessory. |
| 4 | Knee/material accents and cosmetic silhouette options extend the existing joint-cropped boot/trouser art. |
| 5 | Hair clipping under covered helmets, with long hair retained below the brim and a circlet exception. |
| 6 | Direction-influenced cape sway, dash response, rear fold and hem details. |
| 7 | Shared hand/wearable anchors retained and exercised across eight facings and poses in the outfit sheet and existing rig tests. |
| 8 | Optional idle weapon sheath/back attachment; active attacks/blocking still show held equipment. |
| 9 | Rarity trim and restrained shimmer on chest gear plus directional helmet gems; item identity remains intact. |
| 10 | Helmet visibility and cosmetic head/chest/cape overrides selected from owned stored items; stats remain on actual equipped gear. |
| 11 | Controlled dyes cover armor/cape/helmet/pants accents and tint cached glove/boot/shoulder artwork without replacing shading. |
| 12 | Up to two carried relic belt markers, with a cosmetic hide option. |
| 13 | Four-outfit/eight-facing contact sheet, existing finite-render/rig tests and new visual inspection. Repaired previously identical Cinder/fire-wand icon pixels. |

## 7. Storage — 13 items

| # | Implementation |
|---|---|
| 1 | Unified backpack/personal-chest/shared/recovery overview, retaining physical storage rooms. |
| 2 | Cross-container name/rarity/stat search identifies the source container. |
| 3 | Category filtering and explicit sorting; ordinary viewing does not reorder manually placed items. |
| 4 | Deposit matching merges into matching stored types. |
| 5 | Mark/unmark multiple stacks, choose a destination and move marked; category transfers and fit reports are also available. |
| 6 | Protected item types are skipped by bulk transfer and blocked from normal deposit/drop/sale shortcuts. |
| 7 | Three loadouts recover owned gear from storage atomically, reporting missing items or insufficient return space without partial changes. |
| 8 | Container-aware splitting/transfers/drag destinations support paged shared/victory storage beyond slot 24 while keeping backpack/personal chests bounded. |
| 9 | Persistent Recovery container holds board-choice supplies and rewards until collected. Full destinations preserve their source items. Existing vending orders remain recoverable in the tray. |
| 10 | Owner-only, deposit-only and shared guest permissions, enforced on normal transfer and drag routes. Existing characters retain shared behavior until changed. |
| 11 | Shared-stash restoration was already wired correctly in app startup/resume; preserved it and added explicit Field Kit access rather than introducing a second stash. |
| 12 | Relic transfer descriptions explain the lost carried bonus. |
| 13 | Validated asynchronous file writes, prior-save backups, corruption fallback, confirmed previous-save recovery, character JSON export and additive import. |

## Preserved source and packaging

The pre-change source backup is `test-output/pre-090`. Earlier release folders are preserved in `dist/archive`, with `dist/0.8.11` retained separately. No character data was intentionally reset. Smoke tests use isolated application profiles.

The release ships all runtime assets and modules. One-off implementation scripts, test outputs, concept/reference images and old builds are excluded from the application package. The normal game remains usable without developer tools or network access.
