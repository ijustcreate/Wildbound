# Humanoid arms and layer overlap

The user rejected the narrow, awkward arms and the arm/torso overlap in the new humanoid model, particularly in a running profile.

## Changes

- `src/humanoid-hd.mjs` gives the upper arm a longer short sleeve, a fuller elbow, a tapered wrist and a slightly wider hand. The existing flat pixel palette and hair/eye artwork remain in use.
- Automatic arm rendering now separates the shoulder/sleeve (`Upper arm L/R`) from the forearm/hand (`Forearm L/R`). Shoulder depth governs the sleeve; elbow/hand depth governs the forearm. A swinging wrist no longer changes which side of the torso the sleeve occupies. Shoulder equipment follows the upper piece; gloves and carried gear follow the lower piece.
- Front-view forearms and the near forearm in front diagonal views attach after the torso as a dependency chain with held items. Far arms and shoulder armor keep their projected depth. This removes half-hidden arms and floating weapons without pulling far shoulders through the body.
- The keeper crown's antlers are shorter and forked with small inner tines, preserving the same head anchor and palette.
- Both pieces partition one complete skin silhouette. The shared elbow coverage has no additional outline or seam. New layers expose their own shoulder/elbow/hand anchors to the existing sprite editor.
- Existing painted whole-arm sprites and old authored whole-arm orders retain their original single-layer contract. No joints, limb lengths, IK, clips, saved rigs or profiles were edited.

## Verification

- 32 focused Node tests passed for character detail, appearance, fitted gear and hero generation.
- Isolated Electron arm verification rendered 1,938 poses, checked 384 shoulder depth relationships and 80 exact split-silhouette comparisons. It covered eight views, complete idle/walk/run cycles, every action, three builds, long hair, six equipment loadouts, custom painted arms, authored orders and studio sprite capture. No renderer errors; rig unchanged.
- The existing humanoid verification rendered 1,160 appearance/equipment cases, including facial handles, custom head paint, bounded caches and gameplay raster density.
- Actual creator interactions passed at three window sizes. Inventory geometry and preview rotation checks passed at 850/600/420 pixel heights.
- Review exports: `test-output/humanoid-arms-profile.png`, `humanoid-arms-eight-directions.png`, `humanoid-arms-equipped.png`, `humanoid-arms-atlas.png`, and matching JSON reports. The equipped review includes native gameplay size and enlarged idle/run poses. The atlas is assembled QA output, not replacement animation frames; the atlas checker passed all eight views with no warnings.

## Desktop delivery

Version **1.0.87** passed the full rebuild: 1,151 Node tests, 282 runtime syntax checks, packaging and shortcut creation. Build identity: `1ce158a4108f3905a04390af18c57c040d4e6a3f`, modified source, built `2026-10-07T17:38:01.568Z`, normal profile (`preview: false`).

The exact packaged `resources/app.asar` passed the 1,938-pose arm check with five byte-matched files (arm artwork, player renderer, render ordering, Keeper artwork and authored rigs), 384 depth checks, 80 silhouette comparisons and no renderer errors. Packaged creator interactions and inventory checks passed at three sizes each. Packaged wings/crown verification rendered 192 poses, with unchanged rigs and no renderer errors. The assembled eight-view atlas passed validation without warnings.

Executable: `dist/1.0.87/Wildbound-win32-x64/Wildbound.exe`. Desktop shortcut: `Wildbound Latest (1.0.87).lnk`, targeting the repository `Play Wildbound.cmd` with no arguments. `Play Wildbound.cmd --check` confirms the current build identity. The user's existing 1.0.84 session was not terminated. No commit, push or website deployment was performed.
