# Skull Rock and Mermaid Lagoon

Mermaid Lagoon sits on the lower Tideglass coast north of Greywake, near `(17430, 5420)`. Follow the existing Tideglass footpath toward the shore and take the dry approach south to the western shelves. Palms frame a clear blue basin with rose and slate rock, three animated waterfalls, and original merfolk swimming through the cove. Explorers can wade from the shelves, swim across the basin, and climb out onto the sandy rim.

Skull Rock is offshore southeast of Greywake, near `(18568, 8872)`. Swim out from Greywake’s southeast beach and wade onto the island’s southwest sand. The skull formation has moss, fissures, hollow eyes, and a walkable recessed mouth. Its rock cheeks and the surrounding boulders have physical footprints. The native shore painter carries the sandy shelf into the surf.

Both landmarks appear on the Wilds overview and in the developer destination menu. Natural exploration records their discoveries in the normal expedition checkpoint. The art uses original Wildbound shapes and materials, with the supplied images as visual references.

## Verification and desktop build

All 37 focused Node tests and 27 muted packaged Electron checks passed. The Electron walkthrough covered the original Tideglass pools, the dry walk to Mermaid Lagoon, swimming in and out of the cove, the swim from Greywake to Skull Rock, the grotto and its collision, both map labels, and discovery persistence after a reload. The native terrain worker and the fallback produced the same landmark mask. All six developer arrival positions at each site were dry and clear. The report and five captures are in `test-output/wilds-coastal-landmarks/packaged/`.

Desktop build `1.2.167` was packaged from the modified `Wildbound_worlds` checkout at `a6cee9bc55ad12ed58df5c3d27b150449f31ef26`. The packager parsed 1,241 source files, and all 12 changed runtime modules matched their packaged counterparts by hash. A muted boot smoke test reached the lobby without errors. `dist/1.2.167/Wildbound-win32-x64/Wildbound.exe` is the verified executable. The Desktop shortcut `Wildbound Worlds (1.2.167).lnk` targets `Play Wildbound.cmd` with `-BuildDirectory "dist\1.2.167\Wildbound-win32-x64"` and opens the normal save profile.
