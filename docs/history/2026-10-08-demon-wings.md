# Fire imp and succubus wing alignment

The user requested the fire imp and succubus wings match the player's wings.

The imp's shoulder item now selects the same upright membrane painter as the player's succubus-wing item. The shared optional wing joint defaults now include the player's existing backward sweep; the player fallback no longer adds that sweep separately. The player's geometry is unchanged, while default imp/succubus rigs gain the same profile geometry. Imp ember colors, succubus colors, tail, rig pivots and existing animation clips remain in use. Existing authored joints, clips, painted parts and layer orders are preserved. Neither imp nor succubus has a shared saved override in the current authored file.

The user also requested that the succubus headgear only add horns. Horn items now opt out of the shared helmet hair clipping, and their renderer/icon no longer paint a headband or gold base caps. Horn roots sit farther outward, leaving the hair crown visible in every direction. A full fitted-gear regression exposed a pre-existing fractional profile pixel in the newly added Alan turtle helmet; its rectangle helper now rounds final coordinates and dimensions to the native pixel grid. The all-events test fixture now supplies actual sand for the newly added sand-only shore encounter, retaining its gameplay terrain restrictions.

Verification: 25 focused creature/flight tests, 11 gear/icon tests and 17 core tests passed. Isolated muted Electron rendered 696 imp/succubus animation frames across eight directions, preserved the rigs and custom joint/key edits, and captured both wing layers in the Studio's profile view. A rendered green-hair comparison confirmed the central hair crown remains unchanged with horns in front/rear views; total visible hair coverage remains 90–97% across the eight angles, with only the horn overlap occluding small edge regions. Review sheets: `test-output/demon-wings-eight-directions.png` (enlarged and native character views) and `succubus-horns-hair-closeup.png` (same hair with/without horns). Report: `test-output/demon-wings-report.json`.

Desktop delivery details follow after the full rebuild and packaged verification. No commit, push, website publication, profile replacement or player-process termination was requested or performed.

Final delivery: included in 1.0.107-all-changes. Packaged 696-frame wing/horn review and hair preservation checks pass; see 2026-10-08-humanoid-ghost.md for build identity and combined verification limits.
