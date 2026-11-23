# Rigged art and motion

## Edit a native rig part

Start with the existing [Rig Studio workflow](../../../../RIG_WORKFLOW.md) and [registered subjects](../../../../src/rig-subjects.mjs). Record the subject, part ID, anchor, native dimensions, and intended facings. Wildbound's native facings are S, SW, W, NW, N, NE, E, and SE.

- Draw each required view as the same object turning under coherent light. Verify symmetry before reusing a mirrored part. Keep handed gear and asymmetric features correctly sided.
- Preserve per-view render order, visibility, and authored parts. The [part renderer](../../../../src/render-order.mjs) attaches indexed sprites using bone-relative `x` and `y`. Keep that offset when cropping or revising a part. Use [coordinate patches](pixel-recipes.md) for localized artwork and keep whole-character animation on the native joints.
- Review the assembled rig in all relevant facings at gameplay and inventory scale. Test idle, movement, and one overlapping or bent pose where the edit could expose a gap, wrong occlusion, or floating gear.

## Transfer skeletal animation

1. Scope the work to the requested clips. For a new donor, verify the source and map clip identity, timings, axis conversion, target joint IDs, and the root-motion policy before writing runtime code. Use a separate test subject for a proposed replacement.
2. Prefer existing motion data and converters. The [Captain import script](../../../../scripts/import-oathless-captain.cjs), [source metadata](../../../../assets/oathless-captain/motion-provenance.json), and [native retargeter](../../../../src/native-humanoid-base.mjs) show conversion from sampled skeletal motion to editable target joint keys. For a new source, record its provenance and any unsupported tracks or aliases.
3. Keep Wildbound's rest segment lengths, native artwork, and attachment offsets. Store animated deltas and explicit clip timing. Remove horizontal donor root travel when the game controls translation. Use donor contacts and keep intentional vertical movement. Choose sample count and FPS together to retain duration. A loop should play smoothly without a duplicated end sample.
4. Test the motion through the actual renderer and relevant state transition, as well as on the timeline. For locomotion, sample fractional frames and check contact, loop wrap, stride, and signed knee bend relative to the hip-to-ankle line. World speed and visual cycle should agree.
5. Identify the prior stock clip before migrating its poses. Protect custom keys and artwork. Check the [rig persistence path](../../../../src/project-rigs.mjs) before saving, and use an isolated profile for Studio review and persistence checks. Normal desktop Studio can write the shared `authored/rigs.json`.
