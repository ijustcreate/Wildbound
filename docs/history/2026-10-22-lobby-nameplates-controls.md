# Lobby player plaques and physical controller inputs

The lobby kept the roster HUD inside the hidden expedition screen, so joining never displayed the player's plaque. It also inherited saved combat mappings for dash and potion, contrary to the requested lobby controls.

The existing roster now moves between lobby and expedition with the screen, renders immediately on joining, and refreshes while in the lobby. Names follow the selected explorer and dash cooldown displays the lobby practice actor's cooldown. Lobby plaques sit above the world and below interactive panels; pet cards occupy the bottom edge.

Lobby controller controls use physical positions independently of expedition customization: R/RB (button 5) dashes, D-pad Up (12) toggles the player's storage portal, and ZR/RT (7) uses a potion. L/LB does not dash. Keyboard controls remain Space, P, and H. Help text and controller binding details describe these lobby actions. Modal/join guards and TV directional ownership remain respected.

Validation includes the lobby storage/practice tests, an actual muted hidden Electron join/control check with simulated Xbox and Switch pads, two simultaneous player plaques, selected names, portal ownership/open/close, dash without potion, and roster transfer between screens. No physical controller hardware claim. The refreshed Electron capture shows both plaques visibly rendered.

Build: 1.2.54, based on commit 1bd5ef027966e371f21cd0956b96b0aa4a62144b with modified tracked source, retaining earlier local changes. Normal saves use Play Wildbound.cmd without --preview.

The full rebuild passed all 1,498 tests and syntax checks for 400 runtime files. The controller settings Electron regression passed 77 checks. Source and packaged lobby join/control checks each passed 19 assertions without renderer errors; packaged boot reports ready in the lobby with zero failures/errors. The runtime files match their packaged hashes, and git diff --check passes.

Exact output: dist/1.2.54-2026-10-22T19-39-40-833Z/Wildbound-win32-x64/Wildbound.exe. The Desktop shortcut Wildbound Worlds (1.2.54).lnk targets C:\Users\New User\Desktop\Wildbound Server Branch Build\Play Wildbound.cmd with no preview arguments. Play Wildbound.cmd --check selects this exact executable.
