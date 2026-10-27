# Worlds 1.2.34: recover chat changes into the active checkout

The earlier chat mistakenly edited and packaged the separate COdex SHell checkout.
The active project is Desktop/Wildbound Server Branch Build, branch Wildbound_worlds,
HEAD 1bd5ef0, with substantial existing tracked and untracked work. The previous
Worlds release is 1.2.33. No reset, checkout, pull, commit or push was performed.

Both checkouts' app, HTML, package metadata, authored directory and complete src
trees were copied before transfer to the temporary folder
wildbound-chat-transfer-904c8d6a40c94c4e8cafe9925c26c75e (0 is Worlds, 1 is the old checkout).
Personal profiles, worlds, saves and editor drafts were not touched.

Transferred behavior, adapted to newer Worlds code rather than copying old files:

- Lower hood crown pixels in resolved-headwear, retaining the newer view artwork.
- Native-player breaststroke with an upright head; saved original swim retained.
- Editable humanoid stance migration widens arms and feet, stores original rest
  joints and preserves original custom player clips and native source data.
- HUD portrait clears bow-facing state; dialogue portraits already did so.
- Fresh expedition, victory and next-expedition paths refresh maximum HP and heal.
- Chooser idle animation, level label and Drop from game.
- Creator enlarged preview, compact name refresh beside Edit, single appearance
  randomizer and five stacked color buttons beside the preview. Newer hairstyle
  carousel, glasses, wardrobes and controller-family support retained.
- Display/audio-only settings with compact no-scroll layout. Hidden legacy
  controls remain mounted so pause PvP and existing binding initialization work.
- Version 1.2.34 in existing desktop package metadata; existing timestamped
  packaging and runtime dependency copier retained unchanged.

Verification: isolated muted Electron checks in scripts/verify-chat-transfer.cjs,
art sheets/screenshots and report in test-output/chat-transfer. Settings checked
at 1280x851 and 1000x700; creator, chooser, native stance/swim and renderer checked.
Three pre-existing full-suite failures reproduced against the untouched backup:
face test omitted the newer glasses overlay, and house tests expected floorplan 2
although the current garage layout is version 3. Tests updated for those existing
features while retaining distinct-face and house/draft preservation assertions.
Regression tests added for full-health starts/victory, head-up paired-arm swimming,
idempotence and original authored/custom clip recovery.

Final release gate log: test-output/chat-1.2.34-build-final.log. The packaged
identity and exact timestamped output are in dist/1.2.34-*/Wildbound-win32-x64/
wildbound-build.json. Use Desktop Wildbound Worlds (1.2.34), normal profile.
Packaged source is modified/uncommitted. Hardware controller playtesting is separate
from automated UI/input and rendering checks.

Final result: normal rebuild gate passed 1,385/1,385 tests and checked 373 runtime
files. Packaged output is
dist/1.2.34-2026-10-18T17-14-17-218Z/Wildbound-win32-x64, built
2026-10-18T17:14:27.021Z from modified source at the above HEAD.
Actual executable --boot-smoke-test and --worlds-smoke-test both report failed:0.
Worlds smoke verifies four content packs, local-world create/save/reopen, director,
studio movement/jump/input release and offline operation. Packaged renderer UI
and native-part-capture checks also pass. All 388 runtime/source/authored files
checked byte-match; package.json is intentionally reduced to runtime metadata by
the existing dependency-copy script, with version 1.2.34 and ws present.
The Desktop Wildbound Worlds (1.2.34) shortcut targets this checkout's launcher.
