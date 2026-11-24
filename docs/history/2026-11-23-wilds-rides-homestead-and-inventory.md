# Wilds train rides, homestead, and inventory

## Performance and streaming

- Station cats plan close to the party, and fallback searches run in small slices. Track lookup retains deterministic ties without sorting the full route on each query. See [railway update measurements](2026-11-23-railway-ride-streaming.md).
- The worker prioritizes floors under the party and camera, then active scenery and lookahead. It drops obsolete portal requests and budgets decoded image and geometry payloads together. The mountain shows an immediate lower-detail surface while a worker renders the full terrain raster. Asset packs read concurrently and the on-demand sprite raster cache evicts least-recently-used textures.
- Train wheels reuse their rims and draw moving spokes separately. Coal redraws on an independent cadence and skips rider masks it cannot overlap. Stable rider masks and seated poses use bounded caches. Door, custom paint, facing, equipment, scenery order, and occupied roof state remain inputs to rendering.
- Grass has taller, wider meadow blades and stronger movement near grounded explorers. Visible chunks keep their instance buffers on the GPU. The shader only traverses active forces, train passengers leave no ground wake, and cuts change a small state texture without rebuilding blade geometry. The railway worker reuses base meadow geometry and skips unused grass image copies over Wilds ground.

The technical pass used Minecraft's separate simulation and render distances, Warcraft's distance-dependent work, and Unreal's worker-based visible texture requests and residency budgets. The recent RTX Kit work demonstrates simpler texture residency using a native DirectX neural decoder. Wildbound applies residency and GPU batching through its existing Electron WebGL pipeline. [Minecraft](https://learn.microsoft.com/en-us/minecraft/creator/documents/simulationrenderdistanceguide?view=minecraft-bedrock-stable) · [Warcraft](https://worldofwarcraft.blizzard.com/en-us/news/20139979/engineers-workshop-extended-draw-distance) · [Unreal](https://dev.epicgames.com/documentation/unreal-engine/texture-streaming-overview-for-unreal-engine) · [RTX Kit September 2026](https://developer.nvidia.com/blog/whats-new-for-game-developers-dlss-5-with-3d-guided-neural-rendering-nvidia-ace-updates-and-new-rtx-kit-capabilities/)

## Gameplay and interface

- The Wilds Homestead uses the active main-game house design, floor finishes, furniture, lighting, cutaway roof, and vehicle and appliance interactions. The main house library and editor draft stay separate from the Wilds checkpoint. The default Floo fireplace keeps its old coordinates, and authored variants get an available hearth spot.
- Regional encounters supply seven surface habitats plus the Caverns and Shadow Realm. Packs activate around exploring players, hibernate at distance, and preserve wounds and defeats in the Wilds save. Stations and other landmarks leave room to enter safely.
- Greywake's painted summit and collision share a polygon. The switchbacks govern uphill travel. Two marked ledges support downhill jumps with in-flight camera lift and safe landings. Players and mobs draw at the same terrain elevation. Taller exposed cliff bands and lower shoreline scree help the climb read from the ground.
- Charged spell particles, aim, and projectiles share the active wand's color. Each hand uses its own palette and tip origin, including Fire, Frost, Friendship, and healing magic.
- The backpack and worn slots recover the area that an inspection shelf used. Item details float near the hovered or selected slot. The earlier main-rig jump feedback is recorded in **Add a dev train level**, October 31, 2026. The 1.2.91 recovery preserved authored takeoff and airborne poses across rig migration, and the current jump regression checks pass. [Jump recovery handoff](2026-11-01-railway-world-polish-1.2.91.md)

## Measurements and verification

Against 1.2.123, the moving 160-sample train fixture reduced drawing p95 from 165.3 to 38.9 ms for one rider and from 263.7 to 70.7 ms for four riders in compartments. Median draw time went from 29.4 to 6.9 ms and from 106.3 to 28.5 ms respectively. The Chrome graphics backend reported Intel Iris Xe. These numbers measure update and draw calls in muted Electron. Crowded curves still produce draw spikes, and sustained display FPS and physical controller feel were outside this test.

The independent four-rider streaming benchmark measured first visible ground at 4,072.5 ms on 1.2.123 and 155.4 ms in candidate source after local collision became ready. Simulation fallback p95 fell from 24.7 to 2.2 ms. The shader check measured 5,197 instances and zero geometry uploads on cutting. Reports are under `test-output/wilds-ride/`, `test-output/railway-update/`, and `test-output/forest-landscape/`.

## Desktop build 1.2.125

The executable is `dist/1.2.125/Wildbound-win32-x64/Wildbound.exe`. It was built at 2026-11-24T04:01:40.302Z from modified source on `Wildbound_worlds` at `5b244635ab78e5a3c8e78ef21fdbabf60e505fd7`. `C:\Users\New User\Desktop\Wildbound Worlds (1.2.125).lnk` targets `Play Wildbound.cmd` in this checkout, pins `dist\1.2.125\Wildbound-win32-x64`, and uses the normal save profile. Executable boot, version metadata, icon, and both pinned and default launcher checks passed.

The focused Node run passed 112 checks. The 1.2.124 gameplay package passed 166 train layer probes, 63 mountain and harbor checks, 16 real Worker mountain checks, 25 biome checks, 18 Homestead checks, 52 wand checks, 19 Quidditch checks, 11 garden checks, and the WebGL grass test in muted Electron. That package's real Worker delivered the first visible tile after 157.3 ms in the sequential railway update run. Four-rider fallback simulation stayed at 1.4 ms p95 with zero samples above 16.67 ms. The 1,884-file runtime and asset comparison found only the final two inventory CSS edits between 1.2.124 and 1.2.125. The final package passed 262 muted inventory tooltip and layout checks across wide, narrow, and two-player views.

The checkout-to-package check matched all 1,885 runtime, authored rig, and asset files byte for byte. Packaged inventory persistence passed through real item pickup, equipment, purchases, used supplies, closing and reopening, and a saved Wilds expedition with the original train position.
