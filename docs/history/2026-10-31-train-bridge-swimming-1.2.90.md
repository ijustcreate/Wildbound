# Swimming beneath railway bridges - 1.2.90

October 31, 2026. User requested swimming beneath the train bridges after the 1.2.89 publication.

The dev railway river now permits swimming. Water is a lower traversal layer: swimmers crossing beneath active or inactive route bridges stay at river height and render behind bridge decks/rails and trains. Train body collision does not push swimmers out of the lower layer. A walker approaching a bridge from the bank follows the elevated deck. Jumping/interaction below a bridge cannot snap a swimmer through its floor into a carriage. Returning to a bank restores walking. Native swimming poses, clipped waterline and ripple rendering are reused, and water movement uses the live water SFX material. Player/profile isolation and all previous train, mode/menu and Mario fixes remain.

Verification: 68 focused railway/audio/lobby/Mario unit tests passed, including crossing beneath the complete span, deck entry from the bank and bank exit. 40 muted Electron checks include native rendering beneath a moving train and continuous traversal without lifting, blocking or implicit boarding. Capture: test-output/train-review/swim-under-bridge.png. Browser, packaged and live publication checks follow from the clean source commit containing this note; generated manifests and final receipts identify exact revisions and paths. No physical-controller or FPS claims.

Version 1.2.90 preserves earlier published web snapshots. Both Desktop Wildbound - Train Build and the versioned Wildbound Worlds shortcut target Play Wildbound.cmd with blank arguments and normal saves. Source and Pages pushes remain separate; generated builds, test profiles and personal saves are not source files.
