# Humanoid detail and posture

User requested cute pixel humanoids based on two supplied references, attached to the existing rig in all eight directions. Later feedback identified arms, necks, pelvises and posture. The user then explicitly rejected excessive detail: they wanted more pixels in the eyes and better hair, not high-frequency texture throughout the character. This correction supersedes the first detailed pass. Generated artwork remains a working revision, not an approved style baseline.

## Changes

- Image-tool hair atlases use measured crops and palette tinting in `src/humanoid-hd.mjs`. The latest `hair-chunky.png` supplies simpler crop/long/ponytail shapes in five distinct views; all hair uses a four-shade ramp. Eyes use deliberate small pixel patterns with readable whites/irises on the individual facial handles. The first eye/material source experiments remain on disk, but fine fabric textures and tiny added bevels are removed. All 19 hair choices, eight face choices and 77 armor options remain available.
- Detailed connected limbs use rounded shoulder roots, cut sleeve cuffs, tapered wrists and defined hands. A short neck overlaps the jaw and collar. One fitted hip panel and waistband replaces the overlapping torso, hip and horizontal belts. The leg roots connect beneath it.
- Default idle plants feet under the pelvis and relaxes elbows. Walk/run use narrower arm swing planes and reduced torso sway. `postureRevision: 1` migrates only exactly recognized original locomotion keys, preserves clip timing and edited clips, and skips custom rest joints/IK. The authored rig changes only idle/walk/run plus the revision marker; joints, constraints, other actions and other subjects are unchanged.
- World intermediate raster density and inventory icons preserve crisp pixels at zoom without inventing texture. Faces rasterize once before transforms, fixing visible seams between fractional fill rectangles. Real canvas sprite capture includes image layers so the existing editor can see generated parts. Existing native-grid painted overrides remain supported.
- Inventory transaction messages reserve a small fixed row so the preview and slot grid do not resize when feedback appears.

## Reusable skill

`wildbound-pixel-assets` is installed under the user's Codex skills and versioned at `.agents/skills/wildbound-pixel-assets`. Includes the two source references, compact generation prompt, rig map, eight-view attachment contract, compact rig inspector and PNG/manifest checker. It requires one assembled sample before catalog expansion, palette/part reuse, measured crops, bounded caches, full motion/angle review and preservation of custom edits. No extra agent or paid API dependency is required.

## Checks

- The full 1,101-test Node suite passed for the posture build. After the style correction, 53 focused Node checks passed, including migration preservation, grounded idle, running elbow planes and fixed lengths across all actions.
- Isolated Electron rendered 1,152 cases after the style correction: all appearances/armor, multiple builds/actions, every frame of walk/run in every direction, editor capture, custom painted head, facial handle/visibility changes, NPC rendering and world canvas density. Additional checks enforce four flat crop-hair shades and no invented material colors. No renderer errors.
- Inventory geometry stable at 850/600/420 pixel heights. Creator interactions and closeups passed at approximately 1280x850, 780x600 and 600x430.
- Skill frontmatter validated and eight behavioral atlas checks passed.
- Review images and reports are ignored under `test-output`: `character-study.png`, `humanoid-hd-review.png`, `humanoid-walk-cycle.png`, `humanoid-run-cycle.png`, `inventory-layout.png`, `humanoid-hd-report.json`, `asset-skill-validation.json`.

## Delivery

The detailed 1.0.80 build was superseded by the simpler 1.0.81 art correction. The source checkout also contains concurrent Keeper and creature work; preserve it. The running 1.0.78 game was not stopped. No commit, push or website deployment was requested or performed by this task. Normal launcher uses normal saves; automated checks use isolated profiles. Physical controller and FPS testing were not performed.

The broad packaged smoke suite is not green: 1.0.80 reported 17/99 failures, compared with 16/99 in the saved 1.0.79 report. The additional named failure was the event-editor encounter check; other failures include outdated lobby/storage/rig interaction flows and Field Kit setup. This task did not modify the event editor. Do not claim a clean broad UI smoke run. Focused real-Electron character, creator and inventory checks above are passing.

Final desktop output: `dist/1.0.81/Wildbound-win32-x64/Wildbound.exe`, built `2026-10-07T05:59:52.237Z` from commit `1ce158a4108f3905a04390af18c57c040d4e6a3f` plus modified source. Fifteen packaged runtime/art files were byte-compared with source. The 1,152-case character verification also passed against `resources/app.asar` itself, with both palette checks and no renderer errors. `Play Wildbound.cmd --check` passed. Desktop shortcut `Wildbound Latest (1.0.81).lnk` targets this checkout's `Play Wildbound.cmd` with no arguments (normal save profile).
