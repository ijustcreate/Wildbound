# Player walk review

The stock player walk now carries the recovering boot higher, times each arm against the leading foot, and shifts weight toward the supporting leg. The torso settles just after contact, with a smaller vertical rise through the passing pose. The native rig, fitted parts, clip length, and 28-world-unit cycle provide the same anchors and timing. The work changes only the editable stock walk keys.

The migration recognizes the exact earlier native walk on the shipping rest rig. Old stock clips migrate at load, and customized walk keys and angles retain ownership. The actual shared player starts with its original authored data, which was left untouched. Its separately authored run keeps its source and cadence.

The before/after video uses the native assembled Animator in muted Electron with the original captured inputs. It compares all eight facings at 48 world pixels per second, then repeats at half speed. The east passing frame also round-trips through the pixel command at the same root for coordinate review. The existing foreshortened ground projection still produces more horizontal-plane slide on north/south walks than in profile.

Review outputs live in `test-output/player-walk-review/`, including `wildbound-walk-before-after-extended.mp4`, native/enlarged boards and the pixel-coordinate comparison. The walk is ready for user artwork review.

## Verification

38 focused Node tests passed. The real Game update selected walk at low analog input in all eight directions and selected run at full input. Migration left every other clip identical in the actual project rig. All planted frame angles, support between keys, loop wrap, source art, custom angle keys, and joint lengths passed their focused checks. Rig pose measurements put peak boot lift at 1.30 before and 2.33 logical pixels after, and head travel at 1.60 before and 0.88 after. The east-facing pixel review verified all 148 changed indexed pixels at the original root.

The baseline and final runtime renders used muted Electron with isolated profiles and zero logged renderer errors. The packaged native, enlarged, equipped, and transparent passing captures match the video source byte for byte. The MP4 was decoded from beginning to end. The actual packaged executable started the lobby and returned exit code 0. Packaging checked the syntax of 989 runtime modules. The full repository suite was not run.

Desktop output `C:/Users/New User/Desktop/Wildbound/dist/1.2.113-2026-11-23T20-29-11-727Z/Wildbound-win32-x64/Wildbound.exe`, version 1.2.113, built at 2026-11-23T20:30:33.315Z from modified source at `f0b787ff33c3ac8f3675b48504937ebda4f0dcb5`. The desktop shortcut `Wildbound - Player Walk (1.2.113).lnk` targets `Play Wildbound.cmd` with the exact relative `-BuildDirectory` argument. This is a normal-profile build. No commit or publish.
