# Title-screen update 1.2.56: [entry flow, Studio toolbar and verification](history/2026-10-27-title-screen-1.2.56.md). The current source includes the title scene and direct input-to-explorer selection. Final package identities are recorded in the generated local publication receipt and build manifest. Earlier build notes below are historical.

# Web publication: [current and preserved web editions](history/2026-10-26-web-editions.md). Current web version 1.2.55; original and 1.0.74 preserved separately. Desktop package remains the October 22 build below.

# Latest verified desktop build: [native locomotion and pixel forest](history/2026-10-22-forest-and-native-locomotion-1.2.55.md). Version 1.2.55, modified source on 1bd5ef027966, dist/1.2.55-2026-10-22T22-20-14-817Z. All 1,512 tests and 405 syntax checks passed; the final allocation-only shadow follow-up passed 23 focused tests. Final package: 1,028 content checks, actual executable boot and forest profiling pass. Previous same-version package passed art, shader, motion and 25 input/selection checks; its only subsequent runtime difference is shadow allocation reuse. Normal-save Wildbound Worlds (1.2.55) shortcut selects the final build. Current native rig and authored data preserved. Measured CPU frame cost improves 43–51%; heavy stampede/cold seam hitches remain (final seam maximum 258.6 ms). No commit/push.

# Implemented in 1.2.55: [Boundless forest profiling and pixel-meadow study](art/2026-10-22-boundless-forest-profile.md) and [13-point animation QA](art/2026-10-22-animation-qa.md). The earlier draft results are superseded by the release note above. Earlier notes below are historical status at their writing.

# Pending source-only follow-up: [night-only catchable swamp fireflies and plant review](history/2026-10-22-swamp-night-fireflies-plants.md). Fireflies use bank/shallow habitats, tiny cached glow, net capture/save/release and no daytime activity. New wetland plant art is in the opt-in day/night review scene, not rolled out across production maps. Not in the desktop package yet; preserve all other work.

# Latest verified desktop build: [Wildbound Worlds 1.2.48 shadow-realm wildlife](history/2026-10-20-wildbound-1.2.48-shadow-fauna.md). Forest-deer anatomy replaces the shadow realm's boxy pale hart; a small peaceful monarch fairy dragon adds articulated wings, eight-direction art and skittish flight behavior. Existing pale-hart saves upgrade in place. Full 1,481-test suite passes; 393 runtime files syntax-checked; muted packaged boot smoke passes with no renderer errors. `Play Wildbound.cmd --check` selects 1.2.48. Use `Wildbound Worlds (1.2.48).lnk` with the normal save profile. Modified source at 1bd5ef027966; package built from modified tracked source. No manual gameplay playtest; visual sample saved under `test-output/shadow-fauna-review/`.

# Latest verified desktop build: [Wildbound Worlds 1.2.47 April control fixes](history/2026-10-19-wildbound-1.2.47-april-control.md). Full 1,480-test suite passes; packaged runtime syntax check covers 392 files; muted boot smoke reports zero failures. `Play Wildbound.cmd --check` selects 1.2.47. Desktop shortcut: Wildbound Worlds (1.2.47).lnk.

# Latest visual review: [integrated swamp scene quality draft](history/2026-10-18-swamp-scene-quality-review.md). New opt-in scene combines redesigned native trees, animated moss, cached water and irregular ground, using the user's latest swamp-dock/reed references. NOT imported into production or packaged. Waiting for visual approval before any scenery-family rollout. Preserve all existing changes and saves.

# Pending source follow-up: [swamp shadow ownership, moss motion and tree-structure review](history/2026-10-18-swamp-shadow-moss-review.md). Default tree blob/baked-patch and duplicate light/shadow fixes are in source, with cached animated moss. Earlier seeded structure gallery is not an approved style reference; the integrated scene above is the current draft. These changes are NOT yet in the desktop package; preserve them and all other working changes.

