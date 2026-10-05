# September 30, 2026: desktop handoff follow-up

Received laptop commits `c6fb5a0` and `a8eaf70` on the original Windows checkout. The checkout was clean and fast-forwarded from `493c3ea` to `a8eaf70`.

## What went wrong

- The repository's `Play Wildbound.cmd --check` selected `dist/1.0.39/Wildbound-win32-x64/Wildbound.exe` even though `package.json` and the pulled source were at 1.0.45. The normal launcher also passed runtime `--preview`, selecting the separate preview save profile. A source pull did not update ignored `dist` packages or desktop `.lnk` files.
- `build/Launch Wildbound.cmd` preferred a local Electron development runtime and old package paths over the current package. The README still advertised 1.0.31. These paths made it easy to launch a different build than the one just pulled.
- The laptop's gameplay commit fixed an actual `count` argument error in the quiver renderer, plus controller join handling, inventory sizing, the lobby display rule and fern rendering. Its tests and notes are in the prior handoff. This follow-up does not claim real controller playtesting on this machine.

## Changes prepared in this checkout

- The normal launcher now chooses only `dist/<package.json version>/Wildbound-win32-x64`, uses the normal save profile, and checks a packaged `wildbound-build.json` against the local Git commit. It reports a missing or stale build instead of falling back to an old version.
- `scripts/rebuild-desktop.ps1` runs the Node suite, packages, and refreshes the Desktop shortcut. The shortcut targets the repository launcher so a later pull also triggers the freshness check. It uses the current user's resolved Desktop and project icon.
- `AGENTS.md`, `README.md` and `docs/DEVELOPMENT_HANDOFF.md` now give the receiving machine a single rebuild path and identify the remote, checkout, package and shortcut as separate identities.

## Verification and limits

- Full Node suite: 566 passed, 0 failed. Runtime syntax check: 166 files. Isolated Electron inventory sizing check: stable at heights 850, 600 and 420.
- Local 1.0.45 package created from `a8eaf70` plus uncommitted handoff-script changes; `Play Wildbound.cmd --check` reports its path, source commit and build time. A test shortcut was created under ignored `test-output/handoff-desktop`, with a launcher target and project working directory. The real Desktop shortcut was not changed in this follow-up.
- The packaged 1.0.45 app boots and writes a smoke report, but that older in-app suite reports 14 failures out of 99. The previously packaged 1.0.44 app reports 15 out of 99; all 14 failures in 1.0.45 were also present in 1.0.44. One inventory mouse action check improved. These failures cannot be attributed to the laptop commit from this comparison. The old lobby portrait smoke check still queries a removed `.player-slot canvas`, and the Field Kit smoke sequence tries to render after its controller-open assertion fails. The remaining assertions need a separate smoke-harness review or hands-on verification. Read `resources/test-output/results.json`; the Windows GUI process command's exit status alone did not expose those failures.
- No push was made. The updated handoff scripts and instructions remain local until intentionally committed and pushed. A receiving machine must rebuild its own package and shortcut after pulling them.
