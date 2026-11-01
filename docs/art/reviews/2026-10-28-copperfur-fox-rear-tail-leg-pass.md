# Copperfur fox rear silhouette and leg pass

Status: art draft for review, not approved for release.

The game-owned fox pixels now replace the thin rear-facing projected tail with a broad curled plume attached behind the rump. Its outer edge and pale tip stay readable from the rear while the body occludes the root. The upper leg strokes use the copper body tone without a separate dark outline; lower legs retain their shade. The fox rig, donor motion, clips, hitbox, behavior, and all non-fox wildlife are unchanged.

Review board: `test-output/creature-art-review/wildlife-focused-before-after-reference.png`. It includes same-scale before and after rows for all eight facings, enlarged nearest-neighbor runtime art, and the primary front, side, and rear modelviewer references.

Verification: wildlife pack tests pass (11/11); fox module syntax check passes; muted Electron capture calls the actual wildlife subject renderer and reported zero renderer errors.

Remaining review question: verify the centered rear silhouette feels like the reference's trailing plume before approving or expanding this change.

