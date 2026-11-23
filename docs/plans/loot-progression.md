# Wildbound loot progression and gear gaps

## Audit snapshot

The audited registry contained 173 equippable items across hand, armor, accessory, back, and shield slots. This expansion adds nine, bringing it to 182. Existing progression includes starter and common gear, rare iron/ranger/elemental pieces, unique moon/reaper/necromancer pieces, and legendary sun gear. Named boss sets (Reaper, Banshee, Succubus, Necromancer) and zone supply pendants remain separate reward channels.

The gaps were in the award rules more than the item count:

- Enemy gear used a global rarity roll with no regard for enemy strength, region, or what the party already wore.
- Treasure rolls used the same global pool, so a forest cache could hand out late desert, moon, or sun equipment.
- Victory rewards had a second, independent global pool. Their rarity steps skipped uncommon/unique in some paths and could repeat types in ordinary chests.
- The roster is broad in damage and armor, but player-facing support gear is thin: healing has a wand, while caster/healer armor choices and a defensive shield line between starter and endgame are sparse.

## New rules

`src/loot-progression.mjs` is the common selection policy for enemy equipment, board treasure, and victory chests.

| Regions | Maximum ordinary rarity |
| --- | --- |
| Forest, beach, swamp, house | Rare |
| Graveyard, caverns, desert | Unique |
| Ice, Shadow Realm, temple | Legendary |

Player level advances the desired tier at levels 1–3 (common), 4–6 (rare), 7–10 (unique), and 11+ (legendary). Uncommon gear is currently supply-only, so it is intentionally not a dead step in ordinary loot. Enemy threat can raise the target; bosses can raise it once more, always within the region cap. Region favorites receive a modest selection bias. The selector prefers a gear upgrade or an empty slot across the party, avoids duplicate items within a single chest, and filters developer, NPC, supply-only, quest-only, and boss-only pieces from ordinary loot. Guaranteed named drops and supplies stay on their existing paths.

Enemy equipment remains deliberately uncommon: 4% for ordinary enemies, 5.5% for tougher enemies, 8% for high-threat enemies, and 10% for bosses. Fixed boss drops (including the full Grim Reaper set), warlock gear, hunter gear, creature materials, relics, and ammunition retain their own rules.

## Implemented gear additions

| Item | Tier and slot | Bonus | Main source |
| --- | --- | --- | --- |
| Waykeeper Buckler | Rare, offhand | +4% move speed | Forest/desert regional gear; Matriarch cache |
| Bastion Ward | Unique, offhand | +8 max health; after a block, 30% less damage from the next hit within 0.75 sec | Shadow/temple regional gear; Matriarch cache |
| Arcanist Circlet | Rare, head | +10 max mana | Caverns/Shadow; Beholder arcane cache |
| Arcanist Robe | Rare, chest | +0.4 mana/sec | Caverns/Shadow; Beholder arcane cache |
| Arcanist Gloves | Rare, gloves | +2 spell damage | Caverns/Shadow; Beholder arcane cache |
| Arcanist set | 2/3 pieces | 2-piece: spells cost 8% less mana. Full set: +1 mana/sec | The three rare pieces above |
| Mender Focus | Rare, hand | 30 healing (45 charged), then 4 healing/sec for 3 sec | Swamp regional gear; Beholder caches |
| Groveheart Focus | Unique, hand | 30 primary healing (45 charged), 16 splash within 42 units, and 5 healing/sec for 3 sec | Shadow/temple regional gear; Beholder arcane cache |
| Bogglass Charm | Rare, neck | +10 max mana, +0.4 mana/sec, 25% poison resistance | Swamp; Matriarch cache |
| Wayfinder Quiver | Rare, back | +20% arrow speed, +10% bow draw speed | Desert; Matriarch cache |

The Arcanist set is three items plus its set definition, so the registry increases by nine items overall (two shields, three armor pieces, two focuses, and two accessories). Items use the existing fitted equipment and pixel-art renderers, with native icon and outfit details for their identities. Guaranteed boss caches choose a missing piece from their configured pool, so repeat kills do not award already owned pieces while another listed piece is still missing.

## Shield art revision

The first shield pass read as two narrow, block-built plates. The revised icon and worn forms use separate silhouettes: Waykeeper is a convex round buckler with a green face, warm rim, and compact boss; Bastion is a broader steel ward with crowned shoulders, a tapered foot, and a restrained central rune. Both stay in the native pixel renderer and use varied one-pixel contour steps, connected material planes, and sparse identifying marks. Current review capture: `test-output/loot-proposal/loot-proposal-gear-and-icons.png`. This is a revised draft pending the user's visual review, not yet user-approved art.

## Scope and verification

This change is source-only. No tests or desktop build were run for this task. The effects and drop cadence still need gameplay playtesting.
