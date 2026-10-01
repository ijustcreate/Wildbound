# Wildbound development instructions

Read [docs/DEVELOPMENT_HANDOFF.md](docs/DEVELOPMENT_HANDOFF.md) before resuming work on a different computer, user account or checkout. Read the latest relevant notes in `docs/history/` for unresolved issues and verification limits.

## Preserve the working game and user data

- Default to the **Electron desktop game**. The browser version is a separate supported target, not a replacement for a broken desktop launch. Do not switch launch methods without the user's agreement.
- Identify the actual repository root, Git branch, remote and dirty files before editing. Never assume a previous machine's absolute path or desktop shortcut is valid here.
- Preserve uncommitted work, authored assets, local saves and unfinished editor drafts. Do not reset/clean the checkout or replace profiles to troubleshoot.
- A Git pull updates source, not ignored `dist` builds or another user's desktop shortcut. Rebuild before claiming that a packaged game includes pulled changes.
- Use project-relative paths in scripts and the current user's resolved Desktop for shortcuts. Quote paths containing spaces. Point shortcuts at the exact verified build, with its working directory and `assets/wildbound-icon.ico`.
- Keep profile choice explicit. Running Electron with `--preview` uses a different profile from normal launch. A missing character or house may mean the wrong profile, not missing code.
- `authored/rigs.json` is shared through Git; local house libraries, drafts, characters, expeditions and browser storage are not automatically shared. Locate and back up the intended version before migrating anything.

## Diagnose and verify

- For freezes or apparently missing controllers, inspect renderer exceptions and live diagnostics before changing mappings, packaging or security assumptions. A stopped frame loop can resemble controller failure.
- Test meaningful UI changes in Electron, not only with syntax checks or mocked canvas tests. Cover selection transitions, empty/occupied slots, controller-family labels, multiple panels and small windows when relevant.
- Do not claim hardware playtesting or FPS improvements from unit tests alone. State what was measured and what remains unverified.
- Do not change Windows security settings, disable protection or imply signing is the cause without evidence of a security block. Distinguish that from JavaScript/renderer/launch-path errors.
- Finish requested build work with a verified output path and shortcut target. Do not terminate another player's game to test without permission.

## Handoff and Git

- Commit/push only when requested. Preserve other work and avoid force pushes.
- Include source, tests, intended shared authored assets and a concise handoff note: symptoms, causes, changes, checks, remaining issues and build identity.
- Exclude generated `dist`, dependencies, profiles, logs, tokens and local shortcuts. Do not publish personal saves as source.
- A source push does not update GitHub Pages or create a downloadable release. Treat those as distinct operations.
