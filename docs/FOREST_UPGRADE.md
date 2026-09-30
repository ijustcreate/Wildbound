# Forest environment upgrade

Implementation checklist for the reference-inspired forest pass (1.0.28).

- [x] 1. Continuous ground materials without visible grass grid lines.
- [x] 2. Distinct asymmetric oak, birch, and pine crowns.
- [x] 3. Directional pixel canopy shadows and sunlit clearings.
- [x] 4. Connected, seeded trails with clear bridge approaches.
- [x] 5. Overgrown gateway, shrine, courtyard, and colonnade landmarks.
- [x] 6. Irregular board clearing with worn flagstones and trail entrances.
- [x] 7. Clustered groves with off-grid roots and varied scale.
- [x] 8. Irregular riverbank dressing and coherent animated currents.
- [x] 9. Solid raised ruins and decorative terraces with matching collision.
- [x] 10. Contrasting sunlit grass, cool shade, grey stone, and autumn accents.
- [x] 11. Contextual grass, fern, flower, and reed patches.
- [x] 12. Shared moss, cracks, leaf piles, roots, and rubble weathering.
- [x] 13. Shared wind for foliage, ground cover, and drifting leaves.

Routes use the existing pathfinder and are reserved before scenery placement.
Local paving patterns use the MIT-licensed wavefunctioncollapse 2.1.0 overlapping
model by kchapelier. Vendored modules preserve the original implementation, with
only CommonJS imports/exports converted to ESM. License: src/vendor/wfc/LICENSE.
Generation is deterministic and bounded; unsuccessful WFC attempts use the source
pattern. No user reference artwork is redistributed.

Elevation is solid scenery, not a new walkable floor system. The board and combat
routes remain on the existing movement plane. Other environments retain their
own ground renderer. Static forest ground is cached and animation is culled.
