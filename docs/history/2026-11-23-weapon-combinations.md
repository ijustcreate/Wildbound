# Discoverable weapon combinations

Wildbound rewards players for lining up enemies, terrain and elemental effects. The seven discoveries belong to individual explorers. Field Kit → Combos offers a hint first and reveals the technique after the explorer performs it. Discoveries persist in expedition checkpoints and normal character records. Restoring an expedition merges its discoveries with the character record before play resumes.

| Discovery | What happens |
| --- | --- |
| Flame Arrow | A normal arrow crossing a campfire, another eligible flame or a teammate's held torch gains a visible ember trail, 15 percent more contact damage and a short burn. The shot can scorch nearby grass or ignite eligible trees on impact. Low shots cool in water. |
| Ice Shatter | A heavy melee hit consumes natural or magical freeze and deals extra damage. Up to four nearby enemies take splinter damage and briefly freeze, which sets up another heavy hit. Walls, elevation and allegiance still matter. |
| Enemy Bowling | A heavy strike launches a surviving, grounded enemy in the direction of the swing. A second enemy takes collision damage and carries some of the momentum. |
| Chain Reaction | The second enemy can hit a third. Momentum and damage drop with each collision. |
| Fire Bowling | A burning enemy can pass the fire to the next enemy it hits. A lit arrow can start the whole sequence. |
| Wall Slam | Colliding with solid scenery stops the slide and adds impact damage. Geometry blocks hits on the far side. |
| Trap Bowling | A thrown enemy crossing an armed capture or interrupt trap triggers the trap's normal result. A teammate can set the trap, and the explorer who lands the launch gets discovery credit. |

Charged ice spells reliably freeze ordinary enemies for 2.4 seconds and bosses for 1.2 seconds. Light attacks preserve the freeze. Shatter adds 65 percent damage within 4–46 points for ordinary targets and 25 percent within 1–25 points for bosses. The shard burst freezes ordinary targets for 1.25 seconds and bosses for 0.65 seconds. A small grace window keeps one broad swing from repeatedly shattering its own new frost. Jungle vines can remain in place after the ice breaks.

Momentum uses real actor collision in steps of at most three world units. Bosses, rooted or immobile actors, airborne enemies and peaceful or owned creatures are excluded from launches. A sequence transfers momentum through at most two body impacts. Temporary impulse and trap tracking live outside the save data. The new effects reuse the native game and editable particle systems. Ordinary arrow inventory and recovery still use the same item.

The earlier charged-attack test now advances the game until the enemy has moved. The sword-lane fixtures isolate their original reach and single-hit checks from ice shatter and enemy bowling. New focused tests cover the actual fire and ice projectile paths, shatter limits, trap credit, wall occlusion, collision limits, ally protection and saved discoveries.

Checkout `C:/Users/New User/Desktop/Wildbound` on `Wildbound_worlds`, origin `https://github.com/ijustcreate/Wildbound.git`, base `f0b787ff33c3ac8f3675b48504937ebda4f0dcb5` plus existing modified work. This pass uses isolated profiles and mutes every Electron test window before loading. The shared authored rig file was not edited by this pass. No commit or publication.

## Desktop verification

All 17 dedicated tests passed. The persistence suite passed 12 checks, including the two discovery tests. A muted Electron game passed 12 scripted combat checks, including a single sequence from campfire arrow to three-enemy fire spread, a solid house wall, a real trap and a save/reload of all seven discoveries. A second muted Electron run passed 17 guide checks with simulated Xbox and Switch input, split-screen ownership and a 650-pixel window. Hardware controller feel and extended balance testing are outside the automated results.

The normal 1.2.111 launcher selected `C:\Users\New User\Desktop\Wildbound\dist\1.2.111-2026-11-23T18-16-59-602Z\Wildbound-win32-x64\Wildbound.exe`. The manifest records base commit `f0b787ff33c3ac8f3675b48504937ebda4f0dcb5`, modified source, build stamp `2026-11-23T18:20:33.886Z` and `preview: false`. All 17 checked runtime files match the working checkout, including the authored rigs, the menu and the profile integration. The actual executable booted into the lobby with zero renderer errors using a muted, isolated test profile. All 12 combat checks and 17 guide checks passed against that package with zero renderer errors.

