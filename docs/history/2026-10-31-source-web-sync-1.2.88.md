# Source, web and desktop sync - 1.2.88

October 31, 2026. User authorized committing/pushing all local changes and publishing the rebuilt live browser game. The source revision is the commit containing this note; generated web/desktop manifests record that exact revision. No force pushes or resets.

This checkpoint includes all accumulated local gameplay, vehicle, inventory, menu, animation, creature, environment and audio work, shared authored assets, tests, import/review scripts and history notes, including the dev railway described in 2026-10-31-train-system-1.2.88.md. Generated dist builds, dependencies, logs, local profiles/saves, credentials and desktop shortcuts remain excluded by .gitignore.

The tested source passed 1,705 full-suite tests and 521 runtime syntax checks. The final focused railway/audio/profile run passed 29 tests; the prior packaged train review passed 28 checks and actual executable boot reported failed=0. Publishing verification runs the HTTP browser build and assembled Pages paths in isolated muted profiles. Exact results and build receipts are reported at delivery and retained in test-output.

Build from this source commit before publishing: scripts/build-web.cjs --versioned. Assemble in a separate latest gh-pages checkout with scripts/assemble-web-pages.cjs. Preserve original/ and all earlier release folders. Current web edition becomes releases/1.2.88/ with latest/ pointing there. Browser storage keeps wildbound-current: keys; the original keeps its existing namespace.

Committing changes the desktop launcher's required Git identity. Refresh the desktop package from this source commit, recreate/check its shortcut and run Play Wildbound.cmd --check. The Desktop Wildbound - Train Build shortcut and Wildbound Worlds (1.2.88) shortcut both target this repository's Play Wildbound.cmd with blank arguments, normal profile and assets/wildbound-icon.ico. Exact final package paths/times are in the manifests and delivery receipt. A Git push does not transfer ignored packages or personal saves to another machine.

No user artwork approval, physical-controller testing, online replication or measured FPS is claimed. Prior source/package notes remain historical evidence for builds made before this checkpoint.
