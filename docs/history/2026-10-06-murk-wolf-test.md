# Murk Wolf motion-transfer experiment

User requested a separate Murk Wolf test based on Modelviewer/Khada's Murk Wolf Mini, new Wildbound pixel artwork in eight facings, and native separate eyes/ears. Existing wolves must be preserved.

Implemented a 32-joint native model with 24 converted source animations and four native/derived aliases, independent editable facial layers and fresh generated skull/body art. Registered `murk_wolf` in Rig Studio, definitions and project-rig persistence. Added its own authored entry without replacing any existing entry. No encounter tables or ordinary wolf code/data changed. The normal wolf's authored JSON SHA-256 at insertion and final verification was `98b2474c14e3173b7258416e8a522196b1a56148aa637e2fde125023e3ac49ad`.

`Play Murk Wolf Test.cmd` launches the current modified source using the repository's Electron dependency. Its profile is `test-output/murk-wolf-play-profile`, isolated from the normal game and regular preview profile. It provides eight facings, gameplay/enlarged size, all motions, native Rig Studio, and a small local part-painting dialog. The normal source game also exposes the subject in its studio and native sprite editor.

Validation: 56 relevant tests passed; 268 runtime files passed syntax checking; atlas checker passed with only the intentional symmetric SW skull mirror note; isolated Electron rendered 9,536 poses (all clips, all frames, eight facings), verified independent facial sprite capture/override and loaded the subject in the actual game's studio. Idle, run, bite, howl and fallen screenshots were inspected. Detailed results/screenshots: `test-output/murk-wolf`. The source atlas, prompts, pivots, conversion provenance and an assembled preview are under `assets/murk-wolf`.

Limitations: 2.5D positional transfer approximates 3D rotations, especially extreme pitch/roll. Fur atlas colors are baked; palette controls affect the procedural parts. Transferred Riot motion remains a local experiment, not a cleared redistribution asset. No original GLB mesh/texture is bundled.

Base commit at verification: `1ce158a4108f3905a04390af18c57c040d4e6a3f`; working tree has this experiment plus unrelated concurrent edits. No commit/push or packaged desktop rebuild was requested or performed for this test. Do not claim the regular packaged executable contains these changes. Use the exact test launcher above.

## Native body revision

The user rejected the generated chest/body and requested the old drawing system. Replaced the torso image with native wolf-style pixel capsules and flat palette shading following pelvis, chest and neck. Removed body entries from the atlas and preparation script; only skull images are sampled. Retained `Murk body` sprite-layer identity, editable shape/palette, separate facial parts, motion keys and authored data. No ordinary wolf files were edited.

Rechecked all 9,536 poses, independent facial layers, native-only body palette capture and actual game Rig Studio in isolated Electron. Three Murk Wolf tests and head-only atlas validation passed. Inspected eight-direction idle/run/bite/howl/death renders and refreshed the assembled preview. Packaged game remains unchanged.

## Native skull and shaped chest revision

The user also rejected the generated skull and wanted a better chest, while explicitly approving the motion transfer. Rebuilt both default parts with native pixel volumes oriented to their existing joints, a shaped ribcage/haunch/neck, broad cheek locks and short shoulder fur. Removed all raster-atlas sampling from the renderer. Eyes, ears, muzzle, jaw, overrides and layer order remain independent. Motion data and authored rig values were preserved. The old PNG and atlas are archived drafts, not active assets.

Verification now checks native palette pixels for both body and skull as well as all 9,536 poses and actual game Rig Studio. This is a revised visual sample for user review, not user-approved artwork. The normal packaged game was not rebuilt.
