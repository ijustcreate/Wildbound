# Night Hunt preview

The existing **Wildbound** desktop launcher uses the stable 1.0.6 snapshot. The separate **Wildbound Night Hunt** launcher uses a dated preview snapshot. Neither launcher closes the other instance. Controllers claimed by one instance stay with that instance.

Preview characters, expeditions, house designs, and edited rigs are saved separately in `%APPDATA%\Wildbound Night Hunt Preview`. The preview initially loads the bundled authored rig art, including existing tiger work. Subsequent preview rig changes stay in that profile; they do not modify the stable project rigs. Use Animation Studio export to transfer those edits deliberately.

## Playing

- A full day lasts eight minutes: four minutes daylight, one minute dusk, two and a half minutes night, thirty seconds dawn. The HUD shows the phase and time remaining. Pausing stops simulation time. Saves preserve the clock.
- Board rolls still summon encounters. Night Stalkers, Carrion Packs, Burrowers, and Mimic Vines enter the event pool at dusk/night. The hunter can appear on any map. Plants inhabit Forest and Jungle Temple.
- Craft a torch from two sticks, or a lantern from one log and two stones in Field Kit → Craft. Equip either in either hand. A lantern causes no damage and gives steadier light. A torch deals light melee damage and burns enemies and trees. Holding one melts nearby ice into shallow water. Tap Interact on empty dry ground to light a short-lived fire ahead of you.
- Running, dashing, attacks, harvesting, and gunshots create noise. Slow movement is quieter. Night Stalkers investigate noise, leave visible tracks, reveal themselves before pouncing, and retreat from nearby light.
- The safari hunter locks an aim line before firing and backs away to keep range. His traps have an arming warning. Defeat him or stay alive in the world for two minutes to win the hunt and receive 20 gold per explorer. Retreating into storage pauses the hunt timer. Killing him drops his actual equippable safari set, rifle, and cartridges; surviving makes him withdraw.
- A rifle occupies both hands. Hold Attack for at least 0.6 seconds, then release to fire. It consumes one cartridge and reloads for 1.2 seconds. Craft six cartridges from three stones and one log.
- Carnivorous Flowers pull victims toward their jaws. Hit the flower or cut its tether with melee to release a friend. Captives can fight back; the tether also releases after three seconds. Poison Pods warn before firing poison barbs, which travel no farther than five tiles.
- Burrowers leave a moving dirt trail, warn before emerging, bite, expose themselves, and burrow again. Carrion Packs favor wounded explorers and pressure rescuers near downed players.
- Living vines gradually thicken in Forest/Jungle Temple. Cut them with Attack or tap Interact; no tool is required. Escape corridors, board space, doors, and portal approaches stay clear. Cut vines remain cut after reloading.
- Dragonflies visit plants; frogs and birds follow insects; scavengers approach fallen creatures and food. Forest, Jungle Temple, and the yard have small wildlife. Ice has white mice and fairies.
- Stampedes contain rhinos, elephants, zebras, and pelicans. Unprovoked animals run through; struck elephants and pelicans fight, while zebras flee.

## Editing

Animation Studio includes ten independent subjects: Carnivorous Flower, Night Stalker, Burrower, Mimic Vine, Poison Pod, Carrion Pack, Hunter, Elephant, Zebra, and Pelican. All have editable joints, clips, facing visibility, layered sprites, and save/export support. Changing one species does not change another. The hunter's clothes and rifle use the same item catalog as player equipment.

## Development and verification

`node --test tests/*.test.mjs` covers combat, clock/save persistence, night event eligibility, equipment, sprite isolation, hunting, plant rescues, capped growth, and stampedes. `electron scripts/verify-night-hunt.cjs` renders a forest scene, all ten rigs, ice wildlife, and the studio in a separate offscreen process and verifies app reload of edited rigs. Outputs are in `test-output`.

`node scripts/package.cjs --preview` packages into a new dated directory, never overwriting a running snapshot. The preview launcher passes `--preview` to select its separate saves. Updating the launcher to the resulting snapshot does not stop an already-running game.
