# Wildbound 1.2.3 — heavier jump and varied cemetery trees

The player jump had remained floaty because the saved/default arc still gave roughly half a second of airtime, and the lobby practice actor overrode it with a much stronger jump. The default is now impulse 230 and gravity 1200 (about 22px apex and 0.38s airtime), and the lobby practice actor uses the same arc. Session restore migrates the original and previously shipped default arcs while preserving intentional custom values.

Cemetery forest trees now render five distinct seeded branch silhouettes and species-specific canopies (oak, birch, pine, deadwood, willow). Existing world seeds remain stable and the established ground collision footprints are unchanged.

The beholder rig now roots six stalks around the body rather than clustering them on its crown. Its idle eyes independently glance around and blink. While controlling any owned unit, the on-world player ring/name now follow that unit (the trailing hero remains unmarked), the inventory portrait/header identify the controlled creature, and controller Attack no longer opens world interactables; Interact retains that action.

Focused regression tests cover jump height/airtime, legacy-save migration, five reproducible tree silhouettes and unchanged collision footprints, beholder idle/stalk distribution, inventory control routing, and Attack-versus-Interact behavior. The full serial suite passes all 1,292 tests; desktop package and launcher smoke verification are performed for the 1.2.3 build.
