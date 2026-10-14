# Codex task: make Wildbound's persistent forest server live

This file is an implementation handoff for the Codex instance running on the server PC.

## Goal

Turn the current Wildbound desktop game into a working shared-world game. The server PC must own one persistent expedition world, save it, accept multiple game clients, and expose a safe local admin panel. Players should be able to enter the same live forest world from separate computers.

## Current state

- The repository is `ijustcreate/Wildbound`, branch `main`.
- The dev-only Heartwood Passage portal exists in `src/forest-portal-event.mjs`.
- `Server Control.cmd` launches a control window, but it is only a control client.
- The control window expects a dedicated server admin listener at `127.0.0.1:4184`.
- The existing `network.cjs` room transport is temporary per-room LAN hosting. Do not mistake it for the persistent server.
- The current packaged Electron build has an ASAR/dynamic-module loading problem. `scripts/package.cjs` must package the app in a way that allows `file://` dynamic imports of `app.mjs` and its `src/*.mjs` graph; verify the fix with a packaged smoke test.

## Required implementation

1. Add a dedicated server process, preferably `server/` or `server.cjs`, with a documented start command.
2. Make the server authoritative for:
   - world seed and generated forest layout;
   - board/event state;
   - player identity, position, inventory, equipment, health, followers, and progression;
   - enemies, pickups, portals, projectiles, combat, and world time;
   - save/load and clean shutdown.
3. Persist the world in a versioned save file under a server data directory. Write atomically, keep a backup, and never use the client profile as the server save.
4. Add a versioned network protocol with handshake, reconnect, snapshots, input/action messages, server ticks, and error handling. Validate all client input on the server.
5. Add a public game endpoint for clients. Keep the admin listener bound to loopback only.
6. Implement the admin API expected by the existing control panel:
   - `GET http://127.0.0.1:4184/admin/status`
   - `POST http://127.0.0.1:4184/admin/save`
   - `POST http://127.0.0.1:4184/admin/announce`
   - `POST http://127.0.0.1:4184/admin/stop`
   - Require the `x-wildbound-admin-token` header for every admin request.
7. The status response must include:
   `uptimeSeconds`, `playerCount`, `players`, `worldSeed`, `lastSave`, `authorityCount`, `tunnelCount`, `localHealth`, `publicHealth`, and `publicAddress`.
8. Wire the desktop game client to a server connection mode. It must show connection state, handle reconnects, and use server snapshots rather than independently simulating authoritative world state.
9. Add configuration for bind address, public address, port, save path, and admin token. Never commit a real token or private tunnel credential.
10. Add `Server Control.cmd` or an equivalent service launcher that starts the server and then opens the control panel. It must report a useful error if dependencies or configuration are missing.

## Forest requirements

- A new server world should generate a forest clearing with paths and at least two points of interest.
- The Heartwood Passage should be able to move the live party into the server-owned forest world.
- Re-entering the forest must restore the saved forest state, not generate a fresh client-only copy.
- Multiple connected players must see the same terrain, entities, pickups, portals, combat results, and follower state.

## Packaging requirement

Fix and verify the Windows desktop build before declaring the task complete. The current error is:

`Failed to fetch dynamically imported module ... resources/app.asar/app.mjs`

The packaged app must launch from the desktop shortcut, load `app.mjs`, load the full `src/*.mjs` graph, and reach the title screen. Prefer the smallest packaging change that is proven by a packaged smoke test; do not silently weaken security settings.

## Tests and acceptance criteria

- Unit tests for protocol validation, reconnects, save/load, admin authentication, and atomic persistence.
- Integration test with one server and at least two simulated clients entering the same forest and observing the same world state.
- Test save, restart, and restore of the same world seed and player progress.
- Test admin save, announce, and stop with a valid token; reject missing or invalid tokens.
- Test that the admin port is not bound to a public interface.
- Run the existing test suite and packaged smoke test.
- Build a fresh Windows package and verify it from a clean desktop shortcut.
- Update `README.md` with exact server start, client connect, LAN, and public deployment instructions.

Do not claim the live server is complete while the control panel only reports offline or while clients still run independent local worlds.
