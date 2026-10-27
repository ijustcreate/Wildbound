# Native cavern art sample

Status: room-and-tunnel preview prepared for user review; no production registration or package change.

The user rejected generated raster sprites converted into indexed art. Generated cave concepts may guide composition and lighting, but actual props must follow native Wildbound construction. This sample is authored directly as polygon/color data in `src/cavern-native-sample.mjs`, rasterized directly into the existing editable 64×64 sprite format without image inputs. Source polygons, palette, contact mask and ground anchor remain editable.

Visual contract: existing Forest and Beach rocks are the primary construction references. Use their green-grey stone ramp (#344740, #59675f, #899087, #bbc0a1), upper-left lighting, a few broad planes and a single readable fracture. The low shelf has a shallow top plane and grounded front face. Two cyan crystal points grow out of a stone base, with broad facets and a restrained tip highlight. Preserve unrotated game perspective and existing world sizes: shelf 90, crystal 65, anchor (32,61). No grain, generated surface texture or imported image outlines.

The follow-up playable preview lives in `src/cavern-room-slice.mjs`. It makes an organic chamber, a bent connected side passage, editable cavern terrain, a shallow/deep pool with an irregular rendered shoreline, and native shelf, crystal, stalagmite, mushroom and drip props. The crystal reuses normal mining/depletion, and the shelf retains its existing collision and jump support. Its renderer and sprite overrides exist only in the isolated review script.

Preview image: `test-output/cavern-room-slice/gameplay.png` is captured by Wildbound's actual Renderer with the native player animator, game lighting, HUD, cavern terrain and scenery passes. `overview.png` shows the connected layout and props. Check the connected passage, player scale, rock silhouettes and pool bank before expanding to the room network.

Run `node_modules/.bin/electron.cmd scripts/review-cavern-native-sample.cjs --mute-audio` for the matched Forest/Beach comparison, or `node_modules/.bin/electron.cmd scripts/review-cavern-room-slice.cjs --mute-audio` for the actual gameplay view and room checks. Both use isolated profiles.

Verified in muted Electron: the player spawn is clear; player-radius traversal connects the chamber and tunnel; the pool has shallow and deep water; both native sprites validate; a crystal mines/depletes through actual harvest calls; and the shelf retains the existing realm collision/jump surface. These checks establish compatibility, not artistic acceptance. No saved overrides or authored rigs were modified.
