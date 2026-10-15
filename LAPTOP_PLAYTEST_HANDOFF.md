# Laptop: build and join this PC's live world

## Pull this branch, not main

Use `codex/server-host-handoff-2026-10-14`. Its new commit contains the dashboard, local support-report diagnostics and current live player connection configuration. `main` has not received these changes. Preserve any laptop modifications and profiles before switching; do not reset or clean them.

```powershell
git fetch origin
git switch codex/server-host-handoff-2026-10-14
git pull --ff-only
npm ci
& .\scripts\rebuild-desktop.ps1
& '.\Play Wildbound.cmd' --check
```

If the branch does not exist locally, use `git switch --track origin/codex/server-host-handoff-2026-10-14`. Read `AGENTS.md` and `docs/DEVELOPMENT_HANDOFF.md` first. Confirm Node/npm and Electron are installed; the rebuild must finish successfully. Do not terminate someone's running game to rebuild. Do not use a browser or old preview as an automatic fallback.

The build is `dist/1.1.0/Wildbound-win32-x64/Wildbound.exe`; the version number remains 1.1.0, so **compare the build's commit identity, not just its version**. A pull transfers source, not the generated executable. The rebuilt Desktop **Wildbound Latest (1.1.0)** shortcut must target this laptop's repository `Play Wildbound.cmd`, with its repository working directory and Wildbound icon. Use the normal profile, not `--preview`.

## Play

Open **Wildbound Latest (1.1.0)**, then click **LIVE WORLD**. The packaged `server-connection.json` contains this host's verified public WSS game address and, with the user's explicit approval for this playtest, its player join key. It must not contain the admin token. The preset requests an automatic connection when the button is clicked. Previously remembered local connection settings can override the preset; if the laptop still tries an old address/key, use the connection dialog to replace them with the current preset. Choose your explorer name and retain the same normal desktop profile for reconnect credentials.

Do **not** run Server Control on the laptop to join. This PC remains the authority. A blank dashboard on the laptop does not imply the remote host is down. Local characters/inventories are not imported into the server. The authority has six persistent explorer slots; reuse the existing reconnect identity instead of making repeated fresh test characters.

The host must remain powered on with the server/tunnel running. The current quick-tunnel hostname is temporary and can change after a server restart; if connection stops working, check the host dashboard and update the tracked preset before rebuilding clients. The admin listener is loopback-only and is not a player address.

## What changed here

- Server Control is now a dashboard showing players, observed session duration, activity, saves, uptime, world seed, simulation tick and local/public health. It polls every five seconds and may miss connections shorter than a poll interval.
- Reopening the monitor focuses one instance; closing hides it in the tray. **Quit status monitor** does not stop the world. **Stop server safely** does.
- Local diagnostic history is bounded/rotated under ignored `server-data/diagnostics/`. **Export support report** produces JSON for issue reports, with build/source identity, runtime versions, health/count observations and errors. It excludes player names, addresses, credentials and save contents. Nothing is automatically uploaded.
- No updater/deployment automation was installed; that pipeline remains paused.

## Verification and known limits

The previous branch build at `a1eacff` passed all 1,110 tests, syntax checks, actual packaged boot and source/package hash comparison. The dashboard additions passed focused diagnostics privacy/rotation tests and muted Electron checks for player rows, safe untrusted names, small windows and offline controls. Repeated live dashboard launches produced one monitor while the original server process remained healthy. A fresh receiving-machine rebuild must pass before play.

Real laptop connectivity and physical controllers are still to be verified. The older broad editor/debug smoke has 16 unresolved failures. The user's earlier report that Wildbound mode and other gameplay appeared older is **not resolved by matching a version number**: this branch includes the other PC's `f71c9b4` integration commit, but its map selector still offers Bounded/Boundless. That commit also changed Heartwood portal dispatch/rendering; full party traversal needs a manual regression check. Compare the actual newer development checkout if gameplay still differs. Do not overwrite newer laptop work just because this branch packages successfully.

Attach a support report, screenshot, reproduction steps and the exact build commit when reporting issues. Do not attach private server settings, world saves, tokens or profiles to GitHub. See `docs/PERSISTENT_SERVER.md` for server operations.
