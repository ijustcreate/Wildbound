# Wildbound 1.2.93 — solid train walls and louder whistle

## Causes and corrections
- The 1.2.92 exit condition fired 18 pixels inside the floor edge. A modest airborne height also bypassed every side wall. This could detach riders prematurely or move them through a solid coach wall.
- Exits now occur only after crossing the real outer floor boundary through a sufficiently wide doorway, or after the actor's feet actually clear the side wall's height. Ordinary coach jumps cannot clear full-height walls. The tender retains intentional jumps over its lower rails. Departure placement stays just outside the carriage rather than jumping 22 pixels sideways; reboarding cooldown remains.
- Exterior doorway spans are shared by physical wall collision, jump boarding and native body artwork in all eight projections. Coach and locomotive cab walls have matching visible apertures and solid frames. Jump boarding cannot penetrate a solid window/wall.
- Whistle gain increased from .18 to .44 (about +7.8 dB), with outdoor audible range increased from 1600 to 2300 pixels. The other train cues and saved master/SFX/Windows volume remain unchanged.

## Verification and preservation
- Focused 31 tests pass, including parked/moving wall pressure and jumping across eight route positions, no premature doorway exit, doorway boarding versus solid-wall rejection, frame clearance and low-tender jumps.
- Muted isolated native Electron verification: 63 checks and zero renderer errors, including real doorway exits and wall retention. OfflineAudioContext renders a strong, unclipped whistle waveform and verifies the broader spatial range without making audible sound or modifying player settings.
- Final full rebuild, packaged content/boot/launcher and HTTP/browser publication receipts are recorded in test-output and delivery. No hardware controller, remote multiplayer, perceived loudness or FPS claim.
- Normal-profile launcher remains Play Wildbound.cmd. Saves, rigs, authored train paint and editor drafts are preserved. Source identity is the commit containing this note; desktop/web manifests identify that clean revision. Original and earlier web editions are preserved.
