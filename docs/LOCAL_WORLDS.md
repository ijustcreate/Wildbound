# Wildbound Worlds 1.2.0

Choose your explorers in the lobby, then **Worlds → Create & explore**. The Worlds button is available in the lobby, home menu and pause menu. During exploration, the world-name button opens the same menu. Close the Worlds dialog to resume. Normal board adventures and existing characters remain available.

## Local ownership and saves

The game owns simulation directly. Hosted networking, live connection UI, public tunnels, server control executable and the nested Heartwood portal experiment are removed on this branch. Previous branches retain their Git history. Private server data was not deleted. The old LAN transport is retained as a dormant adapter with no visible host/join controls; normal local-world play never starts a listener.

Normal desktop saves are in `%APPDATA%/wildbound/Worlds/<world-id>/`. **Open save folder** resolves the actual current profile. Normal characters, authored rigs, house libraries and traditional expedition saves keep their existing locations. Test processes use `test-output/profile`, never the normal player profile.

```
<world-id>/
  world.json
  save.snapshot
  save.snapshot.bak
  terrain/changes.json
  ecology/regions.json
  settlements/state.json
  discovered-events/history.json
```

`save.snapshot` is the authoritative atomic checkpoint; the readable JSON projections can be reconstructed. A corrupt primary falls back to the previous valid backup. Writes to each world are queued. Autosave runs every five seconds and on actions; closing the desktop waits for a final save. A failed close-save leaves the game open to retry. Switching worlds waits for the old save. Terrain and scenery regenerate from the seed and recorded differences. Changed or added props, removed props and edited terrain tiles are stored; unchanged streamed chunks are not copied. Actors, inventories, NPCs, damage, event progression and ecology are stateful checkpoints.

Copy the whole world directory with the game closed to transfer it manually. Characters and editor libraries are separate. No personal save data belongs in Git or a client package.

## Simulation and director

One real minute is one world hour (60× clock); a world day is 24 real minutes. Active time follows simulation time, pauses freeze it, and reopening applies elapsed wall time. Backward wall-clock changes do not rewind the world. The elapsed time is accounted for completely; for absences exceeding 90 world days, older intervals use an equilibrium approximation followed by at most 90 days of hourly statistics per known region.

The 1,600-pixel regions containing living explorers run actual creature movement, combat and local ecological interactions. Their eight neighbors stream scenery; other explored regions retain statistical population, food, water, nests, weather and settlement state. Unvisited regions are generated lazily from seed and coordinates. Existing regional summaries receive hourly ecology updates; distant actors are stored dormant rather than running AI. Plant regrowth, reproduction/carrying capacity, predation, daily migration, nest creation, merchant arrivals, rare encounters, weather damage, relations and weekly seasonal markers are deterministic functions of seed and world time. The director updates settlement supplies and condition; the Worlds inspector lets an explorer search local nests, trade during merchant visits and spend settlement supplies on repairs. Native merchant events also use the existing merchant actor.

The Worlds inspector shows regional statistics, simulation tiers, quests and recent events. Discovery quests complete from explored-region counts. **Simulation test controls → Advance one world day** changes and saves the current world, making population/director behavior easy to test. Plants regrow after three world days; rocks, graves and built structures retain their changes. Player inventories, health and combat are not simulated while the game is closed.

Current practical limits are 4,096 discovered regions per world, 64 active ecology actors across the party, 10 prey and 3 predators per active region, 256 recent history entries and a 32 MB checkpoint. Checkpoints retain earlier consequences after the event tail is compacted. This is a first playable ecosystem model, not an individual lifetime simulation of every distant animal. Settlement activity is represented by supplies, condition, relations and available interactions; there is no autonomous town-building economy. Seasonal events currently mark the calendar; they do not replace every biome's artwork.

## Content packs

Bundled packs live in `worlds/<id>/world.json` and reuse native generators, scenery, board art, creature rigs, sound and existing encounters. **Install content pack…** selects a manifest from a local folder, validates it, then copies its declared assets into the profile's `world-packs/<id>/`. Use a new ID for an expansion; bundled IDs are reserved by precedence. Worlds embed the pack's rules so later rule changes do not silently rewrite old saves. Custom media requires the installed pack folder when transferring a world.

```json
{
  "version": 1,
  "id": "my-forest",
  "name": "My Forest",
  "environment": "forest",
  "description": "A local expansion",
  "prey": ["mother_deer", "pig"],
  "predators": ["panther"],
  "food": 0.8,
  "water": 0.7,
  "factions": ["Wayfarers"],
  "quests": [{"id":"explore","name":"Discover five regions","target":5}],
  "assets": {"board":"assets/board.png", "music":"assets/theme.mp3"}
}
```

Native generator choices: forest, graveyard, beach, temple, desert and ice. Optional `events` is an array of native encounter indices. Optional asset keys: board, lobby, cemetery (central ground art), music and ambience (adaptive companion audio). Artwork must fit the existing board/terrain geometry. Paths stay inside the pack's `assets/` directory. Packs are declarative data and media, not arbitrary executable generator code. Future bespoke generators need native code integration.

## Playable rig preview

The studio shows hierarchy, a half-width editing stage, inspector and independent playable preview in a single row, with timeline below. The preview uses the lobby floor and walls with no board/furniture. It draws the selected editable rig live, using separate practice-game movement, jump and weapon state. Changes do not need to be saved to see them, and practice cannot change expedition or profile data.

The compact **Keys** toggle captures WASD/arrows, J attack, K block, Space jump and Shift dash. Escape or window blur releases keys. **Pad** uses a connected controller with the game's mappings; the selector chooses a pad. Input is routed away from dialog navigation while the preview owns that pad. Disconnect releases ownership. Wheel zoom changes the preview camera. The ↺ button resets position and ? reveals controls. Creature rigs share this movement sandbox while drawing their own native animation clips; this is not each creature's autonomous enemy AI.
