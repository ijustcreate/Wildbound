# Train depth, passenger access and furniture support — 1.2.107

Checkout: `C:/Users/New User/Desktop/Wildbound`, branch `Wildbound_worlds`, origin `https://github.com/ijustcreate/Wildbound.git`. Base commit `f0b787ff33c3ac8f3675b48504937ebda4f0dcb5` plus modified source. Existing uncommitted work, authored rigs, saves and other player processes are preserved. No commit/push requested.

## Symptoms and causes

The prior tabletop correction only covered seated riders. Far-side riders also shared a clamped scene depth, erasing their relative ordering. The foreground wall pass used every occupant to decide whether to draw over each individual actor. Harry and Ron share a bench: a short nearest-only Interact radius let the closer passenger monopolize interaction. Tables remained solid at every jump height, and the train jump loop did not ask for furniture support.

## Changes

- Preserve camera-ground depth among riders after their supporting carriage floor in all eight angles. Jump elevation changes the drawing position without changing ground ordering.
- Give each rider a foreground furniture pass for tables, chair backs/cushions, consoles and stoves. Clip real geometry in front of that rider's body plane; skip surfaces below their supported feet. Preserve native and authored painted art. Evaluate foreground wall occlusion against that one rider, rather than all occupants.
- Reach students from up to 64 train-local pixels within their own compartment. Unclaimed gifts have priority. Once all nearby gifts are claimed, repeated Interact from one spot cycles through the reachable students; moving eight pixels restores nearest targeting. The visible prompt and actual action use the same selector. Full bags keep the gift unclaimed. Gift quantity/transfer ownership is unchanged.
- Tables provide a 14-pixel support above the train floor, matching the actual tabletop at z34 over the z20 carriage floor. Seat cushions provide eight pixels; their backs provide a 19-pixel obstacle and landing surface. The sole footprint can contact a three-pixel tabletop lip. Furniture collisions respect jump/support height, while compartment walls and exterior boundaries remain solid.
- Use the shared jump solver with train support. Players can land, be carried by a moving table, jump again, and fall back to the carriage floor after walking off. Sitting clears prior airborne or supported elevation. Leaving a carriage preserves the full elevated departure height.

## Checks

Focused existing train/student/station regressions: 60 passed. New actual-input/depth/support tests: six passed. Source muted isolated Electron review: 40 passed, zero renderer errors. It exercises aisle interaction with all three students, one gift each, real jump input landing on a table and jumping again, across eight headings. Grounded and tabletop screenshots were inspected under `test-output/train-depth/source/`. Normal saved sound settings and personal profiles were not changed.

Full rebuild and packaged receipts will be appended after completion. Hardware controller feel, remote multiplayer, sustained FPS and user aesthetic acceptance remain unverified.

## Stable verification boundary

Concurrent checkout edits introduced duplicate imports and a temporarily unavailable imported file during broad runs. The initial broad run is not a clean result (849 passed, 150 file-load failures); an affected-file retry was stopped when source files changed again. A new dependency cycle exposed by eager support imports was corrected by extracting pure layout functions into src/train-interior.mjs and keeping train-surfaces.mjs free of rendering/station imports. Full-suite verification remains incomplete.

Final verification uses the immutable snapshot recorded by test-output/train-depth/frozen-path.txt. Its focused train/jumping/furniture/wall suite passed 135 tests in 16 files, zero failures. Its muted Electron review passed all 40 checks. Unrelated broad coverage was stopped after confirming early tests; it is not reported as a full-suite pass. All 884 runtime files were parsed with Node's V8 ES-module/CommonJS parsers in one process to avoid hundreds of validator process startups while several desktop builds were running. The normal packaging implementation then consumes the same frozen source; no runtime code was changed by that validation driver.

## Final delivered desktop receipt

Concurrent work advanced the checkout through 1.2.106 to **1.2.107**. The frozen 1.2.106 package remains an intermediate review artifact. The final delivery was packaged from the combined 1.2.107 checkout and then independently reviewed in Electron. No later source changes were reverted.

- Output: `C:/Users/New User/Desktop/Wildbound/dist/1.2.107-2026-11-23T02-18-04-919Z/Wildbound-win32-x64/Wildbound.exe`.
- Manifest: version 1.2.107, sourceCommit `f0b787ff33c3ac8f3675b48504937ebda4f0dcb5`, sourceDirty true, preview false, builtAt `2026-11-23T02:23:55.055Z` (November 22 in the user's Pacific timezone). No new commit or push.
- Final syntax parsing: 891 runtime files. Packaged muted Electron review: **40 passed**, zero renderer errors (`test-output/train-depth/final-packaged-electron.log`, `test-output/train-depth/packaged/report.json`). This exercises real input for all three students and tabletop landing/re-jumping in eight angles in the actual delivered package.
- Exact executable boot smoke: failed 0, ready lobby, errors [], audioMutedTest true. Test profile isolated; normal player saves and sound settings unchanged.
- Hash receipt `test-output/train-depth/final-hashes.json`: all seven core geometry/support modules match the source that passed the 135 regression checks. Comparison to the live checkout examined 1,660 runtime/art/authored files; nine files had newer concurrent changes after packaging (listed in the receipt). The delivered package is the captured version, and those later source edits are preserved. The current renderer still retains the individual-rider foreground selection.
- `Play Wildbound.cmd --check` selects the exact executable above. Desktop `C:/Users/New User/Desktop/Wildbound Worlds (1.2.107).lnk` targets `C:/Users/New User/Desktop/Wildbound/Play Wildbound.cmd`, blank arguments, repository working directory and `assets/wildbound-icon.ico`. This is the **normal save profile**, without --preview.
- Packaged eight-view images: `test-output/train-depth/packaged/grounded-eight-views.png` and `tabletop-eight-views.png`. Full-suite verification, hardware-controller feel, remote multiplayer, sustained FPS and user aesthetic approval remain unverified.
