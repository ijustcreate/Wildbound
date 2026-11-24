# Alley expansion, Lamplit Vault and Quidditch follow-up

The park’s north paths reach Bellglass Conservatory and Meridian Hall. Both have walk-in doors and merchant counters. Meridian Hall’s inner chart opens the Lamplit Vault by Interact. The arena returns players to the chart room through its stairs. Auto-PvP is limited to fighters physically standing in the marked ring. The gallery and bar are safe. The usual combat rules still govern other areas, and a ring knockout returns the defeated player to the gallery.

The streets gained closed façades along unused frontages. The lane between Nocturne Curios and Nightglass Apothecary now gives public access to their rear courts, including a wizard graveyard and a dim path behind the shops. Diagon’s posts use amber glass. Nocturne’s lanterns and wall candles glow green. World-anchored gold and green motes stay inside each district’s playable footprint. Wild Lands receives directional sun shadows from nearby actors and scenery plus local light pools that react to occluders. The existing Dynamic Shadows setting controls cast shadows. Dialogue presents a shorter frame with a smaller portrait and scrollable choices.

The Lamplit Vault’s larger octagonal ring uses the same boundary for its floor, fence collision, and PvP checks. The east gate is the sole opening. Outside it are torch pedestals, three seating areas, and a weapon display rack. Nearby combat can trigger short cheers from visible spectators. The vault has ten guest outfits on the native human rig. The additional Fight Club references are Marla Singer, Angel Face, and Lou. The reused goblin subject includes distinct banker and bartender gear, a short build, long arms, oversized hands, and a broad-eared head. The Gloamwhisker rat has editable eight-view idle, walk, and scurry art. A black cat roams Nocturne separately from the garden cats.

Eeylops stocks reusable cages for Hedwig, the smaller Pigwidgeon, and the full-sized horned Archimedes. Use **Call owl** in the backpack. A cage stays in the bag and can recall the follower after it disappears. A player can call one shop owl at a time. The station rescue and its travel cage continue to work.

Quidditch stands are larger and now use native pixel spectators at player-relative scale. The scoreboard sits outside the east touchline. The pitch uses cached textured turf while retaining the painted field markings. Each visible stand uses a small number of staggered rider lookups and cached face and cheer art. An offscreen stand does no rider-distance or spectator draw work.

On a pitch broom, keyboard **X** and the controller’s west face button handle grabbing, throwing, and swatting. A theft requires close range and similar altitude to an opposing carrier. Hand weapons remain equipped, with their models and normal attacks disabled for flight on the pitch. Using the Portkey in either direction shows the same dedicated gold-and-teal warp. Rowan Fairwind explains the rules near the entrance. A successful Snitch turn-in stows the four balls in the center chest, lands the NPC teams, and makes them available for post-match dialogue. The landing and reload paths recover players who were at a fixture’s blocked footprint. The center chest reopens for the next match.

Madam Malkin’s fitting mirror now hangs on the rear wall. Up close, it shows the player’s current outfit and movement in a clipped reflection, with a separate render identity so it cannot disturb the live character’s animation.

Jump over the Mage Garden pond rim and remain in the water for five continuous seconds to refill mana and gain +30 maximum mana for ten minutes of play. The buff uses the existing player field snapshot, waits while the game is paused, and clamps mana back to the ordinary cap when it expires. A cyan mana meter appears even with empty hands. Small blue motes follow the player out of the water. Garden dialogue and activities follow Neville Longbottom, Professor Pomona Sprout, Luna Lovegood, and Hermione Granger. Hermione uses the actual garden gate and city path between the garden and Flourish & Blotts. Earlier garden reward claims remain available on their original IDs.

Five decorative storefronts frame the park. A new paved west spur reaches Wrong Turn Door & Key, an enterable lock and door shop inspired by *Labyrinth*. Tamsin Hinge stocks a spare car key, Copperweave gloves, and Floo Powder.

## Source and review

- Character gear and dialogue live in `src/diagon-arena-guests.mjs` and `src/diagon-arena-wardrobe.mjs`. Use the existing native appearance and equipment model to add new guests.
- The goblin and rat are editable rig subjects. Their eight directions use the standard studio rig paths documented in the [Wildbound art skill](../../.agents/skills/wildbound-art/SKILL.md).
- `src/diagon-garden-shops.mjs`, `src/diagon-nocturne-rear.mjs`, and `src/diagon-alley-street-art.mjs` define the new storefronts, garden approaches, rear courtyards, and fixture light positions.
- `scripts/verify-diagon-alley.cjs` renders and exercises the shops, legacy station owl, and new purchase and recall paths. `tests/diagon-arena.test.mjs` exercises room return, target eligibility, projectiles, and knockouts.

## Desktop build

Windows build `1.2.131` was packaged from modified `Wildbound_worlds` source at `5b244635ab78e5a3c8e78ef21fdbabf60e505fd7`. The verified output is `dist/1.2.131/Wildbound-win32-x64/Wildbound.exe`. The shortcut `Wildbound Worlds (1.2.131).lnk` targets `Play Wildbound.cmd -BuildDirectory "dist\1.2.131\Wildbound-win32-x64"` and opens the normal save profile. The exact executable passed muted boot. The focused source suite passed 117 tests. Packaged renderer checks covered the octagon and its collision, the alley merchants, the named garden resident routes, and Madam Malkin’s mirror.
