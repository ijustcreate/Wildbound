# Sword, movement and lighting reference — direction recorded

User reference: [eight-second forest combat clip](https://cdn.dribbble.com/userupload/5847687/file/original-4dde0b49b72fa57db742dbf6ac561956.mp4). Reviewed directly in Chrome's video player, including paused samples at approximately 1.02, 1.19, 1.65, 2.17, 2.52, 3.14, 3.85, 4.91 and 6.42 seconds. No donor model, animation data or artwork was extracted. This is a feel reference for Wildbound's current editable native rig.

Status: **implemented on the current native rig in [1.2.57](../history/2026-10-23-sword-walk-forest-1.2.57.md), for user review**. The implementation is not claimed user-approved or an exact recreation of the donor. Exact timings below describe the initial tuning targets, not measured implementation facts about the donor; the release note records the shipped timing, checks and performance limits.

## Visible cues and concrete translation

| Reference cue | Wildbound target | Acceptance check |
| --- | --- | --- |
| Hero closes and circles at close range while keeping a readable silhouette | Responsive directional movement; ground-distance-driven stride; a quick turn without rotating every body part together | Review straight running, stops, reversals and circles in all eight views; planted feet must not slide |
| Strikes involve the body and a short forward step | A modest collision-resolved sword step during the active cut; load through hips and shoulders, then settle into support | No movement through walls, table legs or targets; no attack teleport; ground contact remains legible |
| A very quick cut sits between a readable load and recovery | Tune light sword phases around 60–90 ms load, 60–90 ms active sweep, 120–180 ms recovery, then adjust by actual gameplay feel | Hit timing, blade pose and trail must agree; whiffs retain recovery; movement remains controllable |
| Bright yellow-white crescent appears on the blade's sweep | A short-lived tapered pixel crescent tied to the actual sword trajectory, warm outer color and pale leading edge | Single coherent arc in front, diagonal, side and rear views; no permanent glow or circle around the hero |
| White impact star and enemy response make contact obvious (around 1.19 s) | Small contact-local flash and directional recoil; evaluate brief local impact hold rather than freezing the whole co-op session | Misses produce no contact flash; one hit produces one response; allies and other players retain control |
| Alternating attacks remain readable in repeated exchanges (about 2.17 and 6.42 s) | Distinct return cut and stronger finisher; buffer one next attack near recovery | No input-spam stacking, duplicate hits or hitbox detached from the visible sword |
| Cloth and weapon lag behind turning and stopping | Keep existing native cape/gear secondary motion, with restrained follow-through | No detached grips, clipping through the face, or large coat masses hiding the blade |
| Broad warm yellow-green lit areas and cooler green shade | Warm directional key, readable cool ambient fill and coherent soft cast shadows; preserve grouped pixel values | Day, dusk and player-light comparisons; hero and enemies readable in shade without washing out the meadow |
| Lighting depth comes from large masses rather than fine surface noise | Use broad ground/canopy shade groups; retain chunky grass clumps and subdued shadow detail | Compare at gameplay scale; avoid added speckles, blurred sprite edges and expensive full-screen bloom |
| Camera follows without overpowering the action | Restrained follow and capped impact response; maintain the shared-screen party framing | No shake on whiffs; no motion sickness-inducing kick or co-op framing regression |

## Current integration points

`src/combat-animation.mjs` already supplies editable generation-4 wind-up, strike, follow-through and weapon-vector logic. `src/combat-combos.mjs` owns durations and saved custom combo settings. `src/native-locomotion.mjs` and `src/player-motion.mjs` are the current locomotion/rendering path. `src/render.mjs` and `src/world-lighting.mjs` own shared lighting/shadows. Use these paths; do not return to the obsolete character-viewer rig or overwrite `authored/rigs.json` and saved custom clips.

Start with one native hero and sword at gameplay scale, using the actual reference beside a small front/diagonal/profile/rear comparison. Establish timing, foot placement, grip and one clear trail before expanding equipment variants. This is a visual acceptance gate, not satisfied by test counts. Test collision, damage cadence, held/buffered input, local co-op, authored clip preservation and lighting cost separately. Profile against the final 1.2.56 scenes before making performance claims.
