# Wildbound 1.0.9

The rig inspector now has separate Joint, Sprites, Properties and Equipment tabs. Tabs and the selected bone remain visible while the current section scrolls. Arrow keys navigate the tabs. Absolute coordinates are expandable, equipment slots are compact, and the duplicate preview is hidden in favor of the main canvas.

Build with `node scripts/package.cjs`, then run `powershell -ExecutionPolicy Bypass -File scripts/create-desktop-shortcut.ps1` to create Wildbound Latest (1.0.9) on the desktop.

Verification: the Electron studio checks exercise transforms, undo, artwork, all four inspector sections, and the layout at 1000 x 760.
