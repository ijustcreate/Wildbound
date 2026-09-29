# Wildbound 1.0.13

Includes two-bone IK authoring/runtime support, a reorganized rig browser, lightweight procedural cape motion, furniture-aware contact shadows/rings, and broken-window jump traversal for players and jump-capable enemies.

Read [Rig workflow and feature gaps](RIG_WORKFLOW.md) for instructions and limitations. IK is opt-in per chain; existing rigs remain unchanged. Custom painted cape sprites remain rigid. The cloth approximation has no collision or full physical simulation.

Validation: 342 passing tests; Electron editor checks including IK dragging, fixed shin length, undo, Setup timeline visibility and narrow layout; visual cape-phase and furniture-contact comparisons; enemy window traversal tests in both directions.

Build with `node scripts/package.cjs`, then run `powershell.exe -NoProfile -ExecutionPolicy Bypass -File scripts/create-desktop-shortcut.ps1`. Both use package.json's version. Older builds and saves remain untouched.
