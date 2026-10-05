# Wildbound development instructions

Read [docs/DEVELOPMENT_HANDOFF.md](docs/DEVELOPMENT_HANDOFF.md) before resuming work on a different computer, user account or checkout. Read the latest relevant notes in `docs/history/` for unresolved issues and verification limits.

## Preserve the working game and user data

- Default to the **Electron desktop game**. The browser version is a separate supported target, not a replacement for a broken desktop launch. Do not switch launch methods without the user's agreement.
- Identify the actual repository root, Git branch, remote and dirty files before editing. Never assume a previous machine's absolute path or desktop shortcut is valid here.
- Preserve uncommitted work, authored assets, local saves and unfinished editor drafts. Do not reset/clean the checkout or replace profiles to troubleshoot.
- A Git pull updates source, not ignored `dist` builds or another user's desktop shortcut. Rebuild before claiming that a packaged game includes pulled changes.
- After every cross-computer pull, run `Play Wildbound.cmd --check` from the repository root. A missing or mismatched build identity means the executable is stale; use `scripts/rebuild-desktop.ps1` before playtesting. Do not use an older version or a `night-hunt-*` preview as an automatic fallback.
- Use project-relative paths in scripts and the current user's resolved Desktop for shortcuts. Quote paths containing spaces. Point the shortcut at `Play Wildbound.cmd`, which verifies and launches the exact current build, and use `assets/wildbound-icon.ico`. Never preserve an old direct executable shortcut as the "Latest" launcher after a pull.
- Keep profile choice explicit. Running Electron with `--preview` uses a different profile from normal launch. A missing character or house may mean the wrong profile, not missing code.
- `authored/rigs.json` is shared through Git; local house libraries, drafts, characters, expeditions and browser storage are not automatically shared. Locate and back up the intended version before migrating anything.

## Diagnose and verify

- For freezes or apparently missing controllers, inspect renderer exceptions and live diagnostics before changing mappings, packaging or security assumptions. A stopped frame loop can resemble controller failure.
- Test meaningful UI changes in Electron, not only with syntax checks or mocked canvas tests. Cover selection transitions, empty/occupied slots, controller-family labels, multiple panels and small windows when relevant.
- Do not claim hardware playtesting or FPS improvements from unit tests alone. State what was measured and what remains unverified.
- Do not change Windows security settings, disable protection or imply signing is the cause without evidence of a security block. Distinguish that from JavaScript/renderer/launch-path errors.
- Finish requested build work with a verified output path and shortcut target. Do not terminate another player's game to test without permission.
- On a new machine, verify Node/npm and the local Electron binary before changing launch methods. If dependencies are missing, install them with `npm ci`; then run the desktop rebuild script. Its test, package, build identity and shortcut checks must succeed before describing the desktop as updated.

## Handoff and Git

- Commit/push only when requested. Preserve other work and avoid force pushes.
- Include source, tests, intended shared authored assets and a concise handoff note: symptoms, causes, changes, checks, remaining issues and build identity.
- When handing off, state the Git commit and whether the packaged build was created from modified source. Give the exact launcher or shortcut target and identify normal versus `--preview` save profile. On the receiving machine, compare the remote revision, local checkout, build identity and shortcut target in that order.
- Exclude generated `dist`, dependencies, profiles, logs, tokens and local shortcuts. Do not publish personal saves as source.
- A source push does not update GitHub Pages or create a downloadable release. Treat those as distinct operations.
