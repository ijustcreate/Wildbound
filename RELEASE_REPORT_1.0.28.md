# Wildbound 1.0.28 - Living forest landscape

Implements the 13-part forest environment pass inspired by the supplied pixel-art
references. Original reference images are not included in the build.

## Environment

The forest now has continuous ground materials, an irregular board clearing,
winding trails to bridge crossings and four ruin destinations, clustered groves,
asymmetric species-specific foliage, directional shadows, shared wind, contextual
ground cover, downstream currents, and irregular bank dressing. Ruins include
pillars, shrines, and terraced masonry with moss, cracks, grass, roots, and rubble.
Broken paving uses deterministic Wave Function Collapse with a bounded fallback.

Raised ruins are solid scenery with matching collision footprints, not walkable
upper floors. Existing water/swimming rules and the underlying movement grid
remain in place. New forests use this generation; legacy saves retain their map.
New saves and room snapshots reconstruct the landscape from a compact version
marker and seed, preserving harvested trees and other saved scenery state.

All 13 implementation items are tracked in docs/FOREST_UPGRADE.md.

## Validation

- 436 automated tests passed; 124 runtime files passed syntax checks.
- Packaged forest validation passed: 101 trees and 13 ruin pieces in seed 42,
  nonblank desktop/mobile renders, moving foliage/water, and player canopy fading.
  Hardware-accelerated test: 10.6 ms mean render, 28.1 ms p95; ground pass 0.24 ms.
  These are measurements of the test scene, not a frame-rate guarantee.
- Automated route tests across ten seeds check each trail at four-unit intervals
  against water and final scenery collision, plus determinism and save/reload.
- Source render checks cover the overview, clearing, shrine, river, grove,
  normal fogged gameplay, and a 390x844 viewport, with animation and canopy-fade checks.
- Ground and foliage are cached; animated cover is culled to the viewport.
- WFC is vendored from wavefunctioncollapse 2.1.0 with its MIT license preserved.

The broader packaged UI smoke suite passed 81/99 checks. Sixteen failures match
the previous 1.0.27 report (lobby, opening-board, editor interaction, and Field Kit).
Two inventory mouse-transaction checks also fail; both reproduce when the new
landscape is disabled and the old scenery generation is restored in a diagnostic
run. Those UI issues remain outside this forest update. The full smoke fixture
was stopped after writing its results and screenshots because its process remained
alive. The focused packaged forest verifier exits successfully on its own.

Screenshots and measurements: test-output/forest-landscape/.
Desktop shortcut: Wildbound Latest (1.0.28).lnk.

Launch with Play Wildbound.cmd. The versioned Windows executable is
dist/1.0.28/Wildbound-win32-x64/Wildbound.exe.
