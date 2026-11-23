# Shadow Realm forest trees and rolling clouds

The user rejected the broad single-cap tree and thin fog bands, then asked to reuse moving trees from other zones at the same pixel density.

- Shadow `wither_tree` now uses the forest oak renderer: five overlapping leaf clusters, cached leaf flutter frames, native wind and tree-fall behavior. Only its palette and realm size adapter differ. The workshop/reflection sprite is rasterized from the same native drawing functions. Painting an override disables the native renderer marker.
- Rounded scalloped lavender cloud banks replace screen-sized fog sheets. Lit curl ridges animate through eight phases. Running leaves paired counter-rotating billows; the existing advected density field still carves and replenishes trails. Root/shin curls are separate foreground elements; a bounded foreground composite clears faces.
- Limits: eight fluid fields, 64 running billows, 192 cloud draws per pass, 16 cached cloud stamps and one foreground buffer (up to 1024 x 768) per render canvas.
- Existing authored placements, collision, custom sprites, profiles and saves are preserved. No commit or push.

Validation: 30 focused tests passed. Source muted Electron passed 68 checks, including actual animated oak pixels, forest/Shadow tree comparison, fog trails, split clock, override behavior, depth, reflections, saved portal round trip and workshop availability. Packaged muted Electron also passed all 68 checks with zero renderer errors, including the final foreground face-clearing adjustment. The actual packaged EXE passed its muted boot smoke test.

Desktop build: `dist/1.2.110-2026-11-23T17-36-33-570Z/Wildbound-win32-x64/Wildbound.exe`. Version 1.2.110; source commit `f0b787ff33c3ac8f3675b48504937ebda4f0dcb5`, packaged from modified tracked source; normal profile (not `--preview`). Packaging syntax-checked 940 runtime files.

Launcher and shortcut verified: `C:\Users\New User\Desktop\Wildbound\Play Wildbound.cmd`; `C:\Users\New User\Desktop\Wildbound Worlds (1.2.110).lnk` targets that launcher with the repository icon. `Play Wildbound.cmd --check` selects the exact package above.

Build boundary: the six changed tree/fog/asset runtime modules match source hashes; packaged render contains both live `wither_tree` timing paths. Concurrent chats changed `src/diagon-wand-shop-assets.mjs`, `src/diagon-wand-shop.mjs`, `src/enemy-combat-catalog.mjs`, and `src/render.mjs` after the package snapshot (current scan: 942 runtime files). This package does not claim those later edits. Receipt: `test-output/shadow-underworld/canopy-cloud-build-receipt.json`; packaged scene report: `test-output/shadow-underworld/packaged/report.json`; boot and launcher logs use `canopy-cloud-*` in the same output directory.

Visual evidence: `test-output/shadow-underworld/source/nativeTreeComparison.png`, `lowClouds.png`, `cloudTrail00.png` through `cloudTrail09.png`. These are implementation review images, not user approval of the art direction. No hardware playtest or FPS claim.
