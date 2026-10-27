# Wildbound 1.2.67 — illustrated Expedition, TV underground, outer forest and skeleton rig

## Expedition selector

Replaced the old wide map grid with the user's illustrated portrait Expedition scroll. Generated transparent wood/brass, full/rolled parchment, blank choice/row/Accept/ribbon skins, and a Classic signpost from the supplied reference using the built-in image-generation skill. Reference/prompts/provenance retained under docs/art and assets/ui/expedition.

Wildbound hides/inerts the map list and raises Accept under the curled paper. Classic reveals the scroll and a vertically scrolling single-column map list, with Accept below. Mode, Boundless and map edits are staged per owner; Accept commits native settings and invalidates readiness, while cancel preserves accepted settings. All ten maps and Random remain (Random at the list end). Hover/focus map descriptions remain. Existing Wildbound starts bounded at home; enabling Boundless switches the draft to Classic, preserving supported gameplay behavior. Keyboard and controller routes use only visible controls and keep owner/input-release protection. Responsive aspect-preserving layout, gold focus, selected checks, native switch semantics and reduced-motion support retained.

## Lobby TV / Mario requests

Level 2 now has fourteen authored underground room variants instead of shifted level-1 scenery: black negative space, cyan masonry ceilings and ceiling cutouts, block stairs, coin shelves, gaps and bright green pipes. Uses the existing platform simulation, rewards, enemies, seed shuffle, safe seams and pipe rooms.

Sliding shells now use normal gravity/platform collision, fall into actual gaps and despawn below the TV picture. Dead entries remain as spawn tombstones so the source turtle does not respawn. Shells ricochet from solid obstacles and no longer paint a goomba underneath their shell art.

Shared-camera following is eased, monotonic and capped per simulation step; it does not switch abruptly based on the trailing player's current horizontal input. Scene choices are cached per seed/level; collision ranges use a bounded 96-entry cache invalidated by terrain/broken-block/level/area changes. Native two-player input behavior and platform rules remain. Simulation microbenchmark (ms/update, not hardware FPS): two-player mean 0.1363→0.0331, p95 0.2624→0.0525, p99 0.4827→0.1058. One-player mean 0.0783→0.0282. Camera handoff and collision tests pass; physical controllers and end-to-end frame pacing remain unmeasured.

## Boundless forest

Outer river meanders use absolute coordinates plus a coherent long-wave bend rather than identical 50-tile copies. The finite original terrain remains authoritative; the old map seam is preserved. Raised crossings span deep channel plus both shallow banks. River-corner callbacks now query signed/distant coordinates instead of silently substituting grass outside the 50×50 board. Native reeds/lilies extend to loaded outer regions with bounded per-region caches; decorations remain ephemeral and do not enter saves.

Outer grass and dirt trail colors use the central forest's broad/detail noise treatment in cached ground chunks. Streamed forest paths no longer get the repeated house-paving tile. Mosaic accents are confined to landmark clearings, jittered and no longer sampled from a repeating 24-tile forest lattice. Existing authored/harvested props, region edits, central terrain and saves are preserved; no destructive generation-version migration.

## Skeletons

Removed intentional miniature defaults (68% vertical / 78% lateral joints and enlarged face offsets). Recognized legacy/default skeletons now use the regular native player joints and normal locomotion keys, revision 3. Ordinary skeleton variants use the same gameplay render scale as the player; the boss retains its existing size distinction and Krampus retains its separate creature form. Skeletal limbs/ribs, fitted gear, distinct actions and casting remain. Skull artwork is fitted to normal head proportions. Custom rest geometry is untouched; edited clips retarget onto the regular bones. Migration history stores old joints rather than duplicating the expanded full action library, keeping project rig saves below their existing 20 MB limit. Authored source rigs are never rewritten by migration.

## Verification / build identity

- Source: Wildbound_worlds, commit 1bd5ef027966e371f21cd0956b96b0aa4a62144b with modified/untracked source. No commit alone identifies this build.
- Package: dist/1.2.67-2026-10-25T05-34-07-127Z/Wildbound-win32-x64, built UTC 2026-10-25T05:34:14.766Z (October 24 in America/Los_Angeles), normal profile.
- Desktop Wildbound Worlds (1.2.67).lnk targets the repository Play Wildbound.cmd, blank arguments, repository working directory. Launcher --check succeeds.
- Full rebuild: 1,587 tests passed, zero failed, 252493.0 ms; 419 runtime syntax files checked. The earlier rig-save-size failure was corrected before this successful complete rebuild.
- Exact packaged content verification: 1,078 runtime/asset files, zero mismatches. Actual packaged executable boots to ready lobby, Worlds available, zero errors/failures, audio muted for the isolated test.
- Packaged muted isolated Electron: Expedition 23 checks including native Xbox/Nintendo D-pad/confirm/back and three responsive viewports; level-2/shell native render two; outer-forest native render two; loaded skeleton/player-rig 38; shared tooltip/map/storage/portal 52; Camp navigation 152; lobby/ready 110; victory/replay/chest/crypt 65. Every harness reports zero renderer errors.
- Additional focused checks: 41 forest/TV tests; 32 skeleton/control checks; final eight rig-save/geometry/wizard checks. CPU simulation benchmark is in test-output/tv-cpu-benchmark.json, with limits described above.
- Reports: test-output/rebuild-1.2.67.log, packaged-1.2.67.log, boot-1.2.67.log and build1-2-67-content.json. Assembled previews under expedition-review, tv-review, outer-forest-review and skeleton-player-review.
- Authored rig SHA256 remains DC05411B47F02259BE95EA0ED22AEA375D76F79B55D7F0BDEC57DA5DF7ED7D71. Automated Electron windows are muted and use isolated userData. No commit/push requested. Normal saves and authored rig hash preserved.
