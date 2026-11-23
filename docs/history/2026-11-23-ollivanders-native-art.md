# Ollivanders native shop pass

Ollivanders now uses its complete native storefront and cutaway in Diagon Alley. The eight earlier concept sheets remain design studies. The previous wand shop atlas is archived beside them as a rejected study. This pass covers Ollivanders and its approach.

The new room is 216 by 164 world units. Visitors enter on the east side through a 48-unit opening and cross to a 90-unit counter. Collision and artwork share the doorway, counter, and furniture footprints. The room opens into a cutaway on entry. The alley camera eases up to 1.14 near the shop at single-player scale, subject to party fit. The storefront moved 60 world units north to clear the neighboring roof.

There are six architectural assets and fourteen workshop props. The shop uses Wildbound's house roof geometry, floorboards and wall caps, a reshaped station trunk, a shortened house bench as a stool, and native forest birch, shrubs and fern artwork. Slate, oak, stone, brass and amber glass use distinct value groups. The wand sign, boxed stock, sorting counter, and open velvet case identify the shop from street to interior. The door and grounded props use the room's existing world projection.

Static shadow and light layers give the roof, furniture, walls and player route a clear hierarchy. Amber spill is painted on the relevant floor or paving from the bay windows, sconce, task lamp and entrance. Contact shadows follow the footprint. The stable artwork uses four static architecture layers, one courtyard layer and a finite cache of prop rasters. Alley rendering skips shops and actors outside the camera pad. This was checked for correct rendering and bounded caches. Sustained FPS was not measured.

Reusable workflow installed at C:/Users/New User/.codex/skills/wildbound-environment-art/SKILL.md. It covers projection, silhouette and scale, material and line work, highlights, and native lighting review. The validator passed, and all 11 reference paths resolved.

Checkout Wildbound_worlds at f0b787ff33c3ac8f3675b48504937ebda4f0dcb5 with modified source. No commit or push. Full repository suite and hardware playtesting were not repeated.

## Verification and desktop receipt

The focused alley and train suite passed 28 tests. A separate source Electron run passed 24 dialogue and owl regression checks. The exact final package passed 53 muted native shop checks with zero failures and no renderer errors. It verified actual station wand input, both shop views, real threshold movement, individual art renders, merchant purchase and expedition return. Both packaged scene captures were inspected. The packager validated 957 runtime files.

The desktop launcher selected C:/Users/New User/Desktop/Wildbound/dist/1.2.112-2026-11-23T18-49-08-078Z/Wildbound-win32-x64/Wildbound.exe. The manifest reports 1.2.112, built at 2026-11-23T18:51:55.406Z from modified source at f0b787ff33c3ac8f3675b48504937ebda4f0dcb5. The package came from a concurrent desktop build. SHA-256 verification matched all seven changed shop and renderer modules in test-output/ollivanders-build-content.json. The actual executable booted to the lobby in a muted, isolated smoke profile with zero errors.

C:/Users/New User/Desktop/Wildbound Worlds (1.2.112).lnk targets C:/Users/New User/Desktop/Wildbound/Play Wildbound.cmd with blank arguments, the repository working directory and the Wildbound ICO. Normal save profile. The shortcut and Play Wildbound.cmd --check were reviewed against the package above.

Packaged captures are copied to test-output/ollivanders-storefront.png, test-output/ollivanders-interior.png and test-output/ollivanders-assets.png. The native test report is test-output/diagon-alley/packaged/report.json.