# Last verified desktop release: [combined Wildbound Worlds 1.2.36](history/2026-10-18-combined-1.2.36.md). Includes all preceding work, hood/TV/menu fixes, lightweight lighting, three new environments/Boundless integrations and the approved swamp island maze. Real checkout: Desktop/Wildbound Server Branch Build, Wildbound_worlds, modified source on 1bd5ef027966. At build time: 1,429 tests passed; packaged boot/offline saves/editor, UI/art and ten-environment checks passed; 1,311 package files matched the then-current source. Use Desktop Wildbound Worlds (1.2.36) / Play Wildbound.cmd with the normal save profile, not --preview. Exact package identity and safety snapshots are in the release note. Older versions below are historical, not launch targets.

# Historical branch baseline: [1.2.2 recovered fixes + humanoid hands](history/2026-10-15-regression-recovery.md). Fixes stackable-stick pickup/socketing and migrates legacy floaty jump settings on saved players; enlarges shared humanoid hand art without changing rig joints or weapon attachment pivots. The recovered laptop lobby/UI/art/creature/follower work remains integrated with offline worlds and the controllable studio. Hosted persistent servers are disabled.

Historical local desktop test build: [1.0.136 persistent Forest server](history/2026-10-11-persistent-forest-test.md). Superseded by the offline-worlds architecture above; source retained in recovery history.

# Latest local desktop build: [1.0.120 victory, board and vending UI polish](history/2026-10-11-victory-report.md). Readable victory report, centered Yes · Play Again, slim board surround, narrower vending shop and visible controller collection-tray navigation. All 38 focused tests and packaged Electron viewport/input checks pass; 11 runtime files byte-match. Normal-profile desktop shortcut and launcher verified; exact build identity is in the note.

# Latest local desktop build: [1.0.119 tighter opening-board shot](history/2026-10-08-opening-board-shot.md). The opening view is cropped closer around the board and party, with a grey floor and a Press prompt showing the configured left-face-button glyph plus the keyboard hint.

# Latest local desktop build: [1.0.118 location-themed slimes](history/2026-10-08-location-slimes.md). Seven biome-specific slime encounters use native editable pixel art and the WoW slime's transferred idle, locomotion, hurt, attack, and death motion. All seven encounter, save/restore, Rig Studio, direction, and clip checks pass. Build and launcher verification recorded in the linked note.

# Latest local desktop build: [1.0.117 victory flow, followers, and playtest fixes](history/2026-10-08-wildbound-playtest-fixes-1.0.117.md). The buttonless victory report leaves treasure closed for manual chest interaction; board strikes open the replay/lobby choice. Wildbound map travel now carries all living owned companions. The full serial suite passes 1,267 tests; the versioned Windows package and normal-profile Desktop shortcut pass launcher identity checks.

# Moving Wildbound development between computers

Latest local desktop build: [1.0.114-boundless-worlds destination-specific endless terrain](history/2026-10-08-boundless-worlds.md). Boundless keeps the selected destination, renders distant/negative ground, forms a large beach island with ocean and offshore islands, and connects repeated cemetery grounds through their gates. Native scenery, shared region entrances, local enemy navigation and harvested-region saves extend with exploration. Full suite 1,260 tests, final 10 generation tests and packaged seven-map rendering/save checks pass; 12 runtime modules byte-match. Versioned desktop shortcut and normal-profile Play Wildbound.cmd verified. Modified source at bc1b432; no commit or push.

Latest local work: [1.0.113-merchant-center merchant ledger, readable multiplayer trading and center finish](history/2026-10-08-merchant-center.md). Wood/parchment shop with portrait, separate trade categories and explicit confirmation; multiplayer trading uses full-window grids and readable inline details. Center landings show WILDBOUND without new events or travel, finished pieces leave the rolling order, and the finish hold takes priority over loot. Final focused 35 tests and muted Electron 1/2/4/6-player checks pass. Build verification is recorded in the linked note; modified source at bc1b432, no commit or push.

