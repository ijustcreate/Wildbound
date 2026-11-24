# Wildbound visual direction — reference review

Source: the user's `Concept Art Pixel/` folder. These are visual references, not automatically game-ready sprite sheets. This review does not replace any existing game assets.

## Observations from the reviewed examples

- `Free-Base-4-Direction-Male-Character-Pixel-Art-360x240.webp`, the golem preview, and the tavern/mage tower scenes show elevated RPG perspective: visible faces, upright bodies, and readable side/back silhouettes. The camera looks across the tops of things, not straight down at their crowns.
- The tavern and mage tower examples have expressive, relatively large heads, compact bodies, clear hands/feet, and restrained clusters of shading. Weapons and poses remain readable at small sizes.
- `ZGgJS0.png`, `PF4JuZ.png`, `OM1Ahv.png`, `kD9Jtz.png`, and `c_BJmO.png` use warm wood/stone, olive foliage, teal water, consistent object perspective, and open ground between detailed props.
- `viynhsjiiet11.png` and `0o5x1dyiubv81.png` provide a moodier ruin direction: cool shadow masses, warm highlights, layered foliage, worn stone, and deliberate focal points.
- `rebecca-rupert-cozy-valley-land-update-demo.jpg` is a brighter alternative, with particularly readable terrain edges and silhouettes.
- `AgIZDi.png` and `m0okrgo4s6v91.png` illustrate useful prop scale consistency and economical pixel shading.

These references span several styles. Proposed synthesis, rather than an assumption that every example should be mixed equally: expressive RPG characters plus warm jungle materials and the atmospheric ruin lighting.

## Proposed character-kit revision

The earlier front/back-only kit is insufficient for these references. Use front, back, and side artwork. Mirror side views when appropriate; preserve handedness for asymmetric gear.

Use six consistent part columns: head, torso, far arm, near arm, far leg, near leg. Three rows provide the three facings. A fourth row provides weapon, accessory, tail/extra, and assembled front/back/side references. Source cells provide generous transparent padding; actual sizes and attachment points are stored in metadata, not inferred from cell position or filename.

Target an assembled character roughly 32–40 pixels wide and 48–56 pixels tall in a 64×64 canvas, to be validated with a single explorer in the current camera. Do not upscale the environment blindly to match the generated source resolution.

Animals need anatomy-specific kits and front/back/side silhouettes. Use their real side profiles when turning; do not rotate one overhead animal drawing through every direction. Snakes retain procedural segmented bodies, with directional heads. Use layered parts for gait and secondary motion, plus authored key poses for anticipation, attack contact, and recovery.

## Art and animation rules

- Large coherent color clusters, crisp edges, and consistent pixel density; avoid fine noisy texture that disappears at game scale.
- Fixed world lighting, even when characters change direction.
- Stable feet/ground anchors across poses. Collision footprints are independent of visual bounds.
- Complete hidden shoulders/hips beneath overlapping parts, so animated joints do not reveal holes.
- Verify the assembled neutral character before exporting separated parts. Validate motion at the real gameplay zoom, not only in a large editor preview.
- Preserve per-character part bounds, pivots, attachment offsets, draw order, facing, and motion presets in rig metadata.

Suggested first proof: one explorer and one tiger, each with front/back/side assemblies, a walk cycle, attack poses, and a ground footprint. Approve their scale and readability in the same scene before expanding the batch.
