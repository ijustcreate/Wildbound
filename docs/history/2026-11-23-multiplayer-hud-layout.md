# Multiplayer HUD and panel layout

## Changes

- Lowered the normal minimap to a 50 px logical bottom inset and moved the day/night label left so it remains visible beside the map.
- Lowered the train route map to the same lower-right area while keeping it clear of the bottom notice strip.
- Raised the play roster/health cards from an 8 px top inset to the top edge.
- In multi-player panel layouts, inset side rails by up to 64 px at 1280 px width; the panel planner preserves at least a 120 px central gameplay lane. Multi-merchant grids use balanced 16–28 px outer margins and a 12 px gap.

## Review

Refreshed the split-camera scene in muted Electron. It showed the shared map at the lower right with the day/night label shifted left, and Electron reported no renderer console errors. The panel planner returned two 472 px panels at x=64 and x=744 in a 1280 px viewport, leaving 208 px between them. No test suite or desktop package build was run. The live two-player menu appearance and hardware play remain unreviewed.

## Handoff

Source changes: `src/player-panel-layout.mjs`, `src/play-hud.css`, `src/render.mjs`, `src/night-cycle.mjs`, and `src/train-world-art.mjs`. No commit or package build was made. Muted Electron capture: `test-output/split-camera-motion-preview/split-settled-facing.png`.
