# Wildbound November 25 combined release

Several separately tested desktop packages shared a modified source checkout. The combined release brings their integrated source and the later updates together so the desktop and browser can be traced to the same committed revision.

- Greyhaven adds resident portraits and quests, including Mim’s duel, the stables and horse race, and the outlaw challenges. [Greyhaven cast](2026-11-25-greyhaven-cast.md)
- Diagon Alley gains visitors, a finished perimeter, and a working Gringotts vault that sends each explorer to their personal storage. The Shadow Realm adds a repeatable pawprint trail. [Alley and vault](2026-11-25-diagon-alley-and-gringotts-vault.md) · [Visitors and tracker](2026-11-25-diagon-visitors-and-shadow-tracker.md)
- The Wild Lands add Mossbell Hollow, Moonveil Circle, coastal landmarks, and updated terrain, water, foliage, and lighting. [Terrain and Greywake](2026-11-24-wilds-terrain-and-greywake.md) · [Coastal landmarks](2026-11-24-skull-rock-and-mermaid-lagoon.md)
- Live Edit supports in-game scene placement, terrain paint, spawns, and headwear fitting. Split-screen panes reuse frame-level shadow preparation while retaining their own camera transforms. [Live Edit](2026-11-24-live-edit-mode.md) · [Shadow preparation and benchmarks](2026-11-25-split-screen-shadow-performance.md)

The desktop build uses the normal save profile. The versioned shortcut targets `Play Wildbound.cmd` with `-BuildDirectory "dist\<version>\Wildbound-win32-x64"`. The desktop and web manifests record the exact source commit and build number. The browser edition retains the published Garden Villa and its storage namespace. [Play the current browser build](https://ijustcreate.github.io/Wildbound/latest/) · [Browser build and save details](../../BROWSER-PLAY.md)

The 1.2.184 desktop package passed muted lobby boot, 254 scripted renderer checks and a byte comparison of 2,155 runtime and asset files. The 1.2.185 browser package passed 16 standalone checks, the Pages staging check and hosted file integrity checks. The broader Node suite exposed Canvas test doubles that still assumed round minimap dots. The updated tests exercise the directional player marker and preserve the mausoleum art and lighting assertions. [Wilds art and minimap verification](2026-11-25-wilds-art-and-minimap.md)
