# Train construction, fuller boiler and shaped shadows

User feedback: the train looked poorly assembled in the supplied views, the round shadows looked wrong, and the engine cylinder was too thin. User accepted the fuller boiler on November 23, 2026.

## Image findings and corrections

| Views / part | Construction problem | Change |
| --- | --- | --- |
| Engine diagonals and side views | Thin half-cylinder, weak underside and no convincing load support | Full faceted cylinder: radius 38% of carriage width, previously 32%; visible saddle supports, closed rear cap and bands fitted to the new diameter |
| Engine front and rear | Deck edge crossing chimney, wheels buried behind running board | Far rail painted before machinery, near wheels painted after deck; custom wheel sprite overrides retain their original path |
| Engine smoke mouth | Smoke needed to follow the enlarged boiler | Shared profile drives chimney and emission height |
| Tender diagonals | Bright stripes overwhelmed a thin rim, coal read as a flat tray | Subdued narrow grating, thicker bunker cap and a central coal mound; movement shader remains shared with native fallback |
| Coach ends / doorways | Cut-board wall ends and unsupported roof edge | Jambs, lintels, threshold and camera-facing arched roof fascia |
| Coach interiors | Seats read as solid timber boxes; weak table support | Open lower seat frame and short feet; table cross-foot and shoulder supporting the existing top |
| Caboose | Cupola looked placed on top without a joint | Raised roof curb, dark eave and a shallow arched cupola roof |
| Curved gangways | Unconnected flat slab appearance | Shallow steel edge and hinged tread plates at the existing walking height |
| All cars | Round blob shadows unrelated to train shape | Single-fill directional silhouettes from cab, boiler, chimney, carriage roof and cupola; bridge elevation included |

Preserve normal scene sorting and character-only masking. No collision, furniture support height, doorway width, profile or saved authored asset changes. No new hanging boarding steps. Train sprites continue to override native parts. Artwork uses the existing integer pixel geometry rather than smooth vector outlines.

## Verification

83 focused tests passed, including eight-heading engine/coal ordering, character masks, train gameplay, station structures, profile proportions and shadow projection. Native all-angle visual checks and desktop package verification passed; exact results and build identity are recorded below. Do not infer hardware FPS or player acceptance from these tests.

Before images and runtime source copies: `test-output/train-construction-before/`. Close source captures: `test-output/train-craft-review/construction-second/`. Final native checks use stage `construction-final-source`.

Source checkout: `Wildbound_worlds`, f0b787ff33c3ac8f3675b48504937ebda4f0dcb5 plus modified source. The checkout contains extensive other uncommitted work; preserve it. This follow-up has not committed or published source.

## Desktop identity and limits

Desktop output: `dist/1.2.113-2026-11-23T20-52-37-419Z/Wildbound-win32-x64`, built 2026-11-23T20:52:56.649Z, version1.2.113, normal profile, sourceDirty=true at f0b787ff33c3ac8f3675b48504937ebda4f0dcb5. Syntax check covered 994 runtime modules. Actual packaged EXE boot smoke passed with ready lobby, Worlds entry, muted test audio and zero renderer errors.

Pinned shortcut: `C:/Users/New User/Desktop/Wildbound - Train Construction (1.2.113).lnk`. Target: current repository `Play Wildbound.cmd`; arguments: `-BuildDirectory "dist\1.2.113-2026-11-23T20-52-37-419Z\Wildbound-win32-x64"`. Launcher identity check passed. Uses normal saves; automated checks used isolated test profiles.

All eight owned train runtime modules match the package by SHA256 (`test-output/train-construction-runtime-hashes.json`). The full content comparison found a concurrent change to `src/hero-hair-native.mjs`; this package contains its packaging-time snapshot, not that later unrelated edit. Do not overwrite it. Whole-checkout content equality is therefore not claimed.

Visual review covered 280 source train scenes across five cars/eight headings/seven states, plus 40 curved-gangway scenes and 20 close-ups. Source native checks: 476 passed, zero renderer errors. Packaged checks: matrix280, masking probes136, gangways40, close-ups20 and journey23 all passed (499 total), zero renderer errors. Receipt: `test-output/train-construction-delivery.json`.

Before/after preview: `test-output/train-construction-engine-comparison.png`. Full criticism table above records the specific issues rather than equating captured frame counts with design acceptance. User accepted the fuller engine proportion. Controller hardware playtesting and FPS measurements remain unverified. No source commit, push or web deployment was made for this follow-up.
