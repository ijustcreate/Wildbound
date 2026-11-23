# Enemy roster and railway combat warnings

Request: extend the logic/animation pass to the remaining enemies with distinct attacks, reactions and openings; keep ground visuals clean and fix warnings hidden under railway tracks.

## Implementation

The explicit combat catalog covers all 96 hostile creature kinds plus territorial triceratops. It names species attacks, opening advice, recovery bonuses and stagger resistance. This is a roster contract, not a claim that every existing bespoke AI was replaced.

Twenty-one older shared-contact species now use timed preparation, committed attacks and finite recovery: lions/tigers/white lions, boar, crocodile, snake, bat/wasp/tsetse, beetle/monkey, ordinary skeleton/unarmed/boss/Krampus, archer, fire/water elementals and three support casters. Sword enemies link alternating cuts and a slower finisher. Archers draw before firing, retain finite ammunition/retrieval and avoid ally lanes. Support spells resolve only after a valid uninterrupted channel. Front guards, heavy interrupts, wall misses and recovery damage vary by species. Edited AI, allies and Crossfire roles retain ownership.

Twelve eldritch species now resolve locked beams, lashes, swept dives, cones, bursts or a ground impact after visible preparation; sidestepping after direction lock matters. Status effects require actual damage. Other bespoke controllers retain their existing attacks, with shared semantic phase/opening/reaction adapters. Construct aim locks late, wolves commit bite direction, panther damage aligns with its contact pose, golem throws retain aim, hive brood release exposes recovery. Dragon and beholder recovery termination bugs are fixed.

Ordinary melee damage now waits until 30 percent of its active clip. Native animation sampling follows real phase duration, picks species clips and avoids overwriting authored clips or explicit studio poses. Baby spider resolves the spider rig in ordinary and direct preview paths. Internally sampled spider/beetle frames still use bounded caches. No authored rigs were written by this pass.

Danger footprints use one faint fill and a thin outline. Repeated decorative warmup pulses were removed. Railway rendering now paints base ground/water interactions first, all main and crossing rails second, combat warnings and on-foot sword lanes next, then cars/actors. Swimmers and water effects remain below bridges; train body/roof depth remains authoritative.

## Verification

- Final-source muted isolated Electron: 105 checks, all 96 hostile kinds, three phases in eight directions, editable clip preservation, native main/crossing rails and charged sword lane. No renderer errors. Family/eight-direction boards and railway screenshots: `test-output/enemy-roster/final-source/`.
- Current focused roster/house/hold-sword regression run: 67/67 pass (including all eight sword flank directions, capture on arrival and archer target validity).
- Earlier full root suite was stopped after identifying failures while concurrent edits were landing. It is not a clean full-suite result. It reported merchant wording, creator labels, head-art checks and timing/attack failures; current targeted combat reruns supersede the old attack results. No claim of hardware/controller or FPS playtesting.
- Final roster contract suite: 41/41 pass, including active-pose contact timing. Other focused enemy/train regressions: 113/113 pass. Together with the distinct house/hold-sword cases, 181 unique focused tests pass. Packaged checks: roster 105/105, sword polish 35/35, Crossfire roles/shared pressure 16/16. All 156 muted native checks pass with no renderer errors.

## Checkout and desktop

Branch `Wildbound_worlds`, origin `https://github.com/ijustcreate/Wildbound.git`, base `f0b787ff33c3ac8f3675b48504937ebda4f0dcb5`, extensive concurrent modified source. No commit or push. Local saves, authored rigs and drafts preserved. Authored rig hash observed during this pass: `280FBAC82256AA65C7CDFDEA14834913964003B2823B192E49566E629FE30A41`.

Canonical `node scripts/package.cjs` passed all 953 runtime syntax checks and created normal desktop **1.2.111**. The shared checkout version advanced during the build; the package manifest and launcher agree.

Verified package: `dist/1.2.111-2026-11-23T18-16-59-602Z/Wildbound-win32-x64/`, built `2026-11-23T18:20:33.886Z`, base commit `f0b787ff33c3ac8f3675b48504937ebda4f0dcb5`, **modified tracked source**, `preview: false`.

