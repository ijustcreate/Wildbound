# Wildbound QA remediation

This pass implements the 42 defect fixes and 13 interface changes from the [November 23 QA audit](../qa/2026-11-23-wildbound-qa-audit.md). The checkout is `Wildbound_worlds` at `f0b787ff33c3ac8f3675b48504937ebda4f0dcb5` with existing modified and untracked work. No commit or push was requested.

## Release priorities

| Audit item | Change |
| --- | --- |
| B01 | Public Wilds preserves progress in a dedicated checkpoint, including train state, gear, currency, XP, location, and explored sites. The lobby and Camp offer Continue The Wilds. Starting fresh with an existing Wilds checkpoint requires a deliberate choice. Initial play waits for visible terrain, with a bounded synchronous fallback if the worker stalls. |
| B11 | Authored encounter action IDs survive save and restore, including cached connected worlds. |
| B17 | A failed character read leaves the damaged roster protected from close-time writes. Recovery is explicit and operates on one selected record. |
| B20 | Connected-map snapshots exclude the live audio service and repair cached legacy state before serialization. |
| B21 | TV arena ground drops retain ownership and item metadata in a durable recovery queue, and are returned or kept in overflow when the run ends. |
| B22 | Arena spawning ignores disconnected explorers and can use an alternate marker when the preferred spawn stays occupied. |
| B39 | New named worlds carry forward the shared stash. |
| B40 | Checkpoint restores reconcile newer shared character and stash revisions before another save can overwrite them. |

## Remaining findings

| Audit items | Changes |
| --- | --- |
| B02–B04 and UX01–UX03 | Expedition drafts apply only on Accept, reopen with the committed settings, and use the resulting focus when movement and confirmation arrive together. The owner panels reflow in a four-player window and keep their names, distinct mode crests, map labels, and close buttons readable. |
| B05–B10, B35, B38, and UX07–UX09 | Back routes through the top interactive layer, Settings preserves its owner, and physical Nintendo selection is consistent across menus. Prompt themes no longer change hardware routing. Explicit remaps survive reload. Keyboard helps and PlayStation roll glyphs match live bindings. Pause is its own Expedition surface, the controls guide is device-aware, and encounter tactics remain available in the HUD journal and the controller-accessible Pause menu. |
| B12–B16, B18–B19, B37, B41–B42 | Field Kit import accepts full backpacks, includes an explicit stash choice, and keeps data transactional if writing fails. Recovery is per record. Damaged edit libraries fall back independently. World checkpoints validate before selection and can recover from backup. Exploration continues gracefully when the journal reaches its cap. Tagged starter stock separates new grants from deposits. Loaded worlds become active only after successful preparation and dismiss the stale pause stack. |
| B23–B28 | Arena cameras frame active players, swept stomps resolve before landing, and the Safari Rifle uses a finite ranged arena loadout. Merchant purchases can fill a compatible stack. Railway repair clears previous route segments and pending junction switches. The sandbox bank requires durable funds for permanent exchanges. |
| B29–B34 | Trap rules share one resolution path and honor capture speed. Monkeys throw again, archers can resupply before empty, and bow attacks revalidate the original target before release. Melee spends runes only from the gear that contributed to the strike. |
| B36 and UX04–UX06 | SCRAP-9 displays and accepts all 32 pack positions. The explorer picker has separate browse buttons, a selection count, and selectable portraits. Inventory inspection and Couch scaling keep hand labels, action states, and stats readable. |
| UX10–UX13 | Living Worlds leads with recent saves and keeps tools under Manage. Merchant rows keep stable geometry with a separate appraisal. TV guidance uses current device labels and prompts at the board and tubes. Defeat explains the three outcomes and requires confirmation before restarting. |

Legacy unmarked starter chest stacks move to recovery once because older data cannot distinguish grants from deposits. Newly tagged stock can be replenished without becoming a recovered deposit. The automated checks leave physical controllers, screen-reader speech, live remote co-op, four simultaneous inventory inspectors, and prolonged railway travel for a manual pass.

## Verification

