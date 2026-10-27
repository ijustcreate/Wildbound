# Wildbound 1.2.76 — broom view markup corrections

Verified October 26, 2026 (America/Los_Angeles). Active checkout: `C:/Users/New User/Desktop/Wildbound Server Branch Build`, branch `Wildbound_worlds`, commit `1bd5ef027966e371f21cd0956b96b0aa4a62144b`, packaged from modified source. No commit or push.

## Changes

- Follows the user's retained eight-view markup in `docs/art/references/broom-view-markup-2026-10-26.png`: flatter shaft pitch, raised/tucked feet and knees, deliberately drawn witch-hat silhouettes for each facing.
- Passenger uses the same projected pelvis and shaft transform as the actual mounted rig. The pet is queued above the broom in every facing, with near/far character occlusion; no separate ground shadow or duplicate external passenger draw. Mouse facing follows the mount.
- Only an exact match of the previous shipping default broom clip migrates to the new pose. Authored/custom animation keys remain untouched. Actual 1.2.75 default motion was checked against the migration.
- Includes the completed 1.2.75 broom, Bone Carver, mausoleum/pit, pixel editor, shared beholder, slime crown and reliquary fixes. See the preceding release note for their scope and persistence details. The rejected later humanoid style study remains removed.

## Build and checks

- Exact output: `dist/1.2.76-2026-10-27T05-29-58-387Z/Wildbound-win32-x64/Wildbound.exe`.
- Built UTC `2026-10-27T05:30:08.929Z`; normal save profile, no preview argument.
- Desktop `C:/Users/New User/Desktop/Wildbound Worlds (1.2.76).lnk` targets `C:/Users/New User/Desktop/Wildbound Server Branch Build/Play Wildbound.cmd`, with blank arguments and `assets/wildbound-icon.ico`. Launcher `--check` selects this exact package.
- Full rebuild: 1,664 tests passed, zero failures; 478 runtime syntax files. Packaged source/assets: 1,160 exact matches, 206,673,847 bytes, matching manifest/build identity.
- Packaged Electron: broom/Bone Carver 21 checks, pit 7, editor/pixel save 9, shared beholder 3, reliquary pickup/UI 21. All 61 checks passed with empty renderer error lists. Editor stdout prints the first eight checks; its saved report includes the ninth pixel-save check.
- Actual packaged EXE muted isolated boot: ready, version 1.2.76, failed=0, errors empty. Eight-view mouse/frog review image: `test-output/broom-mount/broom-eight-views.png`.
- Rig guard passed with no allowed changes. Authored rigs SHA256 remains `DC05411B47F02259BE95EA0ED22AEA375D76F79B55D7F0BDEC57DA5DF7ED7D71`. Normal saves/drafts preserved.
- Technical checks do not establish user approval of the revised appearance. Physical controller playtesting, remote multiplayer, FPS and long-session balance remain unverified.

## Persistent artist setup

The existing Wildbound Artist persona `b0edbefc-4705-4bd9-80dd-917a8777ddc4` is a specialist for this master chat. Its profile uses the installed pixel-assets skill, motion-transfer for donor rigs and imagegen for appropriate concept/raster work. `docs/art/artist-reference-kit/evidence.json` retains eight original-feedback entries and three selected images from a review of 17 locally readable Wildbound chats. Approval scope, the old-rig failure, partial improvements and the later rejected humanoid study are explicitly separated. `office-profile.json` records the artist profile and current-chat routing scope. This office setup is separate from the packaged game; no claim of automatic routing from every independent chat.
