## 1.0.5 — Combat combos, jumping and temple tigers

- Each wand fires from its own posed tip.
- Added configurable three-swipe and five-punch combos and a Combos editor tab.
- Expanded humanoid animations and migrated older edited rigs.
- Added J / controller B jump with enemy jump toggles.
- Added tiger skin to the lion rig and tiger encounters in Jungle Temple.

## 1.0.4 — Character carousel and particle studio

- Click or activate a lobby name to confirm renaming; removed the separate Edit name button.
- Character browsing is an A–Z carousel with boundary arrows and position dots. Selecting the name assigns the character directly.
- Restored difficulty descriptions, compacted setup buttons and expanded the header art across the lobby.
- Added a Particles editor tab with live preview, new effects, controls, local saving, JSON import/export and preset restoration.
- Temple torch fire and knocked-out stars use the shared particle renderer. The rain study is editor-only; existing gameplay rain is preserved.

## 1.0.3 — Equipment preview and wolf packs

- Chest decoration follows the torso and wearable fit instead of drawing a separate patch above it.
- Rig Studio paper-doll slots show equipped item artwork, including custom facing pixels.
- The first house lion spawns on a clear interior floor; later encounters retain exterior spawns.
- Wolves have an independent saved rig, canine pixel art, diagonal trot and four original synthesized sounds.
- Alpha-led packs follow, flank a shared target and stagger telegraphed bites; leadership transfers when the alpha dies.

# 0.9.9 — Explicit character selection

- Clicking a character now highlights and previews it without closing the picker or assigning it immediately.
- Added a separate Use character button. Selected names retain a gold border and checkmark while navigating to actions.
- Delete / controller X acts on the highlighted character and opens a named confirmation with Cancel selected by default. Other players' assigned characters remain protected.
- Kept the compact two-column action layout and independent simultaneous player pickers.
- Verified mouse selection, controller deletion, cancellation, confirmed deletion, explicit assignment, and independent controller pickers at both tested window sizes.

# 0.9.8 — House Builder, navigation and encounter cards

- Skeletal archers require a living, present target within shooting range and a clear line of fire. Obstructed or distant archers reposition instead of firing; no target means no shot.
- Swept collision now stops bananas, poison and fireballs at walls before damage. Arrows and spells resolve obstacles before nearby targets, preventing hits across walls.
- Cached pathfinding routes house enemies around rooms and furniture. Monkeys and skeletons can operate doors; other creatures require an open passage. Creature-sized collision prevents dragons fitting through normal doors.
- Refined five-room house, solid furniture, fenced backyard and gate, deep-water pool, trees in both yards, front path and mailbox. The kitchen doorway stays clear.
- Studio > House Builder: grid placement, selection, precise coordinates, walls, carved doors, fences, floors, paths, pools, trees, fourteen furniture types, undo/redo, saved versions, JSON import/export. Saved designs apply to the next House expedition; current expeditions retain their layout.
- Encounter announcements have an illustrated portrait medallion, gold accents, readable verse, separate tactics line, and duration bar. Duplicate event toasts are suppressed while the announcement is visible.

# 0.9.7 — Ice, House & Yard, spiders and compact inventory

- Added Ice and House & Yard to environment selection. Random now chooses among all four maps.
- Ice includes snow, frozen ground, snow-covered trees and rocks. White lion and spotted snow leopard encounters are restricted to Ice; both have distinct palettes and editable animated rigs.
- House & Yard starts the party indoors around the board. Five connected rooms have visible solid walls, furniture, a yard and path. Interact opens/closes doors; closed doors block movement and projectiles, and cannot close on an actor. Creatures spawn outside.
- Added an editable eight-legged spider rig and encounter with two adult spiders plus three destructible eggs. Each surviving egg hatches after 20 seconds of gameplay into a smaller, faster baby spider.
- Spider nests spread visible ground webs and silk across nearby trees. Webs reduce movement for players and non-spider enemies; spiders are immune. Spiders fight nearby wasps/bees and beetles, which retaliate. Walls prevent their melee attacks passing through.
- Door state, webs and egg timers persist in expedition saves. New encounters are added when loading older design data.
- Inventory panels now occupy at most roughly one third of the screen: equipment slots surround a full character preview on top, backpack below, and compact selected-item actions. Two open panels sit at opposite sides, leaving the middle visible. Three to six panels use bounded columns/rows; short panels scroll internally. Controller gear navigation follows the slot layout and scrolls the selected item into view. Drag/drop, split, equip and chest transfers remain supported.
- Validation: 204 logic tests; in-app regression checks; 30 inventory viewport/player-count/UI-scale combinations; rendered eight-facing creature sheet and both new maps.

