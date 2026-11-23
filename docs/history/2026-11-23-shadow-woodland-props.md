# Forest-derived Shadow Realm props

User requested the remaining Shadow props use modified forest bushes and plants, matching forest pixel density/style while keeping muted purple colors and distinct enchanted shapes.

Art contract: use the existing 64-pixel forest prop brush, stepped silhouettes, broad shadow/highlight clusters and the forest breeze. Shadow foliage uses #29233e, #4b3b65, #71608c and #a095ba. Recreate silhouettes as hooked brambles, curled fronds, drooping bellflowers and uneven hooded mushrooms rather than only recoloring green sprites. Keep bright magic sparse. The prior tree/fog pass remains intact.

Changes:
- Shared forest prop painter supports a Shadow variant; ordinary forest artwork follows its original path. Seven existing Shadow IDs reuse shrubs, tufts, flowers, fungi and limestone/mossy rocks. Plants inherit native forest wind plus brief player-proximity rustling. Sprite caches distinguish palettes and are capped at 160 entries.
- Ashen log, hollow stump and root arch have new branching wood silhouettes, forest-brush foliage and small mushroom growth. Well, shrine and lantern use matching plant accents; structural props share a cooler muted ramp. Existing roles, resource depletion, placements, collision and saves remain intact.
- Static editor/reflection sprites use the same painter as the moving plants. Edited local sprites remove the native-plant marker and keep priority.
- Forest regression tests exposed an import cycle in the prior tree integration. Tree drawing now lives in a pure shared module, re-exported through forest.mjs, avoiding catalog initialization before tree constants exist. Geometry and motion remain shared.

Validation: 30 realm/enchanted-forest/vegetation tests plus 17 forest/landscape/render tests pass. Final muted source Electron passes 79 checks with zero renderer errors, including native plant markers, animated bush/fern/flower pixels, painted overrides, shared depth/grass/fog, reflection and saved portal round trips. Representative before/after comparison and all-prop board were visually reviewed; a stripe-like fern highlight was removed in favor of broad continuous leaves.

Desktop verification: packaged muted Electron passes all 79 checks with zero renderer errors. Actual `Wildbound.exe --boot-smoke-test --mute-audio` passes with a ready lobby and no errors. Packaging syntax-checked 952 runtime files.

Build: `C:\Users\New User\Desktop\Wildbound\dist\1.2.110-2026-11-23T18-00-19-884Z\Wildbound-win32-x64\Wildbound.exe`, version 1.2.110, built 2026-11-23T18:03:05.719Z from commit `f0b787ff33c3ac8f3675b48504937ebda4f0dcb5` with modified tracked source. Normal profile, not `--preview`.

Shortcut: `C:\Users\New User\Desktop\Wildbound Worlds (1.2.110).lnk` targets `C:\Users\New User\Desktop\Wildbound\Play Wildbound.cmd` with the repository icon. Launcher `--check` selects the exact build above.

All eight changed tree/plant/art integration modules and render.mjs match the packaged snapshot. Source scan after packaging contains 953 runtime files; concurrent chats changed app.mjs, src/field-kit.mjs, src/playable-lobby.mjs, src/tv-arena-level.mjs, src/tv-journey-board.mjs and src/tv-wildbound.mjs after the build snapshot. This delivery does not claim those later changes. Hashes and manifest: test-output/shadow-underworld/woodland-build-receipt.json. Packaged review: test-output/shadow-underworld/packaged/report.json. Focused tests, boot, shortcut and launcher logs use the woodland-* prefix in test-output/shadow-underworld/.

Evidence: test-output/shadow-underworld/source/nativePlantComparison.png, allConceptNativeProps.png and whisperingGrove.png. These are self-reviewed implementation previews, not a claim of user aesthetic approval. No hardware-controller or FPS claims. No commit/push; unrelated shared edits and local player data preserved.
