# Default explorer art

The default explorer wears a wider teal jacket with broad shade planes, warm cuffs and belt, slate trousers, and russet boots. A directional chestnut crop and smaller eyes put more emphasis on the head silhouette. The art uses the existing eight-direction rig, layer order, joint positions, and animation clips. The source applies to the stock lobby preset and legacy stock explorers. Customized looks and NPCs retain their own art. Equipped and authored part layers keep priority.

Muted, isolated Electron used the world player render size of 43 for the standing and running comparison. The 1× PNG and synchronized run GIF are in `test-output/character-art-work/` as `explorer-lobby-before-after-native.png` and `explorer-lobby-before-after-run.gif`. The comparison uses the playable lobby preset. The restored baseline matched all 88 original control captures. All 120 stock samples changed and all 64 matching NPC or customized samples stayed pixel-identical. Equipped coat and circlet variants were included. The authored rig file retained its original SHA-256.

The source and captures were reviewed from the `Wildbound_worlds` checkout at `a6cee9bc55ad12ed58df5c3d27b150449f31ef26` with concurrent local work. Verification used the source renderer in Electron. The numbered desktop packages predate this art pass.

The focused Node suites and stock-selection regression passed. The separate creator UI verifier stopped at its controller-family prompt assertion before the art preview checks. The comparison and character renders passed independently of that verifier.

## Chibi proportion revision

The second pass restores the original eye art. It uses the user's November 23 eight-view turnaround for the rounded cheek-to-jaw contour, swept crown, close collar, sturdy torso, and broader boots. The recovered source attachment is saved as `test-output/chibi-explorer/reference-turnaround.png` alongside the comparison.

The stock outfit applies the shorter proportions during drawing. Feet and boot rotation use the original pose contacts, and the authored rig file keeps its original hash. Authored parts and fitted outfits retain their placement. The exposed head has a separate directional skull and hair treatment.

Muted Electron captured 216 baseline and 216 revised samples through the production Animator at world render size 43 with the authored rig loaded. All 120 stock samples changed, and all 64 NPC or customized samples and 16 circlet samples matched the baseline. The side-by-side PNG and complete synchronized running GIF are `chibi-explorer-native.png` and `chibi-explorer-run.gif` in the same folder. A separate muted full-app source boot and 21 focused Node tests passed.

## Head scale turnaround

The stock explorer head is drawn at 85% of its prior width and height. The skull, hair, and facial layers use the same transform about each direction's lower skull contour, which preserves the jaw-to-collar placement. The authored rig hash stayed the same. All 16 focused tests passed.

Muted Electron captured 216 poses before and after through the authored rig at world render size 43. The lower outfit and feet matched pixel for pixel in all eight standing views. Customized, non-player, and fitted circlet samples stayed pixel-identical. The silent 10-second `test-output/explorer-head-turnaround/explorer-head-turnaround.mp4` shows all eight facings at 1× and nearest-neighbor 8×. The MP4 was decoded in full after encoding.

## Facing refinements

The stock explorer head is another 10% smaller about the same collar anchor. SW and SE use stepped pupils and separated eye shapes in the original palette. N and NE have raised rear collars. The NE coat aligns more closely with the hips, and the E boot joins at the ankle with a distinct toe. The rendered upper arms and forearms are 10% longer around the original shoulders. The editable rig, animation data, and foot anchors are preserved.

Muted Electron reviewed all eight facings, the complete run, and representative mining and pickup poses with the authored rig loaded. The capture had zero renderer errors. The 64 customized or non-player samples and 16 fitted circlet samples remained pixel-identical. The revised 1× and 8× turnaround is `test-output/explorer-facing-fixes/explorer-facing-fixes-turnaround.mp4`. The same folder contains the paired standing and motion crops. Full decoding and a frame check of every facing passed.

## Marked turnaround revision

The user's arrows pointed to the S, SW, and SE eyes, the NW, N, and NE collar and shoulders, the SW and NE trouser silhouettes, and the E ankle seam. The standing eyes now have separate ivory, sage, and pupil pixels at 1×. The rear yoke flows into the sleeves, the marked knees and thigh read as continuous cloth, and the E trouser cuff joins the boot shaft. The existing rig, head scale, arm lengths, and foot anchors are preserved.

Muted Electron captured the authored standing, running, and bent poses with zero renderer errors. Tested custom, non-player, and circlet variants remained pixel-identical. At 1× a few run frames omit an eye accent color. The focused 34-test run and final nine face tests passed. The clean 8× markup sheet is `test-output/explorer-markup-revision/explorer-turnaround-markup.png`, with gameplay-size and movement comparisons in the same folder.

## Shared humanoid trial and zombie head

The approved explorer now supplies the default art and visual pose fit for the shared native player rig. Custom players, player-backed NPCs, and Studio can use that base with their own palettes, hairstyles, and face details. Fitted outfits, seats, and existing painted overrides use their established anchors. Held effects follow the rendered hands. Studio displays fitted guides, writes motion in the editable coordinate system, and tags new sprite captures that use the shared fit. Dedicated character and creature rigs retain their individual templates.

The zombie has a directional skull with a taller crown, recessed eye sockets, and a separate jaw contour. The face respects direction and existing visibility controls. The body and motion remain on the zombie rig.

Muted Electron captured shared-base and zombie comparisons under `test-output/shared-humanoid-preview/`. All 136 approved explorer poses matched the baseline. Custom explorer and Luna samples updated with their own colors and details. Fitted outfit, independent villager, skeleton, and wolf samples matched their baselines. Across all 72 zombie variant samples the changed pixels were confined to the head area. The authored rig hash stayed the same. The 37 focused appearance, creator, ranged, and headwear tests passed. Eight native Studio checks, 13 Studio and rig tests, and 24 matched Item Studio pose checks passed. The broad Studio item catalog sweep timed out after its tool checks. This is a source checkout trial with no new numbered package.
