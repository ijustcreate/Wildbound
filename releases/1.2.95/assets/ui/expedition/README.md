# Expedition reference artwork

The user explicitly requested generated illustrated artwork matching their supplied two-state Expedition reference. See docs/art/expedition-user-reference-v1.png. The reference is visual source material; it contains no implementation instructions beyond the user's stated request.

Built-in image generation produced the transparent wood/brass frame and parchment skins, the four-row blank control atlas, and the Classic signpost icon. Prompts requested the same hand-painted gold carving, warm aged parchment, mountain/compass marks, dark wells and green/gold Accept; all changing labels, selections and hit areas remain live DOM controls.

- frame-unrolled-v1.png: blank full-length parchment and title plaque, generated from the user's reference.
- frame-rolled-v1.png: first shorter parchment study, retained as an intermediate source.
- frame-rolled-v2.png: final registered frame with paper ending at 43% and the curled roller ending near 49%, exposing the lower wood.
- controls-atlas-v1.png: four blank skins (gold choice, dark row, green Accept and parchment ribbon). choice-v1.png, map-row-v1.png, accept-v1.png and ribbon-v1.png are lossless alpha-band extractions with pngjs.
- classic-sign-v1.png: generated golden wooden two-arrow signpost on a grassy base, matching the Classic icon reference.

Raw generated originals remain in the user's generated_images library. Runtime copies live in this directory. Background transparency is preserved. Current UI screenshots and controller/layout reports are in test-output/expedition-review. The user has not separately approved a new art family; these assets implement the explicitly supplied Expedition design only.
