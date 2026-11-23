# Chicken carrying, storage and house polish — November 17, 2026

Request: lower the carried chicken and animate holding/throwing; make storage portals smaller, dimensional at floor contact and owner-colored; simplify and fit the storage popup, omit gold/XP, use smaller current chests, refresh vending/SCRAP-9, and retain the room behind robot conversations.

Changes:
- Missing-only editable chicken_hold/chicken_throw clips on the existing player rig. Walking/jumping legs remain active; the chicken follows the projected grip instead of a fixed overhead offset. A 0.46-second throw releases once after 0.16 seconds and recovers; weapon input cannot turn it into a sword strike. Calm placement remains separate.
- Both private-storage portal directions render at 76% of the previous size, using a palette derived from the owner's current highlight. A storage-only PixelFX depthFloor option suppresses the old flat floor line/skaters; perspective light, elliptical contact traces and bounded rising motes replace it. Upstream default effect behavior remains available in the particle editor.
- Thin dark room frame, compact title/close control, no room wallet/XP. Room camera fits the actual 290×197 artwork rectangle; centered and co-op rail panels retain their appropriate footprints. No authored room layouts or saves rewritten.
- Storage uses the current shared expedition chest renderer at compact scale, with matching smaller collision bounds. Vending uses one new native pixel cabinet design for the room and its live shop preview; catalog, stock/prices and collection tray remain separate controls.
- SCRAP-9 and vending use restrained dark surfaces and clearer selection. Floating controller-selection tooltips no longer cover the grids; selected robot stack/value appears in its notice. Room backdrops remain live while robot introductions or either shop is open and clean up when returning to the room. Shop wallets remain where needed for purchases; the room itself omits gold/XP.

Verification: 20 focused Node checks passed initially. Muted, isolated Electron review passes 44 checks: eight carry headings, timed native throw, owner palette previews, room/shop/robot-introduction at 1280×850 and 640×480, real vending purchase/collection, and close-to-room transitions. No renderer errors. Captures and reports: ignored test-output/storage-refresh/.

Desktop build receipt follows below. Source: Wildbound_worlds, f0b787ff33c3ac8f3675b48504937ebda4f0dcb5 plus modified source; no commit/push. Existing Bayou/landing artwork and concurrent car artwork are preserved. Normal saves, house drafts and authored rigs are not replaced. Physical controllers, online replication, FPS and extended user playtesting are unverified.


## House follow-up
- Removed decorative surface interactions and cooking/reward prompts while preserving the artwork. Candles, ordinary lights and doors remain interactive. Stove/tap/bed controls win over nearby chicken pickup.
- Stove and sink have independent persisted applianceOn states. Burner flames flicker and cast warm light. The faucet streams into a bounded filling basin; switching it off stops the stream and slowly drains the basin. Dynamic overlays avoid repainting the destructible furniture caches every frame. These runtime states are excluded from authored-layout comparison.
- Bed sleep places the existing native sleep pose on the pillow under a gently breathing duvet, hides the standing player marker, adds three rising sleep letters, heals 16% max HP per second, and wakes on movement/jump, combat input or damage. Waking restores a safe bedside position. A map/seed change clears the sleep marker without returning the player to old world coordinates. A held chicken is set down before resting.
- House yards use the same live native meadow renderer and forest palette as the forest; floors, furniture, paths and pools remain excluded. Existing house grass artwork maps to the forest palette at render time without rewriting personal saves.
- 15 focused house/presentation/grass Node checks pass. Muted isolated Electron review passes 9 checks, including real Interact, sink fill, burner lighting, bed healing/wake, no bowl/cutting-board actions and active native forest grass (8,094 submitted instances in the reviewed yard scene; not an FPS measurement). Evidence: ignored test-output/house-living/.
- Dice question checked in source: two independent uniform 1–6 dice; Wildbound travel is triggered by totals 5 or 8 (9/36 = 25%). No odds or travel-trigger changes.
- Initial broad suite: 1,824 passed, one car-entry assertion failed while separate vehicle edits were in progress. The current car-repair tests pass; final complete rerun is recorded below.


## Verified combined desktop receipt
- Final rebuild: 1,834 tests passed, zero failed; 841 runtime files syntax checked. Six final focused house interaction checks pass, including closer-door priority. Both feature drivers rerun against the exact packaged app: 44 storage/chicken/shop checks and 9 house checks, all passed with audio muted and no renderer errors.
- Actual packaged EXE --worlds-smoke-test --mute-audio exited 0. Its test-output/worlds-desktop.json reports failed: 0, errors: [], requests: [] and audioMuted: true. Test profiles are isolated.
- Package: dist/1.2.101-2026-11-17T17-05-33-688Z/Wildbound-win32-x64/Wildbound.exe. Built UTC 2026-11-17T17:05:54.354Z, version 1.2.101, source f0b787ff33c3ac8f3675b48504937ebda4f0dcb5 plus modified source, preview: false. Includes the concurrent car work as well as the preserved Bayou and landing artwork.
- Content comparison: 1,573 runtime/source files match byte-for-byte, zero mismatches; package.json matches the production normalization that removes scripts/private/devDependencies. Intentionally excluded donor source data and backups are not runtime package failures. Report: test-output/storage-refresh/packaged-content.json.
- Launcher --check selects the exact package above. Desktop C:/Users/New User/Desktop/Wildbound Worlds (1.2.101).lnk targets C:/Users/New User/Desktop/Wildbound/Play Wildbound.cmd, blank arguments, repository working directory and assets/wildbound-icon.ico. Normal save profile. The existing player game was left running; reopen through the shortcut/launcher to load these changes.
- No source commit/push, web deployment or release upload. Shared authored rigs and personal saves/drafts were preserved. Physical controllers, online replication, extended user playtesting and FPS remain unverified.
