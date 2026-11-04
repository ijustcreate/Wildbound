# 1.2.99 — background terrain preparation, train paint and breakable bridges

## Symptoms and causes
First entry and new terrain regions generated native worlds, ground images, grass geometry, shoreline masks, track rasters and scenery on the animation thread. Station cats also ran simultaneous full visibility/path searches across eight stations, producing separate simulation spikes.

## Changes
- A prioritized module worker prepares the existing native terrain, collision records, grass data/ground, shoreline masks, tracks, wind poses, distant stations/train/buildings and overview. Nearby collision regions and ground are prepared ahead of players. Initial preparation has an explicit loading screen; unready collision regions cannot be entered. Worker lifetime follows the dev session/design, immutable preparation never replaces live harvested scenery, and bitmap memory is bounded. The ordinary synchronous renderer remains a supported fallback.
- Native station-cat path searches run in the worker. Cats retain live collision checks, easing, idle poses and movement; obsolete pending wind poses are replaced rather than accumulating.
- Dev menu Train color / Apply train color changes and saves the body color without moving or stopping the train, in both dev worlds. The workshop has a Train color section, presets, all palette channels and eight-direction previews. Custom pixel-painted parts retain their own palette. Saved railway geometry and editor drafts are preserved.
- Four ordinary sword contacts break a 48-pixel raised railway span. Broken deck/rail geometry and walking/swimming support share the same runtime state. Intact bridges still allow swimming underneath.
- Swept locomotive bogie checks detect a broken water span even between updates. The engine stops, riders leave the train, and successive carriages reach the gap and splash/sink in nearby deep water using the car water effects. Coaches still on land do not sink through it. Dev menu Repair bridges / reset train restores support, parks the train and safely places explorers outside with boarding enabled. Damage is dev-session state, not a saved authored design.
- No personal profiles, house libraries, authored rigs, saved sound settings or unfinished drafts are replaced. Automated Electron windows use isolated profiles and are muted before loading.

## Verification and delivery
Focused Node train/world regressions: 49 passed; bridge physics: four passed. Muted Electron existing train/editor regression: 65 checks, no renderer errors. Dedicated real-worker Electron review: 40 checks in both worlds, including paint persistence, sword damage, swimmer support, swept derailment, five deep-water carriage splashes/sinks, repair, movement and safe return. Full-suite, packaged desktop boot/content, browser and Pages verification receipts are written under ignored test-output at final delivery.

A default-graphics 1440x960 scripted moving review after the cat correction measured approximately 13–15 ms mean update+draw and 22–25 ms p95 across 180 frames per world. These are CPU timings, not a hardware FPS guarantee. Initial scene preparation remains an explicit loading step; first appearance of a new train cutaway can still cost more than an ordinary moving frame. Physical controllers, online replication and exhaustive long-duration travel remain unverified.

Normal-profile launcher: Play Wildbound.cmd; desktop, source branch and live GitHub Pages publication are separate checked outputs. Build manifests identify the clean source commit containing this note. Final exact output paths, hashes, commits and deployment status are recorded in test-output/railway-1.2.99-delivery.json.
