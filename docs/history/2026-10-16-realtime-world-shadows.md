# Realtime world shadows · 1.2.22

## High-resolution follow-up · 1.2.23

- Raised default and fallback height maps from 128×128 to 512×512 (4× samples per axis) and enabled interpolated shadow-map drawing to remove the conspicuous square stepping.
- New planes use run-length encoding to keep mostly empty scene maps compact. The loader remains compatible with legacy raw-base64 maps, and old saved scene assets are bilinearly upgraded in the runtime and Shadows editor.
- The fallback region cache remains capped at 12 regions; dynamic caster cache positions are quantized to two map samples to avoid excessive rerenders.
- Verification: complete serial Node suite **1,347 passed**; packaged Electron Worlds → Shadows smoke **3/3 passed**; launcher build identity check passed. Gameplay frame-time impact was not manually profiled.
- Build: **1.2.23**, executable `dist/1.2.23/Wildbound-win32-x64/Wildbound.exe`, desktop shortcut `Wildbound Worlds (1.2.23).lnk`.

## Exclusive shadow styles · 1.2.24

- Added a persistent **Display → Dynamic world shadows** checkbox. On is the default and suppresses legacy actor/tree/bush/desert-prop blobs; off skips the dynamic caster pass and restores the legacy blob style. The styles never render together.
- Switching styles invalidates cached scenery art immediately. The setting survives app restart and applies to newly created renderers.
- Verification: full serial Node suite **1,349 passed**; packaged Electron shadow-editor/settings smoke **5/5 passed**; build identity and syntax checks passed.
- Build: **1.2.24**, executable `dist/1.2.24/Wildbound-win32-x64/Wildbound.exe`, desktop shortcut `Wildbound Worlds (1.2.24).lnk`.

## What changed

- Added `src/realtime-shadows.mjs`: compact grayscale Ground, Detail, and Back height planes; bounded sun-ray marching (maximum 150 samples); a stable ground baseline per ray sample; shared max-composited front/back caster heights; a cached pixel shadow mask; and a day/night sun direction that honors the authored base angle/elevation.
- Integrated live shadow casters for players, followers, enemies, villagers, pets, scenery, and house architecture. The renderer processes visible 1,600-unit regions, uses authored scene height maps where available, and keeps a 12-region LRU of fallback maps for other regions.
- Added **Worlds → Shadows**. It procedurally generates an initial map from placed scene props and lets authors paint/erase each height plane, tune sun direction/elevation, brush size, ray steps, bias and opacity, preview the resulting shadow mask, regenerate from props, and export the scene JSON asset.
- World design validation/save includes the height-map bundle. Tests cover the map encoding, distinct planes, stable terrain occlusion, overlapping front/back casters, generation from scene props, and sun movement.

## Verification

- Full serial Node suite: 1,346 passed. After the final ground-height ray adjustment, the focused shadow and world-authoring suite passed (6/6).
- Packaged Electron boot check passed, muted, with no renderer exceptions.
- Packaged shadow-editor smoke passed: Worlds → Shadows, both canvases, all three planes, prop-map generation, painting, and isolated local save.
- The broader legacy desktop showcase runner reported 17 unrelated failures in older lobby/inventory/rig assertions plus its R3 Field Kit automation error. It is not a clean full-app showcase result; those paths were outside this shadow change.
- Runtime gameplay visuals and frame-time impact were not manually playtested. Do not infer FPS gains from the unit tests.

## Build / handoff

- Version: **1.2.22**; packaged 2026-10-16 17:37:57 UTC from modified, uncommitted source at `1bd5ef027966e371f21cd0956b96b0aa4a62144b`.
- Executable: `dist/1.2.22/Wildbound-win32-x64/Wildbound.exe`.
- Desktop launcher: `Wildbound Worlds (1.2.22).lnk` → repository `Play Wildbound.cmd`; build identity check passed. Use the normal profile (not `--preview`).
- No commit or push was made.
