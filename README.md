# Wildbound Character Viewer

This is a separate static website for inspecting Wildbound's unit animations. It includes a snapshot of the game's shared rig data, rendering modules, and sprite JSON. It does not read or change game saves.

For a local preview, serve the `dist` directory with any static HTTP server and open its root URL. To refresh the snapshot after changing rigs in Wildbound, copy `authored/rigs.json`, the game's `src` directory, and the four sprite JSON files (`animations.json`, `library.json`, `parts.json`, `animal-parts.json`) into matching paths under `dist` before republishing.
