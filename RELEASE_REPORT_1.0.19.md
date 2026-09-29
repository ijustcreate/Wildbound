# Wildbound 1.0.19 — Consolidated test build

Fresh Windows build containing all current gameplay, rendering, procedural
environment, animation, editor, UI and player/gear art changes. See the 1.0.8
through 1.0.18 reports for the detailed feature history. Also includes the latest
four-degree projectile aim-assist limit and editor/UI refinements.

Launch `Wildbound Latest (1.0.19)` from the desktop. Older packaged builds and
player saves are retained. The repository launcher prefers this build while
retaining its existing separate preview-profile behavior.

Validation: all 371 automated tests passed before packaging. Syntax checking is
part of the package build. Physical controller hardware is not exercised by the
automated checks.

The full legacy UI smoke harness is not green: 14 failures cover lobby portraits,
board attacks, rig-editor interactions and Field Kit controller checks. At least
the keyboard board fixture still positions the character at y=720, outside the
new smaller table's melee reach. The remaining failures have not been diagnosed;
this build is for testing, not a claim of complete end-to-end validation.
