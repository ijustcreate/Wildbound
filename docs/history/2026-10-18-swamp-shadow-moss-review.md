# Swamp shadow ownership and moss/structure review

Real checkout: Desktop/Wildbound Server Branch Build, Wildbound_worlds,
modified source on 1bd5ef027966. Preserve all combined 1.2.36 work and personal
saves. These changes are SOURCE-ONLY pending visual review; the verified desktop
1.2.36 package has not been replaced.

Latest user reference: screenshot 6d0a6bc7 and the supplied Desktop/Swamp images.
Borrow asymmetric branching, broad grouped foliage and hanging moss curtains;
do not copy watermarks, branded text or reference pixels. Retain native indexed
128px art, muted green ramps, warm trunks, existing foot pivots and collision.
No added fine texture, new character rigs or altered map layout.

Audit/fixes:
- environment.drawProp discarded renderOptions when delegating to realm art.
  Realm props therefore drew a blob regardless of the dynamic-shadow setting.
  The setting now propagates, and the fallback blob draws only in fallback mode.
- The tree artwork baked an opaque green oval under its roots. Removed that
  construction cluster entirely; cast/contact shadows belong to the renderer.
- Crystal additive glow discs were also independent of occlusion. Dynamic mode
  now uses the existing shared point-light pool; fallback mode retains the disc.
- Runtime sun casters use the same tree classification as point-light geometry.
  Multiple authored shadow scenes no longer stamp runtime casters repeatedly.
- Moss was baked at time zero into the complete tree. Body/moss are now separate
  cached indexed layers, with three pinned-root wind bands per curtain. No
  per-frame geometry generation or getImageData/putImageData. Light-cache clocks
  recognize cypress/mangrove; normal/medium zoom passes actual time.
- Painted Assets overrides remove the native-layer marker and remain intact;
  rendering now forwards the actual asset library to realm props.

Review-only native branch grammar: explicit treeVariantSeed controls branch
count/reach/height, trunk lean/width, crown masses and moss attachments. Roots
remain registered. Same seed recreates the same tree. This is enabled only in
the review fixture/explicit prop opt-in; not silently applied across saved maps.
Small structure review is required by wildbound-pixel-assets before expansion.

QA: focused realm/shadow/cache tests pass, including fallback/dynamic ownership,
removed baked patch, crystal glow ownership, deterministic varied structure,
custom-art bypass and moving moss. Muted isolated Electron verifies both unlit
and light-cached motion: 1,419 / 1,634 changed pixels across phases respectively.
Single-tree software warm p95 ~1.3–2.1ms; not an overall FPS/hardware claim.
The full ten-environment source lighting render check also passed with zero
renderer errors after these changes (test-output/swamp-shadow-world-qa.log).
Preview: test-output/swamp-shadow-layers/tree-structure-draft.png and report.json.
Authored rigs SHA-256 remains dc05411b47f02259be95ea0ed22aea375d76f79b55d7f0bdec57da5df7ed7d71.
No build, commit, push or save migration performed in this review pass.
