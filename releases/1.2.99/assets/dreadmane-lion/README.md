# Dreadmane Lion

Separate enemy `dreadmane_lion`, from the exact [Wowhead lion NPC 55491](https://www.wowhead.com/npc=55491/lion#modelviewer). Existing lion, white lion, tiger and wolf rigs are preserved.

- **Rig:** 69 source bones mapped to 37 native joints; 49 sequence entries, 38 distinct sequences and 11 aliases. Source includes a real walk and run, two claw variants, pounce, roar, sitting, sleeping, swimming, hurt and death.
- **Appearance:** native articulated pixel body, skull, mane, eyes, ears, jaw, muzzle and nose. No source mesh or textures are used. This remains a new art sample for review.
- **Enemy:** 220 HP, a two-swing claw combo, a short-range roar with stagger/knockback, and a crouched pounce. Visible tells, interrupt/capture handling, wall checks and recovery windows. It sleeps when no target is nearby and plays its wake transition.
- **Encounter:** “The Dreadmane wakes”, also available through Pause → GM field console → Event → Spawn selected event.

Launch `Play Dreadmane Lion Test.cmd` for all clips, eight facings, gameplay-size views and the part editor. Its **Fight the Dreadmane** link enters the actual game. `Fight Dreadmane Lion.cmd` enters the fight directly. Both use the explicit isolated profile `test-output/dreadmane-lion-play-profile`; normal saves are separate. `--review` selects another isolated profile.

Conversion is reproducible with `node scripts/import-dreadmane-lion.cjs <lion-124781.m2>` after putting the eight AFID `.anim` files next to it. Existing generated output requires explicit `--force`; the converter never changes shared authored rigs. `scripts/register-dreadmane-lion.cjs` inserts only a missing authored entry and preserves existing edits. Full mapping, IDs, source hashes, aliases and timings are in `motion-provenance.json`. The source contains Blizzard animation; native appearance does not imply ownership of that animation.

Checks: `node --test tests/wow-m2.test.mjs tests/dreadmane-lion.test.mjs` and `node_modules/.bin/electron.cmd scripts/verify-dreadmane-lion.cjs`. The Electron check covers every sampled frame in eight directions, independent facial edits, the actual game's Rig Studio, combat and a rendered ground tell. `scripts/render-dreadmane-lion.cjs` refreshes visual contact sheets without the full check.
