# Merlin’s outfit and the first live prop stacks

Merlin’s original portrait lost pixels at the crown in both dialogue sizes. The shared cached idle actor surface also allowed only 48 rig pixels above the ground pivot, which clipped the more upright silhouettes. The Starwatch cap now uses eight original brimless profiles with a restrained blue cloth ramp and gold stars. Its planted lower edge holds to the skull while the tip follows the existing cloth motion. Merlin wears a full ankle-length blue robe fitted over the leg poses and carries a short rowan wand. The beard follows the jaw and sways toward the tip over the robe. The taller actor bounds retain the crown in the gameplay cache, and Merlin’s portrait uses its own framing at both dialogue sizes.

The study conversation now offers the rowan wand. The older staff remains a valid inventory ID for existing characters. Archimedes looks toward the nearest visible living explorer on his floor while perched and follows his travel direction in flight.

The [five approved prop designs](../design/sprite-stacking-demos/README.md) are the first replacements in the wider art pass. Blue Crypt uses the new supply crate, cask, and Abyss Watch obelisk. The railway station uses the new lantern, and the Old Well entrance uses the new stone ring and timber frame. The game bakes the strips to native-size sprites using the props’ existing ground anchors. The well selects among three baked rope positions. The scenes continue to own fixture lighting, collision, and interaction.

Muted Electron rendered Merlin in eight facings across idle, walking, and casting. Both desktop and compact dialogue portraits retained the entire hat. The perched owl turned west and east as the explorer moved between sides. Source captures are under `test-output/greyhaven-merlin-review/` and `test-output/greyhaven-archimedes-review/`.

## Desktop 1.2.164

The desktop package `dist/1.2.164/Wildbound-win32-x64/Wildbound.exe` was built from modified source at `a6cee9bc55ad12ed58df5c3d27b150449f31ef26`. The normal-profile shortcut targets `Play Wildbound.cmd -BuildDirectory "dist\1.2.164\Wildbound-win32-x64"`. The exact executable passed a muted lobby boot. The packaged renderer passed seven Merlin checks, two perched owl facing samples, and 16 production prop checks with zero renderer errors. The focused source suites passed 20 rig and Greyhaven tests and 72 prop scene tests.

Packaged captures are under `test-output/greyhaven-merlin-review/desktop-1-2-164/`, `test-output/greyhaven-archimedes-review/packaged/`, and `test-output/sprite-stack-production-review/packaged/`. The package verifies this art pass. Concurrent Greyhaven landscaping edits were made after the package snapshot.
