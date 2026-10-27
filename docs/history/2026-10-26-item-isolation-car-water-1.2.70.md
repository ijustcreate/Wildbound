# Equipment-only item editing and car sorting/water — 1.2.70

Verified desktop package: dist/1.2.70-2026-10-26T19-36-44-838Z/Wildbound-win32-x64. Built UTC 2026-10-26T19:36:55.225Z from modified source at commit 1bd5ef027966e371f21cd0956b96b0aa4a62144b, branch Wildbound_worlds, origin https://github.com/ijustcreate/Wildbound.git. Correct checkout: Desktop/Wildbound Server Branch Build. No commit/push.

Desktop shortcut: C:/Users/New User/Desktop/Wildbound Worlds (1.2.70).lnk. Target: C:/Users/New User/Desktop/Wildbound Server Branch Build/Play Wildbound.cmd, blank arguments, assets/wildbound-icon.ico. Normal save profile; no --preview. Launcher --check matches this package and source revision. Existing running games were not stopped.

## Equipment editor

Captured headwear/clothing layers previously included the character's body pixels. Editing replaced the whole captured body part. Equipment extraction now subtracts the corresponding unequipped layer and uncovered actor raster at the same pose. Saved itemOnly sprites become separate runtime overlays over an independently rendered underlying body queue. Erasing equipment reveals the original head, hair, arms or legs; authored humanoid sprites/joints remain unchanged. All equipment parts in a facing are retained when one part is painted; transparent parts remain saved rather than reverting to procedural art. Old combined overrides continue rendering and migrate on editing. Restore original art restores that item's whole selected facing. Icons remain independent.

## Car fixes

Wheels render inside the car pass before the body, which masks their inner portions. Hood, wheels and body share sinking translation/opacity. Cars use their center for depth; overlapping grass, cut stumps and small rocks sort below the vehicle. The foreground grass shader masks car footprints and excludes seated players as independent grass occluders. Standing scenery retains normal depth sorting.

Tyres pass rocks up to 40 world units and cut/falling tree roots, including graveyard trees. Larger rocks and standing trunks remain solid. When the car center enters deep water, every occupant is released to their seat's world position, vehicle links are cleared, swimming is determined individually, the engine stops and re-entry is disabled. The empty wreck keeps sinking to invisibility. Shallow water and bridges do not trigger sinking.

## Verification and limits

Full rebuild: 1,641 tests passed, zero failures; 465 runtime syntax files. Exact packaged content: 1,146 matching files. Actual packaged EXE boots ready with zero errors. Packaged Electron: 195 item isolation/persistence checks across 12 items and eight facings; 38 editor checks including native pointer paint, undo/redo and successful Studio Save; 14 input/gameplay checks including all-rider water ejection and empty-car sinking; 32 occupied/empty/sinking car views; foreground grass shader compiles with its vehicle mask active. Native graphics evidence under test-output/item-isolation and car-water-ground; release logs final-packaged-1.2.70.log, final-exe-1.2.70.log and rebuild-release-1.2.70.log.

Authored rigs hash remains DC05411B47F02259BE95EA0ED22AEA375D76F79B55D7F0BDEC57DA5DF7ED7D71; rig guard reports no changes. Tests use muted isolated Electron profiles. Normal saves, editor drafts and shared authored artwork preserved. Physical controller hardware and end-to-end FPS remain unmeasured. Visual appearance and vehicle tuning remain for user testing.
