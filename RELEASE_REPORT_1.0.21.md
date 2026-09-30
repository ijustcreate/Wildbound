# Wildbound 1.0.21 — Gear and animation-layer test build

Use **Wildbound Latest (1.0.21)** on the Desktop. Older builds and saves are preserved. This is a local test release, not a new GitHub publication.

## Gear

- Each level after the first adds 8 maximum HP and 6 maximum mana. Armor contributes health; Moon equipment adds 15 mana per piece (20 for blade/bow). Equipping gear changes capacity without free healing/refilling.
- Moonbound: three distinct requirements grant +30 mana; completing all four grants +4 mana/sec, 25% cheaper spells and 3 healing per successful cast. Alternative Moon helms and weapons count toward the same requirement rather than duplicate pieces.
- Safari hunter: three pieces grant +25 HP; the six-piece set grants +1 HP/sec and 12% movement speed.
- Sunforged: three pieces grant +30 HP; completing all five requirements grants +8 attack damage and +2 HP/sec.
- Green checklists show worn requirements and unlocked bonuses in the equipment details.
- Azure bead (+15 mana), Moon prism (+25) and Starheart (+40) can be crafted in Field Kit or found in enemy loot. Loose trinkets give no bonus.
- Compatible weapons, helmets, armor, shields and necklaces have sockets; boots, pants, gloves, shoulders, capes and utility gear do not get sockets by default. Item creator supports 0–3 sockets.
- Select compatible gear and press Y (controller secondary action), choose a trinket with the D-pad, then confirm twice with the accept button. Back cancels. Filled sockets offer free removal; a full backpack prevents extraction without losing the trinket. Mouse buttons use the same workflow.
- Socket contents stay with individual item instances during swaps, storage, loadout changes, drops, collection and profile saving.

## Animation

Attack during a jump to overlay upper-body melee, bow or spell animation while the legs retain their jump pose. Weapon angles and wand launch positions follow the same composed pose.

Player Rig Studio → Layers exposes conditions, base/overlay clips, joint masks, strength and ordering. Choose preview clips, enable combined preview and play/scrub; save/export the rig to retain rules. See PLAYER_ANIMATION.md for the workflow. Creature-layer authoring and additive/state-machine blending remain outside this implementation.

## Verification

387 automated tests passed, including new resource/set/socket tests, exact-instance loadout handling, airborne gameplay attacks, independent animation clocks, mask blending, weapon angles and rig migration/serialization. A focused Electron check exercised layer editing, undo, save and preview, set checklist rendering and controller-driven socket selection/confirmation. Screenshots are in test-output/animation-layers-editor.png and test-output/trinket-sockets.png.

The tabletop sorting and cinematic board changes from 1.0.20 are included. Earlier broad UI-smoke failures documented in 1.0.19 are not claimed fixed; this release uses focused checks for the changed workflows. Physical controller playtesting is still recommended.
