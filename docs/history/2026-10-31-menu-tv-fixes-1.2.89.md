# Wildbound mode, Classic grid and TV cavern fixes - 1.2.89

October 31, 2026. User follow-ups are included before completing source/web publication.

- Wildbound and Classic mode clicks now commit the mode immediately. Wildbound sets the starting environment back to House and bounded travel; its map-table preview persists when the chooser closes without Accept. Classic selects a valid non-House destination. Both the map table and central board receive the same effective preview environment rather than a default forest-only board.
- House remains the Wildbound starting location but is excluded from Classic choices. Nine destinations plus Random fit a five-column, two-row grid. Controller spatial navigation, tooltips and map selections are preserved.
- Ground enemies in the lobby Mario game now use the shared solid collision movement, including level-two masonry, bricks, roofs and pipes; they turn when blocked.
- Cavern ceiling blocks and individual blue pillar tiles are breakable from below. Sliding turtle shells break side-hit bricks, ceiling blocks and pillar tiles, then ricochet. Question blocks activate when hit by a shell.
- Respawn searches for clear body space on the playable floor and never chooses the cavern roof merely because it is the highest overlapping solid. Death/respawn preserves the main play area.

Verification: 48 focused unit tests passed; 34 muted Electron selector checks; 37 muted Electron train/Mario checks including the real lobby-to-train app transition. Captures: test-output/expedition-review/classic.png and test-output/train-review/mario-level-two.png. The earlier full 1,705-test run predates these follow-up fixes; targeted existing and new tests cover the modified paths. Physical controllers, subjective feel, online play and FPS remain unverified.

Source revision is the commit containing this note. Build web 1.2.89 and the desktop package from that clean source revision, then publish gh-pages while preserving original/ and earlier snapshots. Generated manifests/receipts identify exact paths and timestamps. Both desktop shortcuts target Play Wildbound.cmd with blank arguments and normal saves. All authorized local source/assets/tests/notes are being pushed; local saves, profiles, builds, logs and shortcuts remain excluded.