# 0.9.6 — Independent player pickers and readable events

- Character selection lives inside each player card: one equipped preview, a compact two-column name grid, and New/Delete/Back options underneath. Each controller has its own focus, preview and inline delete confirmation. Multiple players can browse simultaneously; a hero already selected by another player cannot be claimed.
- Other open pickers survive lobby refreshes, joins and another player choosing a character. Shared creation/name keyboard remains an owner-controlled dialog.
- Larger event titles, verse and instructions, with automatic clearance below the objective status and reserved player HUD space.
- Generated a UI concept and a new wide header image; the title, board and dice remain visible together in the full-width banner.
- Verified two simultaneous pickers, independent navigation, retained picker state after another player selects, and event/status clearance at 1000×700 and 1440×940.

# 0.9.5 — Show the full header artwork

- Fit the entire header artwork instead of cropping it. The board, dice, title and characters remain visible at every window size.
- Clarify Random as Forest or Desert, matching the existing map selection behavior.
- Put Start Adventure on its own full-width row beneath the three setup options.
- Move the bottom fade below the board and tighten compact party-card spacing so the setup controls remain on screen.
- Visually verified at 1000×700 and 1440×940.

# 0.9.4 — Controller party menu and joint angles

- Boot directly into the party screen, with generated jungle header art. Removed the landing screen and Sprite Workshop from main navigation; bone editing retains the sprite editor.
- Six player cards, large cycling game options, explicit readiness and Start-to-begin. Controller navigation stays within the owning player’s card and shared setup controls.
- Portrait character gallery with level and gold, unavailable characters marked In use, New character and controller keyboard access.
- Delete selected character with a named confirmation, Cancel focused first, save-failure rollback, and shared storage preserved. Deleted heroes cannot return through Continue expedition.
- Hand and foot angle controls: numeric degrees, slider, reset and a draggable gold direction handle. Rest angles and animated per-frame angles are stored separately for each facing, with shortest-arc interpolation, undo and frame operations. Weapon and foot rendering follows these angles.
- Verified 196 logic tests, 118 in-app checks, and 12 setup/editor screenshots at 1000×700 and 1440×940. Controller tests use simulated gamepad input; physical controller verification remains a user-side check.

# 0.9.3 — Inventory, input and lion sprite editing

- Reworked controller party setup: explicit New character and Edit name buttons, saved-character cycling without native popup dependence, owner-specific focus, compact creation with optional appearance details, visible focus and Start-to-begin.
- Added an on-screen naming keyboard with directional navigation, A to type, X delete, Y shift, Start done and B cancel. Setup regression tests exercise joining, typing a name, creating, selecting a saved character and beginning an expedition entirely through gamepad input.

- Reflow every open inventory when neighbours open/close or the window resizes, without rebuilding cached controls. Player panels stay bounded and reserve HUD/event space; wide panels use two internal columns.
- Prevent charged attacks and Interact releases from leaking out of inventory. Long Interact holds no longer open the board stash on release. Modal buttons must be released before becoming gameplay actions.
- Show player names, controller identities, movement/aim controls and all action bindings in both Settings surfaces. Named mapping dropdowns swap conflicting bindings; invalid saved duplicates are normalized.
- Expand the facing-specific layer order controls. Give lion layers readable names and place the E-view mane in front of the body, with face above mane. Migrate old numbered layer orders.
- Lion bones expose their connected sprite previews. Edit uses the existing sprite editor, with Save to Bone & Return, cancel, restore original, rig undo, per-facing persistence and validated imports. Procedural rigs without registered attachments explicitly show that no separate editable sprite is registered.
- Regression coverage includes sequential inventory opening, window resizing, 30 viewport/player/scale combinations, stray menu inputs, idle encounter counts, mapping conflicts, mane order and sprite-editor save/undo.

# 0.9.2 — Controller assignment fix

