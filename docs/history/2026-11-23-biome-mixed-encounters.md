# Natural biome mixed encounters

Request: bring coordinated mixed groups into normal encounters, give each biome its own combinations, scale pressure fairly for solo/co-op, and preserve clean ground visuals.

## Behavior

Twenty positive-weight native cards are appended after the existing encounter roster: two each for forest, desert, ice, house, temple, graveyard, beach, swamp, caverns and shadow. Existing event indices and authored layout introductions are preserved. These are normal random-picker cards, not developer-only demonstrations.

The saved variety director promotes an eligible mixed card after three local ordinary/elite combat cards. Counts still rotate between profiles; a non-mixed card separates successive new mixed cards where the pool permits. Ordinary/discovery/peaceful coverage, time/biome/habitat restrictions, explicit world-pack event filters and user-edited stats remain authoritative. Missing native cards are appended when older saved definition packs load, preserving edited cards and their order.

Wild Lands resolves the roller's actual terrain region and active cavern/shadow room rather than its persistent forest world setting. The game world itself is not rewritten. Diagon Alley remains excluded from these patrols. Deep-water placement searches around the party in large worlds and stays within 650 world units; crocodiles still require genuine deep water.

Early solo receives two different enemy kinds; later solo receives three. Nearby co-op adds weaker frontline members to reach three/four/five early bodies or four/five/six later bodies for two/three/four nearby explorers. The group caps at six even for larger parties. Health and damage remain authored per member, rather than multiplying with party size. Additional members do not duplicate the shield or healer.

Only living, available explorers within 520 units and on the same floor contribute to the count. Distant, downed, disconnected, unavailable, spectator, room-bound and menu-bound explorers do not raise this encounter's pressure. Existing hostile pressure within 650 units reduces the group, never to a one-species fragment. Solo/duo get no fresh mixed group on top of a local boss. Major weather, nearby volcanoes and stampedes cap incoming mixed groups at two. Ordinary random waves also respect the local budget while mixed/layout/role enemies remain unresolved.

A whole arrival is preflighted before consuming the card: open terrain, appropriate habitat, separation from other actors, at least 180 units from every living exterior explorer, and at most 650 units from the encounter anchor. Members approach from a shared sector with offsets; they face the anchor and receive staggered readiness/cooldown clocks. Native pack and ordinary casters honor the safe arrival hold. If no safe placement fits, the spawn fails without consuming the card or leaving a fragment.

Pack initialization is dispatched per species, so a mixed crab/deckhand group does not accidentally turn every member into crab AI. Mixed groups use the existing shared turn scheduler and individual native tells/openings. They add no walls, circles, particles, floor decorations or waiting indicators. Scenery is unchanged by these spawns. A missing palmBase import discovered in the cross-biome render review was repaired without changing the artwork.

## Checks and limits

- Source desktop review: 40 real encounters, both profiles in all ten generated biome maps, early solo and later four-player compositions. Original source review passed 600 checks. The final packaged review adds bounded arrival-distance checks and passed **640/640** checks with no renderer errors, across all 40 cases.
- Focused release suite: 78/78 pass across biome policy/runtime, regular director coverage, authored layouts, starting areas, role combat and shared coordination. Actual Wild Lands ice and swamp-water selection/spawning are included.
- Additional legacy-definition migration regression passed: all twenty cards appear without replacing an edited old card.
- A concurrent authored-layout feature deliberately introduces certain forest encounters once. The general opener-variety regression now marks those introductions seen before testing the random director; the authored-layout suite verifies the introductions separately.
- Native encounter simulations advance AI directly and discard old projectile effects. They verify scheduling, rendering and spawn logic, not full fight DPS, player movement skill, hardware controllers or FPS. Individual projectile/target validity has existing regression coverage. No clean full-repository-suite claim.
- Tests run in muted isolated Electron profiles and do not change player audio settings, authored rigs, personal characters, houses or drafts.

## Desktop snapshot

Branch `Wildbound_worlds`, origin `https://github.com/ijustcreate/Wildbound.git`, base `f0b787ff33c3ac8f3675b48504937ebda4f0dcb5`, extensive modified source. No commit/push. Authored rig hash observed: `280FBAC82256AA65C7CDFDEA14834913964003B2823B192E49566E629FE30A41`.

