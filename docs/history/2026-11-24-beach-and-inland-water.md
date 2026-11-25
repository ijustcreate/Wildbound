# Beach tides and inland water edges

- Classic and Boundless Beach use warm sand, a damp strip, translucent shallows, and a moving foam front. The ground raster follows the continuous Classic coast where it agrees with the saved tiles and reconstructs rounded edges elsewhere, including tide pools. A sample halo keeps adjacent rasters continuous. The existing pier deck renders over the surf.
- Wild Lands uses its continuous water masks for West Beach, Greywake and Tideglass surf. Ocean and inland palettes follow the local terrain. Classic forest, Woodland Railway and Wild Lands rivers and lakes use subdued green water, exposed bank soil and thin moving cream ripples.

## Verification

- Source checkout `Wildbound_worlds` at `a6cee9bc55ad12ed58df5c3d27b150449f31ef26` with local changes. Verification used muted isolated Electron source sessions. There is no new packaged build for this pass.
- `node scripts/verify-beach-surf.cjs` passed nine checks across a full, fixed-camera tide cycle. The Classic foam crest traveled 27 world pixels and reversed. The pier deck stayed clear, the tide pools animated, and the Classic and negative Boundless raster seams matched pixel-for-pixel. Captures and the report are in `test-output/beach-surf/`.
- Classic's direct and cached renderers, the Woodland Railway canal and the Lakewood lake were reviewed in muted Electron. The shoreline cache differed by at most one premultiplied color level from direct drawing. Captures are in `test-output/inland-shoreline/`.
- The Wild Lands review covers West Beach, Greywake, Wild River, Tideglass coast and lagoon. Muted Tideglass route, shoreline reflections, and surface transition checks passed. Captures are in `test-output/wild-water-review/`.
- The 46 targeted Beach and Boundless checks covered coastal wildlife, island generation and saved terrain, and pier swimming. Additional inland checks covered Railway surfaces and cached water. Hardware frame rate was outside the checks.