Latest chest and lobby UI work: [responsive storage and playable lobby polish](history/2026-10-08-lobby-chest-ui.md). Separate chest/backpack grids, responsive controller columns, no overlap or scrollbars; proximity captions, minute target totals, seated TV/controller/cable props, jumpable furniture and biome supply chests. 82 focused tests and packaged Electron UI checks pass. Normal-profile 1.0.112-wow-creatures snapshot built 20:53:48Z; all 17 requested runtime files byte-match. Later concurrent rig/house-builder edits require another build; see the exact verification limits in the note. Desktop shortcut and Play Wildbound.cmd identity verified; modified source, no commit or push.

Shore goblin art revision in the current combined desktop build: [eight-view anatomy and grips](history/2026-10-08-shore-goblin-anatomy.md). Smaller coherent skull, rounded pale throat, tapered limbs/webbed feet, fitted kelp strips, projected crest/cheek fins and closed weapon grips; distinct club, bone spear and healer kelp crook. 18 focused tests; all 16,000 source poses and 1,536 packaged poses pass, plus connected parts, independent edits, Studio, real beach healer/guard behavior and saves. Exact runtime file match in 1.0.112-wow-creatures; desktop shortcut/launcher verified. Revised for user visual review, not approved; no authored rig writes by this art task.

Latest local desktop build: [1.0.113-merchant-center including spider, boar and elephant motion/art](history/2026-10-08-wow-creatures.md). Three reference creatures now use native editable pixel rigs with transferred bone motion; the elephant's layered art and near-eye views were revised after user review. The packaged rig check, eight-direction visual QA, shortcut and build identity pass. Use `Play Wildbound.cmd` in the normal save profile. Modified source at bc1b432; no commit or push.

Latest local desktop build: [1.0.108-no-scrollbars and new launcher](history/2026-10-08-no-scrollbars.md). All UI native scrollbars/gutters hidden; wheel scrolling remains usable and lobby controller selection reveals off-screen choices within its owner panel. 19 focused Node tests, packaged menu/wheel/controller/multiple-owner checks, inventory and creator checks pass. 892 packaged source/asset files match current content. New desktop Wildbound Latest (1.0.108-no-scrollbars).lnk targets Play Wildbound.cmd, normal save profile; launcher identity verified. Modified source at bc1b432d20f4, no commit/push. Existing broad-smoke limits follow in the previous note.

Latest local desktop build: [1.0.107-all-changes, humanoid ghost and combined updates](history/2026-10-08-humanoid-ghost.md). Existing-rig hooded ghost, spectral gear/mist legs/claws/eye trails, cemetery event, tombstone spawns, critter fleeing and crypt enemies; wing shapes and horns preserve hair. Includes the latest shore artwork and small-window creator correction. Full Node suite 1,221 passed, final focused 35 passed; packaged current-content, ghost/wing, inventory and creator checks pass. The older broad UI smoke suite has 16 failures requiring review, recorded in the note. Modified source at bc1b432d20f4; normal profile via Play Wildbound.cmd and the 1.0.107 desktop shortcut. No commit or push.

Latest local desktop build: [1.0.106-shore-goblin-art](history/2026-10-08-shore-goblin-art.md). Shore goblin head/body attachment and silhouette revision: rounded tapered neck, solid turning skull/torso, fitted kelp wrap, corrected near-eye visibility. 18 focused tests and packaged muted Electron QA pass (16,000 poses, 40 connection samples, Studio, real gameplay and saves). Launcher and normal-profile desktop shortcut verified. Artwork is revised for user review, not approved.

Latest local desktop build: [1.0.104-shore-goblins](history/2026-10-08-shore-goblins.md). Beach-only three-role shore goblin squad; original native editable art, three colors, 52 Murloc animation entries, healer protection and interruptible healing. Full Node suite: 1,213 passed. Muted isolated Electron checks cover real gameplay, saves, Studio and packaged content. Normal profile via Play Wildbound.cmd. Modified source, no commit or push.

