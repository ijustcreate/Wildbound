# Animation Studio concept

Status: proposed interface, not implemented functionality.

## Direct manipulation

- Setup rig: add/delete/reparent bones; drag joint positions; change bone length and sprite pivot independently. Bind a cropped art part to a bone and adjust its offset, scale, overlap and drawing order without moving the joint.
- Animate: drag joints to pose, rotate using a handle, or drag a paw/hand target to bend its chain with IK. Lock feet to avoid sliding. Setup edits change the rest pose; animation edits affect the selected clip/time.
- Timeline: play/pause, loop, scrub, step frames, select/copy/move/delete diamond keys, change clip duration/FPS and choose stepped or smooth interpolation. Auto-key is explicit and visible.
- Preview: onion skins, bone overlay toggle, native game-scale preview and four direction selectors. Preserve the game's procedural gait as a layer; preview keyframe offsets combined with it or alone.
- Presets: humanoid, quadruped, snake, bat and plant. Tail chains, wing hinges and rooted plant stems get appropriate controls.
- Save/export rig, art bindings and clips together; undo/redo covers every edit.

## Screenshot issue

The animal joints and proportions need correction as well as editor controls. The current renderer rotates the whole quadruped with its heading. Directional artwork and draw order must be previewed individually to avoid a side-view animal appearing rotated flat on the ground. Joint placement, art overlap and native-scale silhouette checks are essential.

## Generation

Mode: built-in image-generation tool (no separate CLI/API call).

Final prompt:

undefined
