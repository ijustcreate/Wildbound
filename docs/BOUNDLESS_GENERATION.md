# Boundless destination generation

Boundless extends the selected destination. It does not choose a new biome when a player crosses a region boundary. The ordinary finite maps and the Wildbound house-travel campaign remain separate.

## Shared rules

- Use the expedition seed and absolute world coordinates. Negative coordinates use floor division and positive modulo; discovery order must not affect geography.
- Stream 50-by-50 tile regions, one nearest missing region per update. Keep a one-region neighbourhood around each living surface explorer. Terrain/plans have a 64-entry cache; enemy navigation uses bounded local grids and a 16-entry grid cache rather than allocating an infinite world.
- Neighbours share identical boundary entrances. Join them to local hubs/gates, carve broad routes, clear obstacle shoulders and put bridges where routes cross rivers. Never pave or plant scenery over the open ocean.
- Reuse the forest's `makePaving` Wave Function Collapse masonry for route details. Global route connectivity is guaranteed by shared entrances and tested walkable corridors; WFC supplies local paving patterns, as in the original forest system.
- Generate collision, surface art and distant terrain from the same plan. Draw viewport ground at negative and distant coordinates; the finite-board reveal must not erase the boundless landscape.
- Keep scenery/plot/mausoleum IDs unique per region. Journal only modified scenery and grave plots on unload. Preserve destroyed trees, broken graves, harvested crops and opened crypt doors through revisits and JSON saves. Temporary rustling must not create persistent region edits.
- Keep the original board clearing peaceful. Additional ambient threats use the destination's species, a shared cap, and cull when far from every active explorer.

## Destination instructions

| Map | Terrain and structure rules |
| --- | --- |
| Forest | Continue the original river ribbons in absolute coordinates; keep shallow banks and walkable bridges. Join varied woodland crossroads with cleared trails. Add trees, shrubs, ferns, rocks and overgrown ruin fragments away from the routes. |
| Desert | Extend a continuous dune field. Coherent noise creates oasis clusters and off-route quicksand; caravan lanes stay sand. Palms belong near oasis water, while cactus, sandstone and dunes fill dry ground. |
| Ice | Use broad snowfields and coherent frozen-water patches. Make sheltered snow routes with compacted-snow marks; use snow trees, frost shrubs, ice rock and spires. |
| Temple | Extend jungle with stone causeways and bridge crossings. Give outer hubs a stone courtyard and nearby ruined pillars, rather than stamping another copy of the original temple building. |
| Beach | Build a large irregular island around the expedition, surrounded on every side by open ocean. Add a shallow surf band, sand, inland green patches and seeded offshore islands. Keep the original pier, use palms/coastal rock/driftwood/grass on dry land, and stop land trails at water. Surf can face every coast direction. |
| Cemetery | Place additional fenced burial grounds at varied regional offsets. Join real west/east/north/south gates to neighbouring paths; turn through the north gate instead of crossing its fence. Reuse the existing graves, plot art, pumpkins, trees and mausoleums, with seed variation and unique metadata so harvesting and crypt interactions work. |
| House estate | Preserve the original house, rooms and pools. Extend garden/woodland walks and estate greenery outside it; do not spawn copies of the house. This rule applies to ordinary Boundless house maps, not the separate home-and-six-worlds campaign. |

The executable rules live in `src/boundless-generation.mjs` (`BOUNDLESS_MAP_RULES`, region entrances, destination fields and plans), simulation/residency in `src/boundless-world.mjs`, and route/outer-ground art in `src/boundless-art.mjs`. New edits should keep the entrance and save/revisit tests green.

Legacy Boundless saves adopt the new contract once. Old streamed mixture props are discarded, while non-streamed home/custom props are retained. Beach cells edited away from the former procedural baseline are preserved. Existing legacy dropped loot and non-streamed encounters remain intact.
