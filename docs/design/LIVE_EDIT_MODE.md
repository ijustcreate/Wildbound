# Live editing in Wildbound

## The editing experience

Click **Edit** at the top of the running game. A small inspector opens over the current scene and can be dragged aside. Choose Characters, Props, Buildings, Trees, Ground, or Spawns to decide what the mouse selects. The selected object has an outline and a visible anchor. Drag from its current position, or type a precise value when a control is available. Move the inspector without losing the selection.

With Ground selected, choose a surface and paint over the actual floor. With Spawns selected, the inspector displays markers and the areas they cover. Select an explorer to inspect their equipment, then open the headwear controls to fit the hat against the explorer’s current pose. The inspector can follow the displayed facing or preview any of the eight views. Each view stores its own fit. Enable a simulation hold for careful placement while keeping the camera and live renderer available.

Changes show in the scene immediately. A drag or brush stroke is one undoable action. The inspector shows whether changes are unsaved and gives the player an explicit Save action. Turning editing off returns mouse and keyboard behavior to play. A saved scene should reopen with the same placements while preserving expedition progress, character equipment, authored templates, and separate editor drafts.

## Reuse the game's current systems

| System | Existing source | Live editing approach |
| --- | --- | --- |
| Camera and selection | `src/render.mjs`, `src/train-world-art.mjs` | Use the active view’s screen-to-world transform. Filter scene candidates before picking and keep the selection in world coordinates. |
| House props and outdoor scenery | `src/house-builder.mjs`, `src/wild-homestead-layout.mjs`, `src/train-editor.mjs` | Move the authoritative placement record. Keep the drawn sprite, collision footprint, lights and dependent interactions aligned. |
| Floors and terrain | `src/location-editor.mjs`, `src/wild-native-biomes.mjs`, `src/train-world-art.mjs` | Use each scene’s native terrain vocabulary. Change the surface used by rendering and gameplay, and invalidate only the affected terrain where feasible. |
| Characters and equipment | `src/player-studio.mjs`, `src/animation.mjs`, `src/sprite-library.mjs` | Inspect the running actor and fit the equipped headwear through the game’s normal rig and facing rules. Keep full animation and pixel editing in their existing studios. |
| Encounter placement | `src/encounter-layout-editor.mjs`, `src/wild-biome-spawns.mjs` | Edit stable spawn points and area definitions. Apply new settings to subsequent spawns while keeping active encounters intact. |
| Profiling | `docs/live-diagnostics.md`, `scripts/profile-wild-lands.cjs` | Reuse the in-game performance overlay and collect repeatable frame and simulation timings for demanding scenes. |

## How changes are stored

Save a versioned set of sparse scene edits with stable object IDs. Record changed positions, painted cells and spawn settings, plus fitted equipment overrides where appropriate. Apply those records when the matching scene loads and when its layout is regenerated. Generated objects need stable identities tied to their source coordinates or generator keys. Keep live drafts and undo history in memory. Commands retain their before and after values so Undo and Redo update the same runtime data as a drag.

An adapter owns each editable system. It supplies stable targets, the fields they expose, validation, and the work needed to refresh the scene. Buildings with linked doors, shops with local coordinates, moving train interiors, and spawn scripts need adapters that own those relationships. Adding a new system should extend the editor through its adapter instead of adding special-case controls to the game loop.

## Delivery sequence

1. Build the overlay, selection, dragging, Undo and Redo, and save-and-reopen checks in a local Wild Lands session. Prove the workflow on real Homestead furniture and authored or generated scenery.
2. Extend the same controls to terrain and spawn data and to the equipped headwear inspector. Verify immediate feedback and saved values in the actual renderer. Document which scene types have each tool so expanded coverage stays easy to test.
3. Convert remaining hard-coded placements by area. Start with buildings and doors, then shop interiors, railway interiors, scripted NPC routes, and encounter rules. Give linked components stable IDs before enabling moves. Add explicit template export and shared editing if those workflows are useful after local playtesting.

The first version edits local sessions. It covers Homestead furnishings, streamed Wild Lands trees and scenery, the Jungle Temple and its furnishings, dry outdoor ground textures, Merlock camp areas and spawn posts, and headwear fits. Ground painting changes the visible material while retaining native water, bridges, and path collision. Existing encounters stay active while future spawns use the new placement.

For a collaborative edit session, start by exchanging saved scene edits for review. Give the host ownership of a patch list, send clients the approved patch with its scene revision, and allow the host to revert that revision. Use the same validated data adapters at runtime for a hot apply. Keep code and art asset changes on the desktop build path. Live diagnostics can accompany a scene-edit report with the build and location that produced it.

## Performance follow-up

Collect a baseline for a quiet Homestead, a station with a moving train, and a fixed crowd of enemies. Record frame-time median and 95th percentile, simulation and render time, actor count, train state, and camera split. Repeat with Edit closed and open to isolate editor overhead. Use the existing CPU profiles to find the expensive passes. Compare the same scene, camera, render settings, and build after each change. Leave optimization decisions to measured hot paths.
