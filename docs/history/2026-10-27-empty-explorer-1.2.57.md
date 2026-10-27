# 1.2.57 combined update — empty explorer chooser and native placeholder costume

This follows the scaling fix in 01e8463b0b1588f528e10dfe7d85f6c524ea89e1, before that preparation was published. The final 1.2.57 contains both requests. The scaling-only web folder was retained as dist/web-1.2.57-scaling-only/ and is not published.

## Requested behavior

A brand-new profile with no saved explorers, or a player whose available explorers are all in use by another player, sees the native grey placeholder and exactly two actions: + New character and Close. No No saved explorers row, Delete or Drop from game button is rendered in that state. The empty card is shorter than the normal chooser.

Available saved characters retain the full chooser. If another player releases a character, normal choices and the actual character preview return. The placeholder is never inserted into the character library or granted as player equipment. Creating a character uses the real appearance flow and does not inherit the grey costume.

## Real gear and art contract

Item ID: blank_explorer_costume. Display name: Blank explorer costume. A real chest-slot full costume, zero armor/health bonuses, zero sockets, developer-only and supply-only. The existing dev-console item selector can grant/equip it; normal gear rolls, earned/ordinary victory rewards and the victory fallback exclude developer-only items.

Reference: the user's grey blank-character brief and the existing native player rig. Same proportions, joints, clips and equipment system; no complete-character bitmap or replacement skeleton. Five muted grey values: outline #414b4d, shadow #697476, body #8b9596, light #b1baba, mark #b7c0bf. Simple hairless skull, broad grey body masses and one small face question mark; no eyes, hair, beard or bright equipment decorations. The mark narrows in profile and disappears on rear views. Pose and facing still come from the normal rig.

The costume makes an opaque render-only view of the character without mutating the saved appearance or authored rig. Unequipped gear/custom appearance data remains owned by the player. A small native inventory icon accompanies the item. Source: src/blank-explorer.mjs and the shared gear/body/head render paths. The chooser uses the same actual item through a detached preview record.

## Verification

All 1,518 Node tests pass: test-output/blank-explorer-full-suite.log. Thirty-nine focused gear, face, loot, preview and layout checks pass. The new tests cover developer spawning/equipping, zero stats/sockets, normal gear/victory loot exclusions and isolated placeholder records.

Muted isolated Electron verifies first-use and all-claimed states, exact button sets, release-to-ordinary-chooser transition, creation without costume leakage, actual dev spawning/equipping, eight views and six actions, unchanged authored model and zero renderer errors. Screenshots: test-output/blank-explorer/first-use.png, all-claimed.png, dev-equipped.png and native-costume-review.png. The art is implemented for user review; automated tests do not establish aesthetic approval.

The combined code also passes all 63 resizing/zoom/multiplayer-focus checks with zero renderer errors. The web builder syntax-checks 410 runtime files. Final packaged and live-web checks, exact executable and shortcut identity are recorded in the generated completion receipt under test-output/. Physical controllers were not tested.

The authored/rigs.json SHA-256 remains dc05411b47f02259be95ea0ed22aea375d76f79b55d7f0bdec57da5df7ed7d71. No profiles, local saves, unfinished drafts, sound preferences, system volume or existing rig definitions were replaced.

## Delivery

Current checkout: C:/Users/New User/Desktop/Wildbound, Wildbound_worlds. The source commit containing this note is the combined release. Version remains 1.2.57 because the scaling-only preparation was never published. web-build.json records its real dirty-build baseline and final publishedSourceCommit separately.

Latest web points to releases/1.2.57/ after deployment; original, 1.0.74, 1.2.55 and 1.2.56 remain historical. Desktop shortcut Wildbound Worlds (1.2.57).lnk targets this checkout's Play Wildbound.cmd without --preview, normal save profile. No downloadable release or separate character-viewer Site deployment.
