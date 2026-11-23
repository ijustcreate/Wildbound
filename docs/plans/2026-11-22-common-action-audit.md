# Wildbound Common Action Audit

Implementation started November 22 2026 and the first desktop pass was verified November 23 2026. This is the first implementation pass through the [common action polish plan](2026-11-22-common-action-polish.md). The full plan remains in progress.

## Implemented behavior

| Area | Result | Evidence |
| --- | --- | --- |
| Queued expedition saves | Every caller waits for the newest queued snapshot; snapshots are immutable | Save coordinator logic tests and real Electron save calls |
| Save failures | Failed state remains visible, Retry writes again, leaving is blocked on failure | Injected desktop failure and actual Save and return button |
| Desktop window close | Existing close hook now flushes expedition or named world and character saves | Renderer flush verification; main process close hook retained |
| Profile write ordering | Returning to the previously saved state during another write cannot leave the intermediate state on disk | Profiles regression |
| Continue expedition | Lobby action loads the last ordinary expedition checkpoint and restores the party | Actual Continue button and serializer round trip |
| Named world save | Live audio service is omitted from snapshots, preventing WeakMap cloning failure | Named world creation, save and restore in Electron |
| Save visibility | Pause actions show writing, success and retryable failure; gameplay toast exposes a failure | Electron status checks and visual review |
| Modal controller release | Settings menus require neutral input before held Confirm can become a gameplay action | Actual inputFrame with simulated Xbox input |
| Controller family glyphs | Confirm and Back use the physical bottom and right face labels for each family | Canvas glyph checks; existing family routing regressions |
| Car and loot labels | Prompts use the effective player mapping and family; loot explains full bags and only singleton equipment promises hold to equip | Mapping tests, car regressions and native rendering |
| Pickups and arrows | Acknowledgments report the committed quantity to the correct explorer; repeated pickups merge and queues are bounded | Ownership, capacity, duplication and expiry tests |
| Consumables | Full health, no potion, no arrows and insufficient mana receive explicit visual feedback; successful potions report actual healing | Logic and Electron checks |
| Combat damage | Enemy numbers show resolved damage, aggregate rapid hits and cap simultaneous labels | Actual damage handler overkill check and aggregation tests |
| Ground recovery | Pause action offers nearby clear ground and a confirmed recorded position; validates collision and nearby enemies again at execution | Logic tests and real recovery controls |
| Recovery preservation | Health, coins, inventory, carried chicken identity and other players stay intact; pending held inventory moves block recovery | Recovery regressions |
| Inventory ownership | Three simulated controller families navigate, equip, unequip, refuse full bags, preserve linked hands and sockets, drop and close independently | Existing real inputFrame inventory review |
| Inventory layout | Compact and expanded inspection, transaction notices, two panels and small windows remain usable | Existing inventory tooltip Electron review |
| World menu busy state | Finishing an asynchronous action preserves buttons that were already disabled | Disabled-state restoration in worlds UI |
| Loot generation integration | Correct Set iteration prevents a new reward generator from throwing during a victory reward roll | Existing expedition regression |

## Scope of recovery

Recovery currently supports normal outdoor ground and private storage rooms. It refuses mounted players, active train riders, controlled followers and custom underground rooms with an explanation. It does not silently eject a passenger or bypass a crypt exit rule.

The recorded fallback is the first validated stable position observed in the current location context. It is an in-memory fallback, not a newly persisted travel checkpoint. Nearby search is bounded to 128 world units, with a recent safe-position fallback within 192 units. Candidates are checked against current geometry, water restrictions and nearby hostile actors. Recovery never heals, regenerates the map, resets loot or loads an older save.

## Still pending from the complete plan

- [ ] Build a single interaction selector across NPCs, gifts, doors, shops, lights, portals and carried objects. This pass corrects shared input labels and selected existing prompts; it does not replace every feature selector.
- [ ] Audit every shop, gift, quest reward, capture and storage transaction for a common success or refusal result. Existing specific notices remain in use where they already work.
- [ ] Verify the entire 17-step route as uninterrupted play with a physical controller. Current controller evidence is simulated Gamepad input through the actual Electron input and UI code.
- [ ] Extend safe recovery to moving trains, vehicle cabins and custom underground geometry using their actual support and exit rules.
- [ ] Finish recovery combat gating and hold behavior. This pass validates destination hostility and requires an explicit dialog choice; the full plan's stationary hold and active-combat policy still need implementation and balancing.
- [ ] Persist or derive a verified entrance checkpoint for recovery across process restarts, if desired after testing the nearby recovery design.
- [ ] Establish and test an interrupted-write protocol across character, world and house records. Individual files retain their existing queues, validation and backups; the new flush waits for both stores but is not a multi-file atomic transaction.
- [ ] Surface explicit backup-recovery information, checkpoint identity and unsupported-version messages throughout the player UI.
- [ ] Complete forced termination, exhausted storage and interruption tests at every write boundary with disposable profiles.
- [ ] Measure save serialization and notification cost in large worlds and crowded combat; no FPS or hardware latency improvement is claimed.
- [ ] Review low health, block, invulnerability, status duration and reduced-effects accessibility across every combat path.
- [ ] Audit all menus, editor transitions and maximum party layouts beyond the inventory, settings and recovery cases covered here.

## Verification records

Reusable source: `tests/save-coordinator.test.mjs`, `tests/common-action-polish.test.mjs`, and `scripts/verify-common-action-polish.cjs`.

Ignored receipts: `test-output/common-action-polish/` and `test-output/inventory-tooltips/common-polish-source/`. The baseline directory preserves copies of the files selected before implementation and the shared authored rig hash. Existing personal saves, unfinished editor drafts and other game processes were not replaced or stopped.

The required rebuild passed 2,116 tests and syntax checked 934 runtime files. The launcher-selected 1.2.110 package passed 34 polish checks, 99 inventory checks and an actual executable boot with zero renderer errors. All 18 relevant packaged files match the checkout. Exact identities and receipts are in the [implementation history](../history/2026-11-22-common-action-polish.md). An automated test pass does not establish physical controller feel, aesthetic approval or completion of the pending items above.