- First controller button or left-stick movement takes over an existing solo keyboard hero during play without opening character creation, including after the party locks.
- Reconnected controllers reclaim disconnected heroes before any join action. The claiming button does not also activate a menu.
- Unassigned controllers join during play only with Start/Menu while joining is available; gameplay buttons cannot open character creation or Field Kit. Lobby joining remains any button.
- Added integration coverage for button takeover, actual stick movement, changed controller index, unassigned input, and explicit second-player joining.

# 0.9.1 — Wardrobe and waist fixes

- Clicking a Rig Studio paper-doll slot opens its compatible gear dropdown at that slot. None is always first; hair has the same clear option.
- Base trousers now join across the animated hips with a flat waistband, covering the shirt endpoint below the pelvis. Equipped pants use the same seam; pendants remain visible.
- Verified all eight facing/run contact sheets, 184 logic tests, and 100 packaged integration checks.

# 0.9.0 — The Field Kit update

- Added a controller-operated five-tab Field Kit, larger UI options, persistent turn/save status, compact board mode and party panel layout.
- Added board choices, temporary boons, six objective types, two mixed encounters, cooperative dragging/guarding, pings, regroup and expedition debriefs.
- Added four trap modes, material crafting and temporary barricades with local pixel assets.
- Expanded creation and cosmetic editing with presets, locks, swatches, face/build choices, rotation/pose/gear previews, starter kits, symbols, dyes and cosmetic gear overrides.
- Added unified searchable storage, marked/category transfers, protected item types, three loadouts, guest permissions and recovery storage; repaired capacity handling beyond 24 slots.
- Added fixed-step simulation, bounded rig caches, spatial scenery queries, cached terrain, lower-resolution soft fog, fewer UI allocations and asynchronous queued saves with backup recovery.
- Removed unreachable inventory/animation code and the obsolete instant-potion purchase path. Isolated developer smoke tools. Updated launch/version documentation.
- See RELEASE_REPORT_0.9.0.md for all 91 review items and measured validation.


# 0.8.11 — Selectable music

- Added Beyond the Village Gate, Triumph at the World’s Edge, Beyond the Swinging Vines and Beyond the Ancient Gate alongside Curious Groove.
- Settings now includes a music-track selector. Your selection is remembered, switches immediately and loops through menu and gameplay using the existing volume control.
- Replaced the event card with compact, background-free text near the top that fades in and out. Shrunk player status panels and removed Pack, Portal and Potion buttons.

# 0.8.10 — Animation graphs, loot collection and background play

- Removed automatic first-roll and board-space treasure drops. Victory gathers unclaimed ground loot into the shared victory chest, with pages beyond 24 slots. Unclaimed victory items stay in that chest through a new expedition.
- Storage portals and room return portals use the owner's player highlight color.
- Added per-facing sprite render order, including separate dragon wings, with save/export and undo support.
- Added an animation graph tab with X/Y/Z curves, draggable keys, right-click key and frame editing, and linear/smooth/hold interpolation used in gameplay.
- Switching windows clears keyboard/mouse state without pausing controller players. Disabled desktop background frame/timer throttling; manual pause remains available.

# 0.8.9 — Character appearance and water-elemental rendering fix

- Fixed a water-elemental render exception that stopped drawing the game after a board roll, including the reported three-player case.
- Added a workshop paper doll with every compatible item per equipment slot, eight-facing placement, scale, rotation and pixel-art overrides saved with the player rig.
- New characters choose skin tone, shirt, pants, shoe and hair colors with seven cosmetic hair choices. Appearance persists with character saves; hair renders beneath helmets and gives no stats.
- Rig editors start paused. Both base colors and their shadow colors are exposed in the player palette.

# 0.7.4 — Projectiles cross water

- Arrows, magic bolts, ice bolts, thrown boulders and fireballs ignore water collision while airborne. Solid scenery, the board and world boundaries still block them; movement collision and projectile range are unchanged.
- Added regression checks for hitting targets across deep water and for retaining solid-obstacle collisions.

# 0.7.3 — Stampede performance

