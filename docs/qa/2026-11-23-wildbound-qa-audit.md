# Wildbound desktop QA and UI/UX audit

November 23, 2026 · Wildbound 1.2.110 · Windows Electron

The first fix should protect player progress. **The Wilds** launches a railway sandbox through the public adventure menu. Its Save now control writes no expedition checkpoint, and ordinary progress disappears on return. Connected-world travel can break saving, an older checkpoint can overwrite newer character and stash progress, and a corrupt roster can be overwritten on close.

The audit covers the launcher-selected package built at 16:30:39 UTC and the `Wildbound_worlds` working tree based on `f0b787ff33c3ac8f3675b48504937ebda4f0dcb5`. The package was built from modified source. Current files differ, including the Expedition menu and train students. **Source-only** identifies a current local feature absent from the package. **Electron** means reproduced in a muted native test window with a disposable profile. **Logic** means reproduced by executing game code with controlled state. **Code** means traced through implementation and ready for playtest. P1 is a release priority such as lost progress, a frozen session, or a blocked core activity. P2 is a material defect with narrower impact or a workaround. P3 is localized.

## Functional bugs

### Adventure selection and input

**B01 · P1 · Electron and Logic · The Wilds discards ordinary expedition progress**

Enter The Wilds, gain coins, XP or gear, and use Save now or return to the lobby. Save now wrote zero checkpoints. The logic probe gained 77 coins, 17 XP and an iron sword, then lost all three on return. Give the public mode its own resumable save and commit normal progression. Keep the developer railway disposable. Verify position, train, party and inventory after relaunch. Source-only. [Expedition entry, line 427](../../src/playable-lobby.mjs) · [Sandbox exit, lines 52–57](../../src/train-test.mjs) · [Save gate, lines 278–292](../../app.mjs)

**B02 · P2 · Electron · Cancel applies an unconfirmed adventure choice**

Start with Classic Forest, select Wildbound, then close with ×. The shared map changes from Forest to House and Wildbound stays enabled. Edit a private draft and commit it once on Accept. Verify × and controller Back both preserve the prior board configuration and the other players' ready state. [Mode actions, lines 21–26](../../src/expedition-menu.mjs) · [Shared setter, lines 360–363](../../src/playable-lobby.mjs)

**B03 · P2 · Electron · Reopening the Expedition menu loses the current map selection**

Accept Classic Desert and reopen the menu. The board configuration remains Desert, but the panel shows Select a level and disables Accept. Initialize the draft from committed map, mode and daily settings. Reopening should show the settings the board will use. [Draft and Accept, lines 10 and 42–49](../../src/expedition-menu.mjs)

**B04 · P2 · Electron · Confirm can activate the previous Expedition row**

Send Down and Confirm on the same input frame from Classic. The handler moves focus, then clicks the old row and restores focus to Classic. Resolve movement before choosing the activated control, or give Confirm explicit priority and ignore movement that frame. Make the policy consistent between menus. [Controller navigation, lines 55–59](../../src/expedition-menu.mjs)

**B05 · P2 · Electron · Escape closes inventory behind Pause**

Open keyboard inventory, click HUD Pause, then press Escape. The inventory closes while Pause and Settings remain open. Route Back to the topmost interactive layer and restore focus to the previous layer. The underlying inventory must retain its selection. [Overlay routing, lines 1429–1444](../../app.mjs)

**B06 · P2 · Electron · A second device can take over keyboard-owned Settings**

Open Settings with a mouse or keyboard and move an attached controller. The existing controller test fails as keyboard ownership transfers to the controller. Keep ownership until the opener closes the menu or explicitly hands it off. Test a non-owner's stick and D-pad during an active settings change. [Ownership transfer, lines 1693–1696](../../app.mjs) · [Native regression, line 103](../../scripts/verify-lobby-settings-controller.cjs)

**B07 · P2 · Electron · Nintendo Confirm and Back reverse between lobby and pause menus**

In the lobby the physical right A button confirms. In Pause and Settings that button backs out, and physical bottom B confirms. Adopt one Nintendo menu convention and derive glyphs from that same action map. Verify both buttons in the lobby, chooser and Pause. [Lobby input, lines 572–591](../../src/playable-lobby.mjs) · [Modal input, lines 1570 and 1637–1650](../../app.mjs)

