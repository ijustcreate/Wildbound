# Headwear fits per facing

Live Edit originally saved a single hat transform per profile and item. A correction made from one angle therefore affected all eight views.

Choose **Characters**, select the explorer, then click the hat. **Follow facing** tracks the rendered direction. The eight compass buttons let you preview individual views in place and each view keeps its own offset, scale, and angle. **Reset facing** restores the native rig fit for the displayed view. Leaving the inspector clears the preview.

Save keeps the same local profile file and preserves earlier all-facing fits as a fallback for directions without an override. The individual record includes the profile, hat, and facing. Undoing a first override reinstates the inherited value.

Muted native Electron rendering compared all eight views in idle, run and train seating. The East-only test changed East pixels and restored the original pixels when the override was cleared. Head direction selected the fit even with a differently facing torso. The compass preview drew the selected explorer in place with their movement data intact.

The normal desktop build is `dist/1.2.149/Wildbound-win32-x64/Wildbound.exe`, packaged from modified source at `a6cee9bc55ad12ed58df5c3d27b150449f31ef26`. The numbered shortcut uses `Play Wildbound.cmd -BuildDirectory "dist\1.2.149\Wildbound-win32-x64"`. All 32 changed runtime files matched the package by hash.

The exact executable passed the muted boot check, and its application resources passed 35 muted Live Edit checks with zero renderer errors. They covered compact-window compass access, selecting the hat on the canvas, keyboard turns, separate North and East transforms, reset and history, and durable save and replay alongside an existing shared fit.
