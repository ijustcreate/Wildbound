# Wilds terrain and Greywake Mountain

The marked west and south strips now extend the woodland along irregular edges. Frostmere snow reaches around the northern Overlook maze, and dark cemetery ground reaches toward the western shore. The eastern mainland forest surrounds the sandy lake above Greywake. Terrain and scenery generation cross the old x=16000 edge, including the far side of the lake. Tracks, stations, and the original Tideglass lagoon use their existing world coordinates.

Wilds cemetery soil is sampled in world coordinates so adjacent rasters share the same texture. The eastern lake uses a blue-green depth ramp and quiet freshwater ripples. Its shoreline mask is shared by the water raster and the surface classification. The existing Tideglass footpath crosses the enlarged woodland to its camp.

Greywake uses native evergreen stands on the foothills and rock ledges. The upper trail gains frosted tread and snowy pines, and the summit has wind-packed snow, blue ice, and fractures. The gold chevrons mark the east-facing ocean jump.

The switchbacks remain walkable. An uphill jump into a cliff face stops at the trail boundary. Directional jumps at lower ledges can land on a reachable trail below. Hold east and Jump at the summit chevrons to cross the cliff and splash into deep water. A midair checkpoint resumes the descent and enters the normal swim state at the landing.

The focused source suite passed 60 tests. A final 12-test terrain run also covered the Tideglass approach. The muted Electron survey compares the native map and local views against desktop 1.2.162, uses normal game input for the descent, and checks actual terrain Worker output. The source lake masks matched exactly. The streamed and direct overview differed by 0.105 on average per 8-bit channel. The camera comparison and reports live in `test-output/wilds-terrain/`.

## Desktop 1.2.163

`dist/1.2.163/Wildbound-win32-x64/Wildbound.exe` was packaged from modified `Wildbound_worlds` source at `a6cee9bc55ad12ed58df5c3d27b150449f31ef26`. The syntax check parsed 1,236 runtime files and the 12 terrain and movement modules matched the package by SHA-256. The verified normal-profile desktop shortcut `Wildbound Worlds (1.2.163).lnk` targets `Play Wildbound.cmd -BuildDirectory "dist\1.2.163\Wildbound-win32-x64"`.

The packaged executable passed the muted lobby boot. The packaged terrain survey passed all 21 checks with zero renderer errors. It verified the two kinds of downhill trail jump, the coast landing and swim handoff, checkpoint recovery in the air, and Worker parity for the map and lake mask.