Latest local desktop build: [1.0.101-expedition-polish](history/2026-10-08-expedition-polish.md). Variable pacing, clear-earned rewards, 3-gold/one-dust starter gear, consumable Dark Essence weapon sockets, expanded vending, Training Points, combat readability, native art review and 85 original cues. Full Node suite: 1,204 passed; final focused UI/audio/equipment checks and packaged muted Electron review passed. Use Play Wildbound.cmd or Wildbound Latest (1.0.101-expedition-polish).lnk in the normal save profile. Source is modified and uncommitted.

Latest local desktop build: [1.0.96-captain-hunter Safari Hunter on the Oathless Captain rig](history/2026-10-07-captain-hunter-1.0.96.md). The Hunter carries the rifle across both hands, uses the Captain kneel/dodge/death motion, and wears the pointed pith hat, orange field gear, and black cape with red inside. Use `Wildbound Latest (1.0.96-captain-hunter).lnk` in the normal save profile. Earlier build notes follow.

Latest local fix: [1.0.94-zone-events Reaper loot and mausoleum victory cleanup](history/2026-10-07-reaper-loot-mausoleum-victory.md). Reaper kills now leave the full set for manual pickup, and calling WILDBOUND closes the crypt entrance. The modified-source desktop build and normal-profile shortcut passed their checks. Earlier local build notes follow.

Latest local desktop build: [1.0.94-zone-events Wildbound arrivals and map-weighted event pools](history/2026-10-07-wildbound-zone-events.md). Fresh destinations now start an available event on arrival; existing zone restrictions and saved revisits remain intact. Use `Wildbound Latest (1.0.94-zone-events).lnk` in the normal save profile. The package syntax check passed; this follow-up did not run the test suite.

Latest local desktop build: [1.0.93-death-frost Reaper, Death set and Banshee skills](history/2026-10-07-reaper-death-set-banshee.md). Includes any-zone Reaper events (cemetery weighted), humanoid gear/scythe, interruptible life drain, Death's Shroud and set bonuses, Banshee retreat spread and charged frost shot. The 1,186-test suite had one icon-grid failure, fixed and verified by all three loot-art tests; 28 focused behavior/rig tests and packaged Electron's 832 frames plus studio/inventory/creator checks pass. Use `Wildbound Latest (1.0.93-death-frost).lnk`, targeting the verified normal-profile `Play Wildbound.cmd`. Earlier build notes follow.

Latest local desktop build: [1.0.92-flight-crypt flight, companion movement and underground presentation](history/2026-10-07-flight-companions-underground.md). Wings show in profile, hovering knees lift slightly, flyers cross fences, grave zombies pursue, pets follow with advancing gaits, and crypt/well rooms use larger surface-scale views with subtle SFX reflections. The modified-source build passed 1,177 Node tests and packaged Electron pose, gait, room, audio, inventory and creator checks. Use `Play Wildbound.cmd` or `Wildbound Latest (1.0.92-flight-crypt).lnk` in the normal save profile. Earlier build notes follow.

Latest local desktop build: [1.0.91 Wildbound mode, cemetery artwork and fleeing cats](history/2026-10-07-wildbound-mode-cemetery-1.0.91.md). Select **Wildbound mode** at the top of the map menu. Start at home; totals 5/8 travel to six preserved environments and back without resetting the party or board pieces. The normal-profile launcher and versioned desktop shortcut point at this modified-source build. Earlier build notes follow.

Latest local desktop build: [1.0.89-gear-spider controller gear/tooltips and adult spider pursuit](history/2026-10-07-controller-gear-spider-hunt-1.0.89-gear-spider.md). The modified-source build passed 1,156 Node tests and packaged Electron controller, tooltip and spider checks. Use `Play Wildbound.cmd` or `Wildbound Latest (1.0.89-gear-spider).lnk` in the normal save profile.

