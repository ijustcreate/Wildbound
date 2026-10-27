# Wildbound browser edition

- [Choose a version](https://ijustcreate.github.io/Wildbound/)
- [Latest build](https://ijustcreate.github.io/Wildbound/latest/)
- [Preserved original](https://ijustcreate.github.io/Wildbound/original/)
- [Permanent 1.2.55 snapshot](https://ijustcreate.github.io/Wildbound/releases/1.2.55/)
- [Earlier 1.0.74 snapshot](https://ijustcreate.github.io/Wildbound/releases/1.0.74/)

The original is the exact root game from gh-pages commit 68c739c03499648f686f44ceb73508f62fb0808e, copied into original/ without modifying its game files. The root now provides a version chooser. Existing root asset URLs remain available for historical bookmarks.

## Local play

Windows: double-click **Play Wildbound Browser.cmd**. It starts a local server and opens a fullscreen Chrome or Edge app window. F11 toggles fullscreen; Alt+F4 closes it.

Mac/Linux: run node scripts/launch-browser.cjs with Node.js installed. Browser play does not require Electron. The local address is http://127.0.0.1:4173/.

Use a desktop browser, keyboard or compatible gamepad. Controller availability depends on the browser. Mobile/touch play has not been verified. Native file integration and content-pack installation require the Electron desktop edition. Online multiplayer is not available.

## Saves

Electron, localhost and GitHub Pages have separate storage. Historical versions use the original browser save keys. Published new builds load src/web-storage.js before the game and use the wildbound-current: namespace, preserving the original's keys. Future current snapshots retain that namespace. No automatic migration or deletion is performed. This is key separation inside one browser origin, not a separate security origin or separate storage quota. Clearing the site's browser data can remove both editions' saves.

## Publish an update

1. Verify source and tests, then run node scripts/build-web.cjs --versioned. It checks runtime syntax and writes dist/web-<package version>/, including runtime modules, assets, shared rigs and world manifests. Existing output folders are never overwritten.
2. Use a separate checkout of the latest gh-pages. Run node scripts/assemble-web-pages.cjs <pages-checkout> <web-build>. The first run preserves the old root in original/. Every run refuses to overwrite an existing versioned release.
3. Update docs/web-index.html, README links and this document for a new version before assembling. The assembler copies the chooser and points latest/ at the new release.
4. Verify browser loading, Workshop and Worlds, game rendering, save separation, historical file hashes and links. Commit/push source and the Pages checkout separately, without force-pushing. Verify the GitHub Pages deployment and the live build identity.

Keep original/ and earlier releases/ unchanged. Do not publish local saves, credentials, test profiles, dependencies or desktop packages. web-build.json identifies the source commit and whether it contained modified source. Publishing Pages does not update desktop packages or create a downloadable GitHub release.