Actual packaged `Wildbound.exe --boot-smoke-test --mute-audio --software-rendering` exited 0: ready lobby, Worlds available, no renderer/boot errors. Temporary isolated test profile; the player's saves/settings were not changed.

Normal launcher: `C:/Users/New User/Desktop/Wildbound/Play Wildbound.cmd`. Desktop shortcut `C:/Users/New User/Desktop/Wildbound Worlds (1.2.111).lnk` targets that launcher, blank arguments, working directory the repository root, icon `assets/wildbound-icon.ico`. `Play Wildbound.cmd --check` selected the exact package above. Blank arguments use the normal save profile, not `--preview`.

Snapshot limit: 20/20 enemy-pass runtime files and authored rigs match the package byte for byte. A broader 954-file comparison found a concurrently changed `src/shadow-forest-layout.mjs` and newly created `src/shadow-thickets.mjs` after the package snapshot; this package retains the earlier Shadow Realm snapshot. It is not claimed to contain every latest concurrent edit. Receipt: `test-output/enemy-roster-package-files.json`. Native reports/images are under the `packaged-enemy-roster` stages of `test-output/enemy-roster/`, `test-output/sword-polish/` and `test-output/combat-tactics/`.

## Species contracts

Existing bespoke attacks are preserved unless identified above. The ledger describes their attack identity and intended opening.

