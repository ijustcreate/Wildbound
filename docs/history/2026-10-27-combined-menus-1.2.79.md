# Wildbound 1.2.79 — integrated resizing, empty chooser and blank costume

This release integrates this chat's completed menu work (532e8d72a781734750ea1f5fe64c8dcebf5167d2 and scaling parent 01e8463) with the concurrently published 1.2.78 source (0f33cc30b68336dcb164281545d504541519670b). The earlier 1.2.57 preparations were never published. Both histories are preserved by the merge; no force push, reset or profile migration.

## Result

The empty chooser has the grey native question-mark explorer and only + New character and Close, both on first use and when every saved explorer is in use by another player. The normal chooser returns when an explorer becomes available. Preview data never creates a saved hero or grants equipment; creation retains ordinary character appearance.

Blank explorer costume (blank_explorer_costume) is actual chest-slot developer-only gear, with zero armor/health/socket bonuses. Existing dev cheats can grant/equip it. Ordinary gear rolls, earned/ordinary victory rewards and their fallback exclude it. Its inventory icon, current rig animation, eight directions and six actions are native; no bitmap replacement or authored-rig change.

Viewport resizing immediately repositions cards without the dock transition. Small cards retain at least 80% text scale, focus scrolling accounts for that scale, and the title illustration/prompt share one contained aspect ratio. Resize-generated mouse motion does not join a player.

## Remote work retained

The 1.2.78 source includes accumulated gameplay/editor/creature/vehicle/creator work through 1.2.77. Semantic conflict resolution retains its updated vehicle descriptions, Bone Carver catalog, custom item-pixel precedence, skeleton artwork dispatch, bone-leg renderer condition and compact map/dice menu sizing, while adding the placeholder and scaling rules. Other remote source, artwork and tests are integrated intact. See the earlier 1.2.78 publication note for that work.

## Verified combined source

- All 1,670 Node tests pass (test-output/combined-1.2.79-full-suite.log), including the new dev-equipment and loot exclusions.
- 63 muted offscreen resize/zoom/multiplayer-focus checks pass, zero renderer errors.
- 101 newer creator-inline UI checks pass, zero renderer errors.
- Placeholder checks pass for first use, all claimed, release, creation without leakage, actual dev spawning/equipping, actual inventory and Studio, eight views/six actions and model preservation, zero renderer errors.
- The web builder checks 483 runtime files. HTTP-served compiled web smoke passes startup, Workshop, Worlds, gameplay update/render, save separation/reload and historical boots; 428 original runtime files match.
- Authored rigs retain SHA-256 dc05411b47f02259be95ea0ed22aea375d76f79b55d7f0bdec57da5df7ed7d71. Physical controllers, remote multiplayer and FPS are not claimed.

## Web size and immutable assets

The existing Pages checkout is 848.4 MiB; copying the complete media into another edition would exceed the published-site size limit documented by GitHub (https://docs.github.com/en/pages/getting-started-with-github-pages/github-pages-limits). The standalone dist/web-1.2.79 build remains complete.

For publication only, scripts/share-web-assets.cjs verifies every current media/shared-rig file against immutable 1.2.78, then rewrites the generated new-edition asset URLs to that identical media and moves the redundant generated folders into ignored dist staging. It refuses changed/missing assets. Source/native paths and every historical release are untouched. This saves 191 MiB across 662 verified files; 29 generated text files have asset URL rewrites. Directory-only validation strings are preserved. The new version's web-build.json identifies sharedAssets and its final publishedSourceCommit. The resulting site is approximately 861 MiB.

Publishing sequence: assemble-web-pages.cjs against the latest Pages checkout, then share-web-assets.cjs <pages> 1.2.79 1.2.78. The HTTP smoke accepts WILDBOUND_PAGES_DIR for that checkout. The dedicated blank preview verifier accepts WILDBOUND_VERIFY_URL for live testing. Keep 1.2.78 media immutable because 1.2.79 references it.

## Delivery identity

Checkout C:/Users/New User/Desktop/Wildbound, Wildbound_worlds. The merge commit containing this note identifies the combined source. Exact native output, build manifest, muted actual executable boot and shortcut receipt are generated under test-output/ after packaging. Desktop Wildbound Worlds (1.2.79).lnk targets this checkout's Play Wildbound.cmd with blank arguments, normal profile.

Latest browser target: releases/1.2.79/. Original, 1.0.74, 1.2.55, 1.2.56 and 1.2.78 remain intact. No downloadable release or separate character-viewer Site deployment. Personal saves, drafts, sound preferences and system volume are preserved.
