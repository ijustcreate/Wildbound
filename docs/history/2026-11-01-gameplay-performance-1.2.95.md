# 1.2.95 — shared railway/Wild Lands gameplay and wide-view rendering

## Symptoms and causes

Both dev worlds returned before the regular adventure update. Attack charging/release, melee contact, dash state, projectiles, loot, companion updates and equipment effects were bypassed. Wide co-op views repeatedly rebuilt a too-small terrain working set and repainted detailed native tree foliage at subpixel sizes.

## Changes

- Share normal weapon-input handling, melee timing/damage, dash speed/stats/cooldowns, combat timers, enemy AI/death/loot, projectiles, vitals, automatic loot and co-op revival with the regular game. Train carriage motion keeps its own swept interior collision and continuous gangways. External movement/knockback of a rider now updates carriage-local coordinates through the same walls.
- Restore shields/aim, potions, summons, traps, equipment effects, companion updates/control, wing/broom vertical movement and swimming breath/diving. Draw real traps, projectiles, native actors, loot and combat effects. Spawn ordinary dev encounters near the party rather than the old 1600px map origin. Keep dev exploration isolated from the original expedition and saves.
- Adapt distant terrain resolution to screen scale; retain small deterministic prop data separately from bounded raster caches; cache distant native tree sprites by visual variant; prune exact nearest-track searches using segment bounds. Native detail/leaf motion returns at normal camera scale. Overview rails use a compact trace.
- Replace Wild Lands flat forest ground with the regular Forest color logic and close-up grass shader. Replace all eight placeholder shelters with furnished native station buildings/platforms, clocks, thirteen flavor props, lighting, roaming cats and orientation-aware collision. Raise water-crossing rails with approach ramps so bridge decks and swimming remain distinct layers.
- Preserve the complete local 1.2.94 Wild Lands source work, authored rigs, train eight-view artwork/editor and existing saves. No authored rig edits in this release.

## Verification and scope

Focused gameplay tests exercise both worlds through actual Game.update, including charge/release, timed hits, dash latching, projectiles beyond Classic bounds, rider movement, normal enemy spawn placement and native station collision. Muted isolated Electron checks cover actual dev entry, combat, inventory closing, onboard attacks, eight destinations, travel/return, swimming, editor/traversal and small/large windows. Final full-suite, package and publication receipts are recorded at delivery.

Measured CPU draw timings before the final station pass: wide co-op mean 2041.7 -> 13.1 ms; whole-world mean 4334.6 -> 21.8 ms. Initial wide/whole sweeps 1829.6/10300.9 -> 222.2/188.9 ms. Close mean 7.7 -> 9.6 ms with added native grass. Measurements are synthetic native Electron CPU timings, not a physical controller test or a guaranteed hardware FPS. Cold streaming can still hitch. The final station-inclusive measurement is retained in test-output.

The Wild Lands remains a separate dev exploration world: its cave/shadow areas and surface landmarks are still prototype content, not a finished campaign. This release repairs core gameplay and improves the environment; it does not claim the broader world/content pass is complete. Physical controllers, online replication and user art acceptance remain unverified.

## Build identity

Version 1.2.95. The clean source commit containing this note is the release source. Desktop/web manifests identify the exact commit and output paths. Use the current Desktop Wildbound Worlds (1.2.95) shortcut -> repository Play Wildbound.cmd, normal profile (blank arguments). Source push, rebuilt web files and GitHub Pages publication are verified separately. Generated builds, profiles, local saves and logs are excluded from Git.
