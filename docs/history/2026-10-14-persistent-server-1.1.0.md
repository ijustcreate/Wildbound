# Persistent server and desktop launcher 1.1.0

This computer is the host. Branch `main` was pulled from `0680020` to `6d471420435ea91daccbc4947c17a6a049b8fc90`. Current implementation is uncommitted and unpushed; no Pages or downloadable release was published.

The server owns simulation, inventories, validated inputs/actions, atomic saves and recovery backups. Reconnect credentials retain explorers across disconnects, restarts and changed addresses. Streamed forest edits persist. Electron local saves remain separate. Private settings, keys, worlds and logs stay in ignored `server-data/`. See [operations](../PERSISTENT_SERVER.md) for the six-slot roster, one explorer per client, offline-party behavior and temporary public tunnel limits. The control panel provides health, addresses, copy player key, announcements, save and safe stop; admin access stays on loopback.

Boot fixes restore missing Murk wolf/event-test modules, humanoid helpers and posture upgrades. Gameplay fixes preserve event indices, imported biome variants, socket defaults and raised scenery collision. Stale assertions were aligned with current policy. Packaging copies production dependencies directly to avoid pnpm symlink pruning failure; the invalid postject lock version was corrected.

The screenshot's launch failure was caused by calling Git from a shortcut environment without Git on PATH. Checkout identity now reads loose/packed HEAD metadata, including worktree pointers. CMD launchers use absolute system PowerShell. Server startup resolves installed Node.js if its PATH entry is absent. Both launchers passed with PATH restricted to Windows directories.

## Build and launch

`dist/1.1.0/Wildbound-win32-x64/Wildbound.exe` has manifest version 1.1.0, source commit `6d471420435ea91daccbc4947c17a6a049b8fc90`, sourceDirty true, builtAt `2026-10-14T17:47:58.190Z`, preview false. Desktop `Wildbound Latest (1.1.0).lnk` targets repository `Play Wildbound.cmd`; `Wildbound Server Control.lnk` targets repository `Server Control.cmd`. Both use repository working directory and `assets/wildbound-icon.ico`. Normal save profile; no preview fallback or profile replacement. Later launcher refinements run from the repository scripts used by these shortcuts.

## Checks and limits

- Full source suite: 1,110 passed, zero failed (`test-output-rebuild-release.log`); syntax, packaging and shortcut checks succeeded.
- Focused authority suite: eight passed (`test-output-final-authority.log`), covering recovery, authentication, restart/address reconnect, forest edits and combat.
- Actual packaged executable boot: zero failures (`test-output-packaged-boot-final.log`), muted with isolated data.
- Two muted Electron clients using packaged modules: zero failures (`test-output-packaged-ui-final.log`). Distinct explorers/panels, occupied/empty gear, 1280×850 and 780×600 layouts, simulated Xbox/Nintendo families, movement, inventory, reconnect, Heartwood Passage and leaving without local-save contamination passed. Screenshots are in ignored `test-output/`.
- Public WSS probe succeeded and public admin returned 404. Final local authority healthy with zero players. No Windows security/firewall changes.
- Older broad editor/debug smoke still has 16 failures, including stale UI assumptions and a FieldKit smoke exception; unresolved.
- Physical controllers, a second computer, FPS gains and production uptime were not verified. Quick-tunnel addresses change on restart; keep the host running for remote play.
