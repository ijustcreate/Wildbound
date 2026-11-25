# Frost footsteps and pixel shadows

Walking through deep snow now leaves a small boot tread or paw impression. The tread has a separated heel, a darker compressed center, and a pale snow lip. Each cardinal and diagonal stamp is drawn on the world-pixel grid. The existing trail lifetime and cadence still control the marks.

The snow surface test uses the cutaway floor geometry for Hogsmeade, Frostmere station, Wild Lands landmarks, and Classic houses. Both recording and rendering check the actual print position with room for its outer pixels at thresholds. This covers walking, takeoff and landing marks, and marks already present when a building floor covers them.

Wild Lands and Alley daylight cast silhouettes now use stepped pixel masks. Train shadows use pixel spans, and actor contacts use pixel ellipses. Classic and Boundless project their low-resolution shadow textures with nearest-neighbor sampling. The daylight mask is reused per view so adjacent split views can share the destination canvas without reallocating the mask back and forth.

49 focused regression tests passed. Muted source Electron verified outdoor tracks, all eight boot and paw facings, three Hogsmeade interiors and the inn threshold. The shadow comparison verified the actual Frostmere renderer in single and split views with zero renderer errors. The software-only 180-caster fixture measures shadow drawing in isolation. Live gameplay FPS and physical controllers were unmeasured.

Source receipts and before/after frost captures are under `test-output/frost-and-shadows/`.

Desktop handoff uses version `1.2.152` from modified checkout `a6cee9bc55ad12ed58df5c3d27b150449f31ef26`. All eleven frost and shadow runtime files match that package byte for byte. It passes the muted frost and shadow checks with zero renderer errors, and the actual executable passed boot smoke with a ready lobby. The executable is `dist/1.2.152/Wildbound-win32-x64/Wildbound.exe`. The verified `Wildbound Worlds (1.2.152).lnk` shortcut pins that build through `Play Wildbound.cmd -BuildDirectory "dist\1.2.152\Wildbound-win32-x64"` and uses the normal save profile.
