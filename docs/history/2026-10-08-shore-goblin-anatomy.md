# Shore goblin anatomy revision — 2026-10-08

The previous assembled artwork had inconsistent skull/body mass, a disappearing cream underside, thin square limbs, a waist shelf, weak rear crest visibility and unconvincing weapon grips. This revision replaces its native drawing construction while retaining motion and gameplay.

- One orthogonal head frame projects the skull, cheeks, jaw and crest into all eight views. The smaller skull has tapered cheeks, foreshortened far eyes and a mouth that follows head tilt.
- The neck and rounded pale underside remain connected under the donor hunch. Tapered capsules define shoulders, elbows, wrists, thighs and shins; webbed feet differ from open hands.
- The wrap uses separate fitted kelp strips and a thin waistband. The crest uses distinct fins with rear foreground ordering; cheek fins use tapered shapes.
- The right arm reaches gripR. The separate curled hand paints over the held shaft; carrying tips lean away from the face, while attack/cast directions retain their donor motion. The club has a bound wooden head, the spear a bone point and kelp ties, and the healer a forked kelp crook with inset shell/stone and necklace.
- All three palettes, 31 native joints, 52 imported clips, custom boneSprites, visibility, renderOrder, beach-only spawning, healer/guard behavior and saves remain supported. No authored rig file was written by this revision.

The art contract is assets/shore-goblin/art-contract.json. Review images and native/enlarged and full-cycle sheets are in test-output/shore-goblin. Artwork is revised for user review, not user-approved. The verifier now waits for actual Studio startup before doing expensive drawing; a previous attempt exposed an asynchronous startup race rather than a missing Studio feature.

Focused Node tests: 18 passed. Source representative Electron review: 1,536 poses, 40 head/neck/body overlap samples, independent eye edit, Studio selection, real gameplay healing/protection and JSON save round-trip passed, muted with an isolated temporary profile. Complete source Electron validation passed all 16,000 poses. Packaged 1.0.112-wow-creatures review passed another 1,536 poses and the same 40 connection, editor, actual gameplay and save checks. The four goblin runtime modules match the archive byte-for-byte. The build is modified source at bc1b432d20f4b0de0b04d4d3b34600f7a9fe0a70; Play Wildbound.cmd --check and the normal-profile Wildbound Latest (1.0.112-wow-creatures).lnk both verified. The review-only art contract remains in source; it is not runtime data in this archive.

Preservation: the entry guard passed before concurrent creature work changed beastMotions/nightMotions. Those entries were not touched or restored by this art task. Existing dirty work and normal profiles were preserved. No commit or push.

Packaging note: one overlapping package attempt failed copying an audio file in its temporary staging folder; the source file exists. The completed combined build was verified directly instead. No player process or profile was changed.
