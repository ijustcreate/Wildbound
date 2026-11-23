# Bayou river otter - native rig draft

Replace the generic pale fox silhouette with a low chestnut body, rounded head/ears, broad cream muzzle, button nose, readable dark eyes and restrained whiskers. Borrow broad clusters and warm contours from the saved Bera/elf references. Avoid fur noise and outlines around construction primitives. Keep the world origin/collision; full artwork is roughly one player height at 72% of generic fauna scale.

The user requested a rig comparable to the chicken, a tail, swimming, diving, surfacing with something and holding it on its belly. Use the existing Animation Studio format: 30 editable joints, four paw IK chains and 12 keyframed clips. Parts: pelvis/spine/chest, cream belly, neck/head/jaw/muzzle/nose/eyes/ears, four three-joint legs, tailBase/tailMid/tailTip/tailEnd, find attachment. Local +y forward, +z up. All eight views share pivots and respect visibility; palette and body/head/muzzle/tail/paw dimensions are editable.

A clam follows the find joint, with both front paws around it above the raised cream belly. The back-floating face points upward. Swimming alternates paddles and phase-delayed tail links. Diving tips the head down before the tail follows. Waterline clipping and bubbles mark submersion. The wildlife-pack registry uses this dedicated rig; native wild-fauna AI owns its forage sequence.

Native/3x views, gait strip, waterline forage sequence, skeleton overlay and real Bayou captures are generated in muted Electron under test-output/otter-art/. This is a draft for the user's visual judgment; technical checks and self-review do not constitute user approval. Existing authored rigs/other species are preserved. No authored otter override was present when inspected.
