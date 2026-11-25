# Wheat fields east of the Wild Lands Homestead

The tall-grass prop accepts `grassVariant: 'wheat'`. It uses the same ground anchor and wind as meadow grass. At size 80, the stalks rise roughly 35–56 world pixels from staggered roots. Shaded amber stems support pale gold ears with lit upper edges. The wheat bends around a grounded explorer, and nearby foreground stalks cover the explorer’s legs. The WebGL and Canvas painters share the stalk positions and heights.

Three fields contain 144 tufts in the meadow east of the Wild Lands Homestead. Their centers are `(9060, 6830)`, `(9390, 6890)`, and `(9050, 7070)`. The fields are walkable and leave aisles between patches. Their placement preserves nearby routes and ruins and honors existing scenery placement overrides. Field definitions live in `src/wild-wheat-fields.mjs`.

Muted Electron captures covered the three fields, wind, walking, foreground overlap, and the Canvas fallback. The source Worker run passed 46 checks and returned 33 wheat geometry batches. Wind changed the render without uploading new blade buffers. Local checks confirmed the planted ground is dry and free of path, landmark, and rail overlaps. The stalk and ear share a patch state in GPU geometry. This lets a cut remove the ear without rebuilding the geometry. All 30 focused Node tests passed. The full test run was stopped while it was still progressing. Captures and receipts are under `test-output/wheat-review/`.

## Desktop 1.2.150

The executable is `dist/1.2.150/Wildbound-win32-x64/Wildbound.exe`. It was packaged from the modified `Wildbound_worlds` checkout at `a6cee9bc55ad12ed58df5c3d27b150449f31ef26`, with an in-process Node syntax check of 1,194 runtime files. All seven wheat runtime files matched the package byte for byte. The versioned shortcut uses the normal save profile and pins `Play Wildbound.cmd -BuildDirectory "dist\1.2.150\Wildbound-win32-x64"`.

The exact executable booted muted with no errors and reported version 1.2.150. Both launcher checks resolved to that executable. Its packaged renderer passed 46 muted Worker checks with 15 uploaded terrain-worker wheat batches and zero uploads between wind frames. The settled captures showed zero pending or missing grass chunks. A brief Canvas-to-WebGL appearance change can occur while new chunks load after the camera relocates.
