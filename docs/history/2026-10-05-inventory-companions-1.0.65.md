# Wildbound 1.0.65 — inventory, ownership, companions and spell colour

User requested a GitHub push and a fresh launcher. This includes preceding uncommitted game/editor/assets work from the 1.0.56–1.0.64 notes, plus the fixes below. No personal saves, ignored builds, test profiles or logs belong in the commit. Shared authored rigs are preserved, not regenerated. Parent checkout was main at 1891708d014594bd837f1a7049ecefa04d16dae4; use the release commit and wildbound-build.json to identify the final package.

## Fixes

- Inventory uses one bounded grid for title, XP, quiver, equipment/portrait, 24 backpack cells, selected-item summary, eight persistent actions and control hints. Removed conflicting absolutely positioned equipment labels and the unused action row inside the backpack. Equipment is an eleven-slot two-column list; its directional graph matches the screen. Icons preserve aspect ratio. Compact/co-op layouts retain labels and all actions, including empty-slot selection. Unavailable controls stay visible with explanations.
- Actions: Use/Unequip, Hand 2, Sockets, hold-to-Salvage, Move/Place, Split, Drop one, Drop stack/gear. Xbox/Switch/PlayStation labels are distinct; long PlayStation face names use symbols in compact badges. Drop gear works with a full backpack, transfers socket metadata, and clears both occupied hands for two-handed weapons. Favorites remain protected. Lobby/storage-room drops are disabled; expedition drops require manual pickup.
- Inventory ownership is captured at opening. Per-device input cannot inherit another player's open panel through a duplicate/reassigned device or native browser focus. Native Enter/Space navigation cannot activate a controller-owned inventory control. Automatic controller reclamation avoids open UI sessions; explicit keyboard reassignment updates the session owner. Field Kit records its opening controller and cannot steal input via R3 while that player's inventory is open. Initial D-pad-left input is no longer mistaken for the ground-loot toggle inside inventory.
- Game log confirmed `ReferenceError: alive is not defined` when panthers die. Panther rewards now use living, present players instead of an out-of-scope AI variable. Friendship-ally deaths are marked once and removed normally, without hostile loot, kill progress, healing or necromancer rewards.
- Friendship cats clear stale hostile pose overrides on conversion. The allied AI decays hurt/flash/attack/cooldown timers, follows its living owner, faces actual travel, and uses the existing walk/run/bite/hurt/idle clips. It excludes allied, neutral and practice targets. No authored motion files are replaced. Ranger collars now use the exact projected pose drawn for the body, avoiding a separate idle pose that slid on moving cats.
- Spell cores retain each wand's colour. A small source-over halo replaces stacked additive orb/white spark sprites; common wands have the least glow. Trails and impact sparks remain coloured. Friendship bolts have a pixel-heart tip and short heart trail; living friendship allies have two floating pink hearts above them. Hearts reuse one 13×11 sprite, with no continuous particle-array allocation. Existing visible-actor culling applies.

## Source verification

- Full Node suite: 656 tests, no failures.
- `scripts/verify-inventory-refresh.cjs`: actual application inputFrame with three synthetic Xbox/Switch/PlayStation pads, deliberately wrong DOM focus, independent navigation/equip/drop/close; six viewport/zoom combinations; eleven equipment cells, 24 backpack cells, eight controls; stable geometry and unclipped labels; two/three co-op panels; actual visible Equip/Drop gear buttons, including sockets.
- `scripts/verify-inventory-sizing.cjs`: heights 850/600/420, selection stability, tooltip geometry and preview controls.
- `scripts/verify-inventory-workbench.cjs`: lobby salvage, populated/empty chest grids, two-way transfers and sockets, vending purchase/dispense/collect/restock, small windows and separate panels.
- `scripts/verify-companions-projectiles.cjs`: loaded particle sprites with pixel-level colour checks for six wands; 200 real companion renders across five species, five states and eight facings; friendship lion motion changes, floating hearts and friendly death handling.
- `scripts/verify-ui-repair.cjs`: pause highlighting/navigation, dev item owner and ground spawn, 25 tree poses and 30 whip poses.

The release build targets `dist/1.0.65/Wildbound-win32-x64/Wildbound.exe`. The Desktop shortcut `Wildbound Latest (1.0.65).lnk` must point to this checkout's `Play Wildbound.cmd`, with the project icon and no `--preview` argument. Repeat the applicable Electron checks with `WILDBOUND_VERIFY_APP` set to the packaged `resources/app.asar`; check launcher identity after packaging. Final delivery reports package and remote verification results.

## Limits

Controller tests are synthetic, not a physical Xbox/Switch/PlayStation session. No hardware FPS guarantee. Existing invalid authored-beast-rig warnings and broader smoke-test limitations from the 1.0.63/1.0.64 notes are not silently declared fixed. SCRAP-9's larger vendor redesign remains a separate earlier proposal. A source push is not a GitHub Pages deployment or a downloadable release upload. Normal-profile characters, chests, house designs and editor drafts are left untouched.
