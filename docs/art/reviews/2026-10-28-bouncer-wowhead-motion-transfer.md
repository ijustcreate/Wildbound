# Bouncer / jumping spider motion transfer

**Status:** Stand, Walk, and Run from the requested donor are integrated. The eight-leg pixel art and Wildbound rig remain editable; Bouncer's authored pounce behavior and no-web design remain intact.

## Donor and mapping

- Wowhead NPC 222532 Bouncer; display 119179; FileDataID 5752188.
- Source M2: `https://wow.zamimg.com/modelviewer/live/m2/5752188.m2`.
- Reviewed local source SHA-256: `2f077991b5fa2d92816558b88b78bdea6f8a3fe3d45afc729453c07b28a3dc1b`.
- Verified M2 v274, 81 bones, 14 sequences. Stand is sequence index 4 / animation ID 0; Walk index 0 / ID 4; Run index 1 / ID 5. The selected clips are non-alias tracks.
- Source forward `+X`, left `-Y`, up `+Z` maps to native `[Y,X,Z] × 10`. Root drift is removed. The four left leg chains map source roots `[8,7,6,5]` and endpoints `[37,36,35,34]` to native legs `0..3 L`; right roots `[11,10,12,9]` and endpoints `[41,40,39,38]` map to legs `0..3 R`. Intermediate segments map to source bones 14–21.
- The source Run can put a terminal foot endpoint 4.70883 native units below the target floor. The importer clamps only foot endpoint Z deltas to the native floor plane. Other body and leg tracks stay donor-derived; no root or body lift is introduced.

## Assembled preview and verification

Muted Electron captures show all eight facings at 0%, 25%, 50%, and 75% for each clip:

- `test-output/bouncer-wowhead-motion-transfer/idle-eight-facings.png`
- `test-output/bouncer-wowhead-motion-transfer/walk-eight-facings.png`
- `test-output/bouncer-wowhead-motion-transfer/run-eight-facings.png`

Capture completed with `audioMuted: true` and zero renderer errors. The compact gait reads consistently across front, side, and rear facings; the foot endpoint clamp prevents floor dips. It was reviewed through the native pixel renderer, not as a mesh or in an interactive hardware play session.

Focused automated checks: `node --test tests/creature-packs/bouncer-wow-motion.test.mjs` passed **3/3**. They cover donor provenance, eight-facing finite rendering, foot floor clearance across every sampled frame, locomotion routing, preservation of native pounce/bite/windup/recovery, and `webs: false`.

## Runtime changes

- `src/bouncer-wow-motion-data.mjs` contains generated joint-offset clips and donor metadata only. The donor model/texture is not shipped.
- Bouncer defaults apply the donor idle/walk/run clips. Slow and fast locomotion route to Walk and Run respectively.
- Native windup, pounce, bite, recovery, hurt, and death clips remain available. The encounter remains a tiger/lion-style ambush hunter, with no web logic enabled.

Desktop packaging and interactive playtesting were not performed by this subtask.
