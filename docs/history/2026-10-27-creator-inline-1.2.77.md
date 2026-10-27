# Wildbound 1.2.77 — compact color tools and inline appearance close-ups

Verified October 27, 2026, America/Los_Angeles. Active checkout `C:/Users/New User/Desktop/Wildbound Server Branch Build`, branch `Wildbound_worlds`, commit `1bd5ef027966e371f21cd0956b96b0aa4a62144b`, built from modified source. No commit/push.

## Behavior

The shared creation popup previously covered the whole creator, hiding the character while choosing colors. Hair and face selection opened another full-panel view. The user requested a compact palette over the color-option column and close-ups inside the existing preview.

- Palette and custom spectrum now occupy only the color column beside the original character. Position follows panel/preview resizing and accounts for panel scrolling. Compact layouts retain a usable preview and scroll the creation body when necessary.
- Hover, focus and controller navigation preview named colors immediately. Custom spectrum and brightness changes also preview live. Confirm commits; Cancel/Back restores the color from when the palette transaction began, including after visiting the spectrum. Back from spectrum returns to the palette first.
- Hair style and Face details replace the clicked row with inline previous/current/next/Done controls. The original preview canvas zooms to hair or face; no new appearance overlay or second preview canvas. The face view is closer than hair. Rotation and selected direction remain on the same preview. Done/Back restores full framing while keeping selected hair/face details.
- Controller focus is tracked explicitly through opening/closing inline controls and live palette navigation, independently of OS window focus. Hidden controls are omitted from navigation. Existing controller-family prompts and player ownership remain.
- Existing character artwork, palettes, rigs and saved custom parts are preserved. These are UI/camera changes, not replacement character art. The rejected standalone lily-pad study remains outside gameplay.

## Verification and delivery

- Full rebuild: 1,664 tests passed, zero failures; 478 runtime syntax files checked.
- Packaged content: 1,160 exact source/assets matches, 206,678,042 bytes; matching manifest and normal-profile identity.
- Packaged Electron: `verify-creator-inline.cjs` passed 101 checks; `review-creator-colors.cjs` passed 258 checks. The existing character-creator flow also passed: Xbox/Switch labels, 19 hair/9 face choices, independent player controls, owner-only keyboard typing/delete/commit and drop-in creator behavior. Responsive checks covered approximately 1280x850, 780x600 and 600x430; very small windows use scrolling. No renderer errors in these runs.
- Actual packaged executable boot: ready, version 1.2.77, failed=0, empty renderer errors. All automated windows muted before loading and used test profiles; normal profiles and sound settings unchanged.
- Authored rigs SHA256 unchanged: `DC05411B47F02259BE95EA0ED22AEA375D76F79B55D7F0BDEC57DA5DF7ED7D71`.
- Exact executable: `dist/1.2.77-2026-10-27T07-21-54-981Z/Wildbound-win32-x64/Wildbound.exe`, built UTC `2026-10-27T07:22:07.411Z`.
- Desktop shortcut: `C:/Users/New User/Desktop/Wildbound Worlds (1.2.77).lnk`; target `C:/Users/New User/Desktop/Wildbound Server Branch Build/Play Wildbound.cmd`; blank arguments, normal save profile, `assets/wildbound-icon.ico`. Launcher `--check` selects this exact build.
- Physical controllers, remote multiplayer and FPS were not measured. Simulated input checks do not establish hardware playtesting or user approval of the revised UI.

## Review artifacts

`docs/art/reviews/2026-10-27-creator-inline/` contains matched Electron panel captures: `color-before.png`, `color-after.png`, `hair-before.png`, `hair-after.png`, and `face-after.png`, plus `review.json`. Before uses packaged 1.2.76; after uses the verified 1.2.77 source/package. Names, default appearance, viewport and time-zero pose are matched; framing and popup behavior intentionally differ. Helpers and detailed reports remain in `scripts/verify-creator-inline.cjs` and `test-output/creator-inline/`.
