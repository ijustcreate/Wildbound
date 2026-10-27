# Jump clipping / character light placement / 1.2.29

Checkout Wildbound_worlds, base 1bd5ef027966, modified source. No save/profile
changes, no old-build termination, no Git commit/push requested.

Regression introduced by the new character-lighting wrapper: it recursively
rendered the already-lifted character inside a fixed ground-centred crop. Jump or
elevated-support height carried sprite pixels above that crop. The wrapper also
resampled four-times-detail humanoid art at two-times detail and tinted nighttime
actors a second time despite the existing whole-scene night overlay.

Lighting now copies the existing unlit animation/rig surface at its original
resolution and changes only RGB through source-atop composition. The original
draw coordinates apply jump/ground/flight displacement exactly once, outside the
sprite canvas. Animation caches remain unmodified. Cached idle and ordinary rig
branches use the same compositor. No extra ground-centred clipping canvas.

Local-light distance includes body/jump height; light direction is measured at
the body rather than the feet. Carried torches/lanterns gain source height that
follows jumping/supports. The world glow follows that source height. Ambient
darkness stays owned by the existing world night overlay, not the sprite tint.

Verification: isolated muted Electron regression script
scripts/verify-jump-lighting.cjs compares lit/unlit alpha coverage for player,
April, Captain and skeleton, bare/equipped, at six jump heights (48 cases), plus
elevated fractional-position actors, cached idle color/immutability, no duplicate
ambient darkening and carried-light height. Against packaged 1.2.28 it reported
41 errors; current source passes. Pixel checks verify the entire silhouette, not
only whether a window opens. Physical-controller and hardware FPS tests are not
claimed. Relevant lighting/night/integration unit checks also pass.
