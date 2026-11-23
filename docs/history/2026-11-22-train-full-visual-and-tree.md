# Train visual pass and fuller Christmas tree

User scope: review every carriage in eight directions, correct remaining player/passenger/furniture/wall overlaps, and make the house Christmas tree feel less flat. Working checkout: Wildbound_worlds, origin https://github.com/ijustcreate/Wildbound.git, HEAD f0b787ff33c3ac8f3675b48504937ebda4f0dcb5, with extensive preserved concurrent modifications. No commit or push.

## Train changes

The old individual foreground repaint could overwrite neighbouring people/background and tested broad furniture regions rather than physical faces. The new train-rider-layer composes one actor into a reusable 192x192 surface and removes only native foreground faces clipped at that actor's camera-depth plane. Tables, seat backs, end/side/compartment walls, door leaves, machinery, coal and roof opacity participate. Only already-painted nearby cars occlude an actor, including adjacent cars/gangways. Jump height naturally lifts the actor above tabletop coverage. Custom painted furniture retains its palette.

Opaque faces are unioned before masking to avoid roof seams; original trim segments are clipped without introducing outlines at the cutting plane. Native coal gains physical depth testing and fragment clipping; its CPU fallback shares the same rider-plane mask. Wall visibility is memoized per carriage/frame. The geometry display-list cache is bounded to 64 entries / 50,000 vertices per live design, and invalidates for pose, phase, doors, wall fades, palette and interiors. Per-renderer surfaces use WeakMap lifetime.

## Tree art contract and self-review

Reference: installed wildbound-pixel-assets style/art-direction notes, the user's outfit ensemble reference, actual house props and the native character renderer. This is one procedural world prop, not a rig or atlas. Preserve 44x28 support footprint, anchor at furniture bottom center, original crown headroom, room placement, destructible sections and gift interaction. No authored rigs or save/profile migration.

The former stepped triangle is replaced by overlapping radial branch masses with curved lower edges and dark undersides. Broad upper-left green highlights and a continuous right shadow establish volume. Bowed gold garlands and shaded ornaments follow the crown; a visible trunk sits in an inset, foreshortened red planter. One dark outer perimeter; no needle noise/dither. Painter art revision is included in the bounded furniture raster cache key.

Self-reviewed at native and 4x nearest-neighbour scale beside the native player and inside the real house. The branch overlap, rounded lower bough, planter rim and curved garlands read more clearly than the previous flat stepped fill. This is a self-reviewed draft; aesthetic user acceptance is not assumed. Preview: test-output/christmas-tree/source/tree-review.png and house-interior.png.

## Source checks and limits

- Focused train/jumping/holiday/related regressions: 152 passed, zero failures (train-visual-pass-final-regressions.log).
- Muted isolated Electron pixel probes: 136 passed, zero renderer errors, including all eight angles, jump clearance, authored colours, roof fades/closed roofs, open/closed doors, five intermediate curve angles and unchanged neighbouring pixels.
- Muted isolated Electron scene matrix: all five carriage types x eight headings x seven states = 280 captured scenes in 35 sheets. States: walking, seated/driving, raised, doors closed/open, roof fading/closed. Tender roof states intentionally remain open. All 35 source sheets were visually inspected during the pass; key sheets were re-inspected after geometry replay optimization. Latest source evidence: test-output/train-layer-matrix/final-source/.
- Muted isolated tree review: 16 integration assertions, including full cached crown/planter and exactly one reward/no reroll for each of seven surprises.
- Authored rig SHA256 remains 9a2c55d1090231ce5ec11cf06091224a9efb1b62a0c1bb0b3eb312a0cdad0be1.
- Component timings are not FPS: repeated 100-render synchronous, four-player checks varied markedly with shared-machine load. Latest new compositor median 43.5ms / p95 62.3ms; a subsequent old 1.2.107 baseline median 32.9ms / p95 40.3ms. Earlier unloaded runs were lower. The new physical masking has measurable cost; bounded geometry reuse, culling, wall memoization and batched opaque strokes reduce it. Sustained gameplay FPS and hardware/controller testing remain unverified.
- Full repository suite was not repeated against this actively changing checkout. Focused results do not establish broad-suite acceptance.

## Verified desktop delivery

- Final selected executable: `C:/Users/New User/Desktop/Wildbound/dist/1.2.109-2026-11-23T04-06-05-033Z/Wildbound-win32-x64/Wildbound.exe`. Manifest version 1.2.109, builtAt 2026-11-23T04:07:31.443Z, sourceCommit f0b787ff33c3ac8f3675b48504937ebda4f0dcb5, sourceDirty true, preview false. This is a modified-source build, not a new commit.
- Our earlier immutable package `1.2.109-2026-11-23T04-05-42-573Z` also passed all checks. A concurrent chat's later 1.2.109 package was selected by the normal launcher, so the entire desktop review was repeated against that exact selected package. Both artifacts have identical train-world-art.mjs; all nine task runtime files in the selected package retain the completed task implementation. The live source subsequently adds an unrelated train-journey HUD import/text, preserved and not represented as part of this delivered snapshot. Targeted hashes: test-output/train-tree-selected-hashes.json.
- Exact selected package in muted isolated Electron: 280 rendered scene captures (35 sheets), 136 pixel assertions, 16 tree/gift assertions and 40 real passenger/landing/re-jump assertions, all passed with errors []. Reports/logs: train-layer-matrix/selected, train-layer-probes/selected, christmas-tree/packaged, train-depth/packaged and train-tree-selected-*.log under test-output. Representative selected-package sheets were visually re-inspected. Additional forced CPU-coal fallback run passed all 136 pixel assertions against the identical fallback implementation in the earlier artifact.
- Exact selected .exe boot smoke: exit 0, failed 0, ready lobby, errors [], audioMutedTest true. All automated processes were muted before game load and used isolated test profiles. No personal saves or sound settings were changed.
- All 921 runtime files parsed using Node V8's ES-module/CommonJS parsers in one process before the normal package implementation ran. The existing ignored test driver replaces only the validation invocation in memory to avoid hundreds of process startups; no runtime syntax checks were skipped or changed in source. Full-suite verification remains incomplete as described above.
- Desktop shortcut `C:/Users/New User/Desktop/Wildbound Worlds (1.2.109).lnk` targets `C:/Users/New User/Desktop/Wildbound/Play Wildbound.cmd`, blank arguments, repository working directory, icon `assets/wildbound-icon.ico`. `Play Wildbound.cmd --check` verified the selected executable above. This is the **normal save profile**, without --preview.
