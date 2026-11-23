# Diagon Alley and railway station art

The seven shops following the approved Ollivanders sample now have 20 native assets each. All eight stores share the same room scale, floor projection, player clearance and doorway width. East-side storefronts mirror their room placements toward the avenue while prop shading and lettering retain their orientation. Shop props are grounded and sorted against actors. Small objects inherit their display surface's depth. The first visit opens each cutaway along the current walking path.

Flourish & Blotts has a reading chair, floating folio and chained book. Madam Malkin's gains a fitting corner, robe forms and a four-scarf rack. Quality Quidditch uses the actual Nimbus artwork beside repair tools and sporting goods. Slugg & Jiggers has a small animated cauldron and copper still. Eeylops has native perched birds and brass and timber cages. Florean Fortescue's has a scoop case, cafe seating and a chocolate frog display. Gringotts has a bordered vault door, till grille and counting displays. The street has native pixel pavers, lanterns, low fountain and a dressed station-side portal. Existing wand access, pricing, purchases, exchange and carry-back use their original gameplay systems.

The eight Wild Lands train stations and Lakewood have new roof and façade art, local stone and timber colors, waiting-room furniture, floor runners, lantern spill, and dressed platforms and forecourts. The original doorway, tracks, elevations, cats and owl interactions continue to drive the art. See docs/art/railway-station-art.md for individual station materials and verification. See docs/art/diagon-alley-concepts/native-shop-art-brief.md for shop art references.

Artwork is cached by fixed shop or station state and the native renderer culls distant shops. No sustained FPS measurement was made. Station geometry, travel, and existing inventory flows were checked through their normal gameplay paths. The full repository suite and hardware playtesting were not repeated.

Checkout Wildbound_worlds at f0b787ff33c3ac8f3675b48504937ebda4f0dcb5 plus modified source. Concurrent changes, authored rigs, local saves and drafts are preserved. No commit or push.

## Desktop receipt

114 focused Node tests passed. The standard packager ran after parsing all 981 runtime modules with the existing single-process V8 syntax driver. Exact packaged muted Electron runs passed 222 shop checks and 44 station checks with zero renderer errors. Shop checks rendered all 140 new asset IDs and tested real doorway movement, purchases, wand access, portal return and owl workflow. Station checks exercised the eight stops, the legacy Lakewood entry, rendered exterior and interior views, and compared decorative boundaries with playable decks and native destructibles. The actual executable booted to the lobby with zero errors and muted test audio.

Build C:/Users/New User/Desktop/Wildbound/dist/1.2.113-2026-11-23T19-27-29-008Z/Wildbound-win32-x64/Wildbound.exe. Manifest version 1.2.113 with builtAt 2026-11-23T19:28:25.141Z, sourceCommit f0b787ff33c3ac8f3675b48504937ebda4f0dcb5, sourceDirty true and preview false. All 18 changed runtime modules matched the reviewed checkout byte for byte at packaging. The train renderer file was restored to its prior LF line endings afterward. Its normalized packaged content was verified identical. Reports are test-output/diagon-alley/packaged/report.json, test-output/station-art/packaged/report.json and test-output/diagon-expansion-content.json.

A concurrent desktop build completed after this one. Use C:/Users/New User/Desktop/Wildbound - Diagon Alley and Stations (1.2.113).lnk for the exact reviewed executable. The shortcut targets C:/Users/New User/Desktop/Wildbound/Play Wildbound.cmd with -BuildDirectory "dist/1.2.113-2026-11-23T19-27-29-008Z/Wildbound-win32-x64", the repository working directory and Wildbound ICO. The pinned launcher --check returns this package. It uses the normal save profile.

Native preview boards are test-output/diagon-alley-shop-interiors.png, test-output/diagon-alley-train-stations.png and test-output/diagon-alley-station-waiting-rooms.png.
