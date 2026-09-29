# Wildbound 1.0.12

Boots now follow the projected lower-leg angle around the ankle, rather than remaining upright as the leg swings. Procedural artwork is inverse-rasterized onto the pixel grid; custom boot sprites retain their fitting transforms and foot-joint rotations. Base shoes follow the same pose.

Validation: 335 passing tests, including cuff alignment across boot types and running poses, plus visual inspection of 32 running frames across front, back and side views.

Build with `node scripts/package.cjs`, then run `powershell.exe -NoProfile -ExecutionPolicy Bypass -File scripts/create-desktop-shortcut.ps1`. The versioned build and launcher preserve existing builds and user saves.