| Kind | Attack | Opening | Recovery bonus | Pressure |
| --- | --- | --- | --- | --- |
| lion | springing pounce | Evade the committed leap; punish the landing. | 1.22 | 1 |
| tiger | crossing rake | Evade the committed leap; punish the landing. | 1.22 | 1 |
| white_lion | long snowbound leap | Evade the committed leap; punish the landing. | 1.22 | 1 |
| panther | stalk, pounce and alternating claws | Evade the committed leap; punish the landing. | 1.22 | 1 |
| snow_leopard | crouched flank pounce | Evade the committed leap; punish the landing. | 1.22 | 1 |
| wolf | pack lunge | Evade the committed leap; punish the landing. | 1.22 | 1 |
| murk_wolf | shadow pack bite | Evade the committed leap; punish the landing. | 1.22 | 1 |
| dreadmane_lion | roar and committed rush | Evade the committed leap; punish the landing. | 1.22 | 1 |
| night_stalker | shadow ambush | Evade the committed leap; punish the landing. | 1.22 | 1 |
| carrion_pack | scavenger pack rush | Evade the committed leap; punish the landing. | 1.22 | 1 |
| werewolf | leap and claw chain | Evade the committed leap; punish the landing. | 1.22 | 1 |
| fox | darting bite | Evade the committed leap; punish the landing. | 1.22 | 1 |
| arctic_fox | warning snap | Evade the committed leap; punish the landing. | 1.22 | 1 |
| crocodile | short jaw surge | Sidestep the drive; punish its braking turn. | 1.35 | 1 |
| boar | straight tusk rush | Sidestep the drive; punish its braking turn. | 1.28 | 1 |
| rhino | horn charge | Sidestep the drive; punish its braking turn. | 1.28 | 1 |
| elephant | heavy trunk strike | Sidestep the drive; punish its braking turn. | 1.28 | 1 |
| zebra | hind-leg kick | Sidestep the drive; punish its braking turn. | 1.28 | 1 |
| triceratops | territorial horn drive | Sidestep the drive; punish its braking turn. | 1.28 | 1 |
| snake | coiled needle strike | Step across the locked strike; attack the uncoiling body. | 1.25 | 1 |
| anaconda | body sweep and constriction | Step across the locked strike; attack the uncoiling body. | 1.24 | 1 |
| burrower | burrowing emergence bite | Step across the locked strike; attack the uncoiling body. | 1.24 | 1 |
| bat | passing wing dive | Let the pass or sting miss; catch the turn or lowered tail. | 1.15 | 1 |
| raven | swoop and peel-away | Let the pass or sting miss; catch the turn or lowered tail. | 1.18 | 1 |
| crow | circling peck | Let the pass or sting miss; catch the turn or lowered tail. | 1.18 | 1 |
| beetle | braced mandible bite | Let the pass or sting miss; catch the turn or lowered tail. | 1.18 | 0.65 |
| wasp | sting-and-pass | Let the pass or sting miss; catch the turn or lowered tail. | 1.2 | 1 |
| bee | hive-defense sting | Let the pass or sting miss; catch the turn or lowered tail. | 1.18 | 1 |
| tsetse | sleeping dart dive | Let the pass or sting miss; catch the turn or lowered tail. | 1.18 | 1 |
| scorpion | raised-tail sting | Let the pass or sting miss; catch the turn or lowered tail. | 1.18 | 1 |
| jumping_spider | committed jumping bite | Let the pass or sting miss; catch the turn or lowered tail. | 1.18 | 1 |
| spider | web hunt and fanged lunge | Let the pass or sting miss; catch the turn or lowered tail. | 1.18 | 1 |
| tarantula | heavy web bite | Let the pass or sting miss; catch the turn or lowered tail. | 1.18 | 1 |
| baby_spider | short skitter bite | Let the pass or sting miss; catch the turn or lowered tail. | 1.18 | 1 |
| crab | sideways pincer snap | Let the pass or sting miss; catch the turn or lowered tail. | 1.18 | 1 |
| pelican | passing beak swoop | Let the pass or sting miss; catch the turn or lowered tail. | 1.18 | 1 |
| great_owl | talon pass | Let the pass or sting miss; catch the turn or lowered tail. | 1.18 | 1 |
| flying_raptor | locked diving slash | Let the pass or sting miss; catch the turn or lowered tail. | 1.18 | 1 |
| vine | rooted forward lash | Bait the lash or burst, then close while the plant resets. | 1.3 | 1 |
| carnivorous_flower | open-jaw bite | Bait the lash or burst, then close while the plant resets. | 1.3 | 1 |
| mimic_vine | disguised grab | Bait the lash or burst, then close while the plant resets. | 1.3 | 1 |
| poison_pod | poison burst | Bait the lash or burst, then close while the plant resets. | 1.3 | 1 |
| tree_ent | branch slam | Bait the lash or burst, then close while the plant resets. | 1.35 | 0.55 |
| spore | rooted spore eruption | Bait the lash or burst, then close while the plant resets. | 1.25 | 1.4 |
| forest_golem | root snare | Bait the lash or burst, then close while the plant resets. | 1.3 | 0.65 |
| skeleton | measured sword cut | Step outside the weapon arc and punish the follow-through. | 1.2 | 1 |
| skeleton_unarmed | left-right fist chain | Step outside the weapon arc and punish the follow-through. | 1.15 | 1 |
| skeleton_boss | guarded heavy cut | Step outside the weapon arc and punish the follow-through. | 1.22 | 1 |
| krampus | whip crack | Step outside the weapon arc and punish the follow-through. | 1.2 | 1 |
| zombie | dragging grab | Step outside the weapon arc and punish the follow-through. | 1.2 | 0.7 |
| monkey | snatch and escape | Step outside the weapon arc and punish the follow-through. | 1.2 | 1 |
| gorilla | fist slam | Step outside the weapon arc and punish the follow-through. | 1.2 | 1 |
| hunter | tracking weapon strike | Step outside the weapon arc and punish the follow-through. | 1.2 | 1 |
| shore_goblin | sand-side slash | Step outside the weapon arc and punish the follow-through. | 1.2 | 1 |
| oathless_captain | bash and boarding rush | Step outside the weapon arc and punish the follow-through. | 1.2 | 1 |
| grim_reaper | scythe sweep and drain | Step outside the weapon arc and punish the follow-through. | 1.2 | 1 |
| evil_hand | finger pounce and grab | Step outside the weapon arc and punish the follow-through. | 1.2 | 1 |
| archangel | radiant guard strike | Step outside the weapon arc and punish the follow-through. | 1.2 | 1 |
| skeleton_deckhand | cutlass slash | Step outside the weapon arc and punish the follow-through. | 1.2 | 1 |
| ogre | committed club slam | Step outside the weapon arc and punish the follow-through. | 1.2 | 0.65 |
| jimothy | sidestep feint | Step outside the weapon arc and punish the follow-through. | 1.2 | 1 |
| enchanted_broom | sweeping pass | Step outside the weapon arc and punish the follow-through. | 1.2 | 1 |
| cave_monster | armored pounce | Step outside the weapon arc and punish the follow-through. | 1.2 | 1 |
| archer | committed bow draw | Interrupt preparation or close during spell recovery. | 1.25 | 1.25 |
| skeleton_caster | healing channel | Interrupt preparation or close during spell recovery. | 1.25 | 1.25 |
| necromancer | summon and heal | Interrupt preparation or close during spell recovery. | 1.3 | 1.25 |
| skeleton_wizard | charged spell volley | Interrupt preparation or close during spell recovery. | 1.25 | 1.25 |
| frost_skeleton_mage | frost channel | Interrupt preparation or close during spell recovery. | 1.25 | 1.25 |
| banshee_queen | frost flight and scream | Interrupt preparation or close during spell recovery. | 1.25 | 1.25 |
| succubus | heart bolt and life drain | Interrupt preparation or close during spell recovery. | 1.25 | 1.25 |
| imp | flying fire shot | Interrupt preparation or close during spell recovery. | 1.25 | 1.25 |
| ghost | phase and spectral swipe | Interrupt preparation or close during spell recovery. | 1.25 | 1.4 |
| beholder | alternating eye rays | Interrupt preparation or close during spell recovery. | 1.25 | 1.25 |
| lesser_beholder | single eye-ray pulse | Interrupt preparation or close during spell recovery. | 1.25 | 1.25 |
| arcane_eye | locked gaze beam | Interrupt preparation or close during spell recovery. | 1.25 | 1.25 |
| watcher | rooting gaze | Interrupt preparation or close during spell recovery. | 1.25 | 1.25 |
| eye_tentacle | anchored long lash | Interrupt preparation or close during spell recovery. | 1.25 | 1.25 |
| jade_tentacle | orbiting linked lash | Interrupt preparation or close during spell recovery. | 1.25 | 1.25 |
| blaise | cinder bolt and trail | Interrupt preparation or close during spell recovery. | 1.25 | 1.25 |
| voodoo_doll | delayed curse | Interrupt preparation or close during spell recovery. | 1.25 | 1.25 |
| enchanted_book | page volley | Interrupt preparation or close during spell recovery. | 1.25 | 1.25 |
| mindflayer | psionic pulse | Interrupt preparation or close during spell recovery. | 1.25 | 1.25 |
| succubus_2 | gliding heart shot | Interrupt preparation or close during spell recovery. | 1.25 | 1.25 |
| golem | raised stone slam | Leave the committed impact area and punish the long reset. | 1.35 | 0.55 |
| crystal_golem | shard burst | Leave the committed impact area and punish the long reset. | 1.32 | 0.45 |
| mana_golem | arc bolt | Leave the committed impact area and punish the long reset. | 1.32 | 0.65 |
| dragon | breath or rear tail sweep | Leave the committed impact area and punish the long reset. | 1.32 | 0.65 |
| butterfly_dragon | held breath fan | Leave the committed impact area and punish the long reset. | 1.32 | 0.65 |
| scorpion_boss | claw and tail sequence | Leave the committed impact area and punish the long reset. | 1.32 | 0.65 |
| fire_elemental | cinder shot and hot wake | Leave the committed impact area and punish the long reset. | 1.18 | 0.65 |
| water_elemental | slow tidal pulse | Leave the committed impact area and punish the long reset. | 1.25 | 0.65 |
| slime | squash and spring | Leave the committed impact area and punish the long reset. | 1.3 | 1.5 |
| squashling | pumpkin body slam | Leave the committed impact area and punish the long reset. | 1.32 | 0.65 |
| gargoyle | stone-wing dive | Leave the committed impact area and punish the long reset. | 1.32 | 0.65 |
| bee_hive | guarded brood release | Clear its defenders before pressuring the source. | 1.1 | 1 |
| spider_egg | hatching brood | Clear its defenders before pressuring the source. | 1.1 | 1 |
| mausoleum | crypt defenders | Clear its defenders before pressuring the source. | 1.1 | 1 |
