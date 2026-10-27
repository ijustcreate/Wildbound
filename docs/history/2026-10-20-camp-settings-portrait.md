# Camp Settings portrait redesign — 1.2.51

The previous broad rectangular settings window did not follow the supplied portrait artwork. Rebuilt the modal as a 0.53 width/height sign, scaling as a unit to the viewport. Exactly three tabs remain: Display, Sound and Controls. Active tabs expand to show their name; inactive tabs show ivory icons.

DALL·E assets: `assets/settings-sign-v2.png` provides an irregular transparent wooden silhouette, dark inset and iron nails. `docs/art/settings-layout-blockout.png` is the requested simplified layout reference. `docs/art/settings-button-flow.html` and `settings-interaction-flow.md` describe the interaction path. The game scenery remains behind the modal.

Native selectors and sliders retain their game handlers; arrow wrappers route changes through the same input/change events. Toggles use pill artwork. Controller Up/Down skips decorative arrows; Left/Right adjusts values. Done stays outside the scrollable body. Existing advanced mappings remain in an expandable Controls section. Removed Player tab; retained the hidden legacy appearance container to preserve existing integration while character creation remains available from the lobby.

Controls now persist real radial dead zone, response curve, X/Y aim inversion, attack vibration, prompt family and layout presets. Camera and aim-assist rows from the concept were not added as inert controls; the shipping game uses the corresponding existing 2D input functions instead. Hardware rumble was not physically tested.

Verification: `scripts/review-camp-settings.cjs` checks live persistence, three tabs and portrait bounds at 1280×850, 600×430 and 962×1635. `scripts/verify-lobby-settings-controller.cjs` covers 77 synthetic input/ownership assertions, including real slider/checkbox persistence and skipping decorative arrows. `tests/settings-camp.test.mjs` verifies radial defaults, response/inversion and malformed saved values. Full desktop rebuild and packaged verification results are reported with delivery.

Checkout: Wildbound_worlds; source commit 1bd5ef027966e371f21cd0956b96b0aa4a62144b plus existing modified source. Preserve all prior uncommitted work and saves. Normal desktop launcher uses the normal profile; automated Electron checks use isolated muted profiles.

Delivered build: `dist/1.2.51-2026-10-20T16-52-20-928Z/Wildbound-win32-x64/Wildbound.exe`. Rebuild passed all 1,486 tests and checked 394 runtime files. Packaged boot smoke, all 77 controller assertions and the three-size UI/persistence review passed with no renderer errors. Asset/style SHA-256 hashes match the source. Desktop `Wildbound Worlds (1.2.51).lnk` targets this checkout's `Play Wildbound.cmd`; launcher `--check` resolves the new build successfully. Normal save profile is retained. No physical controller or rumble hardware claim is made.
