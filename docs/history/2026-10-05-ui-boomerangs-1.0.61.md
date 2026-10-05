# UI, returning weapons and pause options — 1.0.61

Generated a transparent production UI atlas with the built-in image generator, extracted its panels/buttons/icons under assets/ui-parchment, and added nine-sliced parchment/wood/jade chrome. SCRAP-9 now has readable item rows, 48px icons, paginated Sell/Purchased views and explicit stack-sale actions. Purchased items remain a sales record, not a new buyback economy.

Added starter boomerang to the lobby starter chest and complete kit. Trail/common, Moonsteel/rare and Sunfire/unique boomerangs enter the existing gear-drop pools. They return to the moving thrower, hit each enemy once per throw, use no ammo, and have in-hand and flight artwork.

Arrow quantity badges follow loot visibility in both lobby and expedition. Ground-water impacts produce a small splash and destroy ammunition; airborne arrows still cross water. Forest ambience cue gain reduced from .42 to .10 without overwriting saved mixer sliders.

Start/+ pause menu now exposes fullscreen, PvP, mid-expedition difficulty, mute, music/SFX adjustment, further settings and GM console. A PvP-off indicator is displayed during play. Remote clients cannot change host PvP/difficulty. Existing controller dialog navigation handles these controls.

Verification: boomerang return/one-hit/loot-tier and water-arrow tests; Electron merchant sale/view isolation, sprite loading, pause volume/difficulty/PvP/GM actions; Electron storage empty/deposit/withdraw regression. Screenshots inspected in test-output. Physical Xbox/Switch hardware not playtested. Normal packaged build uses the current dirty source at HEAD 1891708d014594bd837f1a7049ecefa04d16dae4; no commit/push requested. Shortcut remains Play Wildbound.cmd, normal save profile.
