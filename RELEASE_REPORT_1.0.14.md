# Wildbound 1.0.14

Deep water is now traversable by players. Moving swims; hold attack to dive,
release to rise, and press jump to launch out toward shore. Entry splashes,
surface wakes and underwater bubbles use editable particle-engine presets.
Swimmers are shoulder-deep. Divers become smaller, fainter dark silhouettes
as depth increases.

Breath lasts 20 seconds of submersion. After exhaustion, every full second
costs 25% maximum health until surfacing. Air refills in 1.25 seconds from
empty and the meter fades away. Dive controls do not fire weapons.

The animated WebGL surface adapts MIT-licensed noise from boona13's stylized
water shader; attribution is in THIRD_PARTY_WATER.md. Software Canvas waves
are used if WebGL is unavailable. This is visual water, not fluid physics.

Also includes the preceding IK/editor workflow, procedural cape flutter,
elevated contact shadows and broken-window traversal improvements. See
RIG_WORKFLOW.md for supported controls and remaining editor limitations.

Verification: automated swimming/collision/breath/animation-migration tests;
Electron shader compilation and a 180-frame live game/render integration;
six-state swim/dive/splash/breath visual contact sheet.
