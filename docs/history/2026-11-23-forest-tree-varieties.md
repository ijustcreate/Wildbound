# Two-tier oaks and autumn maples

The two reference clips showed a tall tree with a visible fork between its crowns and a shorter gold-orange tree beside green trees. The mature oak reuses Wildbound's native leaf-cluster brush and adds two offset crowns on one rooted trunk. The original maple uses compact sprays of amber foliage, rust undersides, and forked limbs. [Maple art brief](../art/2026-11-23-autumn-maple.md)

New green Classic forests and eligible Boundless chunks choose a few existing oak positions per area. The choice is seeded and spaces featured trees apart. Tree IDs, root anchors, sizes, collision, and routes stay stable. Classic saves store the new flags and older trees load as their previous species. Railway and Wilds scenery use their separate tree rendering path.

The main world renderer checks overlap with each crown separately and eases the alpha for that tier. The rooted contact remains visible. Split-screen views calculate fades for their own players. Water reflections draw an intact silhouette, and point lights have separate crown volumes and paint bounds. Harvesting uses the native tree-fall and stump rendering paths.

Placement checks covered 48 Classic seeds and 48 Boundless chunks, plus current and legacy Classic save round trips. The focused forest, save, Boundless, and Wild Lands suite passed 41 checks. The focused forest renderer and lighting suite passed another 41 checks, with some overlap between the suites.

The muted source Electron run passed all 38 checks with zero renderer errors. It captured a naturally generated riverbank oak, compared both new trees with the ordinary oak, and verified both single-tier fades, simultaneous fading, restoration, split-screen ownership, torchlight, and felling through log drop and stump. Review images and the report are under `test-output/forest-tree-variants/source/`. The broad repository suite was stopped partway through the run.

## Desktop verification

The same 38 checks passed against the desktop package with a muted window, zero renderer errors, and exit code 0. Evidence is under `test-output/forest-tree-variants/packaged/`. All ten changed runtime files matched the current source hashes. An initial captured executable smoke run timed out during shutdown after reporting a ready lobby. The direct muted executable recheck reached the lobby, reported zero errors, and exited 0.

- Final launcher-selected build `C:/Users/New User/Desktop/Wildbound/dist/1.2.113-2026-11-23T21-27-36-399Z/Wildbound-win32-x64/Wildbound.exe`. This newer package also matched all ten runtime files, passed 38 muted scene checks, and passed a direct muted executable boot with exit code 0.
- Manifest version `1.2.113`, built `2026-11-23T21:28:21.622Z` from commit `34393ae3d2983b6a0022ec614d94c6c95cadffdf` and modified tracked source. Normal save profile. The earlier package ending in `21-24-47-255Z` also passed the scene and boot checks.
- Shortcut `C:/Users/New User/Desktop/Wildbound Worlds (1.2.113).lnk` targets `C:/Users/New User/Desktop/Wildbound/Play Wildbound.cmd` with blank arguments and the repository icon. `Play Wildbound.cmd --check` selected the exact package above.
