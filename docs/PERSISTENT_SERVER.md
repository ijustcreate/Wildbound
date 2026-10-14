# Persistent forest server — desktop 1.1.0

`server/start.mjs` runs the real game simulation in Node.js. One process owns terrain, the board and events, world time, players, inventories/equipment, NPC quests, enemies, combat, projectiles, pickups, followers, and Heartwood Passage. Desktop clients send validated inputs/actions and render snapshots; they do not advance a second authoritative world.

## Start this computer as the host

Install Node.js 24 (the tested version is 24.19.0) and the project dependencies. The corrected npm lockfile resolves `postject@1.0.0-alpha.6`; it previously referenced an unpublished version. Use `npm ci` on a receiving checkout with missing dependencies. The existing pnpm lockfile also supports `pnpm install --frozen-lockfile`.

```powershell
npm run server:init
```

Initialization creates `server-data/config.json` only if absent, with independently generated private admin and player join keys. It never replaces an existing configuration or world. Default ports are game `4183` and admin `4184`, both initially on loopback.

`Server Control.cmd` starts the dedicated server if needed, waits for authenticated local health, then opens its operator panel. The process runs hidden with logs in `server-data/server-stdout.log` and `server-data/server-stderr.log`. Closing the panel hides it in the tray; it does not stop the server. **Stop server safely** saves before closing the server and its owned temporary tunnel. The launcher will not kill another process to claim a port.

For an explicit foreground console or a custom configuration:

```powershell
node server/start.mjs --config "C:\path with spaces\config.json"
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/start-persistent-server.ps1 -ConfigPath "C:\path with spaces\config.json"
```

## LAN and internet connections

For LAN connections, set `bind` to `0.0.0.0` in the private configuration and use `ws://HOST_LAN_IP:4183/game`. The admin host remains `127.0.0.1`. This PC's observed LAN address during setup was `10.0.0.180`; DHCP can change it.

This host was configured with `publicTunnel: "quick"` and an installed `cloudflared` binary. The server starts its own hidden Cloudflare Quick Tunnel to **only game port 4183**, obtains a `wss://...trycloudflare.com/game` address, and checks that the remote WebSocket endpoint responds with this world's instance ID. The operator panel shows the current address and its public health. **Copy player join key** copies the private member key locally; it is never displayed in status JSON or written to source.

