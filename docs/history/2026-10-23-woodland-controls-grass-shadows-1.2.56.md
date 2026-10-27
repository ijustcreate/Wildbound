# Wildbound 1.2.56 — lobby controls and living woodland

Current checkout: `Desktop/Wildbound Server Branch Build`, branch `Wildbound_worlds`, modified source on `1bd5ef027966e371f21cd0956b96b0aa4a62144b`. The older character-viewer checkout is not used. No commit/push requested. Normal saves and the current native character rig remain in place.

## Controls

R/RB is dash; L/LB holds position and aims a ranged weapon (or blocks with the existing melee logic). The left menu button (−/View) opens inventory; the right (+/Menu) opens Pause after choosing an explorer, including in the lobby. Unassigned controllers can still reach Settings without joining. Settings remains available from Pause. Pause stops practice movement, attacks and the ready countdown; a fresh right-menu press or Back resumes. Inventory retains per-player ownership.

Untouched saved layouts migrate, including the old shoulder quartet when only unrelated face controls were customized. A reversed inventory/pause pair is repaired while retaining other custom bindings. Board and potion defaults move to the left and right triggers; follower cycling moves to D-pad Right to avoid sharing the dash button. Prompts match the new controls. Keyboard controls are unchanged.

## Grass and ferns

The low meadow layer is restored as short, grouped blades above broad pixel color masses. Tall cutting changes the same blades to short stubble instead of removing the entire patch; cuts still upload no geometry. Burnt patches retain their distinct state. The Canvas fallback also leaves low stubble.

`vegetation-motion.mjs` keeps a bounded, transient trail of grounded movement. A shared 128×128 interaction texture bends and flattens grass, then fades it back over roughly four seconds. Teleports never connect into long scars; jumping/swimming actors do not leave tracks; repeated front/back samples do not advance history. Nothing is added to scenery or saves.

Grass, tree crowns and shrubs share a world-space, stepped breeze. Weather events ease wind strength up and down using intensity and remaining duration. The grass remains at a bounded visible-region density, rather than restoring the old full-world 300,000-blade submission.

The reference is [DylearnDev/Dylearn-3D-Pixel-Art-Grass-Demo](https://github.com/DylearnDev/Dylearn-3D-Pixel-Art-Grass-Demo), specifically its noise-based color groups, layered grass, stepped wind and character displacement. Wildbound uses its own WebGL/Canvas implementation; no Godot shader, mesh, texture or branding asset was imported.

Fern silhouettes use five straight rising fans, three close palette values and few highlights. Decorative fern groups are selected once with at least 40 world units between crowns, and avoid mosaic paving. This addresses the dense, fine speckling in the user's grouped-fern screenshot. Gameplay fern objects retain their identity.

## Named woodland assets

Twenty original pixel assets live under `assets/forest-understory/` with stable IDs and a manifest; editable source is `src/forest-props.mjs`. Families include limestone boulders/stones/pebbles, four rounded shrub sizes, mossy rock groups, porcini and fly agaric mushrooms, daisies, cattail reeds and meadow tufts. Finite/Boundless forest generation scatters small props away from trails and hubs. Existing forest rocks/bushes use the corresponding new art; their gameplay roles remain. Cattails sit along river banks. Variants use nearest-neighbor resampling and a finite shared raster cache.

Forest landscape version 3 adds central understory once to existing version 1/2 saves. Saved scenery is installed before migration, preserving cut/burn states and harvested objects. Later reloads respect explicit decoration removal. Outer prop IDs use the region prefix so unloading, edits and checkpointing own their full lifecycle. Travel regression checks every surviving outer prop against the active region list.

The user's supplied prop sheet is the visual reference. Native-size and enlarged named exports are reviewed on `test-output/forest-understory-review/forest-props-contact-sheet.png`; the group fern and real forest captures are saved beside it.

## Map-table shadows

The previous table blocker used a square footprint expanded from the longer side and had no leg volumes. `boardLightVolumes` now uses the actual rectangular tabletop at its raised height plus four narrow grounded legs. `boardTableLegs` also draws the legs, so the artwork and lighting share placement. The sun caster uses the same rectangular footprint.

The carried source is above the tabletop (30 world units plus actor elevation, versus a 16-unit table). Finite 3-D projection shortens the shadow as the source rises; light can pass under the top while individual legs block low rays. No artificial screen-Y offset is substituted for light height. Captures cover light positions to the left, above, below and raised beside the table.

## Verification

Final package: `dist/1.2.56-2026-10-23T17-01-17-223Z/Wildbound-win32-x64/Wildbound.exe`, built at `2026-10-23T17:01:27.309Z`, from modified source. Desktop `Wildbound Worlds (1.2.56).lnk` targets this checkout's `Play Wildbound.cmd`; the launcher selects this exact build with the normal save profile. Authored rig SHA256 remains `dc05411b47f02259be95ea0ed22aea375d76f79b55d7f0bdec57da5df7ed7d71`.

The final full suite passed **1,521 tests** with zero failures. The final visual check then caught small decoration sprites on paving carved after generation. A live terrain mask fixes that case; 16 focused checks pass after that final correction. Packaged verification covers 407 runtime syntax checks, 1,052 content matches, actual-executable muted boot with zero renderer errors, 47 lobby join/control checks, 76 settings/pause ownership and layout checks, and 31 woodland/grass/table checks. Physical controllers have not been tested. Reports and logs are under `test-output/woodland-*`, `test-output/forest-understory-review/`, and the final package's `test-output/`.

## Performance comparison and remaining cost

Sequential isolated profiles compare the previous verified 1.2.55 package to the exact final 1.2.56 package on Intel Iris Xe/D3D11 at 1440×900 backing resolution, DPR 1.25. The full test suite was not running during these measurements. Values below are mean **CPU update + render milliseconds**, not GPU frame time or a claim of constant FPS.

| Scenario | 1.2.55 | 1.2.56 |
| --- | ---: | ---: |
| Clearing | 15.27 | 25.25 |
| Outer roaming | 14.12 | 17.75 |
| Negative coordinates | 14.88 | 18.42 |
| 27-animal stampede | 27.56 | 23.15 |
| Cold moving-camera seam | 25.60 | 37.77 |

The restored carpet submits roughly 7,500–15,600 visible grass instances versus about 1,800–2,000 in the sparse previous build. Quiet/roaming CPU costs increased; this release cannot be described as universally faster or locked to 60 FPS. Stampede mean cost fell in this run. The cold seam p95 rose from 34.2 to 69.2 ms, while the maximum fell from 142.7 to 113.9 ms. New streaming work averages 1.59 ms, p95 4.0 ms, max 12.7 ms. Grass cuts upload zero geometry; individual timed GPU batches average 0.016–0.034 ms, which does not measure the whole GPU frame. Both runs report no renderer errors.

Raw reports: `test-output/forest-motion-release/previous-1.2.55/report.json` and `test-output/forest-motion-release/release-1.2.56/report.json`. The next performance pass should isolate CPU scenery/shadow submission and cold camera-seam work while retaining the fuller ground cover, then repeat the same sequential comparison.

## New combat reference

The user's later Dribbble sword/movement/lighting clip is reviewed in [the combat reference brief](../art/2026-10-23-sword-movement-lighting-reference.md). It is a new direction, not a feature claimed for this already verified 1.2.56 package.
