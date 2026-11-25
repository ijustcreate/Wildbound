# Castle Greyhaven visual pass

This pass applies the 42-point review to the existing Castle Greyhaven footprint. Desktop 1.2.152 is the comparison build. The revised art follows Wildbound’s environment and sprite-stacking workflows. Slate slopes, limestone courses, oak fixtures, iron hardware, oxblood cloth and warm brass each have a compact value ramp. The ground pivots and actor depth keys stay aligned to the existing collision and the supplied three-story plan.

## Exterior and moat

The hip roof, eaves and projecting gatehouse establish the silhouette. Round tower volumes and crenellated collars, distinct window tiers, a lion crest and pennants separate the main masses. The approach widens into a cobbled apron. The fixed bridge has parapets and supports. The timber span shows hinge sockets, chains and braces as it moves. Only the part covering a grounded explorer fades in the raised position. Stepped banks, shoreline planting, water depth, contact shade, lantern spill and water glints tie the castle to Tideglass Reach. The fallback water matches the detailed water more closely while the terrain Worker fills its masks.

## Interiors and shared view

Chipped flagstones, worn passages, quieter cutaway walls, dressed thresholds and a directional light pass separate the rooms. Stacked spiral stairs have risers and floor inlays. The Gallery railing and recessed masonry frame the lower runner. The High Solar steps show the change in floor height. The Great Hall runner, armor and the three stories’ kit use clearer shapes. Bedside chests, meal platters, produce, cookware, varied casks and crates, books and scrolls, the writing desk, the hearth, doors, orb and lever use the existing placements and sprite-stack pivots. Barrel and crate layer strips and the animated drawbridge strip remain authored assets. Co-op prompts use player accents and reduce in size when they share an interaction area. The shared split map moves above the landings.

## Review

Muted Electron captures compare identical cameras in 1.2.152 and the revised castle, with nearest-neighbor enlargements for the bridge hardware, stair tread and lever. An explicit cold-mask check captures the moat before and after streaming the same area. The review preserves the original stair handoffs and playable rooms. The grouped evidence and receipts are in `test-output/greyhaven-review/`.

Thirteen focused Node tests passed. Source Electron passed 80 checks, including bridge movement, three-story traversal, checkpoint reload, colored co-op prompts and the shared map’s top-center anchor. With one Worker mask withheld, the test’s largest mean channel difference fell from 46.10 in 1.2.152 to 0.58 in the revised source on an 8-bit scale.

## Desktop 1.2.162

The numbered package was built from modified source on `Wildbound_worlds` at `a6cee9bc55ad12ed58df5c3d27b150449f31ef26`. The in-process Node check parsed 1,233 runtime files. Nineteen Greyhaven files and layer strips matched the package by SHA-256. The executable `dist/1.2.162/Wildbound-win32-x64/Wildbound.exe` passed the muted lobby boot. The verified normal-profile shortcut pins `Play Wildbound.cmd -BuildDirectory "dist\1.2.162\Wildbound-win32-x64"`.

The exact packaged renderer passed all 80 muted Electron checks with zero renderer or Worker errors. The matched 1.2.152 and 1.2.162 images are in `test-output/greyhaven-review/comparison-1-2-162/`. The test used scripted movement and simulated controller input. Verification focused on Greyhaven and the nearby Wilds systems.
