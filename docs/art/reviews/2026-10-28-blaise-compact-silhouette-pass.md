# Blaise compact silhouette — unapproved draft

Status: ready for visual review; **not user-approved**. Focused Blaise art change only. No package, version, commit or push.

The previous arm shapes extended roughly thirty logical pixels beyond the hands and formed a horizontal bar/wing at several facings. The native editable arm parts now follow the existing shoulder, elbow and hand channels with a dropped elbow and short flame fingers. A narrow tapering torso separates the head, hot core and trailing ember base. The core sits beneath the face; diagonal eyes foreshorten and rear head lobes replace the previous face-like horizontal marks.

## Compact art contract

- Primary reference: the four retained `test-output/modelviewer-references/204217-blaise-{front,side,rear,opposite-side}-idle.png` captures. Borrow the compact vertical flame mass, lowered arms and tapering ember base. These are visual references; no donor animation transfer is claimed. Four reference angles exist, so no diagonal screenshot is fabricated.
- Native source: `src/creature-packs/constructs.mjs`; preserve the existing `Blaise rounded fire body`, `Blaise molten core`, `Blaise flaring fire limb L/R` part IDs and their joints. Art remains articulated, editor-capturable native geometry rather than a baked whole-creature sprite.
- Density: preserve the existing logical integer pixel grid. The gameplay row uses actual `Animator.draw` with `actorRenderSize = 47`, beside native forest bushes. The detail row enlarges a native raster exactly 2× with nearest-neighbor sampling. Before and after share camera, pose, lighting, ground strip and render scale.
- Palette: existing maroon outline/shadow, red-orange body, orange light, golden face/core and pale-hot focal clusters; unchanged palette data. Use broad connected masses and one short inner flame highlight, without texture or extra pixel resolution.
- Eight views: S/SW/W/NW/N/NE/E/SE use the actual `directionVector` convention (`faceX = -sin(angle)`). Profiles overlap the far arm and show a short near-arm hook. Diagonal arms remain registered to their different projected joints. Rear views hide the face and show descending ember lobes.
- Preserved: all joints, shape/proportion settings, clips, palette, visibility, stats, combat, AI, effects and events. Source-only art pass; authored overrides, saves and other creature files untouched by this assignment.

## Evidence and checks

- `test-output/blaise-compact-pass/reference-before-after.png`: four actual reference captures plus all eight labeled BEFORE/AFTER views; actual gameplay scale and 2× detail.
- `test-output/blaise-compact-pass/{before,after}.png`: separate matched comparison rows.
- `test-output/blaise-compact-pass/motion-8-views.png`: idle/walk/run/attack/special/death, four sampled phases each, all eight views (192 assembled poses).
- `test-output/blaise-compact-pass/after-report.json`: muted isolated Electron, zero renderer errors, unchanged joints/clips/shape/palette/visibility compared with the before model.
- `node --test tests/creature-packs/constructs.test.mjs`: **24/24 passed**; native eight-facing/editable-rig coverage plus existing pack combat and fire-trail behavior.
- `node --check` passed for the source and capture helper. No atlas manifest is needed for native-code parts.

Visual self-review: the idle mass reads vertically in all eight views; front/rear arms separate from the torso, side views show a compact hook instead of the previous forward bar, and the tail stays attached through sampled attacks and collapse. The existing head remains the dominant luminous mass. Sampled motion is not a full gameplay, hardware, FPS, or donor-animation validation. No full desktop rebuild was requested or performed, and the installed package is not updated by this source change.

Review question: **Do the compact lowered arms read clearly as fire-elemental arms at the native gameplay scale, or should their tips flare outward slightly more?** The answer determines whether to keep this silhouette or revise only the arm-tip spread.
