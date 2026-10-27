# Wildbound 1.2.69: aiming, cars and fuller authoring tools

## Verified desktop identity

Correct repository: C:/Users/New User/Desktop/Wildbound Server Branch Build, branch Wildbound_worlds, origin https://github.com/ijustcreate/Wildbound.git, HEAD 1bd5ef027966e371f21cd0956b96b0aa4a62144b. Built from modified tracked and new source; no commit/push was requested or performed. Existing dirty work was retained.

Final package: dist/1.2.69-2026-10-26T18-48-40-535Z/Wildbound-win32-x64. Built UTC 2026-10-26T18:48:53.143Z (11:48:53 a.m. PDT). Normal profile, preview false. Desktop shortcut C:/Users/New User/Desktop/Wildbound Worlds (1.2.69).lnk targets C:/Users/New User/Desktop/Wildbound Server Branch Build/Play Wildbound.cmd, blank arguments, repository working directory, assets/wildbound-icon.ico. The launcher --check selects this exact executable.

Actual EXE boot-smoke reports version 1.2.69, lobby ready and zero renderer errors. Exact content verification matches all 1,138 checked runtime/assets/authored files. Authored rigs SHA256 is unchanged: DC05411B47F02259BE95EA0ED22AEA375D76F79B55D7F0BDEC57DA5DF7ED7D71. Rig guard reports no unexpected changes. Automated Electron windows were muted before loading and used isolated test profiles. Existing player games were not terminated; normal saves and unfinished editor drafts were not replaced.

## Aiming

The boomerang guide previously used a bow-hand anchor while throwing from the feet. Wand firing switched cast pose before sampling its launch point, and lobby spell origins used the wrong render size. src/ranged-launch.mjs now supplies both guides and launches with the same weapon-specific visible anchor and collision-plane height. Boomerangs launch/return at the right hand. Holding wand aim keeps the hand at its steady cast pose through release; non-aimed casting retains its normal animation. Healing wands use the same anchor path. Arrows retain their existing ballistics and aim direction.

Regression tests cover continuous five-degree angles, three charge levels, ordinary/lobby scale, primary/offhand/dual wands and boomerangs. Packaged Electron injects 64 actual hold/release input sequences and checks all 80 resulting projectile launch origins: maximum coordinate offset is zero. Pixel-grid rounding of the projectile artwork remains normal.

## Car visual brief and implementation

Retain the existing green hatchback silhouette and broad dark/light paint masses. Use native oblique ground points plus upright body/roof height, rather than rotating one finished top-down image. Eight facing views share the same body, wheel, seat, glass and occupant anchors. Native seated occupants remain upright and face the vehicle heading; four empty seats are visible through front/rear glass when unobscured. Wheels tuck from half-width to 0.47 body width. Existing steerable wheels, hood interaction, physical face-button pedals and fading tyre tracks remain.

Glass uses a small cached sky/cloud/tree-color mosaic based on nearby tree positions, blended lightly above the seats. This is a cheap stylized reflection, without scene capture or ray tracing. Tracks now originate at the projected wheel ground points. The native art was developer-reviewed in eight directions, occupied and empty; it is ready for user visual testing, not a claim of user approval.

## Car collision/damage

Fallen stumps and falling trunks no longer trap vehicle colliders; standing trunks and rocks remain solid. The previous vehicle wall call went through the melee routine, which always dealt 20 structural damage. A dedicated bumper routine now scales damage with speed, samples the actual front/rear bumper width, deduplicates contacted wall cells, and opens a car-width gap on hard impacts. Impacts slow the car without reversing its speed. Enemy impact damage also scales with speed; rooted enemies stay rooted. Both front and rear contacts have regression coverage.

## Location editors

Temple editing includes the fixed seed-42 jungle scenery, native stairs/statues/torches and ten fixed wildlife spawn points. A scene list selects props and spawns; numeric inspectors move them and edit spawn stats. The ordinary house does not silently gain an empty spawn override, so its default chickens remain. Temple stairs use the edited fixture position. Edited temple floors update their terrain footprint; applying scenery preserves matching harvested/fallen state. Existing encounter cards remain in the Events editor.

Upper sanctum, well tunnels, mausoleum and storage previews now render native room artwork and actual actors/props instead of flat tile/marker diagrams. Scene lists, selection, dragging, zoom, pan, fit/house-scale controls and native object names expose small targets. Underground decoration props, lights, enemies, chest loot and gameplay exits remain separately editable and saved per location. Storage chest/robot/vending positions now drive rendering, interaction and collision. Active crypt progress, opened chest contents and living enemy state are preserved when applying layout edits.

Editor scales use the same actor/floor proportions as the house; storage/sanctum floor seams represent 32px world tiles while their logical brush remains 16px. Legacy well view zoom and actor scale compensate for its 16px simulation grid. The native well preview exposed a real render bug: string room IDs were multiplied as numeric animation phases. Render-only numeric ID seeds now keep bat/spider poses finite without changing saved/gameplay IDs. Pixel-comparison checks verify that all five well creatures actually paint their sprites.

## Forest controls

Expanded the Forest tab with validated tree/bush/rock density, tree size, ground cover, weighted oak/birch/pine/palm/bare/snow variants, height/width/branch spread, tree wind, large canopy sway, leaf pixel motion and falling leaves. Native live type and seeded grove previews show the changes. Existing season/leaf-habit choices remain. Save retains settings on this device; generation controls affect newly generated forest maps, while shape/motion controls apply live. Existing active map populations are not regenerated merely by changing the preview.

## Inline item pixel editor

Clicking any turnaround cell selects the same facing as the directional buttons; arrow keys also cycle it. Clicking inventory/worn artwork opens the inline canvas and adjacent tool/color panel. Pencil, eraser/right-click erase, flood fill, eyedropper, brush sizes 1–5, swatches, color picker, drag interpolation, undo/redo and restore-original are supported.

Icon edits are exact 24px artPixels. Worn edits retain actual captured layer dimensions, palette and anchor offsets under the selected item's wornArt[facing][layer] data. They do not overwrite the shared humanoid rig or other items/facings. artRevision invalidates cached player frames; icon caches clear on editing. Existing Studio Save definitions persists/exports these item fields. Actual native mouse strokes, undo/redo and Save definitions were exercised in Electron.

## Checks and limits

Full release rebuild: 1,636 tests passed, zero failures; 463 runtime files syntax checked. Final focused passes also cover room ID rendering and edited location bindings. Final scene-floor seam normalization was visually reviewed in the packaged scene captures.

Packaged Electron: 38 editor/scene/painting checks plus successful native Studio Save; 80 projectile origins across 64 input releases with zero coordinate error; nine car physical-button-position input checks; 16 occupied/empty car facing cases. All report zero renderer errors. Final EXE boot and launcher/content checks pass.

Evidence is ignored under test-output: rebuild-release-1.2.69.log, final-packaged-1.2.69.log, final-content-1.2.69.log, final-exe-1.2.69.log, editor-expansion/, ranged-origins/, car-polish/, car-controls/, and focused test logs. No physical controller hardware playtest or end-to-end FPS measurement was performed. Visual appearance and encounter/impact tuning remain for the user's test session.
