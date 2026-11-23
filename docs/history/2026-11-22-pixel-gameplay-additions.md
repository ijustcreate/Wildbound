# More small-gameplay additions

Checkout: `C:/Users/New User/Desktop/Wildbound`; branch `Wildbound_worlds`. Earlier local changes are preserved. No commit, push, package or publication requested.

## Changes

- Expedition setup offers an optional UTC-date daily world seed, derived deterministically from `wildbound:YYYY-MM-DD`. Accepting it seeds the generated world; turning it off after an active daily expedition returns to a fresh random world seed.
- Aimed boomerangs show sparse outbound pixels and a faint dotted return guide to the launch hand. The return is an approximate straight path; actual flight still homes to the moving hand and can turn early on collision.
- A fast playground ball can ring a nearby unclaimed bell, using its existing one-time coin reward. The existing jump, Interact and melee bell activations remain available.

## Verification limits

No tests or packaged build were run for this task. Source/control-flow review only; the menu layout, seeded map repeatability and ball/bell timing need gameplay review in Electron. Hardware input and daily-world parity across different app versions remain unverified.
