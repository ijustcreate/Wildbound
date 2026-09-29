# Wildbound 1.0.18

Lobby tables block walking and support jumping. The difficulty totem is solid.
Three traditional archery targets score practice hits. Use E / controller Y at
the lever to toggle side-to-side motion; practice never consumes saved ammunition.

Left trigger uses the existing remappable block binding: shields block normally;
with a bow, it anchors horizontal movement and displays a short aiming guide.
Either stick aims, with right-stick priority. Normal attack charging and release
still fires. Keyboard C supports the same behavior. Release the trigger to move.

The open board is on a 64 by 32 world-pixel table: two floor squares wide and one
deep. Jump onto its 16-pixel-high top; its collision, spawn spacing and interaction
reach use the smaller footprint. Landing shadows follow the tabletop.

Quicksand clips buried body parts and allows full submersion. Idling sinks at
5 pixels/sec, actual movement raises at 8 pixels/sec, and a fresh jump raises
22 pixels immediately with faster recovery while airborne. Once submerged, the
shared 20-second breath supply drains; empty air costs 25% max health per second.
Resurfacing refills air quickly. New desert maps have four large irregular patches;
existing saved layouts are preserved.

Palms use seeded curved, banded trunks, separate wind-swaying feathered fronds,
coconuts and ground shadows. Natural sand-water borders gain ankle-deep brown mud,
small ripples and lighter movement slowdown than shallow water. Pools are excluded.

Validation: 370 automated tests passed. Electron render checks cover lobby targets,
lever interactions, tabletop placement, clipped sinking stages, procedural palms
and the desert patch map. Physical controller hardware was not exercised.
