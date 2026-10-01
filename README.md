# Wildbound Character Viewer

This is a separate Site project for reviewing Wildbound character and unit animations. It uses a snapshot of the game's shared rig data and rendering modules under `public/viewer/`; the game checkout and saves are independent.

The site root redirects to `/viewer/index.html`. The viewer offers a unit carousel, animation picker, play/stop, loop and spin, frame scrubbing and stepping, and per-animation feedback. A user can mark a normalized rectangle on the preview, select four positive or four negative tag types, and write a comment. Each saved note records the unit ID, animation ID, zero-based frame and facing indexes, optional normalized rectangle, tags, comment, rig-data SHA-256 prefix, timestamp, and authenticated user ID.

Feedback lives in the Site's D1 `DB` binding, table `feedback`; it is not in browser storage or static site files. The schema and append-only migration are in `db/schema.ts` and `drizzle/`. On a later request to retrieve the review data, use the Sites database read tool for project ID in `.openai/hosting.json`, table `feedback`. Tags are stored as JSON arrays in `good_tags` and `bad_tags`. Keep the same Site project ID and D1 binding on future publishes so notes survive version changes. Do not replace or clear the database when refreshing rig assets.

To update the rig snapshot after Wildbound changes, copy `authored/rigs.json`, `src/`, and the four sprite JSON files (`animations.json`, `library.json`, `parts.json`, `animal-parts.json`) into matching paths under `public/viewer/`, then rebuild and republish this Site. Existing feedback stays tied to its recorded rig revision.
