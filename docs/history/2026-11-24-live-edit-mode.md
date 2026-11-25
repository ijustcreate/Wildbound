# Wildbound Live Edit

**Edit** opens a draggable inspector at the top of a local running expedition. The mouse selects or paints in the active camera view. **Hold simulation** keeps the scene still for precise work while the renderer and the editor stay active. **Done editing** restores the normal mouse controls. Changes preview immediately, with one undo step per drag or brush stroke. Save writes the sparse edits to `live-edits-v1.json` in the current desktop profile.

The initial placement tools cover Homestead furniture, Wilds trees and scenery, and the Jungle Temple. Temple fixtures keep their offset from the building when it moves. Generated trees have a stable source identity and move within their own region. On dry outdoor Wilds ground, brushes paint grass, earth, sand, stone, and snow, or restore the original texture. The Spawns tool changes Merlock camps and individual posts. Future spawns use the edited points. To fit a hat, select an explorer and click the worn hat or its name in the inspector. Offsets, scale, and angle apply through the same rig in all eight facings.

The performance panel shows recent frame times, entity counts, train speed, and the largest recent update and draw stages. Use [the live editing proposal](../design/LIVE_EDIT_MODE.md) for adapter design and the planned coverage of linked buildings, shop and train interiors, scripted routes, and more encounter authoring. Two project skills cover [live editing](../../.agents/skills/wildbound-live-edit/SKILL.md) and [performance profiling](../../.agents/skills/wildbound-performance/SKILL.md).

## Performance measurements

Two isolated, muted Electron scenarios used Windows 11 with an i7-1365U and Iris Xe graphics, one 1282 × 770 view, and dynamic shadows. Each warmed for 60 fixed steps, measured 90 unprofiled steps, and captured a separate 45-frame CPU profile.

| Scenario | Update median / p95 | CPU draw median / p95 | Largest observed costs |
| --- | --- | --- | --- |
| Moving Wild Lands train with four riders | 2.5 / 17.7 ms | 79.0 / 319.3 ms | Rider occlusion and compositing, followed by live car art |
| Jungle field with four players and 30–31 enemies | 71.2 / 141.0 ms | 70.6 / 91.5 ms | Enemy combat queries, line of sight and articulated actor drawing |

The terrain worker still had queued work and the host was shared. These figures describe CPU wall time during traversal. The local JSON reports and CPU profiles are in `test-output/live-edit-performance-pass` and `test-output/live-edit-crowd-pass`. They provide baseline cases for improving rider occlusion and combat path queries.

## Desktop handoff

Desktop `1.2.148` was packaged from modified source at `a6cee9bc55ad12ed58df5c3d27b150449f31ef26`. The executable is `dist/1.2.148/Wildbound-win32-x64/Wildbound.exe`. The verified `Wildbound Worlds (1.2.148).lnk` targets `Play Wildbound.cmd -BuildDirectory "dist\1.2.148\Wildbound-win32-x64"` and uses the normal profile. All 32 changed runtime files matched the packaged resources by hash.

The exact executable passed the muted boot check. The packaged renderer passed 23 Live Edit checks, including a pointer drag of Homestead furniture, native tree placement, brush Undo and Redo, an encounter spawning at an edited post, diagnostics, desktop IPC save, and a fresh reload of the save. It also passed 25 Homestead board checks with keyboard and simulated Xbox controls and 105 album, Quidditch, and shop assertions. The compact album showed all 20 slots and kept both digits of slot 10 inside its tile. The focused placement, headwear, save-state, and profiler tests passed. Platform profiling and editor verification ran in isolated profiles.
