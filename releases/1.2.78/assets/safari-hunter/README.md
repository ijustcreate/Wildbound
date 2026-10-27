# Safari Hunter art contract

The enemy uses the Oathless Captain's 34-joint humanoid skeleton and native kneel, dodge, walk, and death donors. The saved editable rig is `authored/rigs.json` under `safari_hunter`; motion defaults and action routing live in `src/safari-hunter-motion.mjs`.

The equipped parts are `safari_hat`, `safari_shoulders`, `safari_vest`, `safari_cape`, `safari_gloves`, `safari_pants`, `safari_boots`, and `rifle`. Item records, inventory icons, and worn pixels remain in the game's gear pipeline. The hat has a pointed crown; the jacket and trousers use warm brown ramps, boots are near black, and the cape's outside/back is black with red lining visible from the front. The rifle rests across both hands in idle and walk.

Native model coordinates use x across the shoulders, y forward, z height. Headwear follows the head joint, jacket follows chest and pelvis, cape pins to both shoulders, gloves to hand joints, and boots to ankles. Directions are 0 front, 1 southwest, 2 west, 3 northwest, 4 back, 5 northeast, 6 east, 7 southeast. The renderer is shared at game scale and enlarged scale; the PNG files here are visual QA previews, not baked game sprites.
