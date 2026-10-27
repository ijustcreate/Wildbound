# Lobby floor edges and TV jump consistency

Continues modified Worlds checkout on 1bd5ef027966 and all 1.2.35 follow-ups.
The user's colored screenshot annotations are location markers only; original
floor/trim colors are retained. No authored rig, profile, world or draft changed.

Room collision formerly used x47..978/y92..568, inset well inside the visible
floor. Shared lobby-geometry.mjs now defines floor x16..1024/y68..620. Actors'
foot collision circles can reach this perimeter, with their normal 8px radius;
the measured centers are x24/1016 and y76..78/612 depending on movement substeps.
Projectiles and the legacy movement helper use these same floor dimensions.
Right/bottom trim moved from x1010/y590 to x1017/y608, ending at x1024/y620.
Backdrop painting is shared with rig previews; the lobby retains its warm wood
and green tile palette and does not introduce the annotation colors.

TV brief: preserve width, palette, rectangular cabinet, controls and screen
content. Reduce cabinet vertical extent 20% about its existing floor base;
console, controllers and cables retain their positions. Native procedural
artwork only: no replacement raster or authored-asset migration.
The landing surface now matches the shorter cabinet (64px, footprint y175..187).
Airborne prop sorting includes the foot radius instead of toggling exactly at
the narrow support strip, preventing a premature rear-layer change at edges.
Jump impulse/gravity and the earlier 15% horizontal reach remain unchanged.

Focused tests check all four perimeter approaches, trim positions, TV blocking,
landing on the top, walking off, airborne depth, and prior lobby/TV behaviors.
Muted isolated Electron verify-lobby-geometry.cjs renders a real moving jump
sequence: peak109.83, maximum per-tick horizontal movement1.275 at 120Hz,
crosses TV continuously without teleportation. Screenshots/report are in
test-output/lobby-geometry. Rebuild log: test-output/lobby-geometry-build.log.
No commit or push requested.