- Kept all 20 stampeding rhinos while sharing cached animation frames across the herd. The cache is bounded and refreshes after rig edits; hurt and editor poses continue to render directly.
- Rasterized ellipses by pixel rows instead of individual pixels, with pixel-equivalence tests. Offscreen enemies now skip rendering.
- In a local 20-rhino canvas benchmark, average drawing time dropped from 252.9 ms to 1.8 ms per frame (95th percentile 3.6 ms). This measures rhino drawing, not the complete game frame.

# 0.7.2 — Dragon anatomy and living fire

- Corrected dragon joint coordinates and migrated saved rigs. Added broad webbed wings, a long horned snout, four grounded legs, dorsal spines and a tapered tail; previews use the same renderer as gameplay.
- Added the fire elemental to the main rig studio with an animated flame body, hot core, burning limbs and sparks. Its fireballs and footstep fire trail are covered by gameplay tests.
- Fire wand drops deal direct fire damage and apply a two-second damaging burn with regular fire particles. Fire projectiles now have a glowing core and flame tail.
- Saved event lists gain the dragon and fire elemental events when missing.
- Enemy item drops occur at 10% of their former rate. Enemies drop glowing XP orbs that award party XP on collection, work with full backpacks, and persist across saves; victory rewards and recovered player arrows retain their existing behavior.

# 0.7.1 — Dragon rig and pickup feedback

- Added the dragon to the shared main rig list with a distinct red, horned, four-legged body, articulated wings and tail, and animated run, flame-breath and tail-swipe poses. The Creature editor and in-game renderer use the same rig artwork.
- Full inventories now skip automatic pickup attempts, show a rate-limited “Inventory full” notice, and do not play a repeated pickup error sound.
# 0.7.0 — Dragon, fire and enemy combat

- Added a dragon with a close-range tail sweep and a telegraphed flame breath that ignites players and leaves burning ground. Added a rigged fire elemental that throws fireballs, trails fire and emits smoke; defeating it drops the Cinder wand.
- Added the Cinder wand: its seven-square fire bolt burns enemies for two seconds with visible fire particles and damage over time.
- Golems now unearth a boulder at range and throw it when players approach. Added a mixed sword-and-archer skeleton event and a wizard skeleton event with two escorts; the wizard casts blue ice bolts and heals allies with yellow magic on a 20-second cooldown.
- Kept inventory panels on a stable anchor while opening and switching inventory views. Tightened helmet and hood scale/placement, reduced board dice, corrected board collision bounds, and show “Inventory full” after a failed pickup.

# 0.6.0 — Relics, armor styles and controller-friendly setup

- Added backpack-carried relics with distinct reliquary, totem, scarab, eye, moon and sun visuals. Their armor, fists, resistance and loot-reach bonuses count only while in the character backpack; chest storage grants no bonuses. Relics can appear in board treasure and enemy drops and can be sold by SCRAP-9.
- Added four new helmet styles and three shoulder-armor drops. Shoulder guards have a dedicated paper-doll slot and distinct pixel art; equipped headgear, gloves, boots and shoulder armor now render from the same item art shown in inventory.
- Added a Gentle expedition style where each incoming hit deals exactly 1 HP.
- Added lobby controller focus navigation: D-pad or left stick moves through controls, A activates, left/right changes dropdowns, LB/RB cycles characters, and B returns.
- Players remain in place during the opening board view and can move after the first roll triggers its event.

# 0.5.9 — Compact robot trading screen

- SCRAP-9 trading now compacts its portrait, item cards, spacing and text on shorter displays so the backpack, merchant stock and sale controls fit without a scrollbar.

# 0.5.8 — Smaller loot reach bonuses

- Reduced the Amber Charm bonus from 100 to 30.
- Reduced the Tracker Hood from 20 to 8, Moon Circlet from 60 to 18, and Moon Steps from 40 to 12.
- Existing equipped items use the updated item definitions automatically.

# 0.5.7 — Living environment and storage improvements

