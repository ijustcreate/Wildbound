# Llama / Dottie silhouette pass

Status: unapproved art draft.

The llama now has a longer, narrower fleece neck, a slightly smaller body, rounder crown and small bright eyes. Upright ears remain connected to their existing editable joints. The neck/head rig anchors, locomotion clips, and flee behavior are retained; the pass changes pixel volumes and shape values only.

Review board: `test-output/creature-art-review/wildlife-trio-reference-before-after.png`. It shows the archived previous eight-view sprite study, all eight current runtime facings at native and enlarged nearest-neighbor scales, and four Dottie modelviewer reference angles. The archived before is the existing `llama-after.png` pixel study, explicitly relabeled as a previous art draft; the after is rendered from `CREATURE_PACK.subjects.llama.draw`.

Verification: wildlife pack tests pass (11/11); muted Electron before/after capture reported zero renderer errors. Model tests confirm unchanged neck/head anchors and flee behavior.

Open review: decide whether the taller neck feels appropriately llama-like beside the Dottie rear and side references before approving it.
