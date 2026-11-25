# Greyhaven coastal meadow

The north and west of the moat now read as coastal meadow. Broad olive grass folds into darker hollows and scattered slate, with wind-bent trees and groups of shrubs and wildflowers around Stormwatch Beacon. On the east, inland rock outcrops lead into a gravel band and the existing sandy shore. The authored trail turns into a warm curved approach with planted shoulders and worn cobbles at the bridge landing. Moss, uneven grassy ledges and small groups of reeds accent the outer moat coping.

The near terrain painter, cold fallback and distant terrain use the same Greyhaven material sampler. The shoreline and moat retain their existing water masks. The updated approach is part of the Tideglass trail network and its encounter protection. Trees and rock outcrops use native footprints. The ground cover and bank plants leave the approach walkable.

## Verification

- All 16 focused Castle and Wilds terrain tests passed. The route collision probe sampled 954 centerline and shoulder positions from Stormwatch to the entrance. All were on dry ground or a supported bridge deck.
- Muted Electron comparison used desktop `1.2.162` and the updated source at matched camera positions. The exact `1.2.165` package passed 60 walkthrough checks with no renderer or Worker errors. The test walked into and out of the castle and checked the cold terrain and moat masks, the rendering fallback, and the dry, shallow and deep bands on the east shore. The capture and report are in `test-output/greyhaven-review/coastal-1-2-165/`.
- The broader suite was stopped after it surfaced the event roster failure for “When the Smoke Walks.” The same assertion failed when run against the previous `1.2.164` package.

## Desktop build

- Windows desktop `1.2.165` was packaged from modified source at `a6cee9bc55ad12ed58df5c3d27b150449f31ef26`.
- `dist/1.2.165/Wildbound-win32-x64/Wildbound.exe` is the numbered executable. The pinned `Wildbound Worlds (1.2.165)` desktop shortcut uses `Play Wildbound.cmd -BuildDirectory "dist\1.2.165\Wildbound-win32-x64"` and the normal save profile.
- The muted package boot reached the lobby without renderer errors. Both launcher checks selected `1.2.165`, and all 29 checked Castle and Tideglass files matched the packaged copies.
