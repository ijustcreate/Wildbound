# Crooked witch hat art and colors

The original Moss hat had a thin point in profile and an almost level strip for the brim. The [concept study](../art/witch-hat-study.md) compares the original against the new felt shape and palette. The [packaged turnaround](../art/reviews/2026-11-23-witch-hat-turnaround.png) shows all four finishes at inventory scale and on the player in all eight directions.

The [hat painter](../../src/witch-hat-art.mjs) uses one indexed cloth and hardware palette per finish, eight fitted views, and a separate 24 × 24 icon. The new brim separates the lit rim from its underside. The band wraps around the crown and keeps the clasp out of rear views. The player uses its existing skull anchor and profile art overrides. Inventory icons still respect authored pixels.

Moss still drops in the mausoleum crypt. Madam Malkin’s in Diagon Alley sells Ink Plum, Midnight Slate and Ember Russet for 30 gold each. The three stock entries appear when old expeditions reopen the shop. All four hats have +2 armor.

## Desktop verification

- 73 focused Node tests passed, covering native icon colors, fitted anchor bounds, the crypt reward, and all three purchases carrying back to an existing expedition.
- Muted Electron checked both the source checkout and packaged renderer. The 38 comparison, icon and facing PNGs matched byte for byte. The live backpack and Item Studio showed all four variants, and the studio exposed editable pixels for each facing. The packaged executable booted to the lobby and exited the smoke test with code 0.
- Windows desktop build **1.2.126**, from `5b244635ab78e5a3c8e78ef21fdbabf60e505fd7` with working-tree changes. The package predates concurrent changes to Diagon Alley arrival preloading. It contains the same witch hat and shop stock code checked here.
- `Wildbound Worlds (1.2.126).lnk` in the current user’s Desktop targets `Play Wildbound.cmd -BuildDirectory "dist\1.2.126\Wildbound-win32-x64"` in this checkout. The launcher verified the exact package and uses the normal save profile.

This is the first family in the asset art pass. The other headwear, remaining inventory and fitted gear, world props, and creatures still need their own concept and in-game reviews. Reuse the 1× icon and native turnaround comparison when reviewing those families.
