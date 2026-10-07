# 1.0.71 — parallel anaconda, quicksand, adaptive audio and character polish

Base: `edc664ea35a4c75710570680dca26c6e1387f658`, main/origin/main. This continues the uncommitted 1.0.67–1.0.70 batch; no commit or push. Shared authored rigs and personal saves are preserved. The user's running 1.0.69 processes were not stopped.

## Parallel requests completed in source

| User request | Implementation and verification |
| --- | --- |
| Large anaconda | New appended forest event, one owning enemy, 40 floor-space sections, 160-point trail cap, native pixel art, bounded 128-entry raster cache. |
| Slithering body winding around trees | Collision-aware trail and live-root routing; fallen/depleted roots release the route. Individual visible sections sort at their own depth, independent of offscreen head. |
| Jump over body | Ground collision and contact damage stop below 14-unit clearance; jump/elevated support crosses. Existing overlap can escape. Locked red bite warning, recovery, snares, freeze, friendship, once-only death/rewards and save restoration are covered. Melee/spells/arrows hit distant coils; lodged arrows follow the struck section. |
| Quicksand shader | Connected-patch topology produces shared inward spirals/ripples, irregular shore and pixel quantization. One bounded 800×800 visible surface, no animated mask uploads/readbacks. Canvas fallback and actual context-loss recovery pass. Sinking rules unchanged. |
| Major SFX overhaul | 24-voice ceiling, priority stealing, per-actor cooldowns, nonrepeating samples, bounded decoded cache, room/distance exclusion, material footsteps and landings, jump/death/repair cues. Existing bank reused; no claim of newly authored audio. |
| Fixed calm music per level | Deterministic forest/desert/ice/temple/house/TV/lobby pairs. Fresh settings default to Adaptive; existing explicit custom/random choices are preserved. |
| Calm/combat transition | Continuously advancing two tracks with unsynchronized gain crossfade; nearby-hostile threat debounce/hold, friendly/distant/room exclusions, preserved preview/custom/mute/sliders. |
| Missing music/Suno list | `docs/SUNO_TRACK_BRIEF.md` includes assignments, decode audit and seven matched-pair production briefs. All existing tracks decode, but mellow mood, tempo/key matching and seamless looping were not confirmed by listening. |
| Start/+ settings in lobby/home | Owner-only routing, desktop-claim delay handling and held-input suppression. Other controllers cannot navigate/close the opener's settings. Expedition pause/resume remains intact. |

Agents: Hubble (anaconda), Lagrange (quicksand), James (audio), Meitner (settings). Changes were integrated in the shared working tree; parent corrected offscreen-head visibility, integrated body projectile hits and updated obsolete random-default smoke assertion.

## Character creator and earlier visual requests

- Both lobby and drop-in character creators use physical-position Xbox/Switch/PlayStation menu labels. Name keyboard has a persistent immediate gold cursor, strong contrast and explicit marker; CSS transitions no longer hide new selection. Controller ownership is retained. Keyboard arrow/Tab navigation and Ctrl+Enter commit are available for keyboard-owned menus.
- Hair/face selections show enlarged native-pixel previews. Shoulder/view buttons rotate through eight directions. Lobby picker previews animate on a bounded 10 Hz idle refresh and keep selection open for comparisons. Drop-in preview focuses the face/hair when those controls are selected.
- Twelve additional hairstyles (19 total), distinct silhouettes, segmented braids/locs, rounded afro and top knot. Face contour/eyebrow/iris/lip refinement plus stubble/goatee/warpaint (eight face-detail options). Existing appearance IDs, facial anchors and custom authored sprites are preserved.
- Native-rig beetle art and six-leg gait, bounded spell particle trails with saturated cores and friendship hearts, desert ripple/chunk textures/clutter/sand wind, desert board bitmap, bee art plus live hive (eight-bee cap; floor/tree attachment/shadow), improved storage chests/light/dust and persistent first-time robot repair.
- New four-petal carnivorous plant renderer and magenta orchid variant, long-legged blue-grey tsetse, more dimensional rhino/crocodile/lion art. Existing rig joints, animation controls and user-authored data remain in place; default-matching upgrades do not replace edited clips/palettes.

