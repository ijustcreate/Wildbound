# Moving Wildbound development between computers

Current desktop release: [1.0.78 local wall, door, furniture and tree destruction](history/2026-10-06-structure-destruction-1.0.78.md), following 1.0.77 crypt rendering/doorway fixes and 1.0.76 inventory layout/tooltips. Inspect `wildbound-build.json` and the exact verification reports; rebuild on another machine. The hosted web root remains at its previous build; the separate web release remains `/Wildbound/releases/1.0.74/`.

Previous local release: [1.0.72 accumulated UI/coast/spider/map-selector build](history/2026-10-06-ui-coast-spiders-1.0.72.md), plus subsequent creature/event/biome additions. Earlier local history notes describe pre-integration modified checkouts; they are not the final 1.0.74 commit identity.

Latest local work: [1.0.71 parallel anaconda/quicksand/adaptive audio/settings, character creator and wildlife/storage polish](history/2026-10-06-parallel-polish-1.0.71.md), including [1.0.70 spiraling board seal and bounded finale rendering](history/2026-10-06-seal-vortex-1.0.70.md), [1.0.69 regular starter chest, complete starter selection and safe per-level restock](history/2026-10-06-starter-chest-1.0.69.md), [1.0.68 humanoid warlock, inventory-sized robot/buyback, compact victory chest and companion locomotion](history/2026-10-06-warlock-robot-companions-1.0.68.md) and [1.0.67 inventory matching the user's hand-drawn layout](history/2026-10-06-inventory-sketch-1.0.67.md). These changes are not committed or pushed. The previous shared release is [1.0.66 paper doll, lobby storage, TV controls/parallax and victory treasure](history/2026-10-06-paper-doll-tv-treasure-1.0.66.md), built on [1.0.65 inventory, controller ownership, companions and spell visuals](history/2026-10-05-inventory-companions-1.0.65.md), including the preceding 1.0.56–1.0.64 game/UI/assets work. Always use `Play Wildbound.cmd` and rebuild on a receiving computer; a source push does not transfer the packaged executable.

This repository carries the game source and shared authored rig artwork. A desktop shortcut, packaged build, browser save and Electron profile are separate things. Pulling Git does not update them automatically.

## 1. Open and synchronize the correct checkout

Open the cloned **Wildbound repository folder** as the workspace, not a previous machine's Desktop path or an arbitrary shell folder. From that root inspect:

```sh
git rev-parse --show-toplevel
git status --short --branch
git remote -v
git fetch origin
git log -3 --oneline
```

The project remote is `https://github.com/ijustcreate/Wildbound`. Inspect outstanding local work before pulling. On a clean checkout tracking the intended branch, use `git pull --ff-only`. If it cannot fast-forward, reconcile the branches deliberately; do not reset away work. Read `AGENTS.md` and the latest relevant handoff in `docs/history/`. Record the receiving checkout's commit with `git rev-parse HEAD`.

## 2. Run the desktop source build

With Node.js/npm installed, the npm lockfile supports:

```sh
npm ci
npm start
```

`npm start` runs `electron .` from this checkout. Run dependency installation only after accounting for any locally modified dependencies. If Electron's runtime is missing, diagnose dependency installation; do not silently redirect the user to the web launcher. Users of a complete packaged game do not need Node.js installed.

## 3. Build and recreate the shortcut on this computer

First check what the repository launcher would run:

```powershell
& '.\Play Wildbound.cmd' --check
```

It reports the exact executable, source commit and build time. If it reports a missing or mismatched build, the pulled source is newer than the package. Do not use an old desktop shortcut as evidence that the pull worked. Close the target build before replacing it, after checking with anyone using it. Then run from the checkout:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\rebuild-desktop.ps1
```

This single step runs the Node tests, packages the current source, writes `wildbound-build.json` beside the executable, and creates or refreshes the versioned Desktop shortcut. It checks for the local Electron dependencies and stops if the target game is running. The shortcut targets this checkout's `Play Wildbound.cmd`, which checks the build each time before opening `dist/<package.json version>/Wildbound-win32-x64/Wildbound.exe`; it uses the project icon. Run `Play Wildbound.cmd --check` again, inspect the shortcut target and working directory, and launch it to confirm the intended game loads. Replace old shortcuts that target an executable directly. Do not carry `.lnk` files with another user's absolute paths to the new machine. If the Desktop is redirected, pass `-DesktopPath` to the rebuild script.

For non-overwriting test builds, `node scripts/package.cjs --preview` creates a timestamped `dist/night-hunt-...` folder. The normal launcher and shortcut do **not** select these folders: a test shortcut must explicitly target the exact successful output. This packaging flag names the output; it does not itself add the runtime `--preview` argument. The normal launcher does not pass `--preview`, so it uses the normal Electron profile.

Keep the entire packaged directory together when distributing a playable build. `dist/` is ignored by Git. Rebuild on the destination or deliberately transfer a complete release; pulling source alone is not enough.

## 4. Preserve the right saves and editor work

On Windows, normal Electron uses the `wildbound` folder under the current user's roaming AppData. Runtime `--preview` instead uses `Wildbound Night Hunt Preview`. A different Windows account has different profiles. Confirm the running app's actual user-data path when diagnosing.

Browser storage is separate again, and is specific to its origin (including port) and browser profile. GitHub Pages, localhost and Electron do not automatically share saved state.

Before transferring local data, close the relevant apps and back up both source and destination. Compare versions and drafts; do not blindly overwrite newer destination work. Prefer existing export/import facilities where available. In particular:

- `authored/rigs.json` is intentionally shared in the repository; see `authored/README.md`.
- House Builder uses `wildbound-house-designs-v1` and `wildbound-house-state-v1` in local storage, with a desktop `house-designs-v1.json` backing file when saved. The state can contain an unfinished draft distinct from the active version.
- Characters and expedition progress live in the local profile, not in source control.
- Do not commit whole profiles, personal saves, controller claim files or diagnostic logs merely to move development.

If the house looks old, establish which profile/origin/computer holds the intended layout before modifying the default generator. Missing custom data must not be treated as permission to discard it.

## 5. Verify and report honestly

Inspect local live diagnostics (see `docs/live-diagnostics.md`) and renderer errors when the game freezes, ignores input, or leaves the lobby on screen. Confirm the launched executable corresponds to the new build. For inventory layout changes, `npx electron scripts/verify-inventory-sizing.cjs` uses an isolated test profile to check selection stability.

Before a requested push, inspect the diff and tests. Add a handoff with the source commit, symptoms and observations, implemented fixes, test results, unverified behavior and outstanding user questions. Push without forcing, then verify the remote revision. The receiving machine should check four identities: remote commit, local HEAD, `wildbound-build.json` source commit, and desktop shortcut target. A source push cannot update the other machine's package or `.lnk`; run the rebuild there. Read the packaged smoke report's `failed` count when one is run; a process exit alone is insufficient. Source pushes, GitHub Pages deployments and release uploads are separate actions.
