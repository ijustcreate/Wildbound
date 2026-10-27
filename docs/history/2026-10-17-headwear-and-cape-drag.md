# Running head balance, turned helmets and cape drag / 1.2.30

Checkout Wildbound_worlds, base 1bd5ef027966, modified source. Normal Electron
profile. Existing running builds, saves and unrelated dirty work are untouched.

## Head posture

The default Captain-derived run keys could incline the head/chest axis by about
30 degrees in profile; tall headgear amplified the dip. The recognized shipping
walk/run clips now keep neck length and a nearly upright head with small natural
motion (about 5.05 degrees maximum over eight views and sampled complete cycles).
Facial handles remain attached. These are ordinary editable keys, not a runtime
helmet-only counter-rotation. Exact donor-clip matching preserves user-edited
locomotion and all combat/bent poses. headBalanceRevision=1 marks the migration.

## Headwear

src/turned-headwear.mjs supplies native skull-local geometry for ordinary brim,
safari/cap, crown/circlet, metal helmet/fullhelm/horned, hood and mask families.
Crowns, elliptical brims, near cheek guards, closed rear neck guards and emblems
turn together; rear views have no front eye slits. Broad four-color regions
replace noisy lighting bands. Far band arcs are hidden instead of stamped over
the crown. Hood crowns leave face openings visible. Horn silhouettes may reach
14 native pixels above the pivot; other fitted bounds remain 12 vertically and
10 horizontally. Specialized quest/creature headwear retains its identity.
Captain equipped hats now use the same fitted directional renderer, not an
inventory icon. Per-facing wearable pixels/transforms and boneSprite overrides
remain authoritative. No raster atlas was generated for this native-code pass.

## Capes

Walking has gentle lift, running stronger lift/trail, rising jumps downward lag,
and descent a raised trailing hem. Shoulder pins do not move relative to the rig.
CapeInertia stores a bounded render-only history of actual ground travel keyed
by actor identity, sampled once per simulation time. Velocity and fold frequency
settle smoothly after stopping. Cloth trails travel, not just aim direction, so
strafing does not reverse drag. Repeated draws and short dash-afterimage rewinds
do not advance/reset history; teleports and world-clock resets start fresh. This
state is not attached to game actors and is not saved. Direct editor/replay art
renders retain deterministic action-driven fallback motion. Existing length/hem
styles and the Banshee length override remain supported.

## Verification

Muted isolated Electron: 23 head items and 14 capes; 5,696 assembled renders over
eight directions, locomotion/jump/attack/death samples; sprite capture remains
editable. All five headwear sheets and the walk/run/rise/fall cape study reviewed
at enlarged and native size; revised blocked hood openings, noisy hat shading,
and overly low bands before finalizing. Runtime velocity check measured cape
drive ~131.5 px/s after running and ~0.016 after a one-second stop.

Focused tests cover complete default walk/run head cycles, edited-key retention,
neck/limb lengths, all fitted-gear attachment bounds, inertia/teleport/replay
behavior, sideways drag, shoulder pins and ascent/descent. Keep prior known
house-layout revision-test failures separate from this work. Physical-controller
playtesting and hardware FPS claims are not made. No commit/push requested.
