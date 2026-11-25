# Sprite-stacked props

Use Daniel White’s four-view slicer to turn a pixel-art prop into a volume of horizontal layers. This workflow fits turntables and props that need multiple headings, such as furniture, carts, or freestanding fixtures. Match the environment’s camera, footprint, and depth key. [Upstream skill](https://github.com/danielwh2/sprite-stacking/blob/0cce02efe6aa81fffcd05744d7ab65d40f412de2/skills/sprite-stacking/SKILL.md) · [Environment art workflow](environment-art.md)

## Design and pixel views

1. Capture the current prop in the native renderer and record its art size, ground contact, footprint, and one identifying detail. For a replacement, use that capture to guide a new ImageGen concept. Retain the recognizable function and material palette, and choose contours and connected details that survive at Wildbound’s art-pixel scale.
2. Use the concept as the input for a second ImageGen pass. Ask for one horizontal row of four same-scale orthographic pixel views ordered top, side, front, and back. The top view’s front points down and the side view’s front points left. Ask for solid pixel clusters, clear gaps between views, and a transparent or flat white background. Leave out perspective, captions, shadows on the ground, detached decoration, and antialiasing.
3. Inspect the views on a shared grid. Top width matches front and back width, top depth matches side width, and all elevations share the same height and ground line. Center each silhouette vertically in the row for the slicer’s view detection, and keep more than 12 source pixels between silhouettes after cropping. Clean inconsistent scale or silhouette differences before carving. Use binary alpha when preserving see-through gaps. Give posts and rails at least two art pixels of thickness or they may flicker at oblique angles.

High-resolution pixel-style renders can contain subpixel texture. Use nearest-neighbor fitting to the target grid, and simplify any details that break up during rotation. A single attractive three-quarter frame is good for the concept pass. It still needs the four aligned views for slicing.

## Carve and inspect

Run the upstream slicer from a reviewed checkout with Python 3, Pillow, and NumPy. This example runs from the checkout root and targets a height of 24 art pixels. Choose the height by comparing against the existing prop at gameplay scale. [Upstream slicer](https://github.com/danielwh2/sprite-stacking/blob/0cce02efe6aa81fffcd05744d7ab65d40f412de2/skills/sprite-stacking/scripts/views_to_slices.py)

```sh
python skills/sprite-stacking/scripts/views_to_slices.py views.png slices.png --order reading --top-nose down --side-nose left --slices 24 --preview check.png --html viewer.html
```

- Forced reading order keeps similar-looking views from being swapped. The slicer intersects the top silhouette, side profile, and union of the front and mirrored back profiles. Cavities hidden in all outer silhouettes can fill in, and protrusions can form longer ledges than intended. Inspect the check sheet and edit individual layers when needed. Use `--round` for round vessels or columns whose stacked contour needs an elliptical taper.
- An opaque background is removed by flood fill from the border, so enclosed white holes may survive as solid pixels. Transparency gives direct control over holes and margins. Use `--colours` to constrain the shared ramp and `--dark-thresh 0` if outline stripping removes important dark edges.
- Keep the native capture, concept, pixel sheet, RGBA strip, and preview. Record the tool revision, slice width, slice depth, layer count, ground anchor, camera squash, and layer lift alongside the final asset. Preserve the upstream MIT license notice with distributed copies of the upstream tool or viewer, including generated HTML that embeds the upstream viewer. [Upstream license](https://github.com/danielwh2/sprite-stacking/blob/0cce02efe6aa81fffcd05744d7ab65d40f412de2/LICENSE)

## Review in Wildbound

- The strip holds equal-size RGBA tiles from ground to roof, left to right. Verify the strip width equals tile width times layer count. Rotate all slices about the same ground pivot, squash depth for the destination camera, and raise each successive slice by the chosen art-pixel lift. Draw bottom up with nearest-neighbor sampling. Check a full rotation for a stable footprint, holes, disappearing details, or clipping. Compare the same gameplay-scale placement and integer enlargement beside the native capture.
- Keep preview replacements available for visual review before adopting them in a scene. For integration, depth-sort the whole prop at its ground anchor and match the shape used by the destination shadow pass. Reuse the scene’s renderer and cache static composite sprites or the headings it needs. Use muted Electron to check the result in context at the original placement, including actor occlusion, interaction reach, and collision.
- For a hinged prop, place the pivot on the hinge and project each layer through the existing motion state. Check the connection at both end poses and the silhouette as it passes edge-on. Reverse layer draw order when the underside faces the camera. The Greyhaven drawbridge bakes its resting poses and draws its nine layers while it moves. [Greyhaven authoring notes](../../../../docs/design/greyhaven-sprite-stacks/README.md)

The five Wildbound demos show the native props, concepts, and layer strips together. [Source and art notes](../../../../docs/design/sprite-stacking-demos/README.md) · [Interactive review](../../../../docs/design/sprite-stacking-demos/index.html)
