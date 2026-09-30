# Generation 4: Animation Teacher's Critique

## Overall Assessment

This is a stronger posing and mechanics pass, not finished AAA animation. The
weapon paths now have an understandable direction and the body participates in
the strike. The best improvement is the distinction between the quick cuts and
the crouched overhead finish. The remaining weakness is silhouette clarity when
hands, weapons, face, and torso overlap at this small resolution.

Review the animated index at normal speed and 0.25x, then compare native 1x pixels.
The six animation-review images summarize every clip; individual contact sheets
show all eight directions. Native sheets contain every sampled frame. Comparison
playback uses a shared crop so it does not hide changes in proportions.

## Highest-Priority Notes

1. **Impact timing in the game:** the game still applies melee damage on input,
   before the new visible contact pose. Moving damage/VFX to a contact event is
   the next gameplay-animation integration task. This pass preserves combat
   rules and durations; a prettier wind-up alone does not solve that mismatch.
2. **Front-facing punches:** the fist still merges with the chest in some south
   and rear views. Push the elbow silhouette outward and give the fist a stronger
   light/dark separation without enlarging both hands indiscriminately.
3. **Death and get-up:** the body reaches the floor, but west/east foreshortening
   bunches head, arms, and knees together. Give the floor pose a clearer diagonal
   and hold a planted support hand through the rise. Do not add detail to a knot.
4. **Whip recovery:** the moving tip is much more legible, but its recoil still
   feels elastic. A fixed-length, coiling lash with wrist-led reversal would sell
   leather better than further increasing the motion amplitude.
5. **Swim:** still the weakest locomotion clip. Without water occlusion it reads
   as a hunched paddle. It needs a dedicated torso orientation and a clearer
   catch/pull/recovery rhythm, not just larger arm gestures.

## Base Model

The corrected ear placement and profile locks no longer paste large skin blocks
over rear hair. Faces, noses, and hairstyles turn more consistently. The profile
torso is still narrow, and hair highlights are busier than the reference at 1x.
The next art cleanup should simplify those clusters and protect the eye/cheek
space, especially with curls, headgear, and broad shoulders equipped together.
Long hair would benefit from an asymmetric hem and more separate strands at the
ends. The current straight rear mass is serviceable, not a final art direction.

## Clip-By-Clip Notes

| Clip | Assessment and next correction |
| --- | --- |
| idle | Readable and restrained. Add a slight offset between breath and head settling. |
| run | Better opposition and lean. The passing pose still lifts the knees sharply; soften the foot roll. |
| walk | Now distinct from run. Reduce the impression of marching in profile. |
| punch | Clearer load and recoil. Front-view fist/chest separation remains weak. |
| punch_left | Useful fast jab. Keep the supporting shoulder quieter than the striking one. |
| punch_right | Stronger cross than before. Add a more deliberate rear heel pivot. |
| uppercut | Compression and rising fist read well. Hand/head overlap needs cleanup near the top. |
| slash | Better arc in profile. Keep the blade silhouette away from the cheek on recovery. |
| swipe_one | One of the strongest changes: readable shoulder load and cross-body finish. Refine the planted lead foot. |
| swipe_two | Clearly reverses the cut. The recoil could load the hip before the wrist changes direction. |
| swipe_big | Best contrast in weight. The low finish is convincing; the last return to guard remains quick. |
| sword_combo | Continuous two-cut phrase instead of two resets. Needs more personality in the connecting recoil. |
| draw | Bow reaches a stable aim. Rear views still compress the hands and string into the body. |
| ranged | Release and string recovery are clearer. Rifle deserves its own shoulder recoil/reload clip eventually. |
| cast | Clear gathering and release poses. Make the off-hand gesture more intentional for each spell family. |
| block | Solid braced stance. Needs a separate impact reaction rather than only a breathing hold. |
| shield | Usable guard loop. Too similar to block to count as an independent performance. |
| parry | Outward redirection is clearer. Shield rim motion could use a sharper one-frame accent. |
| hurt | Recoil is readable. Still generic; directional reactions would communicate hit location better. |
| dash | Strong forward compression. Add a clearer braking foot before returning upright. |
| jump_takeoff | Anticipation is present. The extension between crouch and tuck should be more emphatic. |
| jump_air | Asymmetry helps. Knee/arm cycling is still busier than a held airborne silhouette needs. |
| jump_fall | Opens from the tuck appropriately. Fingers and shoulders could show more readiness for landing. |
| land | Compression works. Needs a delayed upper-body settle after the legs absorb impact. |
| interact | Clear reach. The generic pose cannot communicate different object heights yet. |
| get_up | No longer a stretched upright recovery. Floor contacts and side-view silhouette remain priority fixes. |
| revive | Better kneeling gesture. Hands need a stable recipient/contact point to sell the action. |
| swim | Priority rework: too upright and too similar to paddling in place. |
| death | Now actually grounded. Side-view overlap and abrupt mass transfer still need work. |
| sleep | Grounded with a slower breathing loop. Still needs a relaxed hand/head relationship in profile. |
| salvage | Hands read as manipulating something. Needs clearer resistance and a decisive final release. |
| pickup | A real bend and lift now. The object becomes visible too early; stage reveal at hand contact. |
| carry | Prop and hands agree better. Add gait-dependent weight shift when moving. |
| found_unique | Clear overhead presentation. Add a little overshoot and head attention toward the item. |
| mine | Tool and hands move together. Wrist orientation can still make the pick silhouette ambiguous. |
| woodcut | Reads as a forceful swing. Needs a distinct lateral chop rather than sharing mining's overall rhythm. |

## Loadout Notes

- Daggers have shorter forward thrusts; the heavy finisher still inherits too much sword-like body motion.
- Dual weapons alternate the lead hand. Off-hand recovery can still look parked, especially with mixed blades.
- Bow, rifle, and wand attachment checks pass, including airborne combat. That is a technical guarantee, not a guarantee of beautiful silhouette in every frame.
- Custom authored wearable offsets remain respected. Extreme offsets can still create clipping and need an artist's individual review.

## Reference Principles

The pass emphasizes anticipation and explicit breakdown poses rather than only
adding in-betweens. These are the relevant teaching references, not a claim that
the exported work matches their production quality:

- [Animation Mentor: Anticipation](https://www.animationmentor.com/blog/anticipation-the-12-basic-principles-of-animation/)
- [Animation Mentor: Pushing/Pulling and Body Mechanics](https://www.animationmentor.com/blog/tutorial-animating-pushing-and-pulling-motions/)

The user's supplied pixel-art turnarounds remain the proportion and silhouette
reference. No external animation frames were copied into the game.