**B08 · P2 · Logic · Valid controller remaps revert on relaunch**

Trade Board and Potion or Inventory and Pause. Load those saved bindings. Migration treats the deliberate choices as old defaults and swaps them back. Version the mapping schema and run each legacy migration once. Reload deliberate swaps as a regression check. [Map migration, lines 57–66](../../src/controls.mjs)

**B09 · P3 · Code · Keyboard help teaches the wrong bait key**

Follow the listed V shortcut for bait. Live input uses T for bait and V for inventory salvage. Generate help and prompts from the binding definitions that drive each action. Verify displayed keys against live input. [Display binding, line 140](../../src/controls.mjs) · [Live input, lines 1935–1944](../../app.mjs)

**B10 · P2 · Electron and Code · Button Prompts can change which physical button confirms**

Set Button Prompts to Nintendo while an Xbox controller is attached. The preference changes the detected family. The lobby uses that same family to swap physical Confirm and Back, even though the preference presents itself as a visual choice. Separate artwork overrides from hardware input or expose an explicitly named Confirm layout. Verify changing the glyph theme alone leaves the same button active. [Family selection, lines 30–34](../../src/controls.mjs) · [Lobby Confirm routing, lines 572–591](../../src/playable-lobby.mjs)

### Checkpoints, profiles, and worlds

**B11 · P1 · Logic · Saved authored encounters can freeze after Continue**

Save a Studio-authored encounter with a delayed or cleared action, then continue. The action-tracking Set becomes an empty JSON object. The next game update throws `this.eventActionRun?.has is not a function`. Encode executed action IDs as an array and hydrate a Set. Migrate old records without replaying rewards. [Serialization, lines 1–25](../../src/rooms.mjs) · [Restore, lines 30–32](../../src/session.mjs) · [Action tick, line 2392](../../src/core.mjs)

**B12 · P2 · Logic · Field Kit rejects a backup made with a full backpack**

Export a hero with 25–32 occupied backpack slots. Import the same file. A 32-slot export exceeds the importer's 24-slot limit. Validate every container with its actual capacity. Round-trip 24, 25 and 32 items, including nested bags and equipment metadata. [Backup validation, lines 823 and 858–866](../../src/field-kit.mjs) · [Slot capacity, line 1](../../src/items.mjs)

**B13 · P2 · Logic · Field Kit can report success after an import write fails**

Import a hero with the profile write forced to fail. The promise resolves with an internal error and the imported hero remains only in memory, so the import flow can announce success. Propagate the outcome and retain a retryable import. Announce success after the record is durable. [Import completion, lines 870–884](../../src/field-kit.mjs) · [Profile write, lines 176–184](../../src/profiles.mjs)

**B14 · P2 · Code · Import drops the exported shared stash**

Put an item in the shared stash, export the Field Kit backup, then import on a fresh profile. Export includes the stash, while import applies only hero records. Add an explicit stash restore or merge preview. Check hero and stash counts after relaunch. [Backup export and import, lines 823 and 870–884](../../src/field-kit.mjs)

**B15 · P2 · Code · Recover previous save can apply half a restore and reload**

Supply a valid previous character backup and a missing or corrupt expedition backup. Recovery updates characters, swallows the expedition failure, and reloads. Preflight both files and report which checkpoint is available. Allow a partial restore through an explicit player choice. [Desktop recovery, lines 211–216](../../main.cjs) · [Recovery UI, lines 892–903](../../src/field-kit.mjs)

**B16 · P2 · Logic and Code · A corrupt editor library can stop the game boot**

Corrupt the disposable profile's house or location designer library with no usable backup. The loader rejects and boot awaits both libraries before it finishes. Preserve the bad bytes and start the lobby with a validated backup or built-in design. Offer library-specific recovery. [Boot, lines 89–90](../../app.mjs) · [File fallback, lines 29–41](../../save-store.cjs)

**B17 · P1 · Logic · Closing after a corrupt profile load can overwrite the roster with an empty one**