Quick Tunnels are temporary playtest endpoints: their hostname changes after a restart and they have no uptime guarantee. Use a named tunnel/domain for permanent hosting; see [Cloudflare's documentation](https://developers.cloudflare.com/tunnel/get-started/quick-tunnels/). Configure an external named tunnel or reverse proxy to forward WebSockets to `http://127.0.0.1:4183`, set `publicTunnel` to `none`, and set `publicAddress` to `wss://YOUR_DOMAIN/game`. Do not route `4184` or `/admin/*` to the internet. This implementation does not change Windows protection, firewall rules, router configuration, or other applications' tunnels.

The game endpoint rejects `/admin/*`; the admin server always binds to loopback and requires `x-wildbound-admin-token` for every route. Do not share the admin token. Player join keys and reconnect credentials are also private. Use WSS for internet connections. A working self-probe establishes that the configured public route reaches this authority; a separate computer/network must still verify end-to-end play.

## Join and reconnect

1. Launch the verified desktop build with `Play Wildbound.cmd` (normal profile).
2. Choose **Shared forest**, enter the address, join key, and explorer name.
3. Enter the world. The connection banner shows connected, reconnecting, rejected, and operator notices. **Leave server** returns to the local lobby.

Each client controls one server explorer with keyboard or controller. Up to six explorers are recorded in a world. First join creates a server-owned explorer with normal starting supplies; clients cannot import arbitrary local inventory, health or coordinates. Local expeditions stay saved separately. Rejoining restores server inventory/progression rather than overwriting it with a local character. The server roster is persistent: a new name/client is a new explorer, so keep reconnect credentials to avoid exhausting the six slots.

Private reconnect credentials are saved in that client's desktop storage, keyed by world instance and explorer name. Automatic reconnect uses the same credential and never claims a character by name alone. If a public hostname changes, enter the new address and the same explorer name on the same client; the handshake finds the recorded world credential. Unknown credentials and simultaneous ownership of one explorer are rejected. Moving to a new computer requires deliberately migrating that client's reconnect credential; copying game source does not migrate it.

Inventory, shops, drag transfers, bag contents, crafting, skill training and companion care are validated on the authority. Development item spawning and invincibility are unavailable from a connected client's console. Heartwood Passage can be requested there; the server opens it and moves the shared live party, retaining inventory and saved home/forest state. No client generates its own persistent forest.

The world pauses when no clients are connected. Disconnected explorers remain in the party while others play; they are not removed from the persistent roster. The server uses the game's existing cooperative board/party rules, not an MMO population model.

## Saves and recovery

`savePath` resolves relative to the config file, independently of all Electron profiles. Default: `server-data/world-v1.json`. Saves include version, world instance, seeded random state, tick, identity hashes and the complete expedition. Reconnect tokens are hashed in the world save; the operator configuration contains the separate join/admin keys.

The server serializes writes, flushes a unique temporary file, backs up the previous primary, then atomically replaces it. It autosaves every ten seconds and saves on disconnect and safe stop. An exclusive lock prevents two authority processes from opening the same world. An interrupted previous process leaves a stale lock which is recovered only after its PID is confirmed absent.

Invalid primary saves can recover from a valid backup without replacing that backup with corrupt data. If both are invalid, startup stops and preserves both. A failed shutdown save leaves the authority and lock available to the operator instead of silently discarding the world. Keep separate backups of the entire private server data directory while the server is stopped.

Changed and removed scenery in streamed outer chunks is checkpointed on saves/world transitions and restored after chunk unload or server restart. Historical chunk edits and inactive journey worlds are retained by the authority but excluded from live network packets. Snapshots are bounded and slow clients are disconnected with a reconnectable identity.

## Admin API

The loopback listener provides `GET /admin/status` and authenticated `POST /admin/save`, `/admin/announce`, `/admin/stop`. Announcements accept JSON `{ "message": "..." }`, limited to 240 characters. Status includes uptime, active players, world seed, last completed save, tick, roster count, authority/tunnel counts, local/public health, addresses, and save/simulation/tunnel errors. Public health is never assumed from a configured hostname alone.

## Build and verify

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/rebuild-desktop.ps1 -TestConcurrency 4
& '.\Play Wildbound.cmd' --check
node scripts/run-electron-check.cjs scripts/verify-persistent-desktop.cjs
```

The rebuild runs the full Node suite, syntax checks, Windows packaging, build identity, and shortcut creation. Runtime dependencies are copied from their real package directories, supporting npm and pnpm without bundling development dependencies or private data. The renderer uses `resources/app` rather than ASAR so dynamic imports resolve.

Run the packaged executable with `--boot-smoke-test --mute-audio` to verify its own module graph and title/lobby UI in an isolated profile. `test-output/boot-smoke.json` beside the executable must report `failed: 0`. Set `WILDBOUND_VERIFY_APP` to the packaged `resources/app` folder and run the two-client desktop verification for that exact packaged graph. Its report is `test-output/persistent-desktop.json` in the checkout. Automated Electron windows mute before loading and do not change player sound preferences.

The older broad `--smoke-test` harness also exercises editor workflows. Its initial run had legacy UI assumptions and failures; read its exact report instead of treating its exit alone as proof. Current multiplayer/package acceptance uses the focused two-client and packaged boot reports, with the full Node suite separately required.

Source pushes, client ZIP distribution, public hosting and GitHub releases are separate operations. This work does not publish the browser viewer or upload a release automatically.