`C:\Users\New User\Desktop\Wildbound Worlds (1.2.111).lnk` targets `C:\Users\New User\Desktop\Wildbound\Play Wildbound.cmd` with blank arguments and the repository icon. The shortcut was already configured for the normal save profile. `Play Wildbound.cmd --check` selected the executable above. Reports and file hashes are under `test-output/weapon-combos`.

The standard rebuild attempt returned 2,179 passes and 14 failed results on the changing checkout. Focused reruns passed for the buyback message, Nintendo labels, headwear catalog size, the eight sword-lane fixtures and the archer check. The older run includes the pre-correction sword fixtures. The necromancer worker stalled and was stopped, and a TV World starter-chest test reported a lobby fixture error. The launcher package came from a separate build in the shared checkout and was checked directly. The follow-up below records the repairs and new verification.

## Follow-up on the 14 failures

- The buyback, controller label and headwear checks now match the current game. The eight sword-lane cases hold the targets in place with vines so the assertions isolate the sword’s reach and hit count from the shatter burst. All 11 cases passed in a fresh focused run.
- The archer fixture initializes its quiver and gives each negative case an independently verified lane. Death, room, range and wall checks each exercise their intended restriction. All 17 house and arrow-supply tests passed.
- A summoned skeleton inherited the necromancer’s live summon windup and could complete it during the same update. Each summon now starts with its own combat state. The summon also checks that its caller is a living necromancer, which protects sessions with inherited windup state. All four necromancer tests passed, including the formerly stalled encounter.
- The TV World transition now applies the arena controller mapping separately from rendering its optional guide. The original starter-chest coverage still checks both restocking and custom deposits. All 52 related tests passed. A muted Electron run moved two players into Mossroot Coliseum and rendered the guide without renderer errors.

The isolated rebuild sweep ran 2,211 tests. It passed 2,209 and found two older fixture expectations. The tactics test now checks that melee and ranged enemies share one offensive opening. The outer-region test keeps the original ordinary-scenery cap and independently checks the Shadow Realm thicket budget and region unloading. All 20 tests in both files passed when rerun against the same unchanged snapshot runtime. The snapshot package checked 957 runtime files and produced a normal 1.2.111 build at `test-output/weapon-combos/repair-snapshot/dist/1.2.111-2026-11-23T18-58-22-463Z/Wildbound-win32-x64/Wildbound.exe`. It passed the executable boot and all 29 combo and guide checks in muted Electron. Its manifest records build stamp `2026-11-23T19:03:53.121Z` and the modified checkout at `f0b787ff33c3ac8f3675b48504937ebda4f0dcb5`.

The shared desktop advanced to 1.2.112 during the follow-up. The launcher-selected build at the end was `C:\Users\New User\Desktop\Wildbound\dist\1.2.112-2026-11-23T18-56-01-206Z\Wildbound-win32-x64\Wildbound.exe`. It passed 18 regressions against its packaged modules, covering all 14 original failures, both updated fixtures and the additional necromancer coverage. Its actual executable booted a muted lobby, and all 12 combo and 17 guide checks passed with zero renderer errors. Controller inputs were simulated. The manifest stayed identical through both checks and the final launcher selection. It records normal mode, build stamp `2026-11-23T19:07:29.14785Z`, modified source and the same base commit.

`C:\Users\New User\Desktop\Wildbound Worlds (1.2.112).lnk` targets `C:\Users\New User\Desktop\Wildbound\Play Wildbound.cmd` with blank arguments, the repository working directory and the Wildbound icon. The verified package uses the normal save profile. Rebuild, retest and launcher receipts are under `test-output/weapon-combos`, including `repair-build-receipt.json` and the `repair-final` reports. No commit or push.