Latest local desktop build: [1.0.87 humanoid arms and layer overlap](history/2026-10-07-humanoid-arms-and-layers.md). Sleeves, forearms and held gear now sort around the torso independently on the existing rig; the Keeper antlers are shorter. The modified-source build passed 1,151 Node tests and packaged Electron arm, wings, creator and inventory checks. Use `Play Wildbound.cmd` or `Wildbound Latest (1.0.87).lnk` in the normal save profile. Earlier release history follows.

Latest local desktop build: [1.0.84 sequential event test board](history/2026-10-06-event-test-board-1.0.84.md). Pause → Dev cheat menu can summon a second stationary board that runs all events in list order, one per hit. This modified-source build passed 1,112 Node tests and 216 packaged Electron assertions. Use `Play Wildbound.cmd`; the normal save profile is unchanged. Earlier release history follows.

Current desktop release: [1.0.79 The Keeper, editable branching quests and lobby alignment](history/2026-10-06-keeper-quests-1.0.79.md), following [1.0.78 local wall, door, furniture and tree destruction](history/2026-10-06-structure-destruction-1.0.78.md), 1.0.77 crypt rendering/doorway fixes and 1.0.76 inventory layout/tooltips. Inspect `wildbound-build.json` and the exact verification reports; rebuild on another machine. The hosted web root remains at its previous build; the separate web release remains `/Wildbound/releases/1.0.74/`.

Previous local release: [1.0.72 accumulated UI/coast/spider/map-selector build](history/2026-10-06-ui-coast-spiders-1.0.72.md), plus subsequent creature/event/biome additions. Earlier local history notes describe pre-integration modified checkouts; they are not the final 1.0.74 commit identity.

