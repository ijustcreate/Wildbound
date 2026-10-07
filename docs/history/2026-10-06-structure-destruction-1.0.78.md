# 1.0.78: local structural destruction

House/temple wall runs now retain their authored geometry/art while storing sparse damage for 40-pixel cells. Swords and offensive magic charged at least halfway damage the nearest exposed cell; healing/friendship spells do not. Swept grounded stampedes smash walls, doors, furniture and trees. Pelicans do not smash ground structures. Tree falls use the existing delayed logs/stump lifecycle, without repeated falls or duplicate logs.

Collision and navigation see local gaps; neighboring cells stay solid. Material toughness differentiates glass, timber, plaster and temple stone. Cached original art is patched locally with cracks, rubble and breach edges. A global LRU bounds paired wall raster memory to 32 MiB; unusually large editor rectangles use a single clipped source draw. Dust/splinters/chunks are ballistic cosmetic squares, capped at 160 per game, with throttled impact sound and batched stampede persistence. Cosmetic debris and caches are not serialized. Destroyed furniture no longer supports jumps or emits lamp light.

House layout comparison ignores destruction state so returning to a saved house does not repair breaches as an apparent editor update. Temple restore skips house-only window migration, which otherwise changes temple wall geometry and misaligns saved damage cells.

Verification: targeted destruction, house, temple, save, navigation, raven and stampede regression suites; isolated Electron `scripts/verify-structure-destruction.cjs` with 20 runners over 420 frames in each biome at whole-map zoom 0.52. 76 house and 48 temple wall cells broke, debris never exceeded 160, reload retained damage, unaffected pixel samples stayed exact, wall art rasterized once, no renderer errors.

Software-rendering measurements: hazard update p95 0.6 ms house / 0.9 ms temple. Isolated whole-map structures benchmark (`scripts/benchmark-structure-destruction.cjs`, 120 sampled frames per case) rendered house intact mean 1.235 ms, breached with maximum debris 1.327 ms; temple intact 0.629 ms, breached 0.665 ms. Full-scene software rendering with forced framebuffer synchronization was much slower (61/113 ms mean), so these measurements demonstrate small structural overhead, not guaranteed full-game hardware FPS. Live controller/GPU playtesting remains unverified.

Build target: `dist/1.0.78/Wildbound-win32-x64/Wildbound.exe`, normal profile, versioned Desktop shortcut targeting `Play Wildbound.cmd`. Consult `wildbound-build.json` for exact source identity. Source push and desktop package do not update hosted web releases.
