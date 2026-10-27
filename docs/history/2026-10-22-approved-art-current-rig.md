# Approved face/hair port to the current Worlds rig

The prior art pass targeted the wrong checkout: COdex SHell/wildbound-character-viewer,
main, version 1.2.35. The current game is Desktop/Wildbound Server Branch Build,
branch Wildbound_worlds, version 1.2.54, base commit
1bd5ef027966e371f21cd0956b96b0aa4a62144b with pre-existing modified source.
The user accepted the face/hair appearance and requested correction of that target.

## Integration

- Ported approved face/hair drawing data into hero-approved-art.mjs and
  hero-hair-native.mjs. No old rig, joint definitions, posture builder or clip
  migration was copied into the current project.
- The existing Captain-derived native player, its action library, head baseScale,
  torso/limbs, gear, new creator carousel and controller flow remain in place.
- Separate head shape / ears / facial expression passes remain separate. Current
  independent facial hair, glasses, hood openings and custom hair construction
  controls are retained. Explicit custom construction recipes retain their
  current renderer; unmodified hairstyle choices use the approved contours.
- Current nape/accessory layer is retained. Front rear-lock layers sit behind
  the torso; rear contours paint over it. Skull and headwear order constraints
  protect against the neck/skull repainting over rear hair. Top knot now has a
  wider, filled connection to the crown.
- Existing custom wearable and bone-sprite overrides keep priority. Raster cache
  is bounded and native art revision is included in current world cache keys.

## Preservation

The authored/rigs.json SHA256 before and after the port is:
dc05411b47f02259be95ea0ed22aea375d76f79b55d7f0bdec57da5df7ed7d71.
No authored rigs, animation keys, personal saves or profile choices were rewritten.
Earlier local work and older running executables are preserved.

## Verification

- Focused native-rig, hair-design, facial anchors, creator, saved layer order and
  gear placement tests pass.
- Silent isolated Electron renders all 19 hairstyles in eight directions over
  six pose families, full walk/run strips, aim/attack/jump/fallen poses and fitted
  gear. It confirms nativeHumanoidRevision=1 and unchanged rig data during drawing.
- Current creator carousel passes controller ownership/rotation and three viewport
  checks. Inventory sizing passes at heights 850, 600 and 420. Glasses/headgear
  checks pass for 23 head items in eight directions with 184 editable captures.
- Assembled sheets and machine reports: test-output/approved-art-current/.

Full rebuild: **1,505 tests pass, zero failures**; 402 runtime files pass syntax
checks. The current branch's normal rebuild gate succeeded without bypasses.

Installed timestamped build:
`dist/1.2.54-2026-10-22T20-40-10-133Z/Wildbound-win32-x64/Wildbound.exe`.
Desktop `Wildbound Worlds (1.2.54).lnk` targets this checkout's `Play Wildbound.cmd`,
which selects that timestamped build with the normal profile. Older packages and
running sessions were retained. No commit/push or hosted viewer update requested.

Final package checks: **1,025 files match source, zero mismatches**. Actual
packaged executable boot smoke reports ready in the lobby, Worlds enabled,
zero failures/errors and an isolated muted test profile. The art sweep and
current carousel/controller/viewport checks also pass against packaged resources.
Build manifest time: 2026-10-22T20:40:18.413Z, modified source on the commit above.

The obsolete desktop `Wildbound Latest (1.2.35).lnk` from the mistaken pass was
archived reversibly under test-output/approved-art-current/. The correct desktop
Worlds shortcut is verified. A receiving user should launch the current Worlds
shortcut; an already-open old executable cannot pick up new renderer files.
