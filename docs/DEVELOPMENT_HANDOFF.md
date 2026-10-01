# Moving Wildbound development between computers

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

The project remote is `https://github.com/ijustcreate/Wildbound`. Inspect outstanding local work before pulling. On a clean checkout tracking the intended branch, use `git pull --ff-only`. If it cannot fast-forward, reconcile the branches deliberately; do not reset away work. Read `AGENTS.md` and the latest relevant handoff in `docs/history/`.

## 2. Run the desktop source build

With Node.js/npm installed, the npm lockfile supports:

```sh
npm ci
npm start
```

`npm start` runs `electron .` from this checkout. Run dependency installation only after accounting for any locally modified dependencies. If Electron's runtime is missing, diagnose dependency installation; do not silently redirect the user to the web launcher. Users of a complete packaged game do not need Node.js installed.

## 3. Build and recreate the shortcut on this computer

Close the old build before replacing its versioned output, after checking with anyone using it. From the checkout:

```sh
node --test tests/*.test.mjs
node scripts/package.cjs
```

Only after packaging succeeds, run in PowerShell:

```powershell
& ./scripts/create-desktop-shortcut.ps1 -DesktopPath ([Environment]::GetFolderPath('Desktop'))
```

The script targets `dist/<package.json version>/Wildbound-win32-x64/Wildbound.exe` and assigns the project icon. Verify the shortcut target and working directory and launch it to confirm the intended game loads. Do not carry `.lnk` files with another user's absolute paths to the new machine.

For non-overwriting test builds, `node scripts/package.cjs --preview` creates a timestamped `dist/night-hunt-...` folder. The existing shortcut script does **not** select these folders: a test shortcut must explicitly target the exact successful output. This packaging flag names the output; it does not itself add the runtime `--preview` argument.

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

Before a requested push, inspect the diff and tests. Add a handoff with the source commit, symptoms and observations, implemented fixes, test results, unverified behavior and outstanding user questions. Push without forcing, then verify the remote revision. Source pushes, GitHub Pages deployments and release uploads are separate actions.