- World-space rain varies in timing, speed and wind, ending in ground/water ripples or canopy splashes. Soft circular live vision blends into explored fog.
- Deep river channels block walkers; shallow banks slow movement to 55% and produce footstep ripples. Monsoons flood one extra bank tile and submerge bridges in wadeable water; flooding recedes when rain ends.
- Players and walking animals leave fading tracks. Grass and procedural plants sway; varied-size procedural trees and rocks retain solid base footprints.
- Facing melee attacks harvest sticks from trees, then fell them with a falling animation and log drops. Rocks show mining progress and shrink as stone chunks are harvested. Resource loot is manual pickup; depleted scenery survives saves and room synchronization.
- Explored minimap terrain shows water, treasure/supplies and enemies in explored areas. World enemies still require live vision to render.
- SCRAP-9 moved to bottom-left, with a matching animated portrait in trading. The vending machine has an overhead interaction prompt, fits the viewport without scrolling, and dispenses on a foreground animation layer.
- Interior portal sits lower in an expanded room and exits on contact. Arrival is clear of the exit to prevent bounce-back.
- Owners can rename private chests; labels persist in profiles and expedition saves and appear throughout storage UI.
- Turn indicator moved from the top HUD into the board-view panel.

# 0.5.6 — Shops, storage, inventory slots and charged magic

- Enlarged full-room storage viewport; shared animated portal artwork inside and outside. Summoned portals appear beside the player on a reachable clear spot.
- Backpack/chest drag drops preserve the chosen cell and empty gaps, including across saves. Cross-container drops swap occupied cells or merge the selected matching stack. Automatic transfers still use available stacks/free cells.

- SCRAP-9 uses the humanoid rig with articulated metal limbs, a robot head and an overhead interaction prompt. Robot and vending machine have solid room footprints.
- Robot trading shows the player's backpack beside the robot's persistent stock. Hover/select items for their sell value and sell a stack to move it into stock and receive gold.
- A 3×4 vending display animates the spring and falling purchase. Click the item in the collection tray (controller Y) to collect. Paid items remain available if the pack is full or the shop closes; stock and purchases persist with profiles.
- Green stamina potion: half dash cooldown for 30 seconds, with a remaining-duration HUD label. Vending price 15 gold; health potions cost 10 gold.
- Wand bolts travel exactly seven 32px squares at fixed speed. Charging increases their visible size, hit radius and damage (up to double); bow draw behavior is unchanged.

# 0.5.5 — Inventory and portal interactions

- Backpack and paper doll remain visible side by side, with an additional chest window when looting. Native mouse drag/drop equips, unequips, swaps hands, rearranges/merges stacks and transfers items to/from chests. Invalid drops and full destinations preserve items.
- One-handed swords equip in either hand, including via the controller offhand action. Offhand swords contribute melee damage; bows still occupy both hands.
- All player-dropped supplies require manual pickup, even with a loot-attracting charm. Enemy supplies retain auto-pickup; potions remain manual.
- Summoning a portal leaves the player outside. Step clear and walk into it to enter; guests can enter by contact. Leaving does not immediately pull players back in.
- The storage viewport shows the whole room, all three chests, both shops and the exit using the shared player animator.

# 0.5.4 — Closer opening board

- Tighter board framing with minimal outer margin. Holds through dice and token travel, releasing only when the first enemy or noncombat event starts.
- Includes independent worker-driven loading animation from 0.5.3.

# 0.5.3 — Independent loading animation

- Pixel infinity animation now renders on an OffscreenCanvas worker, so game module initialization cannot freeze its frames. Wait for its first painted frame before importing the game and stop the worker animation when loading finishes.
- Packaged regression check deliberately blocks the game thread for 450ms and verifies the loading worker advances throughout the stall.

# 0.5.2 — Aligned animation scrubber

- Scrubber thumb travel now shares the keyframe timeline geometry, including the bone-label gutter and thumb radius. Stays aligned at resized widths and fractional frames during playback.
- Includes the rig zoom/pan controls from 0.5.1.

# 0.5.1 — Rig canvas zoom and pan

- Zoom buttons and cursor-centered mouse-wheel zoom from 25% to 800%.
- Pan tool and middle-mouse dragging; Reset view restores the default framing. Each rig remembers its view while switching subjects.
- Artwork, grid and joint handles share the view transform. Joint movement and rotation stay accurate at every zoom; gameplay preview stays at its normal scale.

# 0.5.0 — Storage, equipment and magic

