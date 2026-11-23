# Interior finishes and cave walls

The villa and Wild Lands landmarks project tall inward faces behind actors while keeping front and side bases low. Wall faces use the original damage sections so broken cells leave visible openings. Closed house roofs still cover the room from outside. Shop cutaways now have recessed back panels and low, matching trim around the original door gap. Stations use their regional stone, plaster or timber ramps with wainscoting, and the visual cutaway reaches a short way into the existing approach. Coach wall linings and aisle runners are drawn below passengers on the native projection.

The shared interior paint groups plank grain, broken stone joints, plaster patches and carpet stitches in restrained pixel clusters. Native default storage has inset metal plates and a masonry service wall. The default Jade Sanctum and Wild Lands temple have mossed slab textures and jade-toned wall faces. Player-authored room drawings still use the existing authored rendering path. Art changes add no solid geometry.

Cave rock now follows the original exposed tiles in Classic and Boundless Hollowdeep, the Wild Lands cave, and the Old Well. Limestone and warm rock use different clusters, cracks, foot shadows and mineral seams. The opt-in cavern slice uses the same style against its native distance field. Shadow Realm void ledges and water banks use separate basalt stone layers. The reflection mask follows the same visible edge as the rock. Existing cave routes, portal positions, solid cells and Shadow Realm topology are preserved.

Cross-scene delivery uses bounded raster caches and existing depth passes. Sustained frame rate and hardware controls were not measured. Checkout Wildbound_worlds at f0b787ff33c3ac8f3675b48504937ebda4f0dcb5 with modified source. No commit or push.

## Desktop verification

156 targeted Node tests passed. The standard packager validated 986 runtime modules using the existing single-process V8 syntax driver. On the exact packaged runtime, seven muted Electron verifiers reported 544 passing checks and zero renderer errors. They covered 11 house, landmark and interior checks, 52 station checks, 14 cave checks, 89 Shadow Realm checks, 222 Diagon Alley checks, 20 coach captures, and 136 coach visibility checks. The actual packaged executable booted to the lobby in an isolated muted profile. All 21 changed runtime modules matched source byte for byte.

The build is C:/Users/New User/Desktop/Wildbound/dist/1.2.113-2026-11-23T19-53-57-541Z/Wildbound-win32-x64/Wildbound.exe. Manifest version 1.2.113, builtAt 2026-11-23T19:54:59.357Z, sourceCommit f0b787ff33c3ac8f3675b48504937ebda4f0dcb5, sourceDirty true, preview false. Reports are the scoped *-finish-packaged.log and coach-depth-packaged.log in test-output. File hashes are in test-output/interior-finish-build-content.json.

The dedicated desktop shortcut C:/Users/New User/Desktop/Wildbound - Interior and Cave Polish (1.2.113).lnk targets C:/Users/New User/Desktop/Wildbound/Play Wildbound.cmd with a project-relative -BuildDirectory argument pinned to the package above. Verified with Play Wildbound.cmd --check -BuildDirectory. It uses the normal save profile. Stable previews are named *-finish.png in test-output.
