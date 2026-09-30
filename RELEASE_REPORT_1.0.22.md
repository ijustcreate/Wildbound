# Wildbound 1.0.22 — Consolidated test build

Launch **Wildbound Latest (1.0.22)** on the Desktop. This local package includes all current source and authored assets, including the gear/socket and animation-layer work, board/table fixes, newer local gameplay updates, and hold-to-salvage. Existing builds and player saves are preserved. No GitHub push was requested for this build.

## Try salvage

Select unwanted gear or a relic in the backpack, outside the private storage room. Hold **RT** on controller, **V** on keyboard, or the on-screen Salvage button for 1.25 seconds. A ring fills while the character works on the item, with particles at the hands. Release early or change selection to cancel. Each completed salvage requires a fresh hold.

Relic Dust drops from gear. Magical or above-common gear also gives Magic Essence; legendary gear instead gives Legendary Essence. All three are sellable and stack to 999. Socketed trinkets drop intact. Materials fall at your feet and require manual pickup. Favorites, equipped items and GM items cannot be salvaged.

The Salvage clip is available in Rig Studio; hand-spark and completion-burst presets use the particle engine. Upper/lower-body mixing remains configurable in Rig Studio → Layers.

## Validation

400 automated tests passed. The focused Electron salvage check passed for the filling ring, stable hold button, character animation, hand-particle rendering, completion and manually collected drops. Packaging runs the runtime syntax checks. Previous broad UI-smoke failures documented in 1.0.19 are not claimed fixed by this release; physical-controller testing remains recommended.