## Verification and limits

- Final combined Node suite: **764/764 passing**, `test-output/tests-1.0.71-final.log` (~78 seconds). Whitespace check passes. Focused creator/head/appearance, storage/economy, anaconda/body/projectile, audio/threat, settings and quicksand tests pass.
- Isolated Electron creator: actual inputFrame Xbox/Switch labels and owner-only name input/delete/Plus commit; 19 hair/eight face options; close-up/rotation; both creator paths; controls remain reachable at 1280×850, 780×600 and 600×430. Rendered keyboard and hair/face sheets inspected.
- Anaconda Electron: actual world pixels, 40 sections, freeze, ground collision/jump clearance, independent depth, distant-tail visibility, stopped-body stability and bounded cache; no renderer errors.
- Quicksand Electron: native WebGL and software Canvas rendering, crop coherence, bloom/resize, topology/cache reuse, real context-loss nonblank fallback and one-upload recovery. Isolated median/p95 draw submission 3.6/5.7 ms WebGL, 7.6/9.5 ms Canvas. These are diagnostics, not gameplay FPS.
- Adaptive audio Electron: all 11 tracks decoded; native media/settings, forest/ice/house/temple routing, continuous rapid toggles, friendly release, 24-voice saturation, critical priority and mute cleanup. No listening/hardware claim. Desert/TV initially had focused routing coverage rather than rendered-context evidence.
- Settings Electron: 69 actual-inputFrame assertions, two rendered sizes, no exceptions; desktop claim callbacks and pads were synthetic. Home branch uses the debug setter because ordinary Home redirects to Lobby.
- Earlier batch regression: real inventory/controller isolation, all five companion motion paths, 24 robot backpack/six buyback slots, visible sell/buyback, compact victory chest, multiple panels and small windows pass. Storage/wildlife QA renders 120 real poses, six species/styles/eight directions and actual broken/repairing/online room/light/dust/lid states; no renderer errors.
- Insects/desert/magic Electron: 56 beetle poses, 14 distinct friendship movement frames, 48-particle trail ceiling, eight-bee cap, 20 cached desert chunks. Isolated world draw submission ~40 ms; not a 60 FPS claim.
- Known older broad all-game smoke failures remain documented in 1.0.68/1.0.70. Do not equate targeted checks or Node success with all-game/hardware testing. Current music companions are approximate and may have intro/outro gaps; see the Suno brief.

## Delivery

Local desktop **1.0.71** is built in `dist/1.0.71/Wildbound-win32-x64`, with manifest timestamp `2026-10-06T21:47:24.332Z`, the base commit above, `sourceDirty: true`, and `preview: false`. Packaging syntax-checked 213 runtime files. All 226 shipped runtime/UI/board files compare byte-for-byte with the source; packaged name/version/main/dependencies match (the packager intentionally removes development metadata).

The exact `resources/app.asar` passed the isolated Electron character-creator, 69-assertion settings/controller, anaconda, GPU/Canvas quicksand, adaptive-audio, inventory-refresh, warlock/robot/companions/victory-chest, starter-chest, wildlife/storage and insects/desert/magic checks. Audio decoded all 11 packaged tracks and exercised real media timing/volume and actual SFX voice saturation. These remain targeted software/synthetic-controller checks, not a claim of physical-controller testing, listening review, full-game smoke success or gameplay FPS.

Desktop shortcut `C:/Users/New User/Desktop/Wildbound Latest (1.0.71).lnk` was created and read back: target is this checkout's `Play Wildbound.cmd`, working directory is this checkout, arguments are empty, and the Wildbound icon is assigned. `Play Wildbound.cmd --check` resolves the exact 1.0.71 executable and manifest. Normal launch uses normal saves, without `--preview`. QA used isolated profiles and did not stop the user's game or modify personal saves/authored rigs. Delivery notes were appended after packaging; runtime files remain identical. No commit or GitHub push was performed.
