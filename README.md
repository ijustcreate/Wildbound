# Wildbound Worlds

A work-in-progress pixel adventure with shared-screen local co-op, living worlds and a built-in creation workshop. Gather explorers in a playable lobby, venture into unpredictable encounters, collect equipment and shape the game's characters and places.

## Play in your browser

| Edition | Play |
| --- | --- |
| Version chooser | [Choose an adventure](https://ijustcreate.github.io/Wildbound/) |
| Latest web build · 1.2.55 | [Play latest](https://ijustcreate.github.io/Wildbound/latest/) |
| Original web build · preserved project beginnings | [Play original](https://ijustcreate.github.io/Wildbound/original/) |
| Permanent current snapshot | [Play 1.2.55](https://ijustcreate.github.io/Wildbound/releases/1.2.55/) |
| Earlier archived update | [Play 1.0.74](https://ijustcreate.github.io/Wildbound/releases/1.0.74/) |

The original is retained as a historical snapshot. Future updates can change the latest link without replacing the original or earlier release folders. Use a desktop browser with a keyboard or compatible gamepad; controller support depends on the browser and device. Touch/mobile play is not verified.

## The game

- **Local co-op:** choose explorers in the lobby and share one screen. Character creation, equipment, inventory and controller menus support the adventure.
- **Board adventures and exploration:** encounter-based journeys alongside seeded, persistent local worlds. Forest, cemetery, beach, jungle, temple, desert, ice and newer realm environments have different scenery, wildlife and encounters; availability varies by mode.
- **Living worlds:** streamed regions, regional ecology, wildlife, weather, day/night changes, discoveries, quests and settlement interactions. Distant regions use statistical simulation rather than running every individual creature. The bundled world packs are Heartwood, Cemetery, Beach and Jungle.
- **Combat and equipment:** melee and ranged attacks, blocking, jumping, dashing, followers, loot, consumables, crafting and wearable gear.
- **A changing pixel world:** native articulated characters, eight-direction appearance and equipment, animated creatures, vegetation, lighting and shadows. The current update includes native locomotion and forest rendering improvements.

This is an evolving development build, not a finished release. Large encounters and newly streamed regions can still hitch. Online multiplayer and hosted servers are not available in this edition.

## The editor and workshop

The game includes tools for creating and reviewing content:

- Sprite and appearance editing for characters, creatures, clothing, equipment and items.
- Rig setup and animation: bone hierarchy, per-facing draw order, keyframe timeline, graph editing, two-bone IK, undo/redo and JSON export. A playable preview lets you test movement while editing.
- House Builder for structures, rooms, furnishings and saved local designs.
- Board and environment tools for terrain and prop layouts, including the newer realm environments.
- World authoring for levels, scenes, NPCs, ecology and shadows, with quest/dialogue editing and JSON backup/restore.

Some tools are experimental. See [rig workflow and current limitations](RIG_WORKFLOW.md) and [local worlds and content packs](docs/LOCAL_WORLDS.md). The browser can retain local edits; saving shared rigs directly into authored/rigs.json, native save-folder access and local content-pack installation require Electron. Editor drafts and personal libraries are not automatically uploaded to GitHub.

## Saves and editions

Saves live on the device and browser/profile used to play. The new web edition uses a separate storage namespace from the original, so testing it preserves historical saves. Later current web snapshots share that new namespace. The original keeps the site's previous save keys. Browser storage is shared across paths on the same origin; opening these links in another browser creates separate saves. Clearing site data removes browser saves. Export important editor work where export is available.

Electron, localhost and GitHub Pages each have separate saves. No account or cloud sync is required, and personal saves are not part of the source repository.

## Run the desktop game

The repository root is the Electron game. With Node.js/npm installed:

```powershell
npm ci
powershell -ExecutionPolicy Bypass -File scripts/rebuild-desktop.ps1
& ".\Play Wildbound.cmd" --check
& ".\Play Wildbound.cmd"
```

The rebuild runs checks, packages the current source and updates the versioned desktop shortcut. The launcher verifies its build identity. Normal play uses the normal profile; --preview uses a separate profile. Pulling source does not update an already packaged executable. See [development handoff](docs/DEVELOPMENT_HANDOFF.md).

For local browser play, run node scripts/launch-browser.cjs or use Play Wildbound Browser.cmd. See [browser setup and publishing](BROWSER-PLAY.md).

## Development

```powershell
npm test
node scripts/check-syntax.cjs
node scripts/build-web.cjs --versioned
```

The web builder writes a snapshot under dist/web-<version>/; generated packages, dependencies and personal profiles are excluded from source control. GitHub Pages is published separately from the gh-pages branch. Keep original/ and existing releases/ folders intact when publishing. [Publishing details](BROWSER-PLAY.md).

The repository also retains the separate character animation viewer project on main, including its Site source and stored-feedback integration. It is independent of the playable GitHub Pages game and personal game saves. Do not replace its hosting project or feedback database when updating the game.
