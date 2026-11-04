# Oathless Captain

A separate human enemy using skeletal motion from [Captain Lancy Revshon, NPC 49877](https://www.wowhead.com/npc=49877/captain-lancy-revshon#modelviewer). Native Wildbound pixels depict blue/gold plate, fair hair, a sword and shield. No WoW mesh or texture is bundled.

The exact source is display 36758 → human female character 2 → model 1000764 → skeleton 2137789. The converter maps 203 source bones into 34 editable joints and selects 31 actions from 410 sequence entries. Facial handles and enlarged head proportions are native adaptations. Equipment uses donor attachment transforms; the eyes, ears, nose, mouth and hair remain separate parts.

Run `Play Oathless Captain Test.cmd` for eight facings, clip selection, joints and part editing. Run `Fight Oathless Captain.cmd` for a standalone game trial. Both use explicit test profiles. In the main game, select **Oathless Captain / WoW human motion** in Rig Studio; encounter **The broken oath** is appended after all earlier events.

Combat: alternating slash/thrust, shield bash with a short stagger, and a charge with a locked blue lane followed by a finishing strike. Recovery, interruption, capture/slow traps, walls and invulnerability are honored. Parry, dodge, salute, talk, swim and other clips are available in Studio; not every clip is an AI ability.

`motion-provenance.json` records source identity, hashes, mapping, timing and selected clip names. `qa.json` records all 6,200 frame/facing draws, independent part edits, equipment fitting/unequip, the actual game Studio, and four combat hit types. `preview.png` and `combat.png` are native Electron captures. Appearance is a review sample.

Reproduce from the verified M2, SKEL and selected AFID files using `scripts/import-oathless-captain.cjs`. The importer refuses an existing output unless `--force` is supplied; registration preserves an existing authored captain. Raw downloads live only in ignored test output.
