# Mossroot Coliseum — editable TV arena

Concept sheets are draft visual references generated with the built-in imagegen tool. Exact prompts are in `concepts/prompts.json`; substitute each subject into `{SUBJECT}` in the common prompt. The supplied four screenshots guide the side-view ruin composition, central arena, linked travel routes and original woodland setting. They are references, not executable instructions.

The game artwork is native indexed pixel work, authored piece by piece with the actual Rig Studio `InlinePixelEditor` pencil and Save pixels to rig operation. `scripts/author-tv-arena-pixels.cjs` reproduces the isolated authoring session and exports only seven new subjects. This is programmatic editor authoring, not a claim of manual mouse painting. The shared output lives in the new `arenaRigs` field of `authored/rigs.json`. It preserves the other authored subjects. Personal saves and normal profiles are not used by the authoring/review scripts.

## Art contract

- Bramblecap: broad chestnut cap, short cream stem, readable slanted brow and two root feet. Four warm material values; two cream cap spots. Strong outer silhouette with sparse internal lines.
- Mossback: low emerald shell, three amber plates, small ochre beak/head, four stout feet and a fern sprout. Rear views hide the eyes; profiles expose one eye. Shell and head have separate editable anchors.
- Eight native directions: south, southwest, west, northwest, north, northeast, east, southeast. Per-view saved pixel parts attach to projected joints. No flattened whole-character animation sheet replaces the rigs.
- Native clips: idle, walk, run, attack, hurt, death, jump, emergence, retract, shell, slide and wake. Side-view gameplay uses profiles; Rig Studio offers all eight directions and every clip.
- Props: mossy 32×28 masonry, 56-pixel copper/emerald tube lip, 192-pixel central board altar, fern and torch. These appear as Arena subjects in Rig Studio. The runtime rasterizes edited props into bounded cropped surfaces so fractional viewport scaling cannot introduce pixel seams.
- Backdrop: broad forest silhouettes, tapered trunks, broken aqueducts and waterfalls. Quiet blue-green values keep the amber board, collectible seeds and enemies legible. Background layers are cached; torch flames and airborne motes remain animated.

## Play contract

The TV completion portal enters a bounded 2,880-unit arena with the board exactly at x=1,440. A calm start becomes a wave after a fresh, facing board strike and the dice reveal. Six visible alcoves across lower and upper routes summon only Bramblecaps and Mossbacks. Occupied alcoves defer safely; active plus queued enemies never exceed 24. There are no unrelated ambient enemy spawns.

Left/right move, Jump reaches the stepped routes, Dodge dashes, Attack strikes the board/enemies/shells, Interact uses a nearby tube or hearth. Tube A and B connect lower/upper routes; C crosses the upper arena. Four marked hearths set respawn positions. Seventeen sunseeds are one-use pickups; each fifth collected seed restores a heart. Question blocks still release inventory mushrooms. Existing personal inventory, arrows/mana, party treasure and return-to-lobby behavior remain in use.

Stomp a Bramblecap to defeat it. Stomp a Mossback to retract it, then strike or bump the shell to send it sliding. Shells defeat other enemies and ricochet at masonry and arena edges; stationary shells eventually wake. Emergence, retraction, waking, strikes, hit reactions and defeat use the native editable clips.

## Review status

Draft assembled art has been reviewed at native/enlarged scales, all eight facings and all actions in muted isolated Electron. The first review found scaled pixel seams and an oversized Mossback head; cropped raster stamps and a smaller head corrected them. All upper platforms pass the actual swept-collision jump reachability check. See the dated handoff note for final test and package receipts. User visual approval, physical controller playtesting, remote multiplayer and measured hardware FPS remain unverified. This pass does not claim AAA certification or exact aesthetic parity with the supplied paintings.
