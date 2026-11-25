# Diagon Alley visitors and Shadow Realm tracker

Diagon Alley adds 17 characters from the requested roster, including three creatures. Each visitor has a location or daily route and a conversation with two replies. Dobby uses the native short humanoid rig with a separate outfit and ear silhouette. Peeves and Nearly Headless Nick float, and Newt's Niffler, Fawkes, and Buckbeak have original eight-direction pixel art and animated portraits. The existing Mage Garden resident supplies Professor Sprout.

Look for Dobby near the station arch or ice-cream shop, Newt near the owl emporium, and Buckbeak in the north courtyard. Remus Lupin visits from Hogsmeade and gives directions to the Shrieking Shack.

Drizzt Do'Urden and Guenhwyvar appear on clear ground near the Shadow Realm board. Ask Drizzt about the trail and follow the pale pawprints. Guenhwyvar waits for the initiating explorer at the bends and guides them back to Drizzt. The encounter can be repeated.

## Verification

Source Electron ran with isolated profiles and muted audio. The Diagon Alley verifier passed 119 checks covering normal interactions, distinct replies, creature portraits, and both dialogue viewport sizes. The Shadow Realm verifier passed 11 checks including the conversation, waiting for the player, and completing the loop. Both reported zero renderer errors.

The focused resident suite passed all nine tests. Placement also passed on 32 generated Shadow maps, with fallback checks for an authored obstruction and terrain that finished loading after the first search.

## Desktop build

Wildbound 1.2.183 was packaged from modified source at 4f5a265aff90222b12527182211abf2c90c0ed17. The packaged app passed the same 130 muted Electron checks and the exact executable booted to the lobby with no renderer errors.

The verified Wildbound Worlds (1.2.183) desktop shortcut targets Play Wildbound.cmd with the argument -BuildDirectory "dist\1.2.183\Wildbound-win32-x64". It opens the normal save profile.
