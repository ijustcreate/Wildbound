# Rig workflow and reference feature gaps

## Workflow

1. Choose a rig. Use **Setup** to edit the rest skeleton. The timeline is hidden in this mode.
2. Browse the collapsible **Rig tree**. Select a hand, foot or paw whose parent and grandparent form the desired two-bone chain.
3. In **IK constraints**, choose **Enable selected chain**. The editor switches to Animate and IK pose. Cyan rings identify constrained endpoints.
4. Choose an animation in the animation list, scrub to a frame and drag a cyan endpoint. The middle joint and endpoint are keyed together. Runtime IK preserves the rest segment lengths between those keys; out-of-reach targets clamp to the chain's reach.
5. Use Translate/Rotate for ordinary joint posing. Inspect Joint, Sprites, Properties or Equipment separately. Draw order remains per-facing in the tree panel.
6. Undo/redo while editing, then Save rig to game. Constraints are stored with the rig and included in JSON export. Removing a constraint retains its pose keys.

IK is a two-bone positional solver in model space. End-joint animation keys are targets; middle-joint keys determine the bend plane. It does not currently support independent target bones, pole widgets or world-space foot locking. Setup edits alter the chain lengths. Existing rigs remain unconstrained until explicitly enabled.

## Compared with the supplied reference screenshots

Implemented here: Setup/Animate separation, collapsible bone hierarchy, animation list, selectable IK constraints and endpoint handles, contextual inspector, per-facing draw order, keyframe timeline and graph editor.

Still missing: weighted mesh deformation and weight painting; mesh triangulation/vertex editing; independent IK target/pole objects; IK mix/softness/stretch tracks; transform/path constraints; world-space planted feet; attachment/skin libraries; event/audio timeline tracks; multi-key box selection and multi-track retiming; fully dockable/resizable workspace panels. These are not represented by placeholder controls.

Cape motion is a cheap deterministic cloth approximation: shoulder pins, travelling waves, trailing/lifting hem and curved folds. It is not collision-aware cloth or a full spring simulation. Custom painted cape sprites remain rigid attachments.
