# Castle Greyhaven artwork and residents

Greyhaven uses horizontal pixel layers for its stonework, slate roof, fixtures, furnishings, and other built surfaces. The exterior takes its light and material cues from the [ImageGen concept](exterior-concept.png), generated with the original castle capture as a reference. The castle’s existing geometry provided the profiles for layer authoring. The cellar and kitchen use the painted cask and crate strips from the [five-prop trial](../sprite-stacking-demos/README.md).

The fixed shapes share baked sprites or floor and scenery rasters. Tables retain moving candle flames, the orb floats, and the water renderer still supplies flowing water beneath the bridge. The stair landings, portcullis opening, fixture anchors, and castle footprint continue to track the existing floor and collision plan.

## Hinged drawbridge

The [drawbridge concept](drawbridge-concept.png) and [orthographic sheet](drawbridge-views.png) came from the built-in OpenAI ImageGen tool, using the original Greyhaven entrance as the first reference. The [two prompts](drawbridge-prompts.json) document the sequence. The runtime strip holds nine 80 × 81 pixel slices. The authoring command uses [Daniel White’s MIT-licensed slicer](https://github.com/danielwh2/sprite-stacking/tree/0cce02efe6aa81fffcd05744d7ab65d40f412de2), with the four views registered explicitly because the side faces are thin.

```sh
python docs/design/greyhaven-sprite-stacks/build-drawbridge.py docs/design/greyhaven-sprite-stacks/drawbridge-views.png <upstream>/skills/sprite-stacking/scripts/views_to_slices.py assets/greyhaven/drawbridge-slices.png
```

The deck pivots on its north hinge. Its texture flips from the walking face to the braced underside as it passes edge-on. Each chain follows the projected far edge. Nine layers draw during the 1.25-second travel, and the two rest poses are baked lazily into one deck sprite each. The existing lever sets the movement and preserves bridge support, party access, and checkpoint rules.

## Merlin, Wart, and Archimedes

Merlin wears a brimless Starwatch cap and a full blue astronomer’s robe. His long beard sways at the jaw attachment and he carries a rowan wand. Wart wears a russet page’s tunic and practices with an ashwood sword. Both use the Wildbound humanoid rig. Archimedes uses the articulated brown owl art, follows Merlin through the tower stairs, and turns toward the nearest visible living explorer when perched.

| Time | Merlin | Wart |
| --- | --- | --- |
| Dawn | Warms the kettle in the kitchen | Tidies the Gallery bedchamber |
| Morning | Sorts books in the Gallery library | Practices footwork in the Great Hall |
| Afternoon | Works on a tide chart in the High Solar study | Copies the chart beside Merlin |
| Dusk | Checks the drawbridge from the gate landing | Counts plates in the banquet room |
| Night | Watches the orb in the High Solar | Keeps watch by the Gallery rail |

Conversations have local topics and optional spell and sword demonstrations. The rowan wand, Starwatch cap, page’s tunic, and practice sword are available through their respective conversations, once per hero. A full pack leaves the gift available for later.

## Verification

- `node --test tests/greyhaven-residents.test.mjs` checks the daily route, stair transfers, owl following, dialogue, per-hero gifts, and bridge projection.
- The muted source Electron walkthrough in `test-output/greyhaven-stack-integrated/source-worker/` passed 74 checks with the terrain Worker active. It covered bridge movement, water support, all three floors, co-op views and checkpoint reload.
- Nine additional muted source Electron resident checks and gameplay captures are under `test-output/greyhaven-npc-review/npc-visual-final/`. They include the study dialogue, owl flight, a cross-floor transfer, the orb chamber and simultaneous co-op prompts.

## Desktop 1.2.162

The normal-profile package at `dist/1.2.162/Wildbound-win32-x64/Wildbound.exe` was built from the modified checkout at `a6cee9bc55ad12ed58df5c3d27b150449f31ef26`. All 27 relevant runtime files matched the source by SHA-256. The numbered desktop shortcut targets `Play Wildbound.cmd -BuildDirectory "dist\1.2.162\Wildbound-win32-x64"`.

The packaged renderer also passed the 74 castle checks and nine resident checks in muted Electron with zero renderer errors. Captures and reports are in `test-output/greyhaven-stack-integrated/packaged-1-2-162/` and `test-output/greyhaven-npc-review/packaged-1-2-162/`.
