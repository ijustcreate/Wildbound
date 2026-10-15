# Server computer — do this next

This is the exact handoff for the server computer's Codex. The user has approved putting the Wildbound player join key in GitHub so the client can connect automatically. Do not put the admin token in GitHub.

## 1. Pull the correct branch

Run these commands from the Wildbound checkout. Do not reset or delete the existing `server-data/` folder; it contains the live world and server credentials.

```powershell
git fetch origin
git checkout codex/server-host-handoff-2026-10-14
git pull --ff-only
pnpm install --frozen-lockfile
```

If there are local changes, preserve them and report them before continuing. Do not replace the existing world save or configuration.

## 2. Start or verify the persistent server

If this server has not been initialized yet:

```powershell
pnpm run server:init
```

Start the server with:

```powershell
Server Control.cmd
```

Wait until the control panel reports the authority as healthy and shows a public game address. The game address must be the WebSocket game endpoint, ending in `/game`. Use the public `wss://.../game` address for players, not the loopback admin address.

## 3. Publish the player connection values

Edit the tracked file `server-connection.json` with the values from this running server:

```json
{
  "address": "wss://THE-CURRENT-PUBLIC-HOST/game",
  "joinKey": "THE-PLAYER-JOIN-KEY-FROM-server-data-config.json",
  "explorerName": "Explorer",
  "autoConnect": true
}
```

Use the player `joinToken` from the private server configuration. Never use or publish `adminToken`. The public address may change after a Quick Tunnel restart; update this file whenever that happens.

Validate the JSON before committing:

```powershell
Get-Content server-connection.json | ConvertFrom-Json | Format-List
```

## 4. Rebuild and verify the client

```powershell
pnpm run package
```

The packaged executable is:

```text
dist/1.1.0/Wildbound-win32-x64/Wildbound.exe
```

The client header should show **LIVE WORLD**. With `autoConnect: true`, clicking it should use the checked-in address and key without asking the user to copy anything.

## 5. Commit and push the handoff

Commit only the connection handoff and source/build changes. The `server-data/` folder, world saves, logs and admin credentials must remain untracked/private.

```powershell
git add server-connection.json OTHER_COMPUTER_HANDOFF.md SERVER_CODEX_NEXT_STEPS.md
git commit -m "Publish Wildbound player connection handoff"
git push origin HEAD:codex/server-host-handoff-2026-10-14
```

Report the pushed commit and the public game address. Do not report or commit the admin token.
