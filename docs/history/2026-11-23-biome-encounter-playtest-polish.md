# Biome encounter playtest and pixel polish â€” 2026-11-23

## Behavior

- Nearby co-op targets (under 120 world units on the same floor) share offensive admission and projectile handoff quiet time. Separated teammates retain independent turns, with starts staggered by 0.28 seconds inside the encounter. Already committed attacks keep their original target when players move together.
- Ordinary species reconsider proximity and recorded threat between attacks. Windups and active attacks retain their target; losing that target opens recovery instead of redirecting a committed hit.
- All 20 default introductory pairs now have distinct kind/role signatures. Five previously repeated the shield/archer opener. Forest introduces shield/boar; desert tarantula/archer; ice shield/wizard; house shield/unarmed; graveyard zombie/archer. The full trios retain their species, stats and authored identity. Reduced groups use advice for the actual pair.
- Incoming heavies now consume the same weighted local pressure as existing heavies. Groups trim to a coherent pair or defer; never a lone leftover.
- A skeleton healer with no remaining escort approaches for its telegraphed staff attack instead of retreating indefinitely inside an unusable ranged formation.

## Pixel art correction

The user asked for a closer Wildbound pixel-art match during this pass. Followed the Wildbound Art Refiner workflow; inspected native creatures, sword palette, in-game backgrounds and nearest-neighbor enlargements. One-world-pixel stepped contours replace smooth arcs/strokes, using muted bronze and dark teal backing. Shapes remain a single faint footprint. Imp landing markers and scorpion bite cones share the renderer; the extra imp crosshair is removed. Golem rock-lift no longer paints a misleading melee circle. Native rig artwork and editable clips are preserved.

Brief: `docs/art/biome-combat-tells.md`. Art study: `test-output/biome-telegraph-style/packaged-pixel-final/` (native forest/ice/cavern frames, enlarged pixel crops and earlier/revised study). Controlled art scenes remove nearby occluders only in disposable test state; real fight replays keep scenery. This is self-review, not recorded user approval.

## Checks and limitations

- 170 distinct focused Node checks across group coordination, combat tactics, roster combat, encounter policy/runtime, event variety, encounter layouts, carrying, fauna and creature additions. Final healer/contour suite: 45 passing; budget/creature additions: 29 passing. No clean full-repository-suite claim.
- Baseline full-update desktop driver found 13 fresh co-op attack overlaps and five reused pair signatures. The harness was subsequently corrected to use normal 100 HP, clear player starts around the board, obstacle steering and a longer replay window, so before/after DPS or clearance comparisons would be invalid.
- Full-update desktop replays retain real projectiles, HP, movement, attacks, blocks, dodges, knockback and native terrain. The final run covers 20 cards in solo/duo and 10 four-player cases. It audits new starts near another active target, not attacks that players themselves bring together after both tells commit. Metrics are scripted diagnostics, not human skill, hardware controller or FPS measurements.
- Before the final healer fix: 50 packaged fights, zero spawn failures, zero detected close-target admission overlaps, zero repeated introductory pairs; 46 cleared in the longer scripted window. Remaining cases prompted healer cleanup correction; retreating ranged enemies and simple bot routing are still test limitations.
- Final packaged replay: 50 fights, 179 observed offensive starts, 85 real damage events, zero spawn failures, zero detected fresh close-target overlaps, zero reused introductory pairs and zero renderer errors. 47 cleared within the roughly 30-second scripted window. Three retained one ranged enemy (four-player armory archer, solo veilwood watcher, duo thornlight book); those cleanup times remain unverified because simple bot routing/chasing is not human playtesting. The shrine healer case now clears. Final biome policy/rendering pass: 640/640 checks in 40 native solo/four-player scenarios, zero renderer errors. Reports: `test-output/biome-playtest/packaged-healer-final/report.json` and `test-output/biome-encounters/packaged-healer-final/report.json`.
- Packaged eight-direction roster/phase rendering and warnings over main/crossing rails: 105 checks, 96 kinds, zero renderer errors. Packaged style checks: 3, zero renderer errors.
- Actual packaged EXE boot smoke: exit 0, ready lobby, Worlds present, no errors, test audio muted.
- All automated Electron windows muted before load with isolated temporary profiles. No player audio preferences, personal saves, house libraries, drafts or authored rig content changed.

## Desktop receipt

Root `C:/Users/New User/Desktop/Wildbound`; branch `Wildbound_worlds`; remote `https://github.com/ijustcreate/Wildbound.git`; base commit `f0b787ff33c3ac8f3675b48504937ebda4f0dcb5`. Extensive existing modified source; no commit/push.

Canonical normal desktop package: `dist/1.2.113-2026-11-23T20-30-39-387Z/Wildbound-win32-x64/`. Packaging passed 989 runtime syntax checks. Original packagedAt `2026-11-23T20:30:56.108Z`. Final healer logic synchronized after packaging with syntax check and SHA-256 recorded in `wildbound-build.json`; final builtAt `2026-11-23T20:34:00.922346+00:00`, modified-source build, preview false. A final line-ending-only normalization of the matching fauna source/package is also hashed in the manifest; tested content is identical. This is a tested snapshot; later concurrent edits are not implicitly included.

Authored rig SHA-256 unchanged: `280FBAC82256AA65C7CDFDEA14834913964003B2823B192E49566E629FE30A41`. Runtime file comparison: `test-output/biome-polish-package-files.json`.

Launcher: `C:/Users/New User/Desktop/Wildbound/Play Wildbound.cmd`. Dedicated verified shortcut: `C:/Users/New User/Desktop/Wildbound - Encounter Polish (1.2.113).lnk`, target the launcher, arguments `-BuildDirectory "dist\1.2.113-2026-11-23T20-30-39-387Z\Wildbound-win32-x64"`, repository working directory and `assets/wildbound-icon.ico`. Normal save profile, not preview. Pinned and default `Play Wildbound.cmd --check` both selected this exact package at verification. Other named art/test shortcuts were preserved.

Final scoped runtime/package hash comparison has no drift across the seven modified runtime modules. Authored rigs still match the preserved SHA-256. No commit or push.
