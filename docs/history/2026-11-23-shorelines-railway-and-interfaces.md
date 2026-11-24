# Shorelines, railway exploration, and interface restoration

- Footsteps use a distinct bank of clips for each of twelve materials. Shallow water and flooded crossings use recorded wading, with separate mud, ice, sand, path, and floor sounds. The picker uses the raised deck for players on a bridge and the water below it for swimmers. House floor finishes, rugs, and temporary rain puddles also affect the cue.
- Shoreline trees, tall grass, reeds, rocks, and other props use the same animated water shader as player reflections. It uses the native Wild Lands water mask and leaves dry ground clear. Ordinary and railway bridges become translucent in the area above a swimmer. The rest of the deck remains opaque.
- The pictured Bayou Shrine is a closed stone landmark. Its carved backing and solid foundation now match its collision. An actor saved inside the previous footprint can move out. The cyan Caverns portal north and slightly east of Cemetery Station displays the current device’s Interact prompt and has a return portal.
- Rails draw immediately from the route and bridge state through a bounded raster cache. The terrain worker prepares the scenery region if a forest-floor request reaches it first. The fixed railway status panel is gone while contextual interaction prompts and temporary notices remain.
- Diagon Alley uses a closer walking camera, eight closed storefronts, connected stone sidewalks, and drainage details. All eight original shops retain their entrances and interactions, including in split view.
- The screenshot’s Railway Preview copied the party and intentionally skipped ordinary expedition saves. Its two main exit paths also bypassed the settlement step for shop purchases meant to carry back. Preview is now labeled as temporary and both exit paths settle those purchases. The Adventure Board’s The Wilds mode saves to its own expedition checkpoint and carries character progress into the shared profile.
- The Adventure Board uses its original illustrated scroll and Classic destination map. The Wilds and Daily Seed use controls styled to match. Pause opens the illustrated three-tab Camp Settings with Done to resume and the current save and recovery actions in the expandable session section.

The source checkout is `Wildbound_worlds` at `5b244635ab78e5a3c8e78ef21fdbabf60e505fd7` with modified source. No commits, pushes, or browser publication were requested.

## Desktop build

- Wildbound 1.2.120 was packaged from the modified checkout at 22:48:52 UTC on November 23. The executable is `dist/1.2.120/Wildbound-win32-x64/Wildbound.exe` and uses the normal profile.
- `Wildbound Worlds (1.2.120).lnk` targets `C:\Users\New User\Desktop\Wildbound\Play Wildbound.cmd` and pins `dist\1.2.120\Wildbound-win32-x64`. `Play Wildbound.cmd --check` selected the same executable.
- The full rebuild passed 2,307 Node tests and syntax-checked 1,005 runtime files. The packaged executable booted to a ready lobby in muted smoke mode, and 1,827 packaged runtime and asset files matched the checkout byte for byte.
- The packaged menu, inventory, Bayou and Caverns, bridge, HUD, track, and Diagon Alley drivers passed 514 checks with zero renderer errors. The packaged audio and shoreline driver decoded all 36 footstep clips, played grass → water → grass through actual movement, and checked animated reflections on Classic, Woodland Railway, and Wild Lands shores. The rebuild log and muted Electron reports are under `test-output/`. Sustained hardware performance and physical controllers were outside these checks.
