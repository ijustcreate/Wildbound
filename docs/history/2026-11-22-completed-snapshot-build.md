# Completed-work desktop snapshot — November 22, 2026

The user initially requested a build after all current requests. Further work kept arriving in other chats; the user then explicitly chose **Build the completed work now**. This delivery freezes the last fully verified combined batch rather than including unfinished follow-ups.

## Build identity and scope

- Version **1.2.108**, built UTC **2026-11-23T04:05:06.289Z**, normal profile (`preview: false`).
- Executable: `C:/Users/New User/Desktop/Wildbound/dist/1.2.108-2026-11-23T04-03-53-675Z/Wildbound-win32-x64/Wildbound.exe`.
- Git base: `f0b787ff33c3ac8f3675b48504937ebda4f0dcb5`, branch `Wildbound_worlds`, origin `https://github.com/ijustcreate/Wildbound.git`, **modified source**.
- Runtime frozen from the verified `1.2.108-2026-11-23T03-32-53-600Z` package, originally built at `03:33:23.993Z`. Includes the completed camera/rendering, Crossfire combat, train/dialogue, car, reactive fog/purple grass/deer, creature and earlier accumulated work in that package. Newer world, winter, animation, streaming and Christmas-tree follow-ups are outside this snapshot.
- Frozen-runtime SHA-256 receipt: `ef14e15bd10e738689f2a66647d2f254aaa8ec7d6d626cb25221dcdd6dccd175`. The new build manifest records its source snapshot explicitly. The live checkout has newer ongoing changes; do not identify this snapshot solely by the current checkout version.

## Verification

All **905 runtime files** passed syntax parsing. For this frozen staging directory only, the checker uses Node V8 module/script parsing in one process instead of launching a Node process per file; the normal repository checker was preserved.

Muted isolated Electron against the frozen runtime passed **209 checks**: 14 combat/trajectory, 47 split-camera/editor/worker, 136 train foreground pixel, and 12 conductor/dialogue/ticket/station-stop checks. The conductor driver reports a checks array rather than a `failed` field; its process exited successfully, all twelve checks completed, and renderer errors were empty. **1,714 runtime/asset files** then matched the new package byte-for-byte, with no missing or differing files. The actual packaged EXE boot test passed (`failed: 0`, ready lobby, no errors, test audio muted).

Earlier broad checkout runs passed 2,004 and 2,033 tests. Those are historical integration receipts, not a new full-suite claim for this frozen package. A later regression run for follow-ups was stopped after the user selected this snapshot. Physical controllers and sustained gameplay FPS remain unverified. Existing player games, normal saves, sound settings and unfinished authoring work were preserved.

## Pinned launcher

Another chat advanced the main checkout/launcher to 1.2.109 during this delivery. The separate Desktop shortcut **Wildbound Completed (1.2.108).lnk** reliably selects this snapshot:

- Target: `C:/Users/New User/Desktop/Wildbound/Play Wildbound.cmd`
- Arguments: `-BuildDirectory "dist\1.2.108-2026-11-23T04-03-53-675Z\Wildbound-win32-x64"`
- Working directory: `C:/Users/New User/Desktop/Wildbound`
- Icon: `assets/wildbound-icon.ico`
- Normal save profile; no runtime `--preview` argument.

`scripts/launch-desktop.ps1` now accepts an explicit build directory under this checkout's `dist`, verifies its manifest, checkout commit, executable and non-preview identity, and otherwise retains ordinary latest-version selection. Pinned and default checks passed, as did outside-dist and missing-build rejection. To inspect this exact selection:

```powershell
& '.\Play Wildbound.cmd' --check -BuildDirectory 'dist/1.2.108-2026-11-23T04-03-53-675Z/Wildbound-win32-x64'
```

Receipts are in ignored `test-output/completed-snapshot-delivery.json`, `completed-snapshot-shortcut.json`, `completed-snapshot-receipt.json`, `combined-build-content.json`, and the corresponding snapshot package/EXE logs. No commit, push, web publication or personal-save publication was performed.
