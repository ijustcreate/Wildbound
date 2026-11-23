# Native character particle masks and 42 gameplay placements — November 17, 2026

Request: replace the imported effects' reference-body silhouette with the actual Wildbound character and implement all 42 proposed gameplay placements.

Checkout: C:/Users/New User/Desktop/Wildbound; branch Wildbound_worlds; origin https://github.com/ijustcreate/Wildbound.git; HEAD f0b787ff33c3ac8f3675b48504937ebda4f0dcb5 plus modified source. Existing Bayou, landing, car, controller-ready, chicken and storage work is preserved. No commit, push, web deployment or release requested.

## Character integration

`pixelfx-actor.mjs` captures the actual native Animator raster with current appearance, clothing, equipment, animation and facing. Transparent holes and original colors become the PixelFX mask/pixel fields; the feet remain the anchor. Body-aware effects receive that raster instead of stockActor. A separate Animator avoids disturbing the main renderer's animation history. Effect frame extents expand around the native body to avoid clipping. The editor uses the current explorer (or native default explorer before a party exists) and shows the native body in previews. Chained library effects forward the same mask to body-aware children. PixelFX's acting-rig pose keys do not replace Wildbound's existing animation clips.

Runtime-only capture/raster caches each retain at most 32 surfaces. Game emitters cap at 24 new events per simulation timestamp and 96 live imported transient events. Existing shared draw, emitter, detail and reduced-motion controls remain in place. Decorative imported effects reserve most of the native emitter allowance for combat/status feedback; train rendering now resets the same budget each frame. Native masks are not saved in presets, saves or network state. Private-room transients retain room identity and stop following a character across room boundaries.

## Implemented placement map

Every numbered placement has an editable `game-*` slot in the Particles editor. The authoritative mapping is `gameplay-fx-presets.mjs`; native defaults remain available independently in the library. Existing authored user overrides are preserved; untouched stock presets embedded in old full-editor saves migrate to the new defaults. Legacy live hooks and their new editor slots stay synchronized.

| # | Placement | Actual hook |
|---|---|---|
| 1 | Successful physical hit sparks | enemy-damage.mjs: damageEnemy |
| 2 | Heavy sword cleave impact | core.mjs: confirmed sword hit, swipe_big |
| 3 | Charged sword dash | core.mjs: swordDashRequested release |
| 4 | Directional shield block | adventure.mjs: shieldBlocks |
| 5 | Timed parry | adventure.mjs: shieldBlocks windup response |
| 6 | Bow release spark | adventure.mjs: fireArrow after ammunition succeeds |
| 7 | Rifle muzzle flash | night-equipment.mjs: tryEquipmentAttack after cartridge consumption |
| 8 | Bullet impact on scenery | night-equipment.mjs: swept projectileBlocked collision |
| 9 | Magic charging | gameplay-fx.mjs: charged hand with a magic item, including train/room rendering |
| 10 | Magic bolt impact | magic-bolt-effects.mjs: finishMagicBolt on confirmed hit, excluding healing/friendship |
| 11 | Burning silhouette | gameplay-fx.mjs: burning timer, native actor back/front passes |
| 12 | Poisoned silhouette | gameplay-fx.mjs: poison timer |
| 13 | Frozen silhouette | gameplay-fx.mjs: frozen/bansheeIce timers |
| 14 | Friendly ice break | frost-prison.mjs: breakFriendlyIce |
| 15 | Stunned stars | gameplay-fx.mjs: stun timer |
| 16 | Sleeping character | gameplay-fx.mjs: sleeping timer |
| 17 | Succubus charm hearts | gameplay-fx.mjs: succubusCharm.remaining |
| 18 | Ghost-induced slow | gameplay-fx.mjs: slowUntil compared to simulation time |
| 19 | Successful healing spell | healing-magic.mjs: applySpellHealing, effective healing only |
| 20 | Co-op revival completion | core.mjs: successful nearby-helper revival |
| 21 | Dark Essence life steal | dark-essence.mjs: actual consumed socket and effective healing |
| 22 | XP absorption | adventure.mjs: collectXP after range/readiness checks |
| 23 | Gold received | core.mjs live-enemy roll reward; field-systems.mjs bargain/objective gold |
| 24 | Starter, supply and victory chest opening | adventure.mjs: openInventory; supply-chests.mjs: openSupplyChest |
| 25 | Valuable equipment on the ground | render.mjs: rare/unique/legendary dropped loot |
| 26 | Keeper quest reward claim | npc-quests.mjs: validated claim with inventory space |
| 27 | Temple torches (also held/decorative torches) | torch-flame.mjs: shared real torch flame anchor |
| 28 | Campfires | particles.mjs: shared campfire-flame default used by campfire-art.mjs |
| 29 | Cemetery mist accents | render.mjs / gameplay-fx.mjs: graveyard atmosphere pass |
| 30 | Nocturnal marsh firefly accents | gameplay-fx.mjs: night sky phase, existing marsh_firefly animals |
| 31 | Forest falling leaves | gameplay-fx.mjs: visible standing tree canopy |
| 32 | Storm rain splashes | gameplay-fx.mjs: monsoon/thunderstorm, outside house-floor shelter |
| 33 | Ice-biome snow | gameplay-fx.mjs: ice atmosphere |
| 34 | Water entry / jump landing | particles.mjs: splash/jump-splash defaults used by swimming.mjs |
| 35 | Swimming wake ripples | particles.mjs: swim-wake default used by swimming.mjs |
| 36 | Underwater bubbles | particles.mjs: bubbles default used by swimming.mjs |
| 37 | World-travel departure and arrival | wildbound-travel-art.mjs: native captured party, blink-out/in per stage |
| 38 | Train braking sparks | train-test.mjs: actual deceleration at speed, wheel/rail anchors |
| 39 | Car water entry | vehicle-water.mjs: real waterImpact age and width |
| 40 | Material-colored structure destruction | structure-destruction.mjs: newly broken section, material palette |
| 41 | Salvage completion sparkles | particles.mjs: salvage-burst default, existing native hand animation anchors |
| 42 | Board sequence resolving | board-magic.mjs: newly assembling title, clipped inside existing board well |

