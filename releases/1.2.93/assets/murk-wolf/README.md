# Murk Wolf compatibility test

Launch `Play Murk Wolf Test.cmd` from the repository root. It runs the current source in Electron with the isolated `test-output/murk-wolf-play-profile` profile. The eight-view stage has motion, speed and joint controls, plus the native Rig Studio. Test saves stay in that profile. Use **Export rig** to export an edited model. The regular source game also exposes **Murk Wolf / motion transfer test** in Rig Studio and saves it under its own `murk_wolf` key.

The launcher script accepts `--review` to use `test-output/murk-wolf-review-profile` when displaying a revision alongside an open draft.

This is a separate test creature. No ordinary wolf model, encounter, sound or saved character is replaced. There is no automatic spawn. The normal packaged desktop executable is not rebuilt by this experiment.

## Motion and art

The user-selected reference is [Murk Wolf Mini](https://modelviewer.lol/model-viewer?group=extras&alias=sru_murkwolfmini&id=0). `scripts/import-murk-wolf.cjs` converts its exported GLB into Wildbound's native joint-position keyframes. It evaluates the hierarchy, interpolates quaternions, switches axes and removes horizontal root motion. There is no GLB runtime or imported mesh/texture. The original local GLB is not included in the repository.

The rig has 32 joints. All 24 source animations are available; walk is a slowed run, windup/recover alias alert transitions, and hurt is a small native pose. See `motion-provenance.json` for source names, durations, source SHA-256 and conversion scale. This 2.5D test approximates 3D rotation with projected joints and facing-specific parts; extreme pitch and fallen poses are not full skinned-mesh deformation.

The body and skull use Wildbound's native pixel drawing system. Oriented pixel volumes shape the haunches, ribcage, chest, neck and skull; broad cheek locks and short shoulder fur define the silhouette. Whole-pixel fills and flat palette shades keep them at the same density as the legs and facial parts. The editable `Murk body` and `Murk skull` layers retain their pivots and custom sprite overrides.

`parts-source.png`, `atlas.json`, `src/murk-wolf-atlas.mjs` and the preparation script preserve the earlier generated draft for reference only. Neither the rejected torso nor the rejected skull is used at runtime. The current renderer assembles these native parts in all eight directions:

| Layer | Anchors |
| --- | --- |
| Skull (no baked eyes, ears or muzzle) | head |
| Native body | pelvis, spine, chest, neck |
| Left/right ear | earL/earR, earTipL/earTipR |
| Left/right eye | eyeL/eyeR |
| Muzzle | muzzle |
| Nose | nose |
| Jaw | jaw, jawTip |
| Four legs and paws | shoulder/elbow/frontPaw, hip/knee/hock/rearPaw |
| Tail | tailBase, tailMid, tailTip |

Facial visibility, custom `boneSprites` and `renderOrder` are supported independently per facing. Palette controls now color every default part, including the body and skull. The Murk Wolf alone uses a higher-resolution intermediate canvas in runtime and studio.

## Reproduce and verify

1. `node scripts/import-murk-wolf.cjs <exported-murk-wolf.glb>` recreates the motion module and provenance. Do not run over a different experiment without reviewing its output.
2. Native artwork lives in `src/murk-wolf-pixels.mjs` and `src/murk-wolf-motion.mjs`. The archived `prepare-murk-wolf-art.cjs` script is not required for current rendering.
3. `node scripts/register-murk-wolf.cjs` adds the missing authored subject only. It preserves every existing subject and refuses to replace an existing Murk Wolf.
4. `node --test tests/murk-wolf.test.mjs` validates motion, independent save/import and editable facial metadata.
5. Run Electron with `scripts/verify-murk-wolf.cjs` for all 9,536 sampled poses across eight facings, runtime screenshots, facial-layer captures and Rig Studio selection. Results are in `test-output/murk-wolf`.
6. The Electron check also verifies that both body and skull captures contain native palette colors and that editing an eye leaves the skull unchanged.

Source motion remains Riot-owned. This is a local compatibility experiment, not a cleared redistribution asset. New pixel artwork does not change the motion data's provenance.
