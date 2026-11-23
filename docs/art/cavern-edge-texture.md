# Native cavern edges

Hollowdeep and the Wild Lands cavern previously marked rock with two flat strips per exposed square. The Old Well painted a framed block in every solid cell. At walking scale those outlines looked like grids instead of continuous rock.

The new edge brush follows the same solid cells and screen axes as the native forest outcrops. A deeper face sits above north-bound cave floors. Side faces have shallower exposed shoulders. Broken ridges, offset stone planes, and an occasional damp or mineral seam read against the dark stone mass. Limestone uses a muted cool ramp. The Old Well uses warmer layered stone and a brown floor with isolated fragments. Neither face extends into walkable floor or changes tile data. The keyed renderer caches up to 240 small rasters and supports the Wild Lands worker path.

Hollowdeep uses the brush in both Classic and Boundless. The Wild Lands cave gate uses that same floor renderer. The Old Well uses its own 16-unit terrain grid and retains exploration concealment. The optional smooth-contour slice uses the same colors and strata with its existing rock contour and authored sprite overlays.

Muted Electron captures at walking scale are under `test-output/cavern-edges/source`, with the preceding artwork under `test-output/cavern-edges/before`. The 14 source checks verify the real Old Well entrance, the real Wild Lands gate, cave tile collision, room-slice clearance, unmodified terrain, both materials over every exposed edge combination, and the raster budget. Twenty-eight cave, realm, wildlife and underground regressions passed. These checks do not measure sustained FPS.
