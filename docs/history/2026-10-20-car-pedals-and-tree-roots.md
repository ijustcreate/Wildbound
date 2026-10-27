# Car pedals and tree trunk ends — 1.2.53

Driving previously took gas/brake/reverse from stick Y. Physical bottom face is now an analog gas pedal, physical left face brakes in both travel directions, independent of combat remapping and controller labels. Brake wins if both are pressed and cannot automatically engage reverse. Down-stick plus gas explicitly selects reverse. Keyboard W/S and A/D remain available.

The front-drive bicycle model moves the rear axle and reconstructs the body center, rather than rotating the body then translating its center. Steering response uses exponential interpolation, steering lock reduces with speed, parked steering does not rotate the body, and reverse steering changes yaw in the correct direction. Existing speed, wheelbase and handling overrides remain respected. Front wheel visuals turn; rear wheels stay fixed. Removed the old fixed tire placeholders beneath the animated wheels.

Driver actions are separated from combat/jump/dash and aim state; entering clears airborne/dash/charge state. Passengers retain their existing combat route. Engine repair/key requirements remain in place.

Tree trunk square brushes previously ended a full brush width beneath their endpoint, leaving a central rectangular nub beneath the root flare. Oak/pine/birch trunk strokes now end at ground level. Branching roots, fallen stumps, foliage and custom trees remain intact. Visual review: native oak/birch/pine preview in `test-output/car-controls/trees-and-front-steering.png`.

Checks: unit tests for physical pedals, brake priority, explicit reverse, stationary and reverse steering, timestep consistency, passenger input isolation and actual Game.update action suppression. Muted isolated Electron uses actual app inputFrame with synthetic Xbox and Switch pads and real Game.update. No physical controller playtest claimed. Existing custom saves/profiles preserved.

The user subsequently approved the thirteen art improvements with refinements. This build now also includes the following:

- Independent opt-in world grid, solid/dotted style and opacity, persisted through Display settings; removed baked ground grid lines.
- Staggered stone paving with restrained cracks and irregular grass/stone edges, smaller wood planks, bedroom carpet and kitchen checkerboard floor zones. Custom floor finishes can be selected in the house editor.
- Brighter explored house surroundings by day, warm working bulb pools at night, and reduced night tint within those lit floor areas. Outdoor night darkness and existing cast-light occlusion remain. No blanket daylight at night.
- Shared raised furniture tops, aprons, chair backs, legs and contact shading. Existing authored sofa/desk/bookcase and chest art retained. Ground grass is excluded under solid furniture both when generating yard tufts and when rendering cached/live scenery.
- Nine editable tabletop prop kinds, attached through normalized surface coordinates, with editor add/move/remove controls. Recipe books explain a kitchen task; kettles consume one meat and fruit, heal 55 HP and pay a one-time 15-gold house reward. Repeat cooking only heals and does not consume ingredients at full health after reward. Candles toggle actual small light sources.
- Broad tree foliage masses replace repeated interior stripe clusters; root nubs trimmed. Tiny solo player labels and permanent room/jumpability labels removed; multiplayer names remain above characters, rooms show briefly on entry and actionable surface prompts are contextual.
- Bottom action rail aligned with fixed margins. Full controls expand on request. Notifications, minimap and time display have separate space. Electron layout checks cover 1280, 800 and 600 pixel window widths.

Native visual review artifacts are in `test-output/house-polish/`. These are developer-reviewed changes, not claimed user-approved artwork. Physical controller hardware and FPS were not measured.

Source: Wildbound_worlds at 1bd5ef027966e371f21cd0956b96b0aa4a62144b plus modified source. Final build identity and packaged checks follow below.

Delivered: `dist/1.2.53-2026-10-20T19-52-58-512Z/Wildbound-win32-x64/Wildbound.exe`. Full rebuild passed all 1,497 tests and syntax checked 399 runtime files. Existing minimap expected coordinates were updated for its relocated HUD lane; polygon-capable tree canvas stubs preserve the existing falling/stump/snow regression assertions. Covered counter props now neither render nor intercept appliance interactions; surface state also invalidates both structure and lighting raster caches.

Packaged executable booted to the ready lobby with zero errors. Packaged actual inputFrame driving checks passed for synthetic Xbox and Switch pads. Packaged Display grid controls/persistence and editor prop add/position/remove checks passed. HUD action bounds remain separate at 1280×850, 800×600 and 600×430 (Windows DPI rounding reports one extra CSS pixel on some heights). Packaged renderer reported no console errors. Source controller-settings routing verification passed 77 assertions. Native preview PNGs are retained in `docs/art/house-*-1.2.53.png`. SHA-256 checks matched packaged application, HTML, vehicle, house props, paving, furniture, grid, HUD, tree and night-light files to source. `git diff --check` passed.

Desktop: `C:/Users/New User/Desktop/Wildbound Worlds (1.2.53).lnk`. Target: `C:/Users/New User/Desktop/Wildbound Server Branch Build/Play Wildbound.cmd`, no arguments, normal save profile. Launcher `--check` selects the exact build above. Existing running user game was not terminated. Build contains modified source; commit alone does not identify all included changes. No commit or push was requested or performed.
