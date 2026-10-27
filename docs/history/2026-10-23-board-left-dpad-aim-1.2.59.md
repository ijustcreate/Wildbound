# Superseded test candidate: board on D-pad Left — 1.2.59

NOT the delivered result. During this work the user clarified that L/R mean LT/RT, RB controls creatures, and D-pad Up opens storage. Storage and pause changes were then requested. The combined final implementation is 1.2.60; see its release note. The 1.2.59 candidate used the earlier mistaken bumper interpretation and must not be selected as the finished build.

User reports L opens the game board instead of aiming in the expedition; board should be D-pad Left. Correct checkout: Desktop/Wildbound Server Branch Build, branch Wildbound_worlds, modified source on 1bd5ef027966. No commit/push; no authored rig or normal save writes.

The old default still put board on button 6 (left trigger), and customized/partial old saved layouts could retain board on button 4 (left bumper). D-pad Left was independently hardcoded to toggle loot labels. Previous controller QA checked the aim input flag but did not assert that the board remained closed or actually step expedition wand aim.

- Default board is now button 14, D-pad Left. Saved board bindings on buttons 4 or 6 migrate to 14 and restore left bumper aim; older trigger dodge/potion bindings are repaired where relevant. Other face remaps are retained.
- Loot labels move to button 6, left trigger; keyboard Alt is preserved. D-pad Left no longer doubles as loot-label toggle. Controller settings show the loot-label button.
- New regression covers partial legacy layout migration, uniqueness, preservation and idempotence. Expanded muted Electron QA covers Xbox/Switch/PlayStation: L holds/aims an actual wand hero against movement input without opening the board; D-pad Left opens, stays stable while held and closes on fresh press; left trigger does not open board; inventory/pause ownership and lobby controls remain covered.
- User was asked whether L refers to top bumper or lower trigger because both were old board bindings. Current implementation uses L/LB/L1 for hold/aim and ZL/LT/L2 for loot labels; retain this distinction in the final instructions unless the user clarifies otherwise.

Source focused checks: 22 pass. Exact packaged identity and final verification are appended after build. Existing forest art, grass, leaf motion and their previous performance limits are preserved.

The expanded Electron test was also run against the previous exact 1.2.58 package with saved `dodge:5, board:4, block:6, potion:7`. It reproduces the reported defect and fails at "Left shoulder is expedition hold/aim without opening board 0" (test-output/board-aim-old-regression.log). This layout did not match the older quartet migration. The new package must pass that same case, not just clean defaults.
