# Shared ground loot, Nocturne Court, and Quidditch

Ground items use each scene’s own loot pool. Diagon Alley, the pitch, and Lamplit Vault keep their drops when the party travels away and return them from the expedition checkpoint. Players can share gear, stacks, and filled bags. Moving decks carry their drops with them. Storeroom, temple, well, and crypt drops use room-local coordinates, with the usual full-backpack handling.

The courtyard next to the green candle stand behind Nocturne Curios now contains Voldemort. Approaching through the rear lane starts the encounter and summons two Death Eaters. He casts green hostile magic, speaks at 90%, 60%, and 30% health, and dissolves into rising ash on defeat. He drops his ivory wand and ten Dark Essence. Each Death Eater drops its mask. The wand’s green spell effect and red eyes follow the equipped wand in either hand. Closed storefronts fill the outer rear lane and court edges using the existing shop geometry and cached pixel materials.

Eeylops adopts out a Snowy Owl, a Tiny Barn Owl, and a Great Horned Owl. They follow and fight as hunter companions. Companion care names, feeds, and switches the active companion. A previously active pet stays in reserve when another joins. Existing shop owl cages can still be claimed, and station rescues retain their original behavior.

The pitch uses native walking, running, jumping, dodging, and equipped wing flight. To play the match, use a broom. The west face button or keyboard X catches or steals balls. Fly close to an opposing carrier at similar altitude to take the Snitch or Quaffle. Keyboard F and the controller’s Interact button knock a held Quaffle loose, and keyboard F also steals a held Snitch. A close-range cue marks a catchable Snitch and its flight leaves a short gold particle trail. The midfield chest disappears during play and returns when the match ends. Madam Hooch in the starting area can confirm an early reset and stow the balls for the next match.

Elspeth Trewick stocks matching Gold and Violet team robes and scarves at the second counter in Quality Quidditch Supplies. The broom-speed potion adds 10% to mounted broom speed for five minutes of play. A further dose refreshes the duration.

Fortescue’s five scoops each grant a 90-second effect. Mint Chip restores extra mana, Chocolate adds armor, Strawberry retains its instant heal and adds health regeneration, Bertie Bott’s rolls a flavor bonus, and Moonberry Swirl boosts ground movement. A new scoop replaces the previous effect.

Every Chocolate Frog eaten awards one unseen wizard card until all twenty are collected, including attempts where the frog escapes. The album shows its count in one backpack slot. Open it with Use and browse its animated Wildbound portraits and short biographies with the previous and next buttons or the mouse wheel.

## Desktop build and verification

Windows build `1.2.142` was packaged from modified `Wildbound_worlds` source at `aa3c5e0371f6a5bb79b45b0030d4e7b87af704b3`. The executable is `dist/1.2.142/Wildbound-win32-x64/Wildbound.exe`. The verified `Wildbound Worlds (1.2.142).lnk` Desktop shortcut targets `Play Wildbound.cmd -BuildDirectory "dist\1.2.142\Wildbound-win32-x64"` and uses the normal save profile.

The actual executable reached the lobby with audio muted and zero errors. The package matches all 71 changed runtime files. The 617 muted packaged Electron assertions covered ground items and checkpoint recovery, the pitch and album, Nocturne Court, and the wider Alley and Owlery scenes. The final focused Node run passed 36 tests. Co-op and controller checks used simulated local controls and isolated test profiles.
