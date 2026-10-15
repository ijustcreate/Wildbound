# 1.0.96 Captain-rig Safari Hunter

The Safari Hunter encounter now runs on the Oathless Captain's 34-joint humanoid rig. Native Captain walk, kneel, dodge, and death motion provide the lower-body animation; editable Hunter clips supply a two-hand rifle carry, kneeling aim, recoil, reload, and retreat. The existing Hunter event, cooldown retreat shot, and player-item gear drops remain in use.

Worn Safari equipment was recolored toward the supplied hunter reference: pointed warm-brown pith hat, orange field jacket, brown trousers, tall dark boots, and a shoulder-pinned cape whose back is black and inside is red. The rifle rests across both hands while idle or walking. Item icons and worn pieces use the game's gear pipeline. `assets/safari-hunter/hero.png` and `assembled.png` are enlarged renderer previews; they are not game sprites.

Verification: isolated muted Electron rendered 968 frames across eight directions, the actual Hunter encounter spawned with the Captain-based Safari rig and cape, and the renderer logged no errors. The normal-profile desktop launcher and package identity are checked separately. This follow-up did not run the unit test suite.
