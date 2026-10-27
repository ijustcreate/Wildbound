# Player card frame and cemetery mausoleum footprint

## Player cards

Redesigned the live roster cards around the supplied reference: pixel portrait, all-caps name/HP header, health bar, mana bar when applicable, and a compact row of supplies/dash status. After playtest feedback, reduced card width and portrait size; cards without mana collapse the mana row to avoid empty space. Values, portraits, accessibility labels, co-op card ordering, and responsive small-window behavior remain live DOM/canvas content.

The generated frame is `assets/ui/player-card-frame-v2.png`. It is intentionally free of text and icons and has a transparent exterior and transparent center. CSS consumes it as a nine-slice `border-image` without `fill` so the double-gold border retains its shape as cards resize while the gameplay remains visible through the center. Cards with mana retain the additional bar row; cards without mana collapse it and use a slimmer portrait and shorter card. The image generation used the user's screenshot as a style reference and requested only reusable border art.

Alpha sampling verified that the frame's exterior and center are fully transparent. Card-level shadows are disabled so the artwork leaves the gameplay unobscured outside and within the frame.

## Cemetery collision

The mausoleum facade/cornice is 140 px wide in the native art (`width: 128` body plus 6 px overhang per side), but its solid collision rectangle was only 128 px wide. The generated footprint now matches the drawn side extents while keeping the front stairs and opened doorway walkable. Cemetery feature version 3 migrates older saved mausoleums in place and preserves door state and other authored data.

Regression coverage checks the visible side edge, clear exterior, accessible stairs, doorway aperture/pillars, and migration of old footprints. Focused cemetery/render tests and packaged boot checks are part of release QA.

## Lobby TV pipe plants

Piranha plants now occupy one out of each four pipe positions in the seeded lobby TV course. The seed rotates the selected pipe positions while preserving them across repeat visits; the jungle exploration level is unchanged. A regression test checks the ratio and deterministic placement.

## Test build

Packaged as `dist/1.2.6/Wildbound-win32-x64`; Desktop shortcut `Wildbound Worlds (1.2.6).lnk` targets `Play Wildbound.cmd` in the normal save profile. Package boot smoke passed (`failed: 0`), the runtime syntax scan checked 352 files, and focused cemetery/render plus lobby-TV tests passed. The package manifest marks `sourceDirty: true`; no commit or push was made.
