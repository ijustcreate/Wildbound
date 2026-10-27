# 2026-10-24 — join health, starter supplies, dice menu and horn fit (1.2.61)

Current checkout: Desktop/Wildbound Server Branch Build, branch Wildbound_worlds, modified source on 1bd5ef027966e371f21cd0956b96b0aa4a62144b. No commit/push requested.

- Profile selection now fills HP after level/equipment vitals are calculated. Fresh Game.start and newExpedition already refill lobby damage; new regression checks cover wounded/downed heroes. Continuing an actual session retains its saved health.
- Starter selections receive fresh, separate stock, including four health potions. Old profile chest deposits move once into that saved owner's private field overflow at next selection. Ordinary free starter stock is excluded; extra stacks, sockets and bag contents are retained. Pre-potion legacy saves retain every deposited potion. Same-session withdrawals stay finite; reopening or restoring the session does not refill them. Deposits can still be transferred during a session; permanent storage belongs in private storage. Starter dialogs are 540 logical UI pixels wide instead of the generic 860 centered chest width.
- Dice options anchor directly above the dice tray in lobby world coordinates, clamped on resize. The 280-pixel menu fits all three controls and does not slide from a stale rail position.
- Succubus horn roots move from crown y=-7/-8 to forehead y=-2/-5 depending on view. Profile far horn is foreshortened. Same skull pivot, 1 logical pixel raster, palette and eight direction IDs (S, SW, W, NW, N, NE, E, SE); no body/joint changes, and custom wearable transforms/pixels remain authoritative. Imp horns are unchanged. Headwear cache revision is 7.

Visual fit brief: preserve the existing crimson horn silhouette and hair; connect two broad roots to the brow instead of leaving crown-height antlers. Resolve near/far root placement as the forehead turns. This is an attachment correction, not an approved replacement art family. Eight-view assembled idle/walk/attack/fallen sample and actual starter/dice screenshots are in test-output/join-chest-dice-horns/. User reference is the forehead markup attached in this chat.

Verification and exact release identity: pending final package checks; append below before handoff.

Authored rig SHA256 retained: dc05411b47f02259be95ea0ed22aea375d76f79b55d7f0bdec57da5df7ed7d71. Normal saves untouched by automated tests; isolated muted Electron profiles only.

Final delivery:
- Full rebuild: 1,551 tests passed, 411 runtime syntax files checked. Build log: test-output/join-chest-dice-horns-1.2.61-build.log.
- Exact normal-profile package: dist/1.2.61-2026-10-24T16-27-17-306Z/Wildbound-win32-x64; built 2026-10-24T16:27:33.009Z. Modified source on the commit above; preview=false.
- Packaged content: all 1,057 files match source. Actual packaged EXE boots ready in lobby, Worlds enabled, failed=0 and no renderer errors; automated audio muted. Play Wildbound.cmd --check selects this exact package.
- Packaged Electron: 17 actual Choose/chest/dice/resize/launch-health assertions pass with empty renderer errors. Starter fits 600x430 and 1280x850; dice fits desktop, 600x430 and 962x1635. The native current-authored-rig horn review covers eight directions in idle, walk, attack and fallen poses; no custom rig write.
- Normal-profile desktop shortcut: Wildbound Worlds (1.2.61).lnk targets this checkout's Play Wildbound.cmd. Reopen the game to load the new package. Existing player game was not terminated. Physical controllers were not tested for these UI changes; prior mappings are unchanged. No performance claim.
