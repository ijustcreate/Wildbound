# Wildbound Worlds

A pixel adventure for one to four local players. Gather your party, roll the living board, explore connected worlds and create your own characters, creatures and places.

**[Play Wildbound in your browser](https://ijustcreate.github.io/Wildbound/latest/)** · [Browse web editions](https://ijustcreate.github.io/Wildbound/) · [Play the preserved original](https://ijustcreate.github.io/Wildbound/original/)

## Getting started and local co-op

Open **Choose your explorer** from the title screen. Press **Enter** on the keyboard or **A** on a controller to join, then select or create an explorer. Walk around the lobby to practice movement and combat, change the map and dice settings, pick a difficulty and ready up at the board together.

The party shares a camera when nearby and can split into separate views while exploring. Each player has their own inventory, equipment and action bindings. Open **Camp → Controls** to review or change bindings, or **Controls & journal** in play for a quick reference. Use a desktop browser with a keyboard or compatible gamepad. This edition supports local play. Mobile controls and online multiplayer are outside its current scope.

## Board adventures and game modes

Roll the dice to move the party's pieces and trigger encounters in the world around you. Encounter cards give clues for enemy waves, puzzles and boss fights. Shared turns, one- or two-die rolls and the Gentle, Adventure and Wild difficulty settings change the pace of a run.

| Mode | How it plays |
| --- | --- |
| **Wildbound** | Start at Home and open portals to linked worlds. |
| **Classic** | Start at the board in one destination. Play on a bounded map or choose a streamed Boundless map where available. |
| **The Wilds** | Start by the railway, then explore The Wild Lands on foot or by train. Save at Camp to resume later. |
| **Worlds** | Create a named, persistent local world from a seed and a world pack. Explore and return to it between sessions. |
| **Mossroot Coliseum** | Enter through the lobby TV for a side-view arena with platforms, travel tubes and a board-driven run. |

## Biomes, living worlds and travel

Explore forest, desert, ice, House & Yard, Jungle Temple, beach, graveyard, Bayou Marsh, Hollowdeep Caverns and the Shadow Realm. Availability varies by mode. Each region has its own terrain, creatures, encounters and scenery, with changing light, weather and time of day.

In persistent Worlds, discover settlements, talk with NPCs, trade with merchants, search nests and complete local quests. Wildlife populations, food, water and settlement conditions evolve as world time advances. Bundled world packs include Heartwood, Cemetery, Beach and Jungle. [Local worlds and content packs](docs/LOCAL_WORLDS.md)

In The Wild Lands, board the steam train, cross the gangways, ride in the passenger coaches or take the controls in the cab. Explore station interiors, shops, rivers, caves and portals along the route. The game also includes a drivable car and an editable railway test map. [Railway controls and workshop](docs/railway-system.md)

Look for the Overlook hedge maze behind the villa or the Wilds farmhouse. Explore its paths or break hedges to make a shortcut to the hidden reward.

## Combat, creatures and progression

- **Combat and magic.** Fight with swords, shields, bows, boomerangs, wands and traps. Read attack tells, dodge or block, interrupt dangerous casts and work with teammates on elemental and terrain-based combinations. Discover techniques in the Field Kit as you perform them.
- **Wildlife and companions.** Encounter skittish wildlife, territorial creatures, coordinated enemy packs and bosses. Catch eligible creatures, raise companions and bring followers along on expeditions.
- **Equipment and supplies.** Collect loot, craft and use consumables, equip weapons and armor, socket gear and uncover rare drops and boss sets. Keep supplies in your inventory or use personal and shared storage.
- **Explorers and progress.** Customize an explorer's appearance, develop their abilities, and resume saved expeditions with their gear and discoveries.

## Pixel art, sound and settings

Editable pixel rigs animate characters, creatures, clothing and equipment in eight directions. Forest canopies move in the wind, light and shadows change through the day, and attack effects show where a strike or spell will land. Music responds to exploration and combat, with local sounds for weather, water, creatures and machinery. Camp Settings includes display, sound and control options.

## Studio and creation tools

Open **Studio** from the title or lobby to work on game content without joining a party. Some tools are experimental.

- **Characters, creatures and equipment.** Edit sprites, palettes, outfits and item art. Rig Studio supports bone hierarchies, per-facing draw order, keyframes, graph editing, two-bone IK, undo and redo, JSON export and an interactive movement preview. [Rig workflow](RIG_WORKFLOW.md)
- **Locations and scenery.** Build and furnish houses, lay out boards and environments, and edit terrain, forest props, regions and lighting. The railway workshop supports track routes, car interiors and eight-view pixel parts.
- **Rules and presentation.** Author NPC dialogue, quests, encounters and ecology. Tune items, combat, combos, particles and camera behavior, then test changes in the game.

The browser stores edits locally. Writing shared rigs to `authored/rigs.json`, opening native save folders and installing local world packs use the Electron edition. Export drafts and designs you want to move between machines.

## Art workflows for contributors

Clone or download the [Wildbound_worlds source branch](https://github.com/ijustcreate/Wildbound/tree/Wildbound_worlds) to get the [Wildbound art skill](.agents/skills/wildbound-art/SKILL.md), examples, and tools together. The guides cover sprite recipes, environment art, eight-direction rig parts, and skeletal motion transfer. With an AI coding assistant, try “Read `.agents/skills/wildbound-art/SKILL.md` and use it to make a small draft in this checkout.”

## Saves and editions

Characters, expeditions, worlds and editor libraries are saved on the device and profile where you play. Electron, localhost and GitHub Pages have separate saves. The current Pages editions share a browser storage namespace, and the preserved original keeps its historical keys. Clearing site data removes browser saves. Play requires no account.

## Run the Windows desktop game

With Node.js and npm installed, open PowerShell in the game checkout.

```powershell
npm ci
powershell -ExecutionPolicy Bypass -File scripts/rebuild-desktop.ps1
& ".\Play Wildbound.cmd" --check
& ".\Play Wildbound.cmd"
```

The rebuild runs the tests, creates a numbered package and adds a shortcut for that exact build. The launcher verifies the package before starting it. Normal play uses the normal save profile. The Night Hunt preview uses its own profile. After pulling game source, rebuild the desktop package. [Development handoff](docs/DEVELOPMENT_HANDOFF.md)

For local browser play use `Play Wildbound Browser.cmd` on Windows or `node scripts/launch-browser.cjs` with Node.js. [Browser setup and publishing](BROWSER-PLAY.md)

## Development and publishing

```powershell
npm test
node scripts/check-syntax.cjs
node scripts/build-web.cjs --versioned
```

The game source lives on [`Wildbound_worlds`](https://github.com/ijustcreate/Wildbound/tree/Wildbound_worlds). GitHub Pages publishes from `gh-pages`, and the version chooser links to `latest/`, the original and permanent snapshots. Keep the original and previous releases intact when publishing. Generated packages, dependencies and personal profiles stay out of source control. [Publishing workflow](BROWSER-PLAY.md)

The `main` branch also retains the separate character animation viewer and its stored-feedback integration. [Character animation viewer](https://github.com/ijustcreate/Wildbound/blob/main/docs/CHARACTER_VIEWER.md)
