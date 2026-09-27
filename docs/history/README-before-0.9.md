# Wildbound — The Living Board

**Latest build: 0.7.4.** Open `dist/0.7.4/Wildbound-win32-x64/Wildbound.exe` or the desktop **Wildbound** shortcut. Player, skeleton variants, lion, panther, boar, beetle, alligator, bat, snake, monkey, snapping plant, golem, rhino, dragon, fire elemental, and trap animation share a visual joint/keyframe editor with eight-direction rigs: see [Player Animation](PLAYER_ANIMATION.md). The older release notes below describe 0.2.0 and are not the current controls or feature list.

A playable Electron jungle adventure for 1–6 people on one shared screen. Created for local controller co-op, with keyboard/mouse available as an additional player.

## Play

Open **dist/0.7.4/Wildbound-win32-x64/Wildbound.exe**. Keep that whole folder together if copying the game to another PC. The root **Play Wildbound.cmd** launcher opens the newest build too. Close the previous version before opening the update; both versions use the same saved sprite library.

1. Choose **Gather your party**.
2. Press a button on each controller to join. Press **Enter** to add one keyboard/mouse player. New characters require a unique name.
3. Choose **Open the board**. The first round begins without an assigned turn order.
4. Attack the table to roll. First-round hits establish turn order; each player rolls once. Later rounds follow that order. Stand close and face the table. Other players can fight while dice resolve.
5. Creatures stay until defeated or trapped. Later rolls add more creatures.
6. Reach space 48 with a miniature and hold Interact near the board to call WILDBOUND. Loot the victory chest, then strike the board to generate another jungle. Ground loot survives sealing.

Players stay still during the opening board view until the first roll triggers its event. Players can still join during round one. After everyone has rolled, the roster locks. A knocked-down player must be revived; their turn is never skipped. If everyone is down, the expedition ends.

### Storage, equipment and magic (0.6.0)

Private storage has a robot merchant on the left and potion vending machine on the right. Walk close and Interact, or click their room buttons. The robot buys the selected stack; the vending machine sells one potion for 10 coins. Gold stays with the saved character. Sold items move into the robot’s saved inventory. The vending machine has twelve slots: health potions cost 10 gold, stamina potions cost 15. Wait for the item to fall, then click it in the tray (controller Y) to collect. Stamina potions halve dash cooldown for 30 seconds.

Backpack and paper doll open side by side, with a third chest window when looting. Drag items between slots with the mouse. Explicit drops retain that exact slot, including gaps, after saving; automatic transfers merge stacks or use the first open slot. One-handed swords fit either hand. All player-dropped supplies require Interact to collect. Summoning a portal leaves you outside: walk into the nearby portal to enter. The enlarged room view shows the entire room. Walk into the lower purple portal to exit. Rename an owned chest from its chest window; names are saved with your character.

Chest controls: LB/RB or Tab changes window; A/Enter or X/R transfers the selected stack. Y/2 splits a stack in half; mouse users can choose the exact amount. In the world backpack, X/R drops the selected stack, and the mouse also offers Drop one. Potions require tap Interact to pick up.

Head, neck, shoulder armor and cape are independent slots. Several helmet styles and shoulder pieces have distinct art, and equipped hats, gloves, boots and shoulder armor use the same pixel artwork as their inventory icons. Relics such as the Jade Scarab and Moon Reliquary give passive bonuses while carried in the backpack; moving one to a chest removes its bonus. Relics appear in treasure and enemy drops. Wands fire on attack release and travel seven squares. Charging makes bolts larger and doubles their damage at full charge without changing speed or range. They cost mana per cast, and regenerate 8 mana per second up to 100. The mana meter appears only while holding a magical weapon. Capes and wands drop as gear; legendary variants remain exclusive to victory rewards.

### Environment and harvesting

Expedition setup now offers Forest, Desert, or Random. Desert maps use warm sand, cactus and dune props, and animated quicksand patches that slow movement while remaining traversable.

Melee strikes in your facing direction harvest trees and rocks. Trees drop sticks, then fall and drop logs. Repeated rock hits fill a progress bar and release stone chunks; collect these materials with Interact. Deep water blocks walking; shallow water slows movement and makes ripples. Monsoons flood one extra bank tile and cover bridges until the rain ends. The minimap marks explored terrain, loot and enemies in explored areas. Open Board (B) to see the current turn.

### Controls

| Action             | Keyboard/mouse                   | Controller defaults            |
| ------------------ | -------------------------------- | ------------------------------ |
| Move               | WASD or arrows                   | Left stick                     |
| Aim                | Mouse (movement if mouse unused) | Right stick, or movement       |
| Attack / hit table | Left click or F                  | Bottom face button (index 0)   |
| Dodge              | Space                            | Right face button (index 1)    |
| Quick loot         | —                                | X / left face button (index 2) |
| Interact / revive  | E                                | Y / top face button (index 3)  |
| Place trap         | Q                                | Left-stick click (index 10)    |
| Pause              | Escape                           | Start / + (index 9)            |
| Board close-up     | B                                | Left shoulder (index 4)        |

Traps capture creatures after two seconds. Every roll replenishes one trap; fruit restores health and one trap. Controller X quick-loots, Y interacts, and left-stick click places a trap. **Gentle** limits each incoming hit to 1 HP. **Adventure** reduces incoming damage. **Wild** uses full damage. Controllers navigate the lobby with D-pad or stick, A to activate, left/right to change dropdowns, LB/RB to cycle characters and B to return.