Start with a truncated characters file and no usable backup, then close from the lobby. The load falls back to empty in-memory data. The close-time flush wrote an empty hero list and stash in the disposable fixture, then cleared the error. Preserve the original file, distinguish read failures from write failures, and prevent default data from being saved over a failed load. [Profile load, lines 49–65](../../src/profiles.mjs) · [Close flush, lines 289–300](../../app.mjs) · [Desktop close, lines 179–186](../../main.cjs)

**B18 · P2 · Logic · A malformed newest world save masks its usable backup**

Keep a valid backup and change the latest world's simulation seconds to a string. The disk loader returns the bad record and the renderer rejects it, while the backup restores separately. Validate hydration before choosing the primary and try the prior checkpoint on failure. [File selection, lines 12–23](../../world-store.cjs) · [Hydration, lines 75–85](../../src/world-instances.mjs)

**B19 · P2 · Logic · Long-running named worlds freeze at the exploration cap**

Start from 4,096 visited regions and enter a new region. The world tick throws. Warn as the limit approaches, then bound new exploration gracefully or archive inactive regions outside the simulation. Preserve movement and saving at the limit. [World tick, line 23](../../src/world-runtime.mjs) · [Region cap, lines 46–52](../../src/world-simulation.mjs)

**B20 · P1 · Logic · Connected Wildbound travel can make later saves fail**

Travel from Home to Forest after the audio service has updated, then save. The real save serializer failed with a circular reference through Home's cached audio service. Keep runtime services outside every per-map snapshot and strip legacy cached references. Round-trip a save after both travel directions with the audio system initialized. [Audio wiring, line 231](../../app.mjs) · [Map snapshots, lines 23–34 and 126–137](../../src/house-worlds.mjs) · [Save omission, line 10](../../src/rooms.mjs)

### TV arena, train, and economy

**B21 · P1 · Logic · TV arena victory strands player-owned ground items**

Drop an iron sword before the arena win. After victory, repeated pickup attempts leave it frozen on the board, and Return resets the TV arena. Transfer player-owned drops to their owner's backpack or recovery stash before teardown. Check full backpacks, two players, and repeated Finish actions. [Drop ownership, lines 5–8](../../src/inventory-world.mjs) · [Victory and reset, lines 97 and 177](../../src/tv-wildbound.mjs) · [Lobby return, lines 160–163](../../src/playable-lobby.mjs)

**B22 · P1 · Logic · A disconnected arena player can block the trial indefinitely**

Disconnect a player near the west-root spawn while their partner continues. A 60-second probe reached five kills and left the last spawn waiting. Ignore inactive players in spawn clearance and use a safe alternate marker after a bounded delay. Test disconnect, reconnect and remaining completion. [Arena spawn selection, lines 104–110](../../src/tv-wildbound.mjs)

**B23 · P2 · Logic · The arena camera follows an inactive player and loses the active one**

Leave an inactive player at x=200 and move the active player to x=2400. The calculated view spans x=140–1100 and excludes the active player. Frame the active set and signal off-screen players when they rejoin. Test both directions with one controller absent. [Camera target, lines 180–181](../../src/tv-wildbound.mjs) · [TV view, line 617](../../src/playable-lobby.mjs)

**B24 · P2 · Logic · A fast arena stomp becomes contact damage**

Fall toward a Bramblecap whose head is just above a floor. One 50 ms step from y=397 at 750 px/s crossed the head, landed on the floor, then cost a heart while the target survived. Sweep the previous and current feet against enemy tops before floor resolution clears vertical speed. Test high falls, uneven platforms and side contact. [Player contact, lines 135–136 and 158–170](../../src/tv-wildbound.mjs) · [Floor collision, lines 39–44](../../src/tv-arena-level.mjs)

**B25 · P2 · Logic · The Safari Rifle silently acts as melee in the arena**

Enter the TV arena with the rifle equipped and attack. The arena loadout resolves to melee and produces no rifle shot. Give the rifle a bounded native arena shot or visibly loan a named fallback weapon at entry. Verify the animation, hit range and help all describe the same action. [Loadout and attack, lines 29–35 and 147–175](../../src/tv-arena-run.mjs)

**B26 · P2 · Logic · A merchant refuses a purchase that fits in an existing stack**

