# October 1, 2026: Panther overhaul and Character Viewer review

## Starting state

Game checkout: `C:\Users\mAIn User\Desktop\Codex Projects Local\JumanjiRogue`, branch `main`, remote `https://github.com/ijustcreate/Wildbound.git`, HEAD `3c3fe40274558d9f62c0c8d62c9b1944e9c02eb0`. The checkout already held extensive uncommitted desktop, TV, and human rig work. None was reset, cleaned, committed, or pushed. The separate Character Viewer checkout and its existing Site project were reused.

## Cause and changes

Panther previously inherited Lion motion and combat with a palette and dash distance change. It had no independent rest or swipe poses, energy budget, tree behavior, or attack specific sound cues.

- Authored Panther rig now has a darker layered coat, editable eight direction pixel markings, refined face and claws, and clips for prowl, booty shake, crouch, sit, lie, branch lie, climb, left/right swipe, bite, and swoop. Facial anchors follow the head in lowered poses. Snow Leopard keeps its older clip requirements and does not inherit Panther only poses.
- Panther AI uses regenerating energy for swipe, bite, and swoop. It orbits while prowling, alternates swipe sides, telegraphs a swoop with a crouch, and sits or lies when distant. When near an intact oak or birch style tree of size at least 100, it approaches, climbs, rests on a branch, and descends when a player nears. A small energy bar appears when energy is spent.
- Attack cues use distinct existing CC0 snarl, cloth, and slice sources with Panther specific gain and pitch. No new animal recording was added.
- The same Panther rig and renderer were copied to the existing Character Viewer. The viewer opens with Panther prowl selected and retains all other units and feedback controls. Published version 7 at `https://wildbound-character-viewer.felix13.chatgpt.site`, source commit `95e0622d90a2949d9041a24b3c9251bf05e1c753`. The existing D1 `feedback` table still has four rows after deployment.

## Verification and limits

- Full Node suite: 587 passed, 0 failed. Runtime syntax: 169 files. Dedicated Panther tests cover authored clips, lowered head anchors, energy and alternating attacks, rest/branch/descend, and Adventure routing.
- The final desktop rebuild packaged `dist/1.0.50/Wildbound-win32-x64/Wildbound.exe` from HEAD `3c3fe40274558d9f62c0c8d62c9b1944e9c02eb0` plus modified source, build time `2026-10-01T21:36:02.218Z`. `Play Wildbound.cmd --check` reports that exact package. The Desktop shortcut `C:\Users\mAIn User\Desktop\Wildbound Latest (1.0.50).lnk` targets this checkout's `Play Wildbound.cmd`, working directory the repository root, and `assets/wildbound-icon.ico`. It launches the normal Electron profile, not `--preview`.
- An isolated packaged Electron renderer loaded the authored rig, painted all eleven featured Panther clips without renderer errors, and rendered Panther in a game scene. Review images are in ignored `test-output/panther-electron.png` and `test-output/panther-scene.png`.
- The actual packaged `Wildbound.exe --smoke-test` used its isolated `resources/test-output/profile` and wrote 99 assertions with 14 failures to `resources/test-output/results.json`. Those failures match the previously documented smoke harness count and concern old lobby/editor/Field Kit checks; none targets the new Panther clips. The smoke process lingered after writing its final screenshot, so only that verified `--smoke-test` process and its child processes were stopped. This smoke run is not a clean pass.
- No physical controller playtest or extended live encounter with a real player was performed. Tree selection and transitions were tested in logic and the packaged renderer, but not observed during a long live expedition. The sound sources were verified by file path and cue selection; listening quality remains for user review.

The game checkout remains uncommitted and unpushed. The viewer Site source was pushed only to its separate Site repository as part of publishing; no game source or personal saves were published.