The camera starts tightly on the table, then smoothly follows party spacing. It zooms closer when players gather and farther out when they spread out. Event arrivals briefly extend its view. The map is 50×50 tiles with the table at the center.

### Controllers

The lobby displays controllers detected by Chromium's Gamepad API, their stick readings, and pressed button numbers. Settings lets you change button indexes. A wired Xbox 360 controller and a Switch controller still need a real hardware test on your PC; Bluetooth pairing alone does not guarantee Chromium recognizes a particular controller. There are no controller drivers bundled in the game. A disconnected controller pauses gameplay. Reconnect it, or assign the keyboard if no player is using it.

## Sprite workshop

All 25 built-in sprites are editable 48×48 indexed-palette assets; game rendering uses the same library that the workshop edits.

- **Load image:** accepts a local image. Zoom with the wheel, pan with right-drag or Shift-drag, and drag a crop around your subject.
- Choose 16, 32, 48, 64, or 96 pixels. The importer fits the crop while preserving its aspect ratio and leaving a small margin.
- Optional connected-background removal uses the crop's top-left color with adjustable tolerance. Transparent PNGs work directly. Optional game-palette matching reduces colors consistently.
- **Edit this crop:** opens the result in the pixel editor. Pencil, eraser, flood fill, color picker, mirrored painting, undo, and redo work on actual pixels. Erased pixels become transparent.
- **Split grid & import all:** divides the entire sheet into equal rows/columns and creates an editable asset for every cell.
- **Save to game:** stores the asset locally. Saving under an existing name (for example `lion`) replaces its appearance immediately.
- Export PNG or the full JSON library for backup and sharing. Importing library JSON restores editable assets.

Edits are saved in Electron's local storage on this computer. Export the library to keep a portable backup. Art edits do not change combat behavior.

### Collision footprints

Select an asset, then choose **Collision footprint** from the editor's layer selector. Pencil and Fill mark solid ground in red; Erase removes collision. Mirror and undo/redo work on this layer too. The visible sprite pixels remain untouched. Paint only a tree's trunk base, not its canopy. Default trees and rocks already have footprints.

**Fade when covering a player** enables occlusion fading. Scenery is sorted by its ground footprint. A canopy smoothly fades to 28% opacity when its opaque art covers a player standing behind it; it becomes solid-looking again after the player moves clear. The trunk remains physically solid during fading. Players and ground enemies collide with masks; flying creatures ignore scenery footprints, but not the table.

Footprints and the fade setting survive JSON export/import and Save to Game. PNG export contains artwork only. Scenery masks are live: saving `tree` changes every tree using that asset. Custom assets need to be placed by the game code to become scenery; this is not a map editor.

### Articulated animation and behavior

The built-in characters now use procedural pixel rigs rasterized at 64×64, then enlarged without smoothing. Explorers have separate arm/leg movement and a sword swing; snakes use a traveling wave along a segmented spine and coil before attacking; cats use alternating diagonal pairs of paws and a tail; bats/wasps flap separate wings; monkeys/golems use limb parts; vines sway their stems.

This is a first rig pass using existing sprite crops plus procedural body parts, not a complete set of hand-authored directional frames. Arbitrary imported images are still static unless they use a supported built-in asset name. Purpose-made layered heads, torsos, limbs, and directional key poses are the next art-quality step. Preview controls in the workshop show walk, idle, and attack poses for supported assets.

Cats circle before pouncing, with a recovery window afterward. Snakes weave and coil. Flying creatures orbit and dive. Monkeys retreat after stealing a trap. Crocodiles have a longer recovery; golems telegraph their slam. Speed, circling direction, patience, and target preference vary between spawns. After the first round some lion encounters use a striped tiger appearance on the same four-legged rig.

### Living board

The expanded board has hinged covers, leaf decoration, a winding 48-space route, a green message lens, and six colored carved figures. After dice settle, the active figure hops through each rolled space. The encounter appears only after it lands; then the next turn begins. The board close-up opens during rolls and can be pinned with B or the left shoulder button. Combat continues while it is open.

## Programmer art pipeline

See [assets/ART_PIPELINE.md](assets/ART_PIPELINE.md). The AI-generated source sheet is **assets/concept-sheet.png**. It has 25 designs in a 5×5 arrangement. **assets/sheet-layout.json** defines names and manually checked source bounds; **assets/library.json** is the game-ready output.

```sh
node scripts/import-sheet.mjs assets/concept-sheet.png assets/sheet-layout.json assets/library.json
```

The same pure conversion code powers the batch importer and the workshop. Generated art supplies the designs; deterministic conversion enforces exact dimensions, transparency and palette. AI generation is a developer workflow, not a user-facing feature or an API-key requirement.

## Development

Requires Node.js and npm.

```sh
npm install
npm start
npm test
npm run test:app
npm run package
```

`npm run dev` serves a browser preview at http://127.0.0.1:4173. Packaged Electron is the intended play environment.

On this development machine npm was bootstrapped under `.tools/package`; `node .tools/package/bin/npm-cli.js` is equivalent to `npm`.

The Electron smoke test runs offscreen and captures landing, lobby, workshop, crop import, and gameplay screens in `test-output/`. Logic tests cover ownership of rolls, joining, encounter persistence, all event spawns, traps, revival, loss/win conditions, world boundaries, camera framing, transparency, fill, and imported asset validation.

## Current scope

This is a first playable local co-op build. Online rooms are deferred and are not implemented or presented as a working menu option. Physical controllers, long-session balance, and six-person couch play still need hands-on testing. No external accounts or network services are required to play.
