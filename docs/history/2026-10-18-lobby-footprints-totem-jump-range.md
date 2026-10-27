# Lobby footprints, totem placement and modest jump reach

Real checkout: Desktop/Wildbound Server Branch Build, Wildbound_worlds on
1bd5ef027966 with existing modified source preserved. Continues 1.2.35 and all
earlier chat updates; no version bump requested for this follow-up.

LobbyPractice already generated normal footprints through Game.update, but
PlayableLobby omitted drawTracks. Draw the shared trail layer after the room
backdrop and before equipment trails, furniture and actors. Airborne movement
still does not generate footsteps; tracks retain the existing 18-second fade.

Horizontal jump movement now has a fixed 1.15 reach factor, independent of
holding/releasing Jump. Takeoff momentum and air steering remain; the vertical
arc, hold/release gravity, animation phase timing and landing are unchanged.
This does not restore the old 2x held-Jump speed multiplier.

The difficulty menu previously used the player's left/right inventory rail.
Project the totem through lobbyCamera into the panel overlay, place the popup
immediately beside it and clamp to the visible overlay bounds on small screens.
Recompute on resize or canvas offset changes; other menu docking is unchanged.

Regression tests cover lobby floor tracks/fading and airborne suppression,
15% jump reach without changing height/time or forcing stationary jumps sideways,
and bounded totem anchoring at 360/1000/1920 viewport widths. Electron verification
in scripts/verify-lobby-footprints.cjs checks real lobby drawing with/without
tracks and menu bounds/proximity at 1280x850, 800x600 and 420x640. Screenshots and
report: test-output/lobby-footprints. Muted isolated test profile, no user saves
or authored rig assets touched. Desktop rebuild log:
test-output/lobby-footprints-build.log. No commit or push requested.
