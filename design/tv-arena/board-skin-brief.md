# Mossroot board scenery skin

The user likes the regular Wildbound board layout and requests a TV-specific background with mossy ruins, platforms and tubes. Preserve the authored path, board-space positions, native pawns/dice and center seal. The previous side-view overworld path was rejected; this is a scenery revision of the established framed board, not another layout.

Reference: `assets/board-minimal.png` supplies frame, perspective, pixel density and playable foreground. `test-output/tv-polish/standard-board-final/new-arena-interface.png` supplies mossy teal masonry, turf-topped platforms, wood bridges and simple colored tube bands. Builtin image generation edits the first reference with the second as style guidance. Prompt: `board-skin-prompt.json`. Result: `assets/tv-arena/board-mossroot-v1.png`, 1515×1038.

Shape/material decisions: shallow overhead-oblique ruins between the same cream path, squat arched masonry, broad olive ground planes, darker jade/teal stone shadows, bright turf edges, small bronze-green tubes with turquoise/lavender bars. Keep scenery below the path in contrast. Upper-left light matches the other board skins. Keep the sky and horizon out of the board.

Native renderer: the skin is selected only by TV presentation objects (`environment: tv-arena`). A narrow foreground clip preserves original stone centers, wooden frame and well over the generated scenery. The first review exposed broad strips of old forest ground when the clip was too wide; it was narrowed to the stone interiors. Layout source stays untouched. The same skin is used by the arena altar face.

Review against the forest reference at matching 840×576 scale and the actual 1440×810 roll screen; inspect nearest-neighbor rendering and the altar thumbnail. Native checks compare all 49 calibrated positions with the original and verify visible scenery differences. Existing biome tests also check that the generated art's first 47 tile centers are stone. Artwork has been internally reviewed, not user-approved.