Fill all 32 backpack positions, keep a partial potion stack and try buying another potion. The merchant claims a free slot is required and leaves quantity and gold unchanged. Use the shared metadata-aware stack and capacity check for both the quote and the commit. Test sale refusal only when the full quantity cannot fit. [Purchase, lines 61–64](../../src/traveling-merchant.mjs)

**B27 · P2 · Logic · Repair after a junction can put the train back on the wrong route**

Change routes at a shared junction, then repair. The repair resets the distance and keeps the current route label. Retained route history placed the engine 2,614 pixels away from the current route's spawn in the controlled probe. Reset the historical segments and any pending switch as part of repairing to the current route's spawn. Check that carriages and boarded players land on the same active route as the HUD. [Repair and junction, lines 59 and 150](../../src/train-test.mjs) · [Route sampling, lines 25–26](../../src/train-track.mjs)

**B28 · P2 · Logic · Gringotts can pay permanent gold for temporary Dark Essence**

Obtain five Dark Essence on the Wilds copy, exchange it at Gringotts and return. The original pouch gains 25 gold and no lasting essence expense. Settle both sides against one durable inventory or commit the full Wilds ledger. Check that repeated visits cannot credit the same exchange twice. [Exchange, lines 26 and 52–54](../../src/diagon-alley.mjs) · [Train return, line 57](../../src/train-test.mjs)

### Combat, equipment, and accessibility

**B29 · P2 · Logic · A Flash Decoy can kill an enemy instead of interrupting it**

Lure a standard lion onto a Flash Decoy marked as an interrupt. A controlled 100 HP lion died after the capture timer. Route all enemy families through shared trap rules. Flash should interrupt and open a recovery window, while capture and slow apply only to their own traps. [Species trap handling, lines 43 and 50–51](../../src/enemy-species-combat.mjs) · [Navigation trap handling, lines 42–43](../../src/navigation.mjs)

**B30 · P2 · Logic · Trapper capture speed is bypassed by standard enemies**

Apply the Trapper boon and capture a standard species. A 0.75 multiplier still gives a two-second timer instead of 1.5 seconds. Pass the configured capture duration through a shared trap resolver. Test the same boon on a standard and a legacy enemy. [Capture timing, lines 1545–1546 and 2075–2079](../../src/core.mjs) · [Species timer, lines 50–51](../../src/enemy-species-combat.mjs)

**B31 · P2 · Logic · Standard monkeys have lost their banana throw**

Approach a standard monkey at mid-range in a clear lane. The species loop routes it to approach and melee. In a three-second probe it never threw a banana and stole a trap. Restore a readable mid-range windup and projectile release alongside its stealing behavior. [Active species controller, lines 19 and 111–144](../../src/enemy-species-combat.mjs) · [Throw behavior, lines 1988–2006](../../src/core.mjs)

**B32 · P2 · Logic · Standard archers ignore nearby arrows until empty**

Give the archer 2 of 36 arrows and place a 12-arrow pickup five pixels away. It starts another shot and leaves the arrows. Evaluate safe resupply below the configured threshold, especially while repositioning or recovering. Let a close threat interrupt resupply rather than checking only at zero. [Species resupply gate, line 131](../../src/enemy-species-combat.mjs)

**B33 · P2 · Logic · A bow can fire beyond range after its original target dies**

Begin a shot at a player 150 px to the left. Kill that target during the draw and leave a second player 650 px to the right. The archer spends an arrow and fires right despite its 350 px range. Bind the windup to its original target and revalidate line of sight, life and range at release. Cancel into visible recovery if invalid. [Target and release, lines 52, 65–66, 89–94 and 134](../../src/enemy-species-combat.mjs)

**B34 · P2 · Logic · A sword strike consumes the rune in an unused offhand wand**

Equip a sword and a socketed offhand wand. Resolve a sword hit. The probe dealt 24 damage, triggered 4.8 healing and consumed the wand's rune. Carry the contributing weapon slot through damage and on-hit effects. Check both hands with one weapon acting and with a legitimate dual-wield hit. [Damage sources, lines 1048–1056 and 1117](../../src/core.mjs) · [Rune effects, lines 8–14](../../src/dark-essence.mjs)

