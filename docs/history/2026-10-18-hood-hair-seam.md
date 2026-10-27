# Hair gap inside hood opening

Real Worlds checkout: Desktop/Wildbound Server Branch Build, Wildbound_worlds,
modified source on 1bd5ef027966. Retains all preceding 1.2.35 updates.

The generic covered-hair clip started at skull y=-4, while the hood's side and
diagonal opening extends above it. That cut off the hair behind the upper lip,
showing a small background strip. Covered hair now includes the hood's actual
opening polygon above y=-4; ordinary caps/helmets retain their original band.
The shared opening mask also keeps taller hair from escaping the hood silhouette.
The user's subsequent marked preview showed this clip-only fix was insufficient:
short hair still left clear pixels above the skull and the rear torso neck could
overpaint the hood. A skull-local dark cloth lining now fills the actual opening
BEFORE the face/hair; rear native/sculpted neck sections use hood cloth instead
of skin, while front necks and authored wearable overrides are preserved.
Headwear cache revision is 6. The assembled sheet remains a review sample,
not a claim of user-approved replacement art.
Hair still draws before the hood, so its crown
and outside outline do not change. No replacement art, new hair shape, rig edit
or saved wearable/hair transform was applied. Authored overrides remain intact.

Tests cover hood versus ordinary-hat clipping plus existing headwear/glasses
and native hair contracts. Muted isolated Electron verify-hood-hair.cjs renders
eight directions in idle/run/fallen poses and checks full idle/walk/run/attack/
draw/death cycles for three representative hoods. Before/after screenshots:
test-output/hood-hair. Desktop rebuild log: test-output/hood-hair-build.log.
No personal saves or drafts changed; no commit or push requested.