Latest local work: [1.0.71 parallel anaconda/quicksand/adaptive audio/settings, character creator and wildlife/storage polish](history/2026-10-06-parallel-polish-1.0.71.md), including [1.0.70 spiraling board seal and bounded finale rendering](history/2026-10-06-seal-vortex-1.0.70.md), [1.0.69 regular starter chest, complete starter selection and safe per-level restock](history/2026-10-06-starter-chest-1.0.69.md), [1.0.68 humanoid warlock, inventory-sized robot/buyback, compact victory chest and companion locomotion](history/2026-10-06-warlock-robot-companions-1.0.68.md) and [1.0.67 inventory matching the user's hand-drawn layout](history/2026-10-06-inventory-sketch-1.0.67.md). These changes are not committed or pushed. The previous shared release is [1.0.66 paper doll, lobby storage, TV controls/parallax and victory treasure](history/2026-10-06-paper-doll-tv-treasure-1.0.66.md), built on [1.0.65 inventory, controller ownership, companions and spell visuals](history/2026-10-05-inventory-companions-1.0.65.md), including the preceding 1.0.56–1.0.64 game/UI/assets work. Always use `Play Wildbound.cmd` and rebuild on a receiving computer; a source push does not transfer the packaged executable.

This repository carries the game source and shared authored rig artwork. A desktop shortcut, packaged build, browser save and Electron profile are separate things. Pulling Git does not update them automatically.

## 1. Open and synchronize the correct checkout

Open the cloned **Wildbound repository folder** as the workspace, not a previous machine's Desktop path or an arbitrary shell folder. From that root inspect:

```sh
git rev-parse --show-toplevel
git status --short --branch
git remote -v
git fetch origin
git log -3 --oneline
```

The project remote is `https://github.com/ijustcreate/Wildbound`. Inspect outstanding local work before pulling. On a clean checkout tracking the intended branch, use `git pull --ff-only`. If it cannot fast-forward, reconcile the branches deliberately; do not reset away work. Read `AGENTS.md` and the latest relevant handoff in `docs/history/`. Record the receiving checkout's commit with `git rev-parse HEAD`.

## 2. Run the desktop source build

With Node.js/npm installed, the npm lockfile supports:

```sh
npm ci
npm start
```

`npm start` runs `electron .` from this checkout. Run dependency installation only after accounting for any locally modified dependencies. If Electron's runtime is missing, diagnose dependency installation; do not silently redirect the user to the web launcher. Users of a complete packaged game do not need Node.js installed.

## 3. Build and recreate the shortcut on this computer

First check what the repository launcher would run:

```powershell
& '.\Play Wildbound.cmd' --check
```

It reports the exact executable, source commit and build time. If it reports a missing or mismatched build, the pulled source is newer than the package. Do not use an old desktop shortcut as evidence that the pull worked. Close the target build before replacing it, after checking with anyone using it. Then run from the checkout:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\rebuild-desktop.ps1
```

This single step runs the Node tests, packages the current source, writes `wildbound-build.json` beside the executable, and creates or refreshes the versioned Desktop shortcut. It checks for the local Electron dependencies and stops if the target game is running. The shortcut targets this checkout's `Play Wildbound.cmd`, which checks the build each time before opening `dist/<package.json version>/Wildbound-win32-x64/Wildbound.exe`; it uses the project icon. Run `Play Wildbound.cmd --check` again, inspect the shortcut target and working directory, and launch it to confirm the intended game loads. Replace old shortcuts that target an executable directly. Do not carry `.lnk` files with another user's absolute paths to the new machine. If the Desktop is redirected, pass `-DesktopPath` to the rebuild script.

For non-overwriting test builds, `node scripts/package.cjs --preview` creates a timestamped `dist/night-hunt-...` folder. The normal launcher and shortcut do **not** select these folders: a test shortcut must explicitly target the exact successful output. This packaging flag names the output; it does not itself add the runtime `--preview` argument. The normal launcher does not pass `--preview`, so it uses the normal Electron profile.

Keep the entire packaged directory together when distributing a playable build. `dist/` is ignored by Git. Rebuild on the destination or deliberately transfer a complete release; pulling source alone is not enough.

## 4. Preserve the right saves and editor work

On Windows, normal Electron uses the `wildbound` folder under the current user's roaming AppData. Runtime `--preview` instead uses `Wildbound Night Hunt Preview`. A different Windows account has different profiles. Confirm the running app's actual user-data path when diagnosing.

Browser storage is separate again, and is specific to its origin (including port) and browser profile. GitHub Pages, localhost and Electron do not automatically share saved state.

Before transferring local data, close the relevant apps and back up both source and destination. Compare versions and drafts; do not blindly overwrite newer destination work. Prefer existing export/import facilities where available. In particular:

- `authored/rigs.json` is intentionally shared in the repository; see `authored/README.md`.
- House Builder uses `wildbound-house-designs-v1` and `wildbound-house-state-v1` in local storage, with a desktop `house-designs-v1.json` backing file when saved. The state can contain an unfinished draft distinct from the active version.
- Characters and expedition progress live in the local profile, not in source control.
- Do not commit whole profiles, personal saves, controller claim files or diagnostic logs merely to move development.

If the house looks old, establish which profile/origin/computer holds the intended layout before modifying the default generator. Missing custom data must not be treated as permission to discard it.

## 5. Verify and report honestly

Inspect local live diagnostics (see `docs/live-diagnostics.md`) and renderer errors when the game freezes, ignores input, or leaves the lobby on screen. Confirm the launched executable corresponds to the new build. For inventory layout changes, `npx electron scripts/verify-inventory-sizing.cjs` uses an isolated test profile to check selection stability.

Before a requested push, inspect the diff and tests. Add a handoff with the source commit, symptoms and observations, implemented fixes, test results, unverified behavior and outstanding user questions. Push without forcing, then verify the remote revision. The receiving machine should check four identities: remote commit, local HEAD, `wildbound-build.json` source commit, and desktop shortcut target. A source push cannot update the other machine's package or `.lnk`; run the rebuild there. Read the packaged smoke report's `failed` count when one is run; a process exit alone is insufficient. Source pushes, GitHub Pages deployments and release uploads are separate actions.