**B35 · P2 · Electron · Keyboard shortcuts block ordinary activation of interface controls**

Focus a lobby button and try Tab or Space, then focus the in-game Controls summary and press Space. The native probes saw these events canceled. Route native navigation and activation to focused interactive controls before reading gameplay keys. Test keyboard-only access to the lobby, HUD, and Escape return. [Global input, lines 1392–1396 and 1458–1465](../../app.mjs) · [Lobby panels, lines 541–563](../../src/playable-lobby.mjs)

**B36 · P2 · Electron · SCRAP-9 cannot sell items in the last eight backpack positions**

Fill a backpack through slots 25–32 and open the floating robot's Sell panel. It renders and accepts only 24 positions. Drive the grid, navigation wrap and transaction validation from the shared capacity. Verify both mouse and controller can sell the item in slot 32 without moving it first. [Shop grid, lines 45–46](../../src/shop-ui.mjs) · [Sale indices, lines 28 and 43](../../src/robot-shop.mjs)

**B37 · P2 · Logic · Ordinary arrows and potions deposited in the starter chest disappear**

Withdraw the original starter supplies, deposit your own arrow and potion, save the character, and select them again. Both deposits appear in the saved record but neither reaches recoverable overflow. Return player deposits by recorded provenance instead of subtracting stock by item type. Check new and migrated chests after an ordinary character switch. [Starter chest migration, lines 9–22](../../src/starter-chest.mjs) · [Character persistence, lines 148–150](../../src/profiles.mjs)

**B38 · P2 · Electron · PlayStation opening roll has a blank button glyph**

Join with a simulated PlayStation controller and reach the opening roll prompt. The prompt says “Press … to roll,” and the glyph canvas remains fully transparent after assets load. Map the actual physical face button for every supported family and render a text fallback when art is unavailable. Test all four face remaps. [Prompt, lines 865–873](../../app.mjs) · [Glyph lookup, lines 2–20](../../src/controller-glyphs.mjs)

**B39 · P1 · Logic · Creating a named world can wipe the existing shared stash**

Store 14 potions in the shared stash, then create a named world and wait for profile capture. Creation clones the party but starts with an empty stash. The new world's empty list takes precedence over the profile copy and is later saved back globally. Define stash ownership at the world boundary and prevent a fresh world from overwriting an existing shared record. [World creation, lines 17–26](../../src/world-instances.mjs) · [Runtime activation, lines 340–354](../../app.mjs) · [Profile capture, line 163](../../src/profiles.mjs)

**B40 · P1 · Electron · Continue can overwrite a newer shared character and stash with older data**

Continue an older checkpoint after progressing the same hero elsewhere. In the native fixture, the stored hero had 140 coins and the stash had 44 potions. Resuming and flushing the old expedition overwrote them with 20 coins and two potions. Give the shared inventory and profile a revision, and reconcile or explicitly resolve conflicts before an old checkpoint can overwrite either. [Continue, lines 315–317](../../app.mjs) · [Shared profile capture, lines 130–163](../../src/profiles.mjs)

**B41 · P2 · Electron · Loading a saved world can resume simulation behind Pause**

Open Worlds from an active pause overlay, choose Explore saved world, then close Worlds. The new game has paused=false while Pause and Settings are both still open. Make the world switch update the simulation and modal stack together. Either dismiss the old pause stack on success or keep the new world paused until Resume. [World activation, lines 340–364](../../app.mjs)

**B42 · P2 · Electron · A failed load step reports an error after already replacing the active world**

Inject a write failure while opening a valid named world. Explore changes the active world and screen, then reports the write error. Prepare, validate and finish required work before switching the active runtime. If a refresh write is optional, report clearly that the world opened and which write failed. [Load transaction, lines 357–359](../../app.mjs)

## UI and UX findings

The art direction can carry more of the player experience if the wood and parchment stay as framing and the information inside has stable hierarchy, size, and contrast. Each proposal below keeps the illustrated world and gives the player a concrete usability improvement to verify.

**UX01 · Four-player Expedition panels sacrifice legibility to fit the layout**

