# Chocolate Card Collection and Wilds Homestead board

The Chocolate Card Collection opens on the first collected card in catalog order and shows a fixed grid of all 20 slots. A question mark covers each uncollected card. The header shows the collected and missing totals. Players can select any slot or browse the full catalog with the arrows, wheel, keyboard, or controller. Collected cards show their animated portraits and biographies. Existing album contents load into the new layout.

In desktop 1.2.144, a roll of 9 from trail space 26 reached `TRAIL 35 — 9 rolled`. The reveal clock kept advancing, but the Homestead adapter omitted player input when calling the board sequence, and the overlay hid and disabled its Close button through the result. The long reveal setting made this easy to reproduce. Keyboard Enter and the roller’s controller confirm now continue after landing. Local players can also close the result with the on-screen button. Timed dismissal and manual dismissal both finish the same turn once.

The Board button, `B`, and D-pad Left open the Homestead’s board in Wilds. That view shows the saved pawns and tells players where to roll. Interact beside the physical Homestead table to play. Portal rolls still run automatically and transport only the roller.

Desktop `1.2.146` uses the normal save profile and was packaged from modified source at `a6cee9bc55ad12ed58df5c3d27b150449f31ef26`. The numbered desktop shortcut targets `Play Wildbound.cmd -BuildDirectory "dist\1.2.146\Wildbound-win32-x64"`. The exact executable passed its muted boot smoke test. Its application resources passed 25 native board checks and 105 album and broader gameplay checks, with no renderer errors. Xbox buttons were simulated through the app input mapper.
