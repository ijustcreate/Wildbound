# Chest UI and playable lobby polish

The chest screenshot mixed and clipped the backpack, chest grids and footer. Actual storage menus now use a dedicated parchment layout with an explicit title, separate labeled containers, occupied/empty slot wells, selected-item summary, transfer buttons and controller help. Wide windows use paired grids, narrow windows stack six-column grids, and very short windows collapse the inactive container. Controller row movement follows the visible column count. Automatic controller tooltips no longer cover the chest grid; pointer/focus descriptions remain available. No native scrollbars are visible.

Lobby object captions appear only near an active player. TV, explorer station and difficulty captions sit above their art. Target totals appear after damage, hold for 60 seconds, then fade over three seconds. The practice floor and target lever have revised native pixel art.

TV players use a seated pose on the existing humanoid rig, retaining limb lengths and authored assets. Two independent controllers render in the hands; separate pixel cable curves stay attached to the console front and moved controller. Walking away releases the controller. TV collision uses its actual floor base so players can walk behind it. Station, TV, map table, dice tray and starter chest tops are jumpable; the grounded difficulty totem stays solid at every jump height, with its marker lowered.

Level supply chests reuse starter-chest art, with snow in ice and sand in desert. Forest and jungle/temple chests have saved deterministic perched visitors that flee nearby players. Rendering does not mutate their state or consume RNG.

Map-menu Down from Boundless enters the map grid; rectangle overlap determines vertical neighbors. Wildbound mode and Close have separate gaps. Concurrent character-select, creature and gameplay edits were preserved.

## Verification and desktop

- Final focused Node run: **82 passed, 0 failed** in `test-output/lobby-chests-final-node.log`, covering lobby practice/arrows/props/TV, map navigation, NPC fixture anchors, raised-surface exits and native death timers.
- Full serial regression run: 1,222 passed and six failed before test corrections. All six were stale assumptions (old wall/furniture location/index, mocked practice missing players, or fixed three-second death duration); all affected files passed in the final focused rerun. The entire serial suite was not repeated after those test-only corrections.
- Muted isolated packaged Electron: actual lobby proximity labels, TV pickup/drop, eight seated views, flexible cables, TV depth/top, four biome chests, target timing, map-menu navigation/gaps, five chest window sizes, transfers, controller row movement, pagination and two independent owner panels. No renderer errors. `test-output/lobby-room-polish-report.json` and `lobby-chests-final-electron.log` also record inventory sizing and character creator checks.
- Packaging syntax checked **328 runtime files**. Normal-profile build `1.0.112-wow-creatures`, built `2026-10-08T20:53:48.576Z`, modified source at `bc1b432d20f4b0de0b04d4d3b34600f7a9fe0a70`. Seventeen requested runtime implementation files byte-match the package (`lobby-chests-packaged-content.json`).
- Multiple user chats are editing this checkout. A whole-checkout byte check after packaging found subsequent unrelated edits in `authored/rigs.json`, `src/elephant-pixels.mjs` and `src/house-builder.mjs`; this release is the verified snapshot above, not a claim to contain future concurrent work. Rebuild for those later changes. Do not reset their source, assets or saves.
- Verified `Play Wildbound.cmd --check`; desktop `Wildbound Latest (1.0.112-wow-creatures).lnk` targets the repository's `Play Wildbound.cmd`, normal save profile, with `assets/wildbound-icon.ico`. No player processes were terminated. No commit or push.

Useful screenshots: `test-output/chest-menu-480.png`, `chest-menu-1280.png`, `chest-menu-two-players.png`, `lobby-playing-canvas.png`, `lobby-polish-seated-chests.png` and `lobby-polish-map-menu.png`. Offscreen capturePage can lag canvas-only drawing; the playing image is exported directly from the native lobby canvas.
