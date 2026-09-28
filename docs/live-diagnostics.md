# Live game diagnostics

The desktop game publishes a local, read-only snapshot twice per second to
`%APPDATA%/wildbound/live-diagnostics.json`. While the game is running, Codex can
read it with `node scripts/read-live.cjs`. An optional first argument selects a
different profile's snapshot. `live` is false when the process stopped or the
snapshot is more than four seconds old.

The snapshot contains the current screen, player count, device assignments,
positions, logical movement/actions, controller axes and pressed button numbers,
controller ownership, selection panels, readiness/countdown, expedition options,
and recent runtime errors and state changes. It excludes inventories, save
contents, raw keyboard events, typed text, and credentials. Nothing is uploaded
automatically; there is no network listener or remote command execution.

This lets an active Codex chat inspect what the game reports when you ask it to
check a problem. It does not create an always-listening AI or automatically start
new chat turns. Launch with `--no-live-diagnostics` to disable reporting.
