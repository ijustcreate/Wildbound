# Scruffbeak Wowhead motion audit — transfer held

No runtime motion was changed. The supplied Wowhead reference is the exact source model for Scruffbeak, but the available evidence was not enough to select and retarget its flight and attack clips safely in this pass.

## Verified source

- User reference: [Wowhead NPC 253399 / Scruffbeak](https://www.wowhead.com/npc=253399/scruffbeak#modelviewer).
- Current roster map: NPC **253399** → display **141693** → model/FileDataID **6674327** (`test-output/wow-motion-audit/roster-model-map.csv`, `cdn-model-map.csv`). CDN metadata `https://wow.zamimg.com/modelviewer/live/meta/npc/141693.json` resolves `Model: 6674327`.
- The local source `test-output/wow-motion-audit/6674327.m2` parses with the project reader as **127 bones / 96 sequence rows**. Wowhead M2 sequence rows store numeric animation IDs, durations, variants and aliases, not human-readable labels. The exact ID set includes standard IDs 0 (Stand), 4 (Walk), 5 (Run), and 16 (AttackUnarmed), plus numerous nonstandard IDs and aliases. It does not contain standard animation IDs 46/47 (FlyIdle/Fly).
- AFID maps several nonstandard IDs to external animation files. Those IDs may have relevant motion, but their intended names/actions have not been confirmed from playback. The dedicated skill inspector currently rejects this model format; the project's parser can read its embedded tracks.
- Four original Wowhead Stand captures are available: `test-output/modelviewer-references/253399-scruffbeak-browser-stand-{front,side,rear,opposite}.png`. Existing eight-facing Wildbound artwork preview is `test-output/creature-art-review/eldritch-winged-pass/flying_raptor-before.png`.

## Hold reason

Sequence IDs alone do not establish that the nonstandard clips are flight, dive, or attack. The existing captures show only Stand, and the numeric M2 bone indices have not been validated against Scruffbeak's moving wing, tail, and leg anatomy in those candidate clips. Guessing clip labels or using a generic bird mapping risks reintroducing the wrong animations the user reported. Leave the current native clips/routing intact until candidate clips can be selected in the Wowhead animation picker and their assembled eight-facing poses can be checked against the Wildbound rig.

## Follow-up evidence needed

Capture the Wowhead picker labels and playback for one flying/wing-flap loop, one grounded locomotion loop if present, and its attack/dive. Resolve the matching sequence indices and AFID records, then map wing roots/tips/fingers, body, tail and feet from actual pose samples before adding routing. No transfer or visual approval is claimed here.
