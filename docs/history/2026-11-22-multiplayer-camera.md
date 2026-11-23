# Multiplayer camera and Studio controls

Checkout: `C:/Users/New User/Desktop/Wildbound`, branch `Wildbound_worlds`, origin `https://github.com/ijustcreate/Wildbound.git`, base commit `f0b787ff33c3ac8f3675b48504937ebda4f0dcb5` plus existing modified source. No commit/push requested. Existing assets, unfinished work, saves and running games are preserved.

## Behavior

- New camera policy shares one view while explorers fit above the configured zoom-out floor, then separates distant groups into two, three or four views. Nearby players can share a view. Three views use a full-width top view plus two below, or a tall left view plus two on the right. Four use quadrants. View slots follow party order. There are never five or six viewports; readability for more than four widely separated players is not supported in this iteration.
- Regrouping requires extra space (merge ratio) and continuous dwell time before merging, reducing threshold flicker. Camera following is time-based. Default zoom range is 0.65–1.65, with a 64-world-pixel margin, 0.78 merge ratio and 0.7-second regroup wait. These units use Wildbound's existing half-resolution logical viewport.
- Terrain streaming keeps independent per-view predictions, queued ground requests and pinned tiles. Expired views release prefetch work. It prepares the visible camera areas rather than loading the entire gap between distant players.
- Exploration and the railway/Wild Lands render separate cameras over the same simulation, preserving all actors and controller ownership. Pointer-to-world conversion chooses the viewport under the pointer. Inventory play-area reservations are respected. Split graphics resources are released on merge or departure. Shared global notices are drawn once and per-view HUDs are compact.
- Opening board, travel, sealing, existing room/TV windows, realm-viewer scenes and the Wild Lands overview retain their established camera handling. This is the multiplayer surface camera; it does not replace those separate scene systems.
- Studio → Camera is a dedicated editor workspace with zoom range, margins, merge ratio/wait, follow speed, divider size, two/three-view layouts and enable/disable controls. The draggable two/three/four-player test map previews the same grouping policy. Save applies immediately and persists on this device under `wildbound-multiplayer-camera-v1`; reset defaults is a preview until saved. Profiles and expedition saves are not migrated or replaced.

## Verification

18 focused policy/terrain scheduling tests passed. They cover splitting, cluster ownership, four-view cap, roster changes, hysteresis/delay, slot order, layouts, settings validation, jump headroom and independent terrain prefetch/pinning. Muted isolated source Electron passed 38 checks with zero renderer errors, including native exploration/railway rendering, two/three/four viewports, pointer projection, regrouping, native simulation movement, small canvas, panel reservation, editor controls, persistence across a fresh module load and the real terrain worker preparing all four views. Source screenshots were visually reviewed. Receipts are in ignored `test-output/multiplayer-camera/source/`.

## Final desktop delivery

- `scripts/rebuild-desktop.ps1 -TestConcurrency 4` completed successfully: 1,995 tests passed, zero failures; 893 runtime files syntax checked; package and shortcut checks succeeded.
- Packaged muted isolated Electron: all 38 camera/editor/worker checks passed with zero renderer errors. Packaged screenshots were visually reviewed. All seven changed runtime files exactly match the source by SHA-256.
- The actual packaged `Wildbound.exe --boot-smoke-test --mute-audio` booted the lobby successfully in an automatically isolated test profile: `failed: 0`, no runtime errors.
- Exact output: `C:/Users/New User/Desktop/Wildbound/dist/1.2.107-2026-11-23T02-45-55-376Z/Wildbound-win32-x64/Wildbound.exe`.
- Build identity: version `1.2.107`, base commit `f0b787ff33c3ac8f3675b48504937ebda4f0dcb5`, `sourceDirty: true`, built `2026-11-23T02:46:09.488Z`. This package includes existing modified source; no commit or push was made.
- Verified normal launcher and shortcut target: `C:/Users/New User/Desktop/Wildbound/Play Wildbound.cmd`. Desktop shortcut `C:/Users/New User/Desktop/Wildbound Worlds (1.2.107).lnk` has blank arguments, the repository working directory and `assets/wildbound-icon.ico`. Normal profile, without `--preview`; existing player saves and running games were preserved.
- Consolidated receipts: `test-output/multiplayer-camera/delivery.json`; rebuild log `test-output/multiplayer-camera-build.log`; source/packaged camera reports and screenshots in `test-output/multiplayer-camera/`.

Physical controllers, remote multiplayer behavior and sustained FPS remain unverified.
