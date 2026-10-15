# Read this before integrating the server computer's work

## Purpose and source mismatch

The user requested this branch, `codex/server-host-handoff-2026-10-14`, to transfer all work performed on the host PC. It starts from GitHub `main` commit `6d471420435ea91daccbc4947c17a6a049b8fc90`.

The user tested the desktop and reported that Wildbound mode and quite a lot of other gameplay were older than on the development computer. Matching GitHub main did **not** prove that the newest development-computer work had been transferred. The map table here offers Bounded/Boundless and seven environments. The existing TV follow-on mode exists, but that is not evidence that this checkout has the requested newer Wildbound mode. Locate and preserve the newer development checkout before integrating this branch. Do not overwrite it with this branch or treat version 1.1.0 as proof of newer gameplay.

## Work implemented here

- Dedicated persistent authority under `server/`, with versioned validated protocol, six explorer slots, server-owned simulation/inventory/actions, reconnect identities, atomic saves/backups, exclusive world lock and saved streamed forest changes.
- Desktop Shared forest connection and reconnect UI, authoritative inventory/crafting/pet actions and Heartwood Passage. Local profiles are kept separate from server progress.
- Loopback authenticated administration and Server Control panel for health, addresses, player-key copying, save, announcements and safe stop. This computer is the intended public host. An owned temporary Cloudflare quick tunnel exposes the game endpoint, not the admin API.
- Electron packaging fixed for the full module graph and production dependencies. Missing boot helpers/modules restored; event-index/biome migration, socket and scenery-collision fixes included. Inspect the diff when combining these with newer gameplay, especially `app.mjs`, `src/core.mjs`, `src/definitions.mjs`, `src/rooms.mjs`, `src/playable-lobby.mjs` callers, inventory code and tests.
- Desktop launcher verifies build identity without requiring Git on Explorer's PATH. Server launcher finds installed Node.js if absent from PATH. CMD files use absolute system PowerShell. No Windows security/firewall changes.

## Verification and limits

Full source suite: 1,110 passed. Focused authority suite: eight passed. Actual packaged executable boot passed. Two muted Electron clients using packaged modules passed movement, inventory/panel ownership, occupied/empty gear, small windows, simulated Xbox/Nintendo labels, reconnect, Heartwood Passage and leaving without contaminating local saves. Public WSS probe passed; public admin returned 404.

The older broad editor/debug smoke run still has 16 failures, including stale UI assumptions and a FieldKit smoke exception. Physical controllers, another computer joining, performance gains and production uptime remain unverified. A quick tunnel changes address on restart and is temporary. This is a limited-roster shared host, not MMO infrastructure.

## Build and private data

The host's existing normal-profile build is `dist/1.1.0/Wildbound-win32-x64/Wildbound.exe`, built at `2026-10-14T17:47:58.190Z` from base `6d47142` plus modified source. Launcher refinements followed packaging. Desktop Latest shortcut targets repository `Play Wildbound.cmd`; Server Control shortcut targets `Server Control.cmd`. Neither points directly at an old executable. Read the actual manifest before launching after a checkout change.

Private `server-data/` configuration, tokens, live worlds, logs, Electron profiles, local house drafts/characters, dependencies, generated builds and shortcuts are excluded from this branch. The user has explicitly approved publishing the player join key in this repository for this playtest, so the host Codex must update the tracked `server-connection.json` after the server is running. Put the public game address in `address`, the player join key (not the admin token) in `joinKey`, and leave `autoConnect` true. Do not publish the admin secret.

## Client connection handoff

After starting the persistent server and confirming its public tunnel/address, update `server-connection.json` with the live values and commit/push it to this same branch. The desktop client reads that file: the user can click **LIVE WORLD** in the header and connect without copying an address or join key. If the quick-tunnel hostname changes after a server restart, update this file again and push the new value.

For the receiving Codex's exact command-by-command procedure, follow [SERVER_CODEX_NEXT_STEPS.md](SERVER_CODEX_NEXT_STEPS.md). Do not reset or replace `server-data/` while pulling this branch.

## Safe integration on the other computer

1. Read `AGENTS.md`, `docs/DEVELOPMENT_HANDOFF.md`, this file and `docs/PERSISTENT_SERVER.md`. Identify the actual root, branch, remote, dirty work and build identity. Back up local saves and unfinished authored work.
2. Fetch `origin` and inspect `origin/codex/server-host-handoff-2026-10-14` without resetting or cleaning your newer checkout. Record which changes are newer locally, including Wildbound mode. Preserve that work in an appropriate local branch/commit before merging.
3. Integrate this branch into the newer gameplay source with careful conflict resolution. Do not blindly prefer this branch's gameplay or test expectations. Preserve its server authority, transport, persistence and launcher fixes while adapting them to the newer gameplay.
4. Run meaningful tests and muted Electron checks after integration. Install dependencies with the project's lockfile, then run `scripts/rebuild-desktop.ps1`; it runs tests, packages and creates the current user's shortcut. Do not stop a player's running game to rebuild.
5. Run `Play Wildbound.cmd --check`. Verify commit/build identity and shortcut before claiming the integrated desktop is current. Use the normal profile unless explicitly testing preview. Test newer Wildbound mode manually and then test a second computer joining the host.

The branch is source handoff only. It neither deploys GitHub Pages nor publishes a downloadable release. Detailed operations are in `docs/PERSISTENT_SERVER.md`; build/test history is in `docs/history/2026-10-14-persistent-server-1.1.0.md`.
