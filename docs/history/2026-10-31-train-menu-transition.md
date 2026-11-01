# Train dev-menu transition correction

October 31, 2026. User reported that Test train level did not visibly enter the train map. The game state changed, but the developer button did not switch the app from lobby to play or dismiss pause/settings dialogs. This was missed by the earlier isolated world-state checks.

The real app now supplies train entry/return callbacks to every developer-console entry point. Entry switches to gameplay, closes menus, resumes the simulation and clears held input. Return restores the prior lobby/gameplay screen and original party. The runtime train state and saved expedition isolation are preserved.

Muted Electron verification now clicks the actual app's pause-dev and train buttons from the lobby, verifies play screen / no menus / unpaused / isolated train state, renders the train, then clicks the real return button and verifies original lobby/party restoration. 31 checks passed, zero renderer errors. This correction is included before the requested source push and live browser publication; both desktop and web packages must be built from the commit containing this note.
