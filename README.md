# Wildbound

The repository root is the self-contained Electron desktop game. Version 1.2.0 on `Wildbound_worlds` adds local living worlds. Launch the verified desktop build with `Play Wildbound.cmd` or the **Wildbound Worlds (1.2.0)** desktop shortcut.

Choose explorers in the lobby, open **Worlds**, choose a pack and seed, then **Create & explore**. Existing worlds have independent saves and can be reopened through the same menu. Heartwood, Cemetery, Beach and Jungle are bundled. No internet, account, hosted service or separately running simulation process is required. Couch co-op remains available; networking is a dormant future adapter.

See [local worlds, content packs and simulation limits](docs/LOCAL_WORLDS.md) and [the development handoff](docs/DEVELOPMENT_HANDOFF.md). Old server documentation describes the archived experiment; its runtime, connection UI and Heartwood journey portals have been removed from this branch. Existing private server data and desktop profiles are preserved on disk.

## Character Viewer

This is a separate Site project for reviewing Wildbound character and unit animations. It uses a snapshot of the game's shared rig data and rendering modules under `public/viewer/`; the game checkout and saves are independent.

The site root redirects to `/viewer/index.html`. The viewer offers a unit carousel, animation picker, play/stop, loop and spin, frame scrubbing and stepping, and per-animation feedback. A user can mark a normalized rectangle on the preview, select four positive or four negative tag types, and write a comment. Each saved note records the unit ID, animation ID, zero-based frame and facing indexes, optional normalized rectangle, tags, comment, rig-and-renderer SHA-256 prefix, timestamp, and authenticated user ID.

Feedback lives in the Site's D1 `DB` binding, table `feedback`; it is not in browser storage or static site files. The schema and append-only migration are in `db/schema.ts` and `drizzle/`. On a later request to retrieve the review data, use the Sites database read tool for project ID in `.openai/hosting.json`, table `feedback`. Tags are stored as JSON arrays in `good_tags` and `bad_tags`. Keep the same Site project ID and D1 binding on future publishes so notes survive version changes. Do not replace or clear the database when refreshing rig assets.

To update the rig snapshot after Wildbound changes, copy `authored/rigs.json`, `src/`, and the four sprite JSON files (`animations.json`, `library.json`, `parts.json`, `animal-parts.json`) into matching paths under `public/viewer/`, then rebuild and republish this Site. Existing feedback stays tied to its recorded rig revision.

## Latest Wildbound update

The current viewer snapshot includes the new Beholder and Lesser Beholder enemy rigs, palettes, ray telegraphs, ranged AI, and encounter cards. It also includes desert burrower encounters and the related editor definitions and rig subject tracks. The new motion provenance is recorded in `public/viewer/assets/beholder/motion-provenance.json`.