## Gameplay adaptations and preservation

The imported Arrow Shot/Dash Strike gallery moves include fixed fake target positions. Gameplay uses their release/strike components alongside Wildbound's actual arrow and native dash rather than simulating a second attack. Life Steal now accepts the actual struck target offset (bounded raster extent). Gameplay-only options remove demo chests, loot, torch hardware/logs, electrical test hardware, weather/water backdrops and invented coin HUD counts; the original gallery defaults remain intact. The original cemetery fog, swamp wildlife, shelter, weather, physics, collisions, damage, rewards, saves and character animation remain authoritative.

## Verification

- 65 focused existing healing, quest, destruction and particle tests passed before visual refinement.
- 19 final focused particle/actual-event tests passed, including real bow/rifle ammo gates, impacts, healing, block/parry, friendly ice break, mask colors/holes, bounded event counts and all 42 editable presets.
- Muted isolated-profile Electron review: 149 checks passed, zero renderer errors. Covers eight headings/three character presentations, all 42 visible placements, 73 body-aware library effects retargeted, real renderer with overlapping statuses, bounded caches, four environment hooks and the editor at 1280×850 and 640×480. Captures/reports: ignored test-output/gameplay-fx/source/.
- Full rebuild and packaged verification receipts follow below. No player game was terminated; normal saves, authored rigs, house drafts and sound settings are preserved. Hardware controller play, remote multiplayer, sustained FPS and long-session/aesthetic user acceptance are unverified.


## Final desktop receipt

- Version 1.2.101. Verified output: `C:/Users/New User/Desktop/Wildbound/dist/1.2.101-2026-11-17T18-41-08-039Z/Wildbound-win32-x64`. Built UTC 2026-11-17T18:41:26.876Z from modified source at `f0b787ff33c3ac8f3675b48504937ebda4f0dcb5`, Wildbound_worlds; preview=false.
- Full desktop rebuild: 1,843 Node tests passed, zero failures; 844 runtime files passed syntax checks. The final focused follow-up passes 19 checks, including native mask pixels, alias synchronization, old-stock migration without overwriting authored presets, actual ammo/collision/heal/block/parry/ice gates and idempotent magic impact routing.
- Packaged, muted, isolated-profile Electron review: 149 checks passed, zero renderer errors. All 42 placements render real pixels, all 73 body-aware effects accept the native character, eight headings have burning/frozen/electrified previews, real overlapping statuses render in gameplay, four environmental hooks run, and caches remain bounded. Actual editor viewports were checked at 1280×850 and 640×480 (within one logical pixel of Windows DPI rounding). Captures/reports: `test-output/gameplay-fx/packaged/`.
- 869 runtime/authored files match source byte for byte. Package metadata matches after Electron's expected removal of development-only scripts/devDependencies/private. Actual packaged `Wildbound.exe --boot-smoke-test --mute-audio` reports failed=0, ready in lobby, no renderer errors, isolated test profile. The existing player's game was not terminated.
- Normal-profile launcher: `C:/Users/New User/Desktop/Wildbound/Play Wildbound.cmd`, blank arguments. `--check` selects the exact output above. Shortcut: `C:/Users/New User/Desktop/Wildbound Worlds (1.2.101).lnk`; same launcher target, repository working directory, `assets/wildbound-icon.ico`, blank arguments. Reopen the normal game to load this package.
- Logs and receipts: `test-output/gameplay-fx-rebuild.log`, `gameplay-fx-final-focused.log`, `gameplay-fx-packaged.log`, and `test-output/gameplay-fx/{content,shortcut,final-receipt}.json`. Generated builds, captures, profiles and personal saves remain uncommitted. No commit/push or web/release publication. Hardware controllers, remote multiplayer, sustained FPS and extended user playtesting remain unverified.
