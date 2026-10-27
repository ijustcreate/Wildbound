# Height-aware local lighting and source-facing rims

Real Worlds checkout: Desktop/Wildbound Server Branch Build, Wildbound_worlds,
modified source on 1bd5ef027966. Continues all earlier 1.2.35 updates, including
the footprints, totem popup, jump reach, lobby perimeter/trim and shortened TV.
No source reset, authored rig migration, personal save/draft change, commit or
push. authored/rigs.json SHA256 remains
dc05411b47f02259be95ea0ed22aea375d76f79b55d7f0bdec57da5df7ed7d71.

User screenshot marks illustrate intended light directions/occlusion only.
No annotation colors, lines or replacement artwork are shipped. Pixel-asset
guidance was used to retain existing silhouettes, palettes and native artwork.
Visual brief: warm source-facing surface shading and a thin INNER edge rim;
leave back-facing surfaces unilluminated, not uniformly outlined or glowing.

Old local light was a screen-blended radial gradient over the completed scene.
Dynamic mode now renders local ground light below scenery/architecture, masking
each source independently with finite projected occluder volumes. Trunks and
raised ellipsoid crowns are distinct. Low rays pass under foliage; solid trunks,
bushes, rocks, ruins, furniture and intact walls block them at their real proxy
height. Leafless/felled trees have no crown. Broken wall sections/open doors
transmit; windows transmit partially. Wall torches emit outside their wall face.

The shared realtime-shadows module now exposes finite 3-D volume intersections
for local source visibility, used by surface shading, characters and lightAt
(night-stalker visibility). Existing authored sun height planes remain intact.
The dynamic/simple toggle remains mutually exclusive: dynamic uses occluded
point lights and rim shading; simple keeps its legacy glow/blob presentation.
Existing room coordinate isolation is preserved; surface geometry never leaks
into an underground room's character-light field.

WorldLightRenderer caches bounded source masks (16) and prop buffers (24 MiB),
invalidates on light motion, geometry/destruction changes and world switches,
and skips field work without emitters. Ground shadows use convex projections,
not per-pixel ground ray tracing. Surface visibility is sampled in small blocks;
the rim follows the actual alpha edge and never changes silhouette coverage.
These are authored/procedural volume PROXIES, not leaf-by-leaf mesh ray tracing.

Validation: tests/world-lighting.test.mjs covers low-canopy clearance, trunk and
solid occlusion, finite shadow length/height, independent lights, self-exemption,
all seven environments, opened/destroyed geometry, section gaps, cache edits and
no-source bypass. scripts/verify-world-lighting.cjs renders actual Renderer
scenes across all seven environments plus a clean prop/rim comparison. Pixel
test verifies source-facing rim brightness and zero alpha changes. It records
timings including dense moving-light stress; no hardware FPS claim is made.
Dense moving stress also remains expensive with the point-light pass disabled;
the existing sun/scene pipeline is a separate performance consideration.
Existing jump lighting checks retain all 48 cases, no added ambient wash or
alpha clipping, and a jumping carrier's height190 emitter.

Outputs: test-output/world-lighting/ and world-lighting-build.log. The earlier
lobby geometry full suite passed 1394 tests but its package attempt hit an
Electron-packager temporary-directory ENOTEMPTY; final rebuild supersedes that
attempt rather than touching personal profiles or deleting broad directories.

Final release verified: dist/1.2.35-2026-10-18T18-36-05-118Z/
Wildbound-win32-x64/Wildbound.exe, builtAt 2026-10-18T18:36:20.863Z.
Full gate passed 1403/1403 tests. Compared 390 packaged runtime/source/authored
files: zero mismatches. Normal desktop shortcut still targets Play Wildbound.cmd;
its --check selects this exact release. Packaged EXE boot and Worlds smoke tests
both failed:0; all 13 Worlds checks passed, including save/reopen from disk.
Packaged seven-environment render/rim tests, all 48 jump-lighting cases, totem
anchoring/footprints and lobby perimeter/continuous TV jump verification passed.
All automated windows were muted and used isolated test profiles. Dense moving
forest software-renderer stress remains costly; no hardware FPS assurance is
implied by the successful functional/render checks.
