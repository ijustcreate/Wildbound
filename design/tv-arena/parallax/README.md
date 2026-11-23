# Mossroot art contract

Generated with the built-in `image_gen.imagegen` tool. The user's forest-ruin image is a **style reference**, not document instructions. Generated studies are references for this pass, not user-approved artwork. Prompts and source roles are recorded in `prompts.json`.

Four runtime plates live in `assets/tv-arena/`: `far-valley-v1.png` (opaque), `ruin-aqueduct-v1.png`, `mid-forest-v1.png`, and `near-canopy-v1.png` (real alpha). Each original is 1774×887. Keep originals unchanged. The game samples them onto a shared 512×256 logical grid once, then uses nearest-neighbor rendering and four world-anchored scroll speeds. Mirrored neighboring tiles share their boundary pixels, avoiding visible wrap gaps. All four plates stay behind gameplay geometry and characters.

Style: pale jade sky, desaturated blue-green distance, muted emerald trees and teal masonry, sparse moss highlights, warm upper-left daylight. Broad stepped clusters and limited shade masses; no fine grain, dithering, smooth illustrated foregrounds or busy outlined brick texture. Nearby game platforms retain stronger outlines and clearer contrast than scenery.

The two concept studies guide **editable native** Bramblecap and Mossback rigs, not baked full-character animation sheets. Bramblecap uses a round chestnut cap, cream crescent, small moss tuft, clearer stem face and wide planted root feet. Mossback has a connected ochre head/neck, a single green armored dome with broad plates, ochre rim and sprout. Closed-shell states hide all head/feet and mask the standing belly behind the rim.

Art parts retain their original IDs and eight view IDs. Default motion keys were revised for planted alternating feet, cap/shell follow-through, anticipatory attacks, hurt recoil, stomp collapse, retraction and wake. The authoring script compares old default pixels by actual color, not palette order; modified pixel parts, colors, joints and motion clips are retained. Only recognized default parts are repainted through Rig Studio's actual InlinePixelEditor. Other authored subjects and props are preserved.

Review outputs: `test-output/tv-polish/`. `native-eight-directions.png` and `native-animation-actions.png` show the two revised creatures. The ten additional enemies reuse Wildbound's existing native art; their 2D profiles, foot offsets, core sizes and movement are checked individually. Frog rendering uses an opt-in side-view adapter to the existing wildlife drawing. The normal 3D-world frog rendering is unchanged.
