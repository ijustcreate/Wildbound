# Actor water depth and desktop build 1.2.156

Players, monsters, and NPCs now draw behind the waterline as they move from dry ground into shallows and deep water. Classic Beach samples the same stable shoreline as the ground artwork. Woodland Railway and Wild Lands use their local water geometry. The existing swim and dive poses still handle deep swimming. Ground support and airborne state determine when the figure stays above the waterline.

## Desktop build

- `dist/1.2.156/Wildbound-win32-x64/Wildbound.exe` was packaged at 9:12 p.m. Pacific on November 24 from a fixed snapshot of modified `Wildbound_worlds` source at `a6cee9bc55ad12ed58df5c3d27b150449f31ef26`. The snapshot avoids mixing files from concurrent edits in the shared checkout.
- `Play Wildbound.lnk` and `Wildbound Worlds (1.2.156).lnk` on the Desktop target `C:\Users\New User\Desktop\Wildbound\Play Wildbound.cmd` with `-BuildDirectory "dist\1.2.156\Wildbound-win32-x64"`. The launcher and both shortcuts select the normal save profile.

## Verification

- The snapshot passed 50 targeted Node tests and syntax checks on 1,210 runtime files. The full live-checkout runs were interrupted by in-progress changes from other work.
- The packaged executable booted to a ready lobby in muted smoke mode. The content verifier matched 2,083 packaged runtime and asset files byte for byte.
- Muted packaged Electron passed 14 actor-water checks and nine tide checks, including dry, shallow and deep silhouettes, jumps, above and below the pier, tide reversal, and both raster seams. Reports are in `test-output/water-actor-clipping/packaged/`, `test-output/beach-surf/`, and `test-output/water-depth-desktop-content-report.json`.
- Muted source Electron also verified shallow and deep actor positions on Woodland Railway and the Wild Lands South Beach.
