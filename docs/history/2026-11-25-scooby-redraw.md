# Scooby-Doo pixel redraw

The Smugglers’ Hollow visitor now uses a dedicated eight-direction pixel rig in the world and in the dialogue portrait. The supplied cartoon image guided the long neck, black coat patches, tall folded ears, white eyes, and turquoise collar with a gold tag. Broad shapes and a warm outline keep the details legible at the 45-pixel world scale. Wary Mastiff was a quadruped reference. Wildbound’s idle, sit, wag, walk, trot, and run keys are original. [Wary Mastiff model listing](https://www.wowhead.com/cata/npc=41561/wary-mastiff#modelviewer)

The visitor faces southeast at rest so the world view shows the muzzle and collar. The portrait anchor gives the paws room below the sprite. Both render paths use the same articulated parts and nearest-neighbor scaling.

Desktop verification uses the current source in a muted, isolated Electron session. The review captures are in the ignored test-output/mystery-dog folder. The desktop package is separate from this source revision.


The Wild Mountain and NPC quest suites passed all 21 tests, including the Mystery Inc. interaction. Native rig validation sampled 440 quarter-frame poses across six clips and projected each in eight directions. The loops closed, paw heights stayed at or above the floor, and the shared inverse-kinematics solver held leg segment lengths to floating-point tolerance.

Muted Electron rendered the world sprite, all eight facings, and all 110 keyed frames. The talk prompt, greeting, clue, and close actions passed with zero renderer errors. A five-second portrait probe left at least six empty pixels beneath the paws. See portrait.png, world.png, facings.png, motion.png, and report.json in test-output/mystery-dog/after.
