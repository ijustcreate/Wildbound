# Environment art

- **Camera and scale.** Capture the closest native room, station, or outdoor scene at the destination zoom. Keep a player in both reference and working views. Compare rendered door clearance, tabletop height, walkable footprint, and effective pixel size.
- **Projection and depth.** Match the destination renderer's projection. Establish ground, tabletop, and wall attachment points before contours. Sort at ground contact or the existing depth key. An item sitting on furniture inherits the support height and sort group where the renderer requires it. Align blockers and walkable openings with the art.
- **Materials and silhouette.** Give the room or building a readable roof, entrance, and route. Use broad shadow and light clusters that follow the surface planes. Reserve strong edges for the contour and important overlaps. Use lighting-facing pixels and one structural detail to describe material.
- **Lighting and movement.** Keep contact shade on the support surface, position light at the fixture, and reuse the scene's lighting and animation. Small raster props and fixture loops can use [pixel recipes](pixel-recipes.md).
- **Native review.** Walk the actual approach, threshold, and key occlusion points in muted Electron. Check depth against a player, access to interactive objects, and clear route silhouettes at gameplay size. Compare daylight and darkness when the environment supports both.

The [Ice lodge lantern](../../../../docs/art/winter-lantern.md) documents a prop with stable ground contact and independently animated flame.
