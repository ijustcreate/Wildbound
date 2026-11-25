# Greyhaven cliffs and Mermaid Lagoon cast

## Greyhaven

The outer moat follows a single authored outline with deep inlets, grassy points and uneven stone shelves. The far bank exposes ochre soil over broken slate and drops toward the water. Shorter ledges and scattered plants define the near bank. The wet surface, collision and cliff lip share that outline, including the cached terrain and the first frame while the Worker loads. The fixed landing keeps the original drawbridge deck connection.

## Mermaid Lagoon

Two low mauve rock shelves sit below the waterfalls. Vespera brushes her hair, Luma plays a harp, and Coralie lounges on the smaller shelf. Neri treads water nearby and watches Coralie. Their designs use the supplied illustration’s grouping, hair contrasts and tail colors as a reference for an original Wildbound cast. All four have a conversation and follow-up reachable from the lagoon water.

The `lagoon_mermaid` subject in Rig Studio uses the native humanoid upper-body joints. Its tail has a base, midsection, tip and separate flukes. Each animation uses the editable joint timeline. The same head art renders in the lagoon and in the dialogue portraits.

## Tests and build

- Twenty focused Castle, Wilds terrain, coastal and dialogue tests passed. The shoreline test checks both sides of all 65 bank segments against the native pixel mask. The dialogue test enters through the normal Wilds runtime and reaches all four conversations.
- The muted Rig Studio checked all seven clips, eight facings, four palettes, editable tail parts and rig serialization in an isolated profile.
- Muted Electron on the exact package passed 241 moat checks and 40 lagoon checks with the terrain Worker active and zero renderer errors. The raised bridge blocked the crossing, and lowering it reopened the route. The lagoon run swam to each mermaid using ordinary movement, checked the dialogue and portrait, and sampled full grooming and harp loops. Captures are in `test-output/greyhaven-review/moat-packaged-1-2-168/` and `test-output/greyhaven-review/lagoon-packaged-1-2-168/`.
- Desktop `1.2.168` was built from modified source at `a6cee9bc55ad12ed58df5c3d27b150449f31ef26`. The 16 implementation files checked by SHA-256 match the source checkout and package.
- The `Wildbound Worlds (1.2.168)` desktop shortcut uses `Play Wildbound.cmd -BuildDirectory "dist\1.2.168\Wildbound-win32-x64"`. It opens the numbered `Wildbound.exe` with the normal save profile.
