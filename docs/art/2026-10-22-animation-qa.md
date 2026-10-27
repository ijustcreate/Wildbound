# Main explorer animation review — 22 October 2026

Implementation follow-up: all thirteen findings are addressed in the current native rig's [1.2.55 release](../history/2026-10-22-forest-and-native-locomotion-1.2.55.md). The original review below records the evidence before those changes.

Source: user's 22.93-second `animation issues wildound.gif`. These are visual QA findings and art-direction improvements, not confirmed engine diagnoses. The capture cadence cannot establish game FPS. No animation keys were changed for this review.

1. **The idle weight sits ahead of the legs.** In profile at 0–0.4s and 19.4–19.8s, head and shoulders project forward while the boots gather behind. Place the pelvis over the supporting ankle, soften the chest and move the head back slightly; preserve actual bone lengths.
2. **The idle silhouette is compressed at the neck.** Hood, collar and raised shoulders merge into one block. Lower the shoulders, open a small jaw/collar gap and use a tiny chest-led breathing cycle rather than moving the whole body.
3. **The running feet lack a convincing planted beat.** In the long rightward runs, several poses read as both boots hovering. Author heel/contact, compression, passing and toe-off poses with one clearly grounded support beat per step.
4. **Stride and travel need a contact check.** The boots appear to cycle underneath a smoothly translating body. Drive locomotion phase from distance travelled, then compare each planted sole with a stationary floor mark; correct stance drift rather than merely speeding up the loop.
5. **Knees stay tucked for too much of the run.** The silhouette reads as pedalling. Extend the trailing hip before toe-off, lift the recovering knee later and give the returning boot a short low arc.
6. **The upper body moves too much as one rigid piece.** Hood, chest and belt travel together during the lateral runs. Add restrained shoulder/pelvis counter-rotation, with the head stabilised so the face remains readable.
7. **The free hand keeps reaching in front of the chest.** It resembles a repeated little punch more than a relaxed run. Swing the elbow beside the ribs and let the wrist trail; reserve the forward guard for combat.
8. **The sword repeatedly cuts across the face silhouette.** Around 1.2s, 2.3s, 13s and 16–17s, the upright blade competes with the eye opening. Give locomotion a lower, outward weapon carry, keeping the grip anchored to the existing hand pivot.
9. **Starts and stops have little visible weight transfer.** Around 3.5s and 19.4s, running resolves into a very straight hold. Blend through a brief compression/settle, keeping a supporting foot fixed; do not delay input response to add anticipation.
10. **Turns replace the whole silhouette abruptly.** Front/profile/rear changes around 4.8–6.4s and 20.6–21.4s expose large changes at once. Preserve stride phase across directions and let head, shoulders and hips turn in a short stagger rather than resetting the cycle.
11. **The cape often reads as a rigid trailing paddle.** Around 10–11s and 14–16s the hem forms a long, nearly straight projection. Pin the collar, give the middle and hem separate damped lag, and use two broad folds rather than adding stripes.
12. **Cape movement overwhelms short direction changes.** A long sideways extension can dominate the small character. Limit sideways lift by speed, smooth changes in turn force and let the hem settle after movement; keep near/far cape layers from swallowing the arm silhouette.
13. **The shadow weakens foot contact.** Its hard trapezoid and persistent gap beneath the soles make ordinary running resemble levitation. Keep a small contact shadow under grounded boots, and vary the broader cast shadow using actual elevation; validate running and airborne states separately.

First pass: support/foot contact, weapon carry and cape restraint. Verify one complete cycle at native gameplay size in all eight views, with slow frame stepping and normal-speed playback, before applying changes to further clips. Preserve authored custom poses and the current native rig.
