# 1.0.67 — inventory from the user's sketch

## Request and scope

The user's new drawing replaces the centered portrait/ring arrangement from 1.0.66: name and level, XP, live character on the left beside a body-shaped equipment grid on the right, inventory below, one bottom action row. This is local work; the current request did not authorize another commit or GitHub push.

## Changes

- Retained the narrow 480 CSS-pixel maximum panel, all 24 stable backpack slots (including empty slots), and all 11 existing equipment slots.
- Moved the live equipped character into a left preview column, with the ammunition selector beneath it. Rotation remains independent of world facing; idle animation continues while simulation is paused and reuses the existing canvas/DOM.
- Equipment occupies a three-column body grid to the right. Head, neck, chest, pants and feet form the central column; quiver/back, gloves and right hand are left; cape, shoulders and left hand are right. Existing cape, shoulder and back slots remain separate rather than discarding gear.
- Controller directional navigation matches this grid. Up from neck selects head; up from head reaches ammunition. Foot-to-backpack and tab transitions remain intact.
- Name/level and Inventory headings match the drawing. Full and compact labels preserve readable hand/slot names without clipping in co-op panels.
- Kept the single action row: use/equip/unequip, Hand 2, sockets, hold-to-salvage, move, split, drop one and drop stack/gear. Disabled states and per-controller ownership remain unchanged; narrow rows scroll horizontally without wrapping.

## Verification

- All 668 Node tests passed.
- Source Electron checks passed: `verify-inventory-refresh.cjs`, `verify-inventory-sizing.cjs`, `verify-inventory-workbench.cjs`, `verify-tv-wildbound.cjs`.
- Verified real rendered geometry at six window/zoom combinations (600×430 through 1280×850, up to 150% zoom), stable selection transitions, nonoverlapping character/equipment, correctly aligned body columns, all visible slots, single action row and reachable final action.
- Two/three simultaneous controller-family panels passed label and owner-isolation checks. Actual `inputFrame` calls using synthetic Xbox/Switch/PlayStation inputs passed independent navigation, equip, drop and close even when another player's DOM control has focus.
- Live portrait generated multiple distinct frames with constant game time, kept the same canvas, and rotated without changing world facing. Visible Equip/Drop gear controls work; dropped socket metadata survives.
- Chest contents/transfers, vending stock, lobby portal, TV inventories and shared victory treasure regressions passed.
- Rendered screenshots inspected under `test-output/`. Normal saves/profiles were not touched. Physical controllers were not playtested; no hardware/FPS guarantee is implied.

## Local desktop build

Packaged 1.0.67 successfully after syntax-checking all 191 runtime files. All four Electron verification scripts passed again against the exact packaged `resources/app.asar`. The four changed runtime files are byte-identical to source; packaged name/version/main metadata is correct (the packager intentionally prunes development-only package.json fields).

Manifest: version `1.0.67`, sourceCommit `edc664ea35a4c75710570680dca26c6e1387f658`, sourceDirty `true`, builtAt `2026-10-06T16:05:23.923Z`, preview `false`. This identifies the base Git commit plus modified local source, not a new shared commit. No GitHub push or release was performed. Previous 1.0.66 build was preserved.

Executable: `dist/1.0.67/Wildbound-win32-x64/Wildbound.exe`. Fresh Desktop shortcut: `Wildbound Latest (1.0.67).lnk`, targeting this checkout's `Play Wildbound.cmd`, working directory at the repository root, project icon `assets/wildbound-icon.ico`, and no arguments. `Play Wildbound.cmd --check` passes, with the expected modified-source warning. Normal launch uses the existing normal save profile; QA used isolated profiles.
