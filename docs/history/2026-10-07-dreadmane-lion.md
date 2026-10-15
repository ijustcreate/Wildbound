# Dreadmane Lion / WoW motion transfer

Requested a new lion enemy from Wowhead NPC 55491 with a richer rig and combat, while preserving existing creatures. Installed personal skill `wildbound-motion-transfer` and exercised it on this donor.

The public viewer resolves NPC 55491 → display 39134 → M2 file 124781. Direct bounded M2 decoding handles embedded/external AFID tracks, quaternion interpolation, pivots and aliases. The model has 69 bones and 49 sequences (38 distinct). A fixed, documented converter maps 37 native joints and removes horizontal root translation; game collision-aware movement owns travel. The native pixel body/head/mane and facial pieces remain separately editable.

Added enemy/rig key `dreadmane_lion`, shared authored entry, definition round-trip, Studio/runtime rendering, collision footprint, “The Dreadmane wakes” event, and custom AI. Its new abilities are a left-right claw combo and an area roar with short stagger/knockback; the source pounce has a crouch tell and locked lane. Sleep/wake, damage interruption, traps, immunity, recovery and save-safe one-hit bookkeeping are covered. Existing lion and wolf entries were compared with the skill's preservation snapshot.

First visual QA found a neck gap during the roar and a thin torso; native volumes were refitted along the full neck chain and the mane enlarged. The preview camera was expanded to include the vertical pounce. Art remains a review sample.

Source launchers: `Play Dreadmane Lion Test.cmd` (rig/parts), `Fight Dreadmane Lion.cmd` (actual game trial). Explicit isolated profile `test-output/dreadmane-lion-play-profile`; normal player saves/open game sessions are not reused. This lion was imported only after the user authorized the exact donor. The subsequently requested captain is documented in its own history note. The reference catalog now covers 46 current Studio IDs plus 25 fantasy categories.

Validation is recorded in `assets/dreadmane-lion/qa.json`. The first build attempt exposed legacy-event and dense-save issues; both were fixed. The final combined build is 1.0.88, including the subsequently requested captain, with 1,151 tests passing and 282 runtime files syntax checked. Packaged encounter and Studio checks passed for both new enemies. The broader desktop smoke recorded 16 failures; its limits and build/launcher identity are documented in the captain history note. No commit or push requested.