At the native 1000×700 minimum, four open menus were each roughly 180×316 CSS pixels. Descriptions measured 5.6 px and the close target 16×16 px. The upper panels also cover roster information. Use one party setup panel with a named owner and four compact readiness portraits, or reflow owner panels to two short columns. Keep wood trim thin and aim for 16 px supporting text and 44 px primary targets at the minimum size. Verify four players can read the modes, identify ownership, and close the panel. [Native capture](../../test-output/qa-2026-11-23/source/03-four-player-expedition-1000x700.png) · [Sizing, lines 6–19](../../src/expedition-menu.css)

**UX02 · Adventure modes look too similar for choices that start different games**

Wildbound and The Wilds reuse the Forest icon and closely related names. Classic has little context about how play starts. Keep the names and give each choice a different silhouette and destination line. Use a hearth with linked portals for Wildbound, a dice-and-board crest for Classic, and a rail-and-compass crest for The Wilds. Verify a first-time player can say where each mode begins and what they will do there in one glance. [Mode labels and icons, lines 21–24](../../src/expedition-menu.mjs)

**UX03 · Map thumbnails require hunting for their names**

The five-column grid clips visible names and reveals them through preview, hover, or focus. Similar green tiles are hard to distinguish when comparing destinations. Add a short persistent name under each thumbnail and use two or three columns when narrow. Use a border and check for selection, and a separate outline for focus. Verify a player can spot a named map without moving focus across every picture. [Map grid and hidden captions, lines 32–46](../../src/expedition-menu.css)

**UX04 · The character picker makes browsing feel one-way**

The player sees a single chevron-decorated hero button that advances when clicked. There is no visible profile count or separate pointer control for the previous hero. Add two distinct arrows, a position count such as 2 of 5, and a short portrait strip with readable names. Keep the large portrait as the reward for moving focus. Verify users can go backward and reach a known profile directly. [Character picker, lines 377–394](../../src/playable-lobby.mjs)

**UX05 · Inventory puts important item decisions in very small text**

The item shelf uses 9–10 px stats and hints, a small Details target, and two clipped lines for descriptions. Equipment labels are also abbreviated or cropped in compact layouts. Use one readable scale for the slot name, primary stat and effect. Move long flavor text to expanded Details, retain the pixel icon wells, and give state changes a clear foreground. Verify a player can distinguish both hand slots, read a stat comparison, and find Details with four owners at minimum size. [Inspection styles, lines 18–39](../../src/inventory-tooltips.css) · [Compact labels, lines 131–143](../../src/ui-polish.css)

**UX06 · Couch UI size leaves essential labels small**

The Couch setting changes a global scale, while several inventory and help styles specify fixed small type. Let semantic type and target sizes inherit the selected UI scale. At Couch size, reflow content and scroll an inner region before reducing the label size. Verify that changing Default to Couch visibly enlarges the same item stats and input help while keeping every action available. [Size switch, lines 1301–1302](../../app.mjs) · [Fixed inspection type, lines 18–39](../../src/inventory-tooltips.css)

**UX07 · Controls help makes players decode mixed devices and contexts**

Active help packs many keyboard and controller actions into a long line. Onboarding can replace it with join copy just when a new player needs movement, interaction, or attack guidance. Organize a short device-aware card around core movement, the current interaction, and optional advanced controls. Group glyphs by purpose with plain verbs. Keep it available during onboarding and verify that keyboard, PlayStation and Switch users can each identify their controls immediately. [Live HUD help, lines 918–924](../../app.mjs) · [Binding help, lines 144–161](../../src/controls.mjs)

**UX08 · Timed encounter cards make tactical information easy to miss**

At the one-second setting, the fade phases peak near 67% opacity and then remove the tactic. Show the complete card immediately at short timing. Add a small Last encounter entry under the board or journal that retains the tactic after the reveal. Reserve animation for decorative edges. Verify the message reaches full contrast and can be recovered after it closes. [Encounter presentation, lines 884–901](../../app.mjs)

**UX09 · Pause hides basic game actions inside the Display tab**

Pause opens Camp Settings on top of an underlying pause dialog. Expedition actions live in a collapsible block alongside display controls, with Developer cheats near the top. Keep a single camp overlay with a pinned Resume, a clear Expedition page for save and travel, and separate Display, Sound and Controls tabs. Use vertical spacing and enamel color to distinguish actions by purpose. Verify the player can Resume, Save, and return one level with a predictable Back path. [Pause flow, lines 1007–1055 and 1245–1262](../../app.mjs)

