# Shared rig studio — 0.3.8

**Rhino / quadruped** is also available. Edit the legs, head, ears, eyes, short tail, hornBase/hornTip and smallHornBase/smallHornTip. Horns and facial parts support per-facing visibility. Body width, head radius, leg width, tail width and horn width are adjustable. Idle/walk/run, charge, windup, recover, hurt and snared clips share the same timeline tools. The existing twenty-rhino stampede uses the charge clip with distance-driven gait.

The Rig studio selector now includes **Player, Lion, Bat, Snake, Monkey, Snapping plant, Golem and Trap**. All use one editor and pose evaluator. Select a joint to drag or rotate, choose Setup joints for rest positions or Animate for clip keys, and use the timeline to scrub, play, retime and copy keys. Save rig to game updates runtime rendering; Export rig exports the selected model. Each subject retains its own undo history. Imported packages are checked against the selected skeleton.

| Subject | Main controls and clips |
|---|---|
| Bat | Wing shoulders, elbows, wrists, fingers/tips; hover, fly, windup, dive, recover, hurt and snared |
| Snake | Eight body segments, neck/head/jaw and tail tip; idle, slither, coil, windup, strike, recover, hurt and snared |
| Monkey | Arms/hands, legs/feet, ears/eyes and segmented tail; idle, run, punch, throw, recover, hurt and snared |
| Snapping plant | Fixed base, stem segments, leaves, head and two jaws; idle, windup, bite, recover, hurt and snared |
| Golem | Heavy limbs, fists, head and eyes; idle, walk, windup, slam, recover, hurt and snared |
| Trap | Base/trigger, two hinges and jaws; idle, arm, snap and hold |

Bat wings continue beating when stationary. Snake/golem/monkey locomotion follows distance traveled. Attack clips follow combat timers; monkey bananas release during the throw. Traps open on placement and close around a captured creature. These are editable native pixel rigs inspired by the concepts, not sliced generated sprite sheets. Other enemies such as crocodiles, wasps and skeletons retain their existing systems.

For the lion, select **earL / earR, eyeL / eyeR, face, muzzle or nose** in the joint list or click their canvas handles. Move and key them like other joints. The inspector's **Part visibility** checkboxes control which of the eight facings shows that part; Show all / Hide all controls every facing. Hidden parts retain handles for editing. These visibility settings are per facing, not animated blink keys. Save rig to game persists them. Existing lion packages migrate automatically without replacing edited head positions or clips.

Open **Animation & Game Studio → Rig studio**, then choose **Player / humanoid** or **Lion / quadruped**. Both use the same editor and pose evaluator. The pixel mannequin takes its proportions, separated colored limbs and eight-direction movement from the supplied running-dummy reference. The lion is drawn from articulated parts inspired by the lion concept. Neither renderer crops the reference artwork.

The lion has front shoulder/elbow/paw chains, rear hip/knee/hock/paw chains, neck/head and a three-part tail. Its clips are idle, walk, run, windup, pounce, bite, recover and hurt. Combat clips follow enemy action timers. Scroll the right inspector to edit body, mane, head, leg, tail and tuft sizes. Switching subjects preserves separate undo histories. Save rig to game persists both definitions in the existing design save; Export rig exports the selected subject. Lion and humanoid files cannot be imported into the wrong skeleton.

## Edit and preview

- **Setup joints** changes the rest skeleton used by every clip. Drag a joint to move it and its children. Use **Rotate** to rotate the selected joint around its parent. Across, depth and height controls allow adjustments that are difficult to see from one direction.
- **Animate** changes the selected clip. Dragging a joint automatically writes a key at the rounded current frame. **Set joint key** explicitly records the selected joint.
- Scrub the slider or click the timeline. Play/pause, step forward/back and toggle looping. Change preview FPS. Gameplay running is distance-driven to keep its cadence tied to movement; attacks fit the combat action's duration.
- Drag a diamond to move that joint's key. Shift-drag copies it. Copy/paste frame transfers the whole pose. Delete joint key removes only the selected joint at the current frame.
- Use the eight facing buttons, onion skins and the equipment selector to check the result. The game preview uses the same pose evaluation and pixel drawing as gameplay.
- **Save rig to game** persists the rig, palette and clips. Export/import uses a JSON package for the selected subject. Undo/redo covers pose, setup, palette and timeline edits. Reset has undo support.
- With focus in the studio (outside an input): Space plays/pauses, Left/Right step, Ctrl+Z undoes, Ctrl+Shift+Z redoes and Ctrl+S saves.

Clips: idle, run, punch, slash, bow draw, hurt, dash and block. Head, torso, shoulder/elbow/hand and hip/knee/foot joints share one fixed humanoid hierarchy. The editor manipulates joint positions directly; it is not an IK solver, mesh editor or automatic sprite rigging tool.

## Consolidation and compatibility

All player skins use the same editable player definition. Current equipment stays attached to the animated hands and body; facing determines depth order. Ground markers now align with the new foot anchor. Menu portraits also use the current player renderer.

Old player and lion sprite sheets and creature-rig modes can no longer override their motion. Existing imported artwork and save files remain on disk. Their obsolete assets are hidden from the active art list. Other creatures retain their existing animation tools; this migration covers the player and lion.

The older player definitions inside saved design packages are retained for compatibility but are not used by the player renderer. Player packages are stored within the existing `wildbound-design` definition save under `player`, so there is no second player animation save to keep synchronized.

Validation: model tests cover eight facings, loop continuity, keyed-pose evaluation, joint transforms, action selection and package validation. Electron checks exercise dragging, scrubbing, undo, saving, and independence from obsolete animation modes.

## Human facial parts (0.4.4)

Choose Player / humanoid in Rig Studio. Select eyeL, eyeR, earL, earR, nose or mouth in the joint list. Setup joints changes the rest position across all clips; Animate writes a key at the current frame. Drag the handle or edit X / Y / Z. Part visibility controls each of the eight facings and keeps hidden handles available. Save rig to game applies the changes. Existing rig packages upgrade without losing their head motion.