- Separate backpack/chest windows with mouse controls and controller transfers in both directions. Close the chest independently.
- Nine equipment slots: head, neck, cape, chest, gloves, pants, feet and both hands. Existing head-slot Amber charms migrate to neck.
- Visible capes and mana-powered projectile wands, including rare, unique and legendary variants. Mana regenerates at 8/second; its meter appears while a wand is equipped. Rig Studio includes a magical outfit preview.
- SCRAP-9 robot merchant and potion vending machine in every private storage room. Sell selected stacks for saved character coins; buy potions for 10 coins. Guests use their own wallet and backpack.
- Split stacks in half (Y / 2) or choose an amount with the mouse. Drop one item or the selected stack; X / R drops the selected stack in the world.
- Potions require manual pickup. Reaching the board center no longer prevents nearby loot interaction; loot takes priority over sealing.

# 0.4.4 — Editable human facial parts

- Added separate eyeL, eyeR, earL, earR, nose and mouth joints to the human/player rig and inherited skeleton rigs. Artwork uses these anchors for setup and animated poses.
- Added per-facing visibility for facial parts. Selecting a joint pauses playback, and overlapping handles favor the selected joint.
- Migrate old human and skeleton packages by attaching facial parts to the existing head position and head keys without discarding other edits.
- Restore the Amber charm equipment-preview option.

# 0.4.3 — Equipped character selection portraits

- Character-selection portraits now draw the selected hero with their actual equipped weapons, shield, clothing and accessories using the gameplay animator. Switching saved characters refreshes the portrait.

# 0.4.2 — Board opening and visible amber charm

- Start tightly framed on the board, with players around its edges. Keep the same framing through the first dice roll and moving miniature; only the first spawned event unlocks the party camera. Include the event reveal in the transition.
- Reset that opening on new expeditions and preserve its state in saved games. Players start close enough to strike the smaller board.
- Replace the tiny amber brow mark with an amber pendant and chain anchored to the animated chest, plus a rear clasp. The charm still uses the existing head accessory slot. Add an Amber charm equipment preview in Rig Studio.
- Includes the early pixel-loader fix from 0.4.1.

# 0.4.1 — Early pixel loader

- Draw and animate the infinity loader before importing the game and editors or reading profiles. Show the Electron window only once its first frame is ready.
- Remove the extra 900 ms delay after assets finish loading, and stop drawing the loader after it fades out.
- Keep a readable startup error if the game module cannot load.

# 0.4.0 — New creatures, deliberate combat, and expedition rewards

- Panther, boar, beetle, alligator and four skeleton variants join the shared eight-direction joint/keyframe studio. Editable panther pounces default to 80 units and a 0.65-second cooldown.
- Melee requires a 90-degree facing cone, including close targets. The board is about 60% of its former width/height; rolling requires a close, directed strike. First-round hit order determines subsequent turns.
- New characters require unique names. Added 32 stat-bearing gear variants, distinct ground icons and common/rare/unique/legendary colors. Skeleton sword, archer, unarmed and horned sword/shield boss variants use the human rig with bone artwork.
- Plants telegraph and spit poison with a timed debuff; poison-resistant equipment protects against the debuff.
- Sealing preserves ground loot. Victory creates a separate shared chest with three rare items and exactly one legendary, unaffected by a full shared stash. Legendary gear is excluded from ordinary and boss drops. Unclaimed victory rewards remain as ground loot when restarting.
- Each new expedition regenerates scenery, rivers and bridges from a fresh seed and resets turn registration.
- The private room has worn tiles, utility pipes, fluorescent lighting, shelving and cleaning supplies. Players inside appear as purple portals on the minimap. Downed players sparkle and receive glowing minimap markers and revive direction arrows.

# 0.3.2 — Recognizable loot

- All 15 item types have distinct pixel silhouettes on the ground and in inventory, with shadows, stack counts and a pickup highlight.
- Only the nearest pickup gets a prompt for each player; duplicate prompts are suppressed and placement avoids players where space permits. Prompts identify board treasure and enemy drops.
- New drops seek clear, spaced positions instead of stacking inside the board or scenery. Treasure odds are unchanged: three rewards on each player's first roll and on multiples of four.
- Player style and animation are unchanged from 0.3.1.

# 0.3.1 — One player animation workflow