- Focused checks passed for persistent Wilds, route repair, terrain startup, Gringotts, checkpoint migration, world and profile recovery, traps, ammunition, and TV arena behavior. [Persistence and train results](../../test-output/qa-remediation/focused-node.log) · [Streaming and arena results](../../test-output/qa-remediation/focused-stream-tv.log)
- The source Electron driver passed 15 checks. It exercised the explorer picker, terrain startup, separate ordinary and Wilds save files, and restoration from disk after a renderer reload. It also tested Living Worlds, merchant selection, the one-second encounter card, controller navigation to the retained tactic, and defeat confirmation. [Native source report](../../test-output/qa-remediation/report.json)
- Additional muted Electron suites covered 27 interface checks, 114 lobby join checks, 30 lobby entry checks, 78 Settings and controller checks, 103 inventory tooltip checks, 35 common action checks, 55 TV encounter checks, 10 arena defect checks, and the merchant layout and transaction across six view sizes. [Interface report](../../test-output/qa-2026-11-23/interface-remediation/report.json) · [Four-player Expedition capture](../../test-output/qa-2026-11-23/interface-remediation/four-player-expedition-final.png) · [Arena defect report](../../test-output/qa-20261123/gameplay-fixes-electron.json) · [TV encounter report](../../test-output/tv-arena-run/qa-remediation/report.json) · [Merchant layout](../../test-output/qa-remediation/merchant-center-confirmed.log)
- Native save probes exercised an older checkpoint against newer shared progress, world switching out of Pause, and recoverable startup failures in house and location libraries. [Persistence results](../../test-output/qa-remediation/persistence-electron.json) · [Editor startup results](../../test-output/qa-remediation/editor-recovery-electron.json)
- The initial full suite passed 1,926 checks and recorded 31 test-file failures during overlapping edits. The current source rerun of those 31 files passed all 282 checks. The failures traced to the TV arena/board import cycle, an art module that appeared during the first run, and a stale recursive summon worker. [Initial full suite](../../test-output/qa-remediation/rebuild.log) · [Rerun of affected files](../../test-output/qa-remediation/full-failure-rerun.log)
- The final lobby and common-action Node rerun passed all 61 checks. [Final interface regression results](../../test-output/qa-remediation/final-ui-node.log)
- The final interface review exercised the visible three-step TV guide from the lobby on a 1002 × 704 window. [TV guide receipt](../../test-output/qa-remediation/tv-transition.json) · [TV guide capture](../../test-output/qa-remediation/tv-guide-visible.png)

## Desktop build

Wildbound 1.2.112 was packaged from modified source at commit `f0b787ff33c3ac8f3675b48504937ebda4f0dcb5`. The build manifest records `2026-11-23T18:58:37.122Z` and the normal profile.

- Launcher and shortcut target `C:\Users\New User\Desktop\Wildbound\Play Wildbound.cmd`
- Desktop shortcut `C:\Users\New User\Desktop\Wildbound Worlds (1.2.112).lnk`
- QA rebuild executable `dist/1.2.112-2026-11-23T18-56-14-164Z/Wildbound-win32-x64/Wildbound.exe`
- The packaging script syntax-checked 957 runtime files. The packaged renderer passed 55 TV arena checks with zero renderer errors. [Packaging log](../../test-output/qa-remediation/package-final.log) · [Packaged TV report](../../test-output/tv-arena-run/qa-remediation-packaged-final/report.json)
- Launcher-selected executable `dist/1.2.112-2026-11-23T18-56-01-206Z/Wildbound-win32-x64/Wildbound.exe`. A concurrent package became the default with manifest timestamp `2026-11-23T19:00:38.408930Z`. Both packages matched 47 current audit-related files by SHA-256 and independently passed the muted Electron boot and 15 native checks. The launcher was checked again after the selected package's receipts were recorded. [Launcher and file receipt](../../test-output/qa-remediation/delivery.json) · [Selected executable's native checks](../../test-output/qa-remediation/packaged-native.json) · [Selected executable's boot report](../../test-output/qa-remediation/packaged-boot.json)
