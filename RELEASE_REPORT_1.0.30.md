# Wildbound 1.0.30

Packages the current workspace, including the forest and character generations,
winter loot and combat updates, projectile aiming, stationary wand aiming,
set-item tooltips, boss skill scrolls, and the paused ten-press Y cheat shortcut.
Each of the six skill scrolls now has its own pixel marking.

## Verification

- Full Node suite: 446/446 passed.
- Package syntax validation: 125 runtime files passed.
- Windows x64 Electron 41.10.7 package completed successfully.
- Focused Electron skill gating and keyboard/controller pause shortcut checks passed.
- Packaged broad smoke suite: 81/99 passed, 18 failed. The failed checks match
  the saved 1.0.28 results (ignoring versioned paths in the Field Kit stack).
  These include lobby portraits, board rolls, inventory transactions, editor
  interactions, and Field Kit setup. This is not a fully green smoke release.
- Launcher check resolves the 1.0.30 executable; a new desktop shortcut points
  to that build. Earlier shortcuts and saves are preserved.

## Local Build

`dist/1.0.30/Wildbound-win32-x64/Wildbound.exe`

The complete packaged directory is required. Build binaries and test output are
ignored by Git; the source and authored assets are the published Git changes.
