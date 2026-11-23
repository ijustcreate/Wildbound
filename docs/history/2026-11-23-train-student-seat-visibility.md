# Train student scale and seat visibility

## Symptom

Harry, Hermione and Ron looked undersized in the open train compartment, with their lower bodies disappearing behind the seat cushions.

## Changes

- Render the three seated students at 52 pixels instead of the 34-pixel passenger scale, and use the same footprint when placing their speech bubbles.
- Raise the seated rig origin to match the eight-pixel cushion plus the nine-pixel pelvis drop in the `train_sit` pose.
- Extend the seated legs toward the aisle and draw these stationary students over the seat foreground so their shoes and lower legs remain visible.

## Review

A muted Electron source preview shows all three larger students seated in the compartment, with their legs visible in front of the cushions: `test-output/train-seat-preview.png`. This was a visual review only; no tests, packaging or desktop rebuild were run. The normal saved profile and audio settings were not changed.
