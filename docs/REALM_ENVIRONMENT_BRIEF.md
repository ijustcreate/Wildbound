# Bayou, Hollowdeep, and the Shadow Realm

## Reference inventory and implementation contract

Forest supplies the grounded tree bases, felling/stump lifecycle, harvest feedback, clear central board approaches, and native pixel-art conventions. Beach supplies the bounded seeded map, separated shallow/deep water, landmark placement, small collision footprints independent of image bounds, and ambient ecology. These environments extend those systems rather than importing a separate asset renderer.

| Role | Bayou Marsh | Hollowdeep Caverns | Shadow Realm |
| --- | --- | --- | --- |
| Major silhouette | Mangrove, old cypress | Limestone shelf, stalagmite | Wither tree, root arch |
| Harvestable mineral | Peat boulder, cypress knee | Cyan crystal, amber crystal | Obsidian, veil stone |
| Ground cover | Reeds, fern, lily | Mushroom, rubble | Thorn fan, echo fungus, shadow bloom |
| Other interaction | Moss log; river boardwalks | Ceiling rockfall, dripping water | Ashen log; walk-through root arches |
| Small fauna | Bayou frog, marsh firefly | Cave cricket, blind fish | Dusk moth, veil beetle |
| Peaceful wildlife | Nutria | Olm | Pale hart |
| Event one | Lanterns in the reeds | The singing geodes | Keep the last lights |
| Event two | The nesting bank | Wings in the echo hall | Hounds beyond the veil |

Eight scenery assets per location. Wildlife body views and limbs are separate indexed-pixel assets. Runtime locomotion articulates the limb sprites rather than baking walk-cycle frames. No image-generation dependency.

## Working prompts

### Bayou

Build a Louisiana-inspired old-growth wetland. Read the water before the vegetation: dark winding channels, lighter shallow murk, ochre mud landings, broad moss-green islands. Connect every destination with a loop and explicit boardwalk crossings. Give the player alternate routes around trunks. Keep central board approaches clear. Use heavy cypress columns, buttress roots, mangrove root arches, hanging Spanish moss, broad canopy masses, and a restrained olive/bark palette. Do not cover the marsh uniformly with trees; cluster old growth around island edges and leave open water. Distinguish the small knees from boulders. Give every solid object a grounded footprint; canopy bounds must never become collision. Nutria should idle and flee peacefully. Frogs and fireflies should make the shallows feel inhabited without becoming combat enemies.

### Caverns

Build a connected chamber-and-passage system around a safe central hall. Include loops, not isolated rooms. Outside the walkable excavation, use dark impassable rock with broken mineral ledges at exposed boundaries. Rooms have different identities: cyan geodes, amber seams, mushroom grotto, and subterranean pools. Separate the rounded limestone taper of stalagmites from hard faceted crystals. Place mineral clusters near walls, reserve open routes, and add modest light sources that disappear when mined. Falling stalactites stay overhead and invisible during ordinary play; reveal falling dust and a floor shadow for at least one second before the strike. Default to five hazards, 1.6-second warnings, 0.35-second falls, and five base damage. Each ceiling hazard fires once per expedition and stays spent across saves. Never place hazards in the board clearing. Drips and small ripple rings are decorative. Olms and blind fish occupy appropriate traversable/wet habitat.

### Shadow realm

Build a hostile-looking place with readable movement. Use ink-violet void, muted plum earth, broad twisted trunks, pale fungus, and occasional cold light. Make root arches rare landmarks with two feet and a passable center. Thorn fans are visual ground cover, not invisible barriers. Keep this location visibly different from the green swamp and grey caverns. Pale harts are peaceful even though the environment is ominous. Murk wolves provide the themed combat encounter; the ward event asks players to visit three distinct destinations before the lights fade. Do not obscure attack cues with atmospheric noise.

### Art and interaction

Resolve each silhouette before shading. Use broad shadow and highlight clusters and one or two identifying details. Maintain the existing chunky pixel density. Avoid fine texture, random glitter, and outlines around every primitive. Keep character feet, prop roots, collision boxes, and jump surfaces in the same ground coordinate system. Check the assembled scene at gameplay size, not only an enlarged asset catalog. Technical tests do not certify aesthetic quality or user approval.

### Editor and save contract

Expose each native asset in the existing pixel library. Expose terrain paint, prop placement, movement, size, collision dimensions, jump height, and ceiling warning/damage in Studio → Environments. Preview all ceiling hazards in the workshop. Save layouts on this device, export/import JSON for transfer, and apply saved layouts only to new expeditions. Preserve running expeditions, local sprite overrides, authored rigs, and other developers' uncommitted changes. Six events remain editable in the existing Events tab; append new defaults after the existing roster to preserve old indices.

## Verification checklist

- Flood-fill connected chamber destinations over multiple seeds; never count deep water or void as a walking route.
- Check real `Game.blocked`, harvest, stump support, rock support, and arch openings.
- Trigger a rockfall, leave the shadow, then confirm no damage; stand through a separate fall and confirm exactly one small hit.
- Save and restore spent hazards, harvested props, fauna state, and event progress.
- Spawn and render all six events in a muted isolated Electron profile.
- Render full-map previews, representative gameplay frames, and the asset catalog; correct visible defects before shipping.
- Mount all workshop locations, save/reload a draft, and verify sprite overrides are used by the renderer.
- Run the repository suite and record failures honestly, distinguishing existing checkout problems from this implementation.

## Editing entry points

- `src/realm-world.mjs`: topology, asset catalog, collision, hazard state.
- `src/realm-art.mjs`: indexed native scenery, ground shading, warning effects.
- `src/realm-life.mjs`: articulated ambient wildlife, ecology, six events.
- `src/realm-editor.mjs`: workshop, terrain/prop edits, layout JSON.
- `scripts/verify-realms.cjs`: muted Electron review and runtime smoke checks.
- `tests/realm-environments.test.mjs`: topology, interactions, hazard timing, saves, event lifecycle.

All three environments also generate streamed Boundless regions, with their native props, wildlife, local events and persistent harvested/hazard state. Swamp uses the approved bayou art and connected island maze documented in `SWAMP_STUDY.md`. Runtime integration is in the current combined 1.2.36 source; a fresh desktop package is still a separate build step.