Canonical packaging passed 981 runtime syntax checks and produced normal desktop 1.2.113. Final placement, migration, rendering and concurrent runtime dependencies were finalized into that newly created package with syntax checks and SHA-256 records in the build manifest. The first copied snapshot missed a concurrently added train-layer module. The packaged import graph was completed (964 modules checked), then the final native review and actual executable boot passed. `wildbound-build.json` records SHA-256 entries for runtime/assets synchronized after the canonical copy and the train-layer dependency finalization.

Exact verified package: `dist/1.2.113-2026-11-23T19-28-24-485Z/Wildbound-win32-x64/`, finalized builtAt `2026-11-23T19:51:08.782873Z`, base `f0b787ff33c3ac8f3675b48504937ebda4f0dcb5`, `sourceDirty: true`, `preview: false`. This is a tested modified-source snapshot, not a claim to include later concurrent edits.

Final packaged checks: **796/796 pass**, zero renderer errors: biome encounters 640, full enemy roster/eight-direction art/rail warnings 105, sword polish 35, live Crossfire/shared pressure 16. Reports and screenshots use stage `packaged-final-biomes` under their respective `test-output/` categories. Earlier failed/intermediate stages are superseded by this release stage. The actual packaged EXE `--boot-smoke-test --mute-audio --software-rendering` exited 0: ready lobby, Worlds present, no boot or renderer errors.

Normal launcher: `C:/Users/New User/Desktop/Wildbound/Play Wildbound.cmd`. Desktop shortcut: `C:/Users/New User/Desktop/Wildbound Worlds (1.2.113).lnk`, target the launcher, blank arguments, repository working directory, `assets/wildbound-icon.ico`. `Play Wildbound.cmd --check` selected the exact verified package. Normal save profile, not `--preview`.

All encounter integration files were compared with the tested package; final results and concurrent source drift are in `test-output/biome-encounter-package-files.json`. Authored rigs match. No commit or push.

## Biome combinations

Solo introductions use the first two members; the third joins later or with nearby co-op. Extra co-op members use the biome's lighter frontline creatures.

| Biome | Encounter | Native core members |
| --- | --- | --- |
| forest | Brambleline patrol | skeleton (shield), archer (archer), boar (charger) |
| forest | Hunters of the fern trail | wolf, vine, snake |
| desert | Embers behind the carapace | beetle, fire_elemental, scorpion |
| desert | The dune salvage crew | skeleton (shield), archer (archer), tarantula |
| ice | Hunters of the white drift | wolf, water_elemental, white_lion |
| ice | The frostbound watch | skeleton (shield), archer (archer), skeleton_wizard |
| house | The unquiet armory | skeleton (shield), archer (archer), skeleton_unarmed |
| house | Rustling in the rafters | beetle, imp, spider |
| temple | The shrine sentries | golem, archer (archer), skeleton_caster |
| temple | Raiders of the hanging roots | monkey, vine, tiger |
| graveyard | The gravewatch detail | skeleton (shield), archer (archer), zombie |
| graveyard | The candlelit coven | skeleton_unarmed, ghost, skeleton_caster |
| beach | The tideguard skirmish | shore_goblin (melee), water_elemental, shore_goblin (healer) |
| beach | Shellbreakers on the strand | crab, skeleton_deckhand, scorpion |
| swamp | Hunters of the reedbank | crocodile, spore, snake |
| swamp | The bog lantern escort | skeleton (shield), water_elemental, zombie |
| caverns | The crystal sentries | crystal_golem, arcane_eye, bat |
| caverns | Fangs beneath the shelf | cave_monster, eye_tentacle, beetle |
| shadow | The veilwood hunters | forest_golem, watcher, ghost |
| shadow | The thornlight court | evil_hand, enchanted_book, spore |

Post-validation integration-file drift: []. Authored rigs match: True. The earlier broader comparison observed concurrent `src/train-world-art.mjs` edits after its copy; the tested package retains its verified snapshot.
