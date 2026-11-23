---
name: wildbound-art
description: Create, revise, and verify Wildbound pixel sprites, scenery, wearable parts, and editable rig animations. Use for asset work on the Wildbound source checkout, including the pixel recipe command and skeletal motion transfer.
---

# Wildbound Art

Use the current Wildbound checkout and follow the [project instructions](../../../AGENTS.md). These workflows use the game and tools in the repository.

## Choose the workflow

- [Pixel art and recipes](references/pixel-recipes.md) for new icons, sprites, and short animated effects, or a focused redraw with coordinate patches.
- [Environment art](references/environment-art.md) for buildings, rooms, vegetation, and fixed-view props. Judge them beside a native scene under the destination camera.
- [Rigged art and motion](references/rigged-art-and-motion.md) for eight-direction characters, creatures, fitted gear, or transferring skeletal motion to native pixel parts.

## Review one asset in context

1. Find the asset's source, renderer, intended display size, and closest in-game reference. For a revision, capture the original and identify the specific defect.
2. Record the intended footprint or pivot, silhouette, palette, main light, and one identifying detail. Work at the existing pixel density. Correct the contour and material planes before adding texture or variants.
3. Integrate through the existing asset and renderer path. Preserve user-authored overrides, unrelated art, and saved drafts.
4. Compare the result at native gameplay or inventory size and with integer nearest-neighbor enlargement. Keep the same scale and viewpoint for a before and after. For animation, review a full loop in the real renderer, including the last-to-first transition.
5. Record the source and exact checks performed. Label an unreviewed aesthetic change as a draft. Use a muted, isolated Electron session for gameplay verification.
