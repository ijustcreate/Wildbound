# Upper sanctum, shared interior windows and lantern falloff / 1.2.33

Wildbound_worlds, base 1bd5ef027966, modified/uncommitted source. Normal Electron
profile; prior running builds, personal saves and authored rigs untouched.

The upper temple's old flat grid/chest has been rebuilt with the ground floor's
aged limestone, gold/jade inlays, stepped masonry, wall pilasters, guardian faces,
vine cornice, altar dais, detailed native chest and animated wall torches.
The original 320x240 room coordinate contract, ritual chest at 160/78, south
stairs, persistent shared loot and tiger encounter remain compatible. Decorative
columns are on the perimeter, not new walk-through obstacles in the corridor.

Renderer previously replaced the entire world with the first room player's view;
HeroUI could additionally render a room-only panel per player. room-windows.mjs
now groups temple/well/crypt participants by actual portal ID. Same room means
one window, different rooms mean separate windows. Inventories are still private
and can overlay the shared room without duplicating it. Lower-room cameras fit
all participants, including separated players. Surface camera remains stable
while all players are inside; the actual world continues behind framed windows.
Entrance-only presentation fog prevents a black background on direct room loads,
without modifying exploration or moving actual actors. Surface minimap is behind
the room windows, no longer over their artwork. Storage portal UI is preserved.

Character lighting previously sampled the surface light frame at interior room
coordinates. Room-scoped frames/sources now prevent cross-floor contamination;
carried lights follow room coordinates and the upper torches supply actual local
light. Lower-room enemy visual clones carry their room ID as well. Source-facing
sprite tint is restrained to preserve palette/outline contrast; no added ambient
night wash and no fixed airborne sprite crop. Lantern outer glow retains stronger
amber through the outer third, with intermediate alpha stops and zero alpha at
the boundary; colored non-warm lights keep their own hue. Sky clock and saved
sound settings are unchanged.

Verification includes grouping/entry-exit/inventory, bounded window layouts,
separated-player underground camera, room light isolation, warm soft edge stops,
existing temple/well/crypt/session tests, and muted isolated Electron screenshots
of upstairs co-op, split floors, lower co-op, two rooms, inventory and night.
The existing 48-case jump-lighting/cache/alpha regression check is retained.
No hardware/controller playtest or performance claim; no commit/push requested.
