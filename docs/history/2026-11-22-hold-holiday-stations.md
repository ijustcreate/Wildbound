# Held attacks, Christmas house and train presentation

Checkout: `C:/Users/New User/Desktop/Wildbound`, branch `Wildbound_worlds`, origin `https://github.com/ijustcreate/Wildbound.git`. Base commit `f0b787ff33c3ac8f3675b48504937ebda4f0dcb5` plus modified source. Existing uncommitted gameplay, assets and authored data were preserved. No commit, push or publication requested.

## Changes

- Three held-attack ground improvements: shaped, outlined footprints with inset rails; charging notches and gathering ring; directional chevrons and endpoint reticles with a bright ready state. Spell palettes remain distinct. Previews use actual charged reach and collision-plane origins, before actors.
- Charged hold-position sword dash now tests enemy bodies against each actual swept movement segment. Previously a center-only lane test and ordinary melee arc rejected overlapping enemies. Body flanks and segmented creatures are covered; walls, visibility and once-per-target damage still apply.
- A native decorated Christmas tree occupies the room left of the game board. Additive placement avoids existing furniture and preserves authored layouts. The wrapped gift yields exactly one random item: toy train, hot chocolate, Santa hat, Christmas bell, boomerang, ice wand or healing wand. It drops one manual-pickup item safely with full bags, records the opened state and does not reroll after saving/loading. Placement is one gift per house save, not one gift per player or visit.
- A wreath attaches to the locomotive front, below the headlight, in both native and painted machinery rendering. Back views hide it appropriately.
- Roofs follow actual house floor rectangles, with hipped planes and tile courses. A roof section cuts away when a living shared-world player is inside that section. Christmas bulbs trace its perimeter and remain visible at night. Roof rendering follows the interior fog mask so unseen indoor tiles cannot hide the exterior roof. Static roof cache is capped at eight surfaces and four million pixels.
- All eight Wild Lands stations keep buildings and props upright. Each doorway is built into the platform-facing wall, with a supported approach and clear interior aisle. Forecourts, roof tiles, signs, lanterns, door mats and platform safety edges improve readability. Platform geometry still follows the track.
- Seated train riders receive a clipped foreground tabletop/apron pass. Camera depth determines which portion covers each rider, including raised mugs; near-side players remain visible. Native and painted tables use the same art and footprint as the base pass.

## Art contract

Applied `wildbound-pixel-assets`. Native Canvas geometry extends existing art rather than introducing a baked character atlas. The tree uses an approximately 52-by-100 logical-pixel silhouette, four grouped evergreen shades, sparse red/gold ornaments and a visible star, anchored at its floor footprint. Furniture cache headroom accommodates the star. The wreath uses a small green ring with red bow and gold knot in the locomotive front plane. Roofs use restrained slate/green planes, broad courses and steady multicolor bulbs. Station buildings and furniture remain world-upright in all eight views. Existing authored rigs retain SHA-256 `9a2c55d1090231ce5ec11cf06091224a9efb1b62a0c1bb0b3eb312a0cdad0be1`.

## Verification

Focused regressions: 190 passed, zero failed. Muted isolated Electron source review (`scripts/verify-world-polish.cjs`): 49 checks passed, zero renderer errors. Covers real eight-direction sword hits, gift opening/no reroll, roof cutaway, eight station entrances and actual foreground table pixels in eight views. Screenshots are under `test-output/world-polish/source/`. Full desktop build and packaged receipts will be appended after completion.

Personal saves, local characters and house drafts were not replaced. Normal sound settings were not changed, and existing player processes were not terminated. User aesthetic approval, hardware-controller play, remote multiplayer and sustained FPS remain unverified.

The full-suite run exposed a pre-existing random house encounter failure: a tree-mounted hive could be offset across the house floor boundary, and its fallback could also choose an indoor point. Hive placement now rejects both indoor positions. A deterministic boundary regression and the complete bee/house test files pass (20 tests). This correction does not alter authored trees or house layouts.

## Desktop delivery receipt

- Full-suite run: 1,908 passed, one failed (the hive issue above). The failure was corrected and both affected files rerun successfully: 20 passed. The entire suite was not repeated after this fix; the original rebuild script correctly stopped at its failed-test gate. Packaging and shortcut creation were then run separately after the targeted correction.
- Syntax: all 862 runtime files passed. Packaged isolated muted Electron review: 49 passed, zero renderer errors. Exact packaged executable boot smoke: zero failures, ready lobby, audio muted, no errors.
- Output: `C:/Users/New User/Desktop/Wildbound/dist/1.2.104-2026-11-22T17-00-37-256Z/Wildbound-win32-x64/Wildbound.exe`. Version 1.2.104 reflects the concurrently updated checkout; no version rollback was performed. Manifest: base commit `f0b787ff33c3ac8f3675b48504937ebda4f0dcb5`, `sourceDirty:true`, `preview:false`, built `2026-11-22T17:00:53.732Z`.
- SHA-256 comparison: all 1,605 shipped runtime/source/asset files match the checkout; intentionally excluded raw motion donors and backup files are not counted. Receipt: `test-output/world-polish/package-hashes.json`.
- `Play Wildbound.cmd --check` selects that exact executable. Desktop `C:/Users/New User/Desktop/Wildbound Worlds (1.2.104).lnk` targets `C:/Users/New User/Desktop/Wildbound/Play Wildbound.cmd`, blank arguments, repository working directory, `assets/wildbound-icon.ico`. This is the normal save profile, not `--preview`.
- Source and packaged screenshots/reports: `test-output/world-polish/source/` and `test-output/world-polish/packaged/`. No commit, push or web publication performed.
