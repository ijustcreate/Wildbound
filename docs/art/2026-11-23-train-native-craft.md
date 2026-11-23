# Train native craft brief

Status: implemented and self-reviewed; visual user review pending.

The user asked the train to reach the standard of the car and new Diagon Alley assets. References are the current native car (`car-art.mjs`, `car-pixel-shader.mjs`) and Ollivanders' native workshop (`diagon-shop-brush.mjs`, `diagon-wand-shop-assets.mjs`). Borrow their one-world-pixel contour steps, compact material planes, restrained highlights and purposeful fittings. Preserve the scarlet/brass/slate identity, user paint and authored sprite overrides.

Observed failure: old fittings were square blocks; smooth 1.5-unit projected contours looked softer than adjacent pixel artwork; furniture lacked separate upholstery and wood planes. The cab and boiler need coherent large forms before small surface marks.

Silhouette: cylindrical smokebox front with an inset round door; narrow flared chimney with a visible dark opening; rounded brass fittings. Keep the established carriage proportions, door openings, smoke anchor and playable decks.

Materials: broad scarlet boiler facets, warm brass band face with a dark supporting edge, cool iron and slate planes, dark recessed coach panels, timber compartment framing, compact cloth button accents and rounded-corner table tops. Windows gain thin warm framing, cab-front glazing and the existing reflected environment. Roof highlights follow the curve; gutters and vents stay subordinate. No noisy rust, random chips or smooth gloss.

Native grid: integer projected world coordinates. Reuse the alley's pixelLine and pixelPolygon for visible native geometry. Match the foreground replay's integer projection to avoid registration differences. The train's existing caches remain bounded; art is generated only by existing part/geometry passes. Preserve translucent foreground walls, roof fading and source-atop rider masking.

Fit: table top stays at 34, cushion at 28 and seat back at 39 world units. Partition caps stay at 47. No support, collision, design schema, profile, saved rig or interaction changes. Edited train sprites continue to override their native parts.

Review: capture native train scenes with live players, five carriage types, eight headings, walking/seated/raised states, doors and roof fades. Inspect close views plus integer nearest-neighbor enlargements beside the original and approved reference. Source captures live in test-output/train-layer-matrix/art-before and train-craft-review. Exact tests and desktop receipts are in docs/history/2026-11-23-train-native-craft.md.

Follow-up feedback asked for actual train walls, engine and controls as well as correct character/environment layering. Use a sloped cab desk and distinct pressure dials, throttle grip, brake wheel and firebox door; place coach lining on the inside and repaint native near walls over fittings. Keep all art inside existing supports. Verify actual environment rasters, not only trace markers, and use physical seat points when masking posed students. See the train scene layering handoff for final receipts.

Regression lesson: user reported new rendering faults after the shared scene-layer rewrite. Keep normal world ordering stable; correct camera-facing train parts locally. Check paired front/rear views, pipes against the chimney opening, coal against the near rim, and students against walls/roofs. Visual acceptance is not established by frame counts or tracing the intended order. The latest all-angle regression repair supersedes the earlier scene strategy.

Construction follow-up: user called the cylinder too thin and requested shaped shadows. Boiler radius is now 38% of carriage width (previously 32%) with a complete faceted underside and saddle supports. Update chimney/smoke height from the same profile. Retain carriage dimensions, floor20, table34, cushion28, seat-back39 and all movement geometry. Far deck rail precedes machinery; native near wheels follow the deck. Use shallow treaded gangways, open seat feet, table cross-feet, roof-end fascia and a cupola curb. Ground shadows use a single union fill of directional roof/boiler silhouettes, including bridge elevation. See the construction handoff for image findings, exact build and verification limits. User visual review remains pending.