**UX10 · Living Worlds makes resuming compete with administration**

Create World, Install Pack, and Open Save Folder compete for attention with returning to a saved world. Saved cards lead with seed and pack details, which do little to distinguish similar saves. Start with recent playable worlds. Use name, biome thumbnail and last-played time above one Continue action, and group pack and simulation tools under Manage. Verify two worlds with the same name can be distinguished at a glance. [World list and actions, lines 3–25 and 32–41](../../src/worlds-ui.mjs)

**UX11 · The merchant list moves while the player compares items**

The selected row expands with details that also appear in a separate readout. This changes row positions during controller traversal and repeats copy. Give every ledger row a stable height, item silhouette, name, stock and price. Put the selected description and comparison in a fixed side pane. Verify one D-pad step moves one row and the next row does not shift under the cursor. [Merchant rows and details, lines 23–34](../../src/merchant-ui.mjs)

**UX12 · The TV activity teaches too much in a small footer**

The tiny rotating footer describes controls and the board objective while the screen is already dense with arena art. Use the TV frame to hold a short first-use instruction card, then show family-specific prompts beside the tube and central board. Use a three-part visual sequence for jump, roll and exit. Verify a new player can perform all three without waiting for help text to cycle. [TV help, lines 717 and 732 onward](../../src/playable-lobby.mjs) · [Footer type, line 83](../../src/playable-lobby.css)

**UX13 · Defeat choices conceal their consequences**

Revive, Restart and Return do not say what survives or what resets. Give each button a brief outcome with the actual rules for inventory, the board, and health. Keep Revive the clear default and confirm a restart that would discard progress. Use the defeated-world illustration above the decision and keep the outcome copy close to each button. Verify a player can predict what will happen before choosing. [Defeat choices, lines 418–427](../../index.html) · [Defeat flow](../../src/defeat-flow.mjs)

## Verification and priority

1. Fix the data-loss and session-blocking P1s first. Add a regression around each affected full path, including The Wilds save and resume, connected-map travel then save, authored encounter continue, TV win and reclaim, and old-checkpoint profile conflict.
2. Stabilize menu ownership and Back behavior before restyling Pause. Then fix Expedition draft behavior and legibility together. Retest with one to four players, a minimum-size window, and each supported controller family.
3. Land the combat and economy corrections behind narrow deterministic tests. Follow with playtest sessions for readable tells, arena pickup and camera behavior, group travel, and shop transactions.

The packaged executable booted to the lobby with muted test audio and zero renderer errors. Native probes used isolated Electron profiles. They covered menu transitions, multiple players, the minimum window size, inventory, Pause, and selected world and save paths. The Wilds checks reached entry and Save now. The full terrain route, physical controllers, sustained performance, and live remote co-op remain unverified.

The source regression suite returned **2,100 passed and 13 failed** from 2,113 results. A focused 31-result rerun repeated five failures involving forest import initialization, necromancer summons, a lion pounce onto furniture, the eight-view seated pose, and a cat pounce. Those are separate verification results. The forest package boot still passed through the normal import order. [Full regression log](../../test-output/qa-2026-11-23/source-regression.log) · [Focused regression log](../../test-output/qa-2026-11-23/focused-regression.log)

[Launcher](<../../Play Wildbound.cmd>) · [Packaged boot receipt](../../dist/1.2.110-2026-11-23T16-30-32-350Z/Wildbound-win32-x64/test-output/boot-smoke.json)

[Source Electron observations](../../test-output/qa-2026-11-23/source/native-observations.json) · [Packaged Electron observations](../../test-output/qa-2026-11-23/packaged/native-observations.json) · [Save and world switch probes](../../test-output/qa-2026-11-23/save-audit-result.json) · [Interface probes](../../test-output/qa-2026-11-23/interface-audit-result.json) · [Gameplay probe results](../../test-output/qa-2026-11-23/gameplay-probe-results.txt) · [Settings ownership regression](../../test-output/qa-2026-11-23/controller-settings-regression.log)
