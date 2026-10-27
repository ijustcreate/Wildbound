# Show the lobby plaque after explorer confirmation

Joining creates a temporary Scout player before an explorer is selected. The
roster renderer previously displayed every joined player, exposing that temporary
name/portrait above the character chooser.

In the lobby, roster cards now require both an assigned profile and the lobby
member's spawned flag. Confirming a saved explorer or creating one enables the
card through the existing selection flow. Previewing options or closing an
unconfirmed chooser leaves it hidden. Expedition roster behavior is unchanged.

Validation: 27 focused lobby/practice/storage tests pass. The isolated muted
Electron controller check passes 25 assertions, including two successive joins,
no card during preview, actual Choose confirmation, correctly named cards after
selection, retained portal/dash controls and HUD transfer between lobby/play.
Simulated controllers only; no hardware playtest claimed.

Current checkout: Desktop/Wildbound Server Branch Build, Wildbound_worlds,
1.2.54, modified source on 1bd5ef027966e371f21cd0956b96b0aa4a62144b.
Build identity and packaged checks are appended after the rebuild.
# Verified desktop delivery

Packaged `dist/1.2.54-2026-10-22T20-54-20-063Z/Wildbound-win32-x64/Wildbound.exe`, built 2026-10-22T20:54:31.980Z from modified source on 1bd5ef027966. All 1,505 tests pass; 402 runtime files pass syntax checks; 1,025 packaged files match source. Actual executable boot smoke: ready lobby, worlds enabled, no failures/errors. Packaged Electron regression: all 25 selection/input/nameplate checks pass (simulated Xbox and Switch pads; physical controllers not tested). Launcher check selects this build. Desktop Wildbound Worlds (1.2.54).lnk targets this repository's Play Wildbound.cmd with normal saves. No commit or push.

