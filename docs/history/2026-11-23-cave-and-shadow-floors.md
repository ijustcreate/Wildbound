# Cave and Shadow Realm floors

Hollowdeep, its authored previews, and the Wild Lands caves now use a continuous limestone pattern. Broad slabs, chipped bedding and compact mineral marks cross gameplay tile boundaries. Contact shadows sit at wall feet and narrow routes use softer contrast. The Old Well uses warmer brown stone. Translucent shaft light preserves the floor texture and stays within visible open tiles.

The Shadow Realm uses blue-violet basalt with chipped bevels and quieter worn stone along existing routes. The court picks up a subtler pattern and the shallow basin casts cool light onto nearby dry rock. The Wild Lands arrivals sample continuous material across region boundaries. The two painters use bounded raster caches. This art pass preserves the existing gameplay tiles, collision, portals, shoreline and water reflection masks.

## Verification

121 terrain and world regression tests and a 58-test focused rerun passed. Muted source Electron checks covered Classic Hollowdeep, both cave previews, the Old Well, Wild Lands cave entry, and Shadow Realm portals, fog, terrain material and water. Independent muted checks compared over 850,000 dry pixels across Classic and Boundless camera crops, individually drawn tiles, and Wild Lands region boundaries. Both Wild Lands terrain worker jobs completed.

Cave raster construction now writes pixel spans to a buffer and uploads one image per chunk. A bounded slab cache shares geometry between neighboring rasters. The optimized floor matched all 706,560 sampled pixels from the first package. In seven matched fresh-seed 768×576 terrain draws, the median fell from 325 ms in the first art package to 104 ms after optimization. The prior wall-only build measured 26 ms in the final comparison. Warm samples stayed close to the wall-only build. Timing samples measured Canvas terrain passes with readback. Sustained gameplay frame rate and physical controls were outside those checks.

## Desktop build

The final package passed syntax checks for 989 runtime files, 17 cave checks and 94 Shadow Realm checks in muted Electron, with zero renderer errors. The actual packaged executable booted to the lobby in an isolated muted profile. All eight changed runtime modules matched the source by SHA-256. The five packaged cave screenshots also matched the optimized source captures byte for byte.

Build `C:/Users/New User/Desktop/Wildbound/dist/1.2.113-2026-11-23T20-23-01-447Z/Wildbound-win32-x64/Wildbound.exe`. Manifest version 1.2.113, builtAt 2026-11-23T20:25:48.132Z, sourceCommit f0b787ff33c3ac8f3675b48504937ebda4f0dcb5 on Wildbound_worlds, sourceDirty true, preview false. The verification reports are in `test-output/cavern-edges/floor-final-build`, `test-output/shadow-underworld/floor-final-build` and `test-output/terrain-floor-build-content.json`.

The verified desktop shortcut `C:/Users/New User/Desktop/Wildbound - Cave and Shadow Floors (1.2.113).lnk` targets `C:/Users/New User/Desktop/Wildbound/Play Wildbound.cmd` with a project-relative `-BuildDirectory` argument pinned to this package. It uses the normal save profile. No commit or push.
