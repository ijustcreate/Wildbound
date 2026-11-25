# Mermaid Lagoon sprite scale

The four mermaids read oversized beside the player in the original lagoon scene, particularly when comparing faces and shoulders at the waterline. Their world sizes are now 35 for Vespera, 34 for Luma, 36 for Coralie, and 33 for Neri, about one third smaller across the cast.

The world renderer scales each character and their props around the existing pelvis anchor. Neri’s ripples are tighter around that contact point. Dialogue portraits and Rig Studio use their own presentation scales.

## Verification and build

- Three focused tests passed. The muted Electron comparison used an identical camera and broom rider pose in `1.2.171` and `1.2.172`. The exact `1.2.172` run passed all 45 checks with the terrain Worker active, including the four conversations, portrait, brush and harp loops. At the same reference pose, the measured heights of Vespera, Luma, Coralie and Neri changed from 60, 58, 42 and 54 pixels to 40, 40, 29 and 36 pixels. The rider measured 31 pixels in both runs.
- The Windows `1.2.172` package was built from modified source at `a6cee9bc55ad12ed58df5c3d27b150449f31ef26`. Both changed files matched the packaged copies by SHA-256. The muted executable boot and both launcher checks passed.
- The pinned `Wildbound Worlds (1.2.172)` desktop shortcut points to `Play Wildbound.cmd -BuildDirectory "dist\1.2.172\Wildbound-win32-x64"` and opens the normal save profile.
