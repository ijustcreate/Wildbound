# Wildbound 1.0.20 — Tabletop draw order and paused board sequence

The board table was sorting over actors on its back half, making them appear to
fall through even though their physical support height remained correct. Actor
depth now accounts for tabletop overlap and elevation, for players and enemies.
Floor-level actors behind the table remain occluded. Walking off its actual edge
still causes a fall; crossing its draw-order line does not.

Board hits now pause world simulation during a large centered board close-up.
Dice roll in board-local coordinates, the player's piece advances, and the event
name, verse and tip appear inside an enlarged green center for five seconds.
The view closes automatically and gameplay resumes. Board-generated events no
longer use the separate event popup. Enemy movement, hazards and breath timers
remain frozen; the board roll uses its own clock. One or two dice fit the physical
table and the close-up throughout their animation.

Validation: 375 automated tests passed. The live renderer verified and captured
four states: behind the table on the floor, standing on its back half, standing
on its front half, and jumping above its back half. Additional browser checks
rendered dice and the event reveal and checked close-up viewport sizing with
the compact-board preference enabled. Prior full UI smoke-suite
failures documented in 1.0.19 are not claimed fixed by this targeted change.

Use the desktop shortcut `Wildbound Latest (1.0.20)`. Older builds and saves are
preserved. This follow-up is local and has not been pushed to GitHub.