- Replaced competing player sheet, generic rig and legacy render choices with a shared eight-direction pixel mannequin inspired by the supplied running-dummy reference.
- Added direct joint dragging and bone rotation, rest-pose setup, per-joint animation keys, scrubbing, playback, onion skins, key retiming/copying, pose copy/paste, undo/redo, palette editing, and player package save/export/import.
- Idle, run, punch, slash, bow draw, hurt, dash and block use the same pose evaluator in gameplay and the editor. Equipment follows the same joints.
- Corrected player ground/shadow anchors. Menu portraits now use the active player renderer. Obsolete player animation assets are preserved but excluded from active editing paths.
- All 0.3.0 gameplay additions remain included. Animal animation tools are retained for a later creature-focused consolidation.

# 0.2.0 — Footprints and the living board

- Added an independent paintable collision mask to each sprite, including pencil/fill/erase, mirrored painting, undo/redo, JSON persistence, and default tree/rock footprints.
- Ground movement, dashes, knockback, and enemy charges respect collision. Canopies fade when they obscure a player while trunks remain solid. World art sorts using footprint depth.
- Added code-driven explorer limbs and sword swings, four-legged animal gaits, segmented snakes, flapping wings, moving golem/monkey limbs, and animated vines.
- Added circling, coils, dives, recovery windows, fleeing thieves, and variation in speed, patience, and targeting.
- Replaced the simple board ring with a carved folding board, decorated paths, green message lens, distinct miniature figures, and step-by-step movement before encounters resolve.
- Added an automatic/pinnable board close-up and workshop animation preview.
- Validation: 25 model/pixel/rig tests and 21 Electron smoke checks. Visual snapshots cover collision painting, canopy occlusion, the redesigned board, and animation poses.

This release is local co-op only. Procedural animation is an initial rig implementation; full directional hand-authored animation and automatic rigging of arbitrary imported art are not included.

# 0.3.3 — Shared player and lion rig studio

- Player / humanoid and Lion / quadruped use the same editor, pose evaluator, joint tools and keyframe timeline. Each keeps its own undo history and animation definition.
- Lions have four articulated legs with rear hocks, a neck and a three-part tail, eight directional views, and idle, walk, run, windup, pounce, bite, recovery and hurt clips. Combat clips follow enemy action timers.
- Added editable lion body, mane, head, leg and tail dimensions. Save/export/import includes the lion rig; obsolete lion sheets cannot override it.
- Other creature animation systems remain unchanged. Validation: 68 automated model tests and 42 Electron app checks.

# 0.3.4 — Storage room character parity

- Storage visitors use the main-world player animator, equipped gear, palette, ground anchor and character size instead of placeholder rectangles.
- Room camera follows the viewing player and matches main-world screen scale. Floor tiles use the same 32-unit grid. Walking updates directional facing and distance-driven run animation.
- Validation: 68 model tests and 44 Electron checks, including storage renderer/scale parity and movement animation.

# 0.3.5 — Mouse inventory interaction

- Inventory and storage controls remain mounted between frames, allowing mouse presses and releases to reach the same button. Inventory redraws when displayed data changes; room animation continues every frame.
- Pack, Portal and Potion HUD buttons also retain their DOM nodes while health and other status text updates.
- Added mouse instructions and regression checks for stable buttons, tab/item selection, equipping, closing and avoiding attack input from UI clicks. Validation: 68 model tests and 47 packaged Electron checks.

# 0.3.6 — Editable lion facial parts

- Lion ears, eyes, face, muzzle and nose have individual handles in the shared rig editor. They support rest positioning, animation keys, direct dragging and undo/redo.
- Each facial part has eight facing visibility toggles plus Show all / Hide all. Hidden artwork retains editable handles. Visibility is per facing, not a keyed blink track.
- Older lion packages gain facial parts attached to their edited head positions and head motion. Save/export/import preserves positions, keys and visibility.
- Includes the mouse UI fixes from 0.3.5 and a bat flight concept in design/bat-motion-concept-v1.png. The bat concept is not yet implemented as a rig.
- Validation: 70 model tests and 48 packaged Electron checks.

# 0.3.7 — Shared creature and trap rigs

