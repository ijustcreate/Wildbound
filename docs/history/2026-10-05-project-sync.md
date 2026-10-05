# October 5, 2026: desktop project sync

The user requested publishing this computer's changes and pulling GitHub changes. Initial local HEAD and fetched origin/main both identified `3c3fe40274558d9f62c0c8d62c9b1944e9c02eb0`; no incoming commits were present. The accumulated source, tests, shared authored rigs and September 30/October 1 handoffs are included in the commit containing this note.

The work addresses stale desktop launch paths and preview-profile confusion, adds TV course completion and the separate 2D Wildbound mode, improves lobby collision footprints and human rig rendering, and adds Panther artwork, animation, energy-driven combat and tree behavior. See the earlier handoffs for detailed causes and changes.

Verification before committing: 587 serial Node tests passed, zero failed; `git diff --check` passed. The previous 1.0.50 package was built from the initial HEAD plus modified source at `2026-10-01T21:36:02.218Z`. Rebuild after this sync with `scripts/rebuild-desktop.ps1`; the new package identity must name the commit containing this note and report clean tracked source. The sync chat reports the final build identity and outcome.

Expected output is `dist/1.0.50/Wildbound-win32-x64/Wildbound.exe`. The current user's Desktop `Wildbound Latest (1.0.50).lnk` targets repository `Play Wildbound.cmd`, with the repository working directory and `assets/wildbound-icon.ico`. This launcher uses the normal Electron profile, without `--preview`.

The earlier packaged smoke harness reported 14 failures of 99 checks; this sync does not resolve or supersede that result. Physical controller playtesting, extended Panther encounters and full manual TV traversal remain unverified. Generated builds, logs, local shortcuts and personal saves are excluded from Git. A receiving computer must check its launcher and rebuild locally after pulling.
