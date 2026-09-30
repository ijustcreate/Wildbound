# Wildbound 1.0.23 - Lobby layout and consolidated desktop build

Launch **Wildbound Latest (1.0.23)** on the Desktop. The versioned package includes the current gameplay, editor, animation, gear, salvage, and authored rig changes, plus the new lobby arrangement. Earlier builds and player saves are preserved.

The lobby has a square-tiled floor, a center divider, five horizontal, angled, and vertical practice target tracks, and stations arranged on the right. Furniture collisions follow their new positions, targets move along their tracks, and interaction selects the closest nearby station.

## Validation

All 401 automated tests passed. The lobby was rendered in Electron and visually checked. The earlier broad lobby-flow check stopped at the controller creation-panel assertion; this release does not claim that issue is fixed.
