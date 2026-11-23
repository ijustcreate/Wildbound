# Shadow Realm drifting particles and rolling fog

User requested glowing particles throughout the Shadow Realm, dust and rolling fog. Added src/shadow-atmosphere.mjs and invoked it from the existing Underworld atmosphere pass. Original scenery, rivers, candles and collision remain intact.

World-anchored pink/violet/icy-blue motes drift and pulse, with occasional tiny cross glints. Fine dust rises and sways with faded lifetime wrapping. Broad feathered fog banks billow independently over land and water. Fog uses three cached 192x64 pixel textures (147456 bytes RGBA), with no per-frame texture allocation. Density coarsens for wide views; each rendered view caps at 144 motes, 240 dust particles and 24 fog banks. No gameplay RNG, saved particle actors or expedition mutation. Other biomes are untouched.

Validation: realm environments and chasm props: 15 passed. First muted actual Electron review: 29 checks passed, failed=0, renderer errors=[], covering real pixel animation, visibility, budgets at extreme zoom/negative coordinates, realm isolation, saves, scenery, co-op and encounters. Following visual review, increased mote/dust density and fog visibility; final packaged review follows below. Electron emitted a GPU teardown message after the successful source review; no renderer error or failed check occurred.

Packaging uses current modified checkout; no commit/push. Full repository suite, hardware controllers and FPS measurements are not claimed. Desktop receipt pending.

## Final desktop receipt

Version 1.2.108, source f0b787ff33c3ac8f3675b48504937ebda4f0dcb5 plus modified checkout; built 2026-11-23T02:54:02.064Z. Normal profile, preview=false. Output: C:/Users/New User/Desktop/Wildbound/dist/1.2.108-2026-11-23T02-53-51-542Z/Wildbound-win32-x64/Wildbound.exe.

Packaging syntax-checked 895 runtime files. Final packaged muted Electron review: 29 passed, failed=0, renderer errors=[], muted=true. Log: test-output/shadow-underworld/air-packaged.log. Successful captures: test-output/shadow-underworld/packaged/; visually reviewed candleRuins.png. The GPU teardown message also appeared after successful packaged review. Actual packaged EXE smoke: exit 0, lobby ready, version 1.2.108, errors=[], audioMutedTest=true. Both changed runtime modules match package/source hashes.

Shortcut C:/Users/New User/Desktop/Wildbound Worlds (1.2.108).lnk targets C:/Users/New User/Desktop/Wildbound/Play Wildbound.cmd; launcher --check selected this exact output. Existing saves, sound settings and running player games preserved. No commit or push.