- Bat, snake, monkey, snapping plant, golem and trap join player and lion in Rig studio. All use the same pose evaluator, direct joint tools, keyframe timeline, preview, independent undo history and save/export/import workflow.
- Bats have articulated wing membranes/fingers and hovering, flight and dive clips. Snakes have eight body segments, a tail tip, coil and strike clips. Monkeys have articulated limbs/tail and a banana throw with timed projectile release.
- Plants have fixed bases, flexible stems, leaves and separate snapping jaws. Golems have stone limbs, raised-fist windup and slam/recovery clips. Trap hinges/jaws animate deployment and capture; inventory consumption and capture duration are unchanged.
- Facial visibility remains editable per facing. Old sheet/rig modes cannot override migrated subjects. Other creatures retain their previous tools.
- Includes the preceding mouse UI and lion facial-part fixes. Validation: 78 model tests and 54 packaged Electron checks.

# 0.3.8 — Rhino rig

- Added Rhino / quadruped to the shared Rig studio, with four articulated legs, a short segmented tail, individual ears/eyes and two editable horns with base/tip handles.
- Added heavy idle/walk/run, stampede charge, windup, recovery, hurt and snared clips. Runtime, editor and portraits use the same model; old rhino rig modes cannot override it.
- Rhino animation and facing visibility persist in design packages, with import/export and independent undo. Existing stampede behavior remains intact.
- Validation: 80 model tests and 55 packaged Electron checks.
# 0.7.5 — Desert expeditions and stable UI framing

- Centered gameplay messages in a readable overlay.
- Inventory panels use stable screen-side anchors; multiplayer camera focus stays on players still in the world while another player has inventory or storage open.
- Added Forest, Desert and Random environment choices at expedition start.
- Desert worlds use sand, cactus/dune props and animated quicksand patches that slow movement.
# 0.7.6 — Dual wands and sword spin attacks

- Wands can now be equipped independently in either hand, allowing dual-wielded magic weapons. Each wand fires its own projectile and mana cost.
- A fully charged sword attack performs a radial spin attack with expanded area damage and a visible sword arc.
# 0.7.7 — Compact gameplay notifications

- Centered gameplay messages now use compact, content-sized toast cards so they do not cover the play area.
# 0.7.8 — Centered event message card

- Moved the full event message card from the right edge to the horizontal center of the game view.
# 0.7.9 — Gameplay HUD layout

- Matched the gameplay HUD layout to the reference: event details sit beneath the board on the right, compact notifications sit lower and centered, and the roster, board controls and minimap retain their corner positions.
# 0.8.0 — HUD placement from annotated layout

- Player status panels now stack in the upper-left.
- Notifications remain lower-center, with event details beneath the board and board/minimap controls on the right.
# 0.8.1 — Desert water and elemental variants

- Added a blue water elemental enemy with water bolts and matching rig art.
- Desert maps now have larger animated quicksand fields, shallow teal ponds with reeds, palms, and collidable cactus/palm trunks.
- Players sink gradually while standing still in quicksand and rise back out when moving.
# 0.8.2 — Wolf pack event

- Added a wolf creature using the lion/panther quadruped rig and artwork.
- Added The Wolf Pack event, spawning three wolves.
# 0.8.3 — HUD placement correction

- Player status panels now occupy the upper-left and upper-right corners.
- Event cards are centered at the top, gameplay notifications remain bottom-center, and board controls sit above the bottom-right minimap.
# 0.8.4 — Music and configurable unit sounds

- Added the supplied Curious Groove track as looping menu/game music with a saved volume slider in Camp Settings.
- Added per-unit attack, hurt and defeat sound selections to the creature editor; defeat playback now respects each unit’s configured sound.
- SFX sourcing notes: the editor’s sound choices use the existing generated game sound palette; CC0 reference packs include OpenGameArt’s 8-Bit Sound Effect Pack and Sound Effects Pack 2.
# 0.8.5 — HUD header spacing

- Moved the upper-corner player status panels below the round header so they no longer cover the round label.
# 0.8.6 — HUD final placement and safe pause back

- Moved player status panels to the lower-left, event cards to the top-center, gameplay notifications to the lower-center, the hint to the bottom edge, and board controls to the lower-right.
- Controller Back from pause now resumes play instead of quitting to the landing screen.
# 0.8.7 — Roster corner placement

- One player status card is anchored to the top-left.
- With two players, the second status card is anchored to the top-right.
# 0.8.8 — Pants layer depth

- Equipped pants now render as a pelvis overlay after the torso, so they visibly cover the lower body and connect to the leg layers.

