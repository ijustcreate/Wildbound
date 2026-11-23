# Native pixel recipes and contributor art skill

Pixel recipe decoding, indexed sprite patches, coordinate output, and frame timing now live in the game source. The CLI uses that compiler for the same JSON input, while renderers can use the shared cached canvas painter. The original Ice lodge lantern is the worked example. Its 710 ms loop compiles from its source recipe at startup, and all six frames match the former generated module exactly.

Sprite Workshop and Animation Studio's rig layer editor offer a **Pixel recipe** dialog to preview pasted JSON, play timed frames, and apply one frame to the active draft. Normal Save actions persist it. Attachment pivots and collision footprints stay in their existing editing paths. The rig layer switch keeps independent drafts.

The README and AGENTS.md point contributors and LLMs to the repository's [Wildbound Art skill](../../.agents/skills/wildbound-art/SKILL.md). Its companion references cover recipes, original and revised environment art, native eight-direction rig work, and motion transfer. The instructions use repository-relative paths and the existing tools.

The focused game checks also verified that a fresh app loads the imported player walk and run and that a redrawn playground pot breaks on a normal sword strike and persists after restore.

## Desktop verification

33 focused Node tests passed. Muted native runtime checks verified the six exact lantern frames, original fixture placement and light, loaded gait timings, and pot break/save/restore. The normal packaged executable reached a ready lobby with zero renderer errors. Its initial smoke-test process did not exit within the 55-second wait. The JSON module loading check also passed through the local HTTP fixture. The full repository suite and full browser gameplay were outside these checks.

Build `C:/Users/New User/Desktop/Wildbound/dist/1.2.117/Wildbound-win32-x64/Wildbound.exe`, desktop version 1.2.117 with source version 1.2.114, built 2026-11-23T21:59:19.563Z from modified source at `c30e70eb53f557eb746f91968d6df7035a89bf67`. The desktop shortcut `Wildbound - Pixel Recipes (1.2.117).lnk` targets `Play Wildbound.cmd` with the exact versioned directory pinned and uses the normal save profile. All nine touched runtime and recipe files matched this package, and syntax checking covered 1,005 runtime modules. No commit or publication.

The editor verifier passed 21 checks against both source and the exact packaged resources. It covered malformed recipes, timed playback, frame selection, draft undo and redo, explicit saving, independent rig layer drafts, preserved rig pivots and facings, and a 650-pixel-wide window. Both the editor and runtime package checks were muted and reported zero renderer errors. Receipts are under `test-output/pixel-recipe-editors/packaged/` and `test-output/pixel-recipe-engine/packaged/`.

A software-rendered executable retry also reached the lobby, reported zero errors, and captured its screenshot. Both executable boot checks timed out waiting for the test process to exit. The 30 direct Electron editor and runtime checks exited successfully.
