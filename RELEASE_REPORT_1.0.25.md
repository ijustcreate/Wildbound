# Wildbound 1.0.25

Launch **Wildbound Latest (1.0.25)** from the Desktop. Existing builds and saves are preserved.

- Test equipment against immortal practice targets. Physical, magic, fire, ice, and ghost damage use distinct colors; numbers pop upward, stack, and expire after 0.5 seconds.
- Lions and other jump-capable monsters can reach furniture tops. Tree stumps now have ground collision and support jumping onto them.
- Ritual ghost minions animate and follow separate positions, engaging nearby enemies. The character portrait has up to three blue dots showing each ghost's attack cooldown; world-space follower labels are removed.
- The opening board is centered. Event titles, verses, and tips are larger and sharper with stronger contrast.
- Shallow water is visibly lighter than deep water and has animated edge ripples. Bridges render on their own layer above the water; swimmers pass underneath a translucent deck, while walkers remain on top. Entering and leaving deep water produces a splash.
- Lobby inventory remains available with I or the mapped controller inventory button.

Validation: 414 automated tests passed, including lethal practice damage, actual melee/projectile hits, furniture pounces, stump landing, ghost behavior, bridge swimming, depth splashes, and opening-camera bounds. Electron checks rendered the opening board, readable event text, minion portrait indicators, water contrast, bridge occlusion, and stacked damage text. Broader UI smoke failures previously reported for 1.0.23 are not claimed fixed.
