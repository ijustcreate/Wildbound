# Wildbound 1.0.10

Character rendering now uses depth-aware arm layering, a tighter short-hair silhouette, skin-toned forearms, compact hands, clothing seams and defined shoe soles. Saved rig shapes and custom sprite artwork remain intact.

The rig editor fills its stage with a grey grid. Its full width is available for editing and panning, with controls overlaid at the edges.

Settings show one tab at a time. The level music picker previews hovered/focused tracks, lowers lobby volume during preview, and stops preview on dismissal, tab changes and settings closure. Selecting a track saves the expedition preference without restarting the lobby track.

Validation: 332 unit tests; Electron studio interaction/layout checks; Electron settings tab, preview, ducking, restoration and persistence checks.

Build: `node scripts/package.cjs`. Create the versioned launcher with `powershell.exe -NoProfile -ExecutionPolicy Bypass -File scripts/create-desktop-shortcut.ps1`. Both use the version in package.json. User profiles and earlier builds are preserved.
