# Classic level selector redesign 1.2.87

- Reworked Classic destinations as a vertical list with a map icon at left, clear map label, and a visible selected state.
- Map descriptions remain in a dedicated preview below the list. The list scrolls independently while Accept stays available.
- Selecting a destination persists immediately. Keyboard/controller navigation traverses the Classic options, map rows, and Accept; focus scrolls the selected row into view.
- The title prompt identifies keyboard and controller as the join inputs, without mentioning mouse.
- Focused muted Electron verification: `scripts/verify-expedition-scroll.cjs`, 29 checks passed. Review image: `test-output/expedition-review/classic.png`.
- Full rebuild: 1,695 tests passed; 512 runtime files syntax checked. `Play Wildbound.cmd --check` passed.
- Package: `dist/1.2.87-2026-10-29T20-15-45-884Z/Wildbound-win32-x64/Wildbound.exe`, built 2026-10-29T20:16:16.240Z from source commit `d2720a4da60b468884b350e422ae7ab875c31f61` plus modified tracked/untracked source. Normal profile.
- Desktop shortcut: `C:\Users\New User\Desktop\Wildbound Worlds (1.2.87).lnk` targets `Play Wildbound.cmd` with blank arguments and the repository as working directory.
- No commit or push. Physical controller hardware and an in-game user playtest remain unverified.
