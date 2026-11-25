# Greyhaven Floo, seating and atrium

The original floor-one kitchen fireplace is linked to the Floo Powder network. The interaction and safe arrival use the clear space at the right front of the existing fireplace. The normal menu, powder cost, party rules and green flames apply. Layer switches preserve the castle, Nocturne Alley and surface contents separately.

The decorative north doors were removed from the first two floors, and the third-floor north bay now has a lion throne on a low stone dais. The south entrance and tower stairs provide the usual routes. Each of the 26 chairs, seats and stools has an individual facing, clear stand point and one occupant at a time. The pose uses the native seated animation. Interact or Jump stands the explorer up.

Walking still stops at the second-floor atrium railing. Jump while facing or steering toward the opening to clear the rail and land safely in the Great Hall. The floor switch follows the existing shared-party room model, with separate clear landing points. The upper-floor jump arc is visual until the room changes, so a checkpoint made mid-jump keeps the true upper-floor coordinates on the gallery.

## Verification

- All 21 focused Floo, Castle, resident, Wilds terrain and Wrong Turn tests passed. A separate collision path probe at radius nine reached all 26 seats from their floor’s main hall.
- The muted Floo walkthrough completed seven trips using the real menu and backpack action, including both directions with the Homestead, Nocturne Alley and The Three Broomsticks. It checked landing clearance, powder cost, the inn wand gate and the kitchen’s green flame returning to amber.
- The native seating walkthrough exercised the facing on opposite banquet chairs, the Gallery rail, the jump into the Great Hall, and the throne in co-op. A second explorer waits for the first to step away from the stand point before taking a vacated seat. Older checkpoints inside the new furniture’s footprint recover to that seat’s clear stand point.

## Desktop build

- Desktop `1.2.171` was built from modified source at `a6cee9bc55ad12ed58df5c3d27b150449f31ef26`. All eight implementation files match the packaged copies by SHA-256.
- The `Wildbound Worlds (1.2.171)` shortcut points to `Play Wildbound.cmd -BuildDirectory "dist\1.2.171\Wildbound-win32-x64"` and uses the normal save profile.
- The exact package passed the muted boot smoke test, 80 Floo checks and 87 interior checks with zero renderer errors. The native reports and captures are under `test-output/greyhaven-review/floo-greyhaven-1-2-171/` and `test-output/greyhaven-review/greyhaven-upgrades-1-2-171/`.
