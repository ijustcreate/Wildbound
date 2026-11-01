# Wowhead motion transfer and creature polish — 1.2.85

Packaged the modified Wildbound_worlds checkout (`d2720a4da60b468884b350e422ae7ab875c31f61`) as a normal-profile Windows desktop build. This remains a review build, not a web release; source was not committed or pushed.

## Added since 1.2.84

- Transferred Dottie/Llama (Wowhead NPC 151788) Stand, Walk, and Run motion into the native editable rig. Trot, spit warning, kick, combat, hurt, and death remain native. The review note and eight-facing captures are in `docs/art/reviews/2026-10-28-llama-wowhead-motion-transfer.md` and `test-output/llama-wow-motion-transfer/`.
- Transferred Clinging Remains (NPC 179179) crawl and grab motion while retaining native idle, windup, recovery, hurt, and death actions. The mapping uses capped positional retargeting; see `docs/art/reviews/2026-10-28-clinging-remains-wowhead-motion-transfer.md` and `docs/art/reviews/2026-10-28-clinging-remains-eight-facing-before-after.png`.
- Integrated Turkey (NPC 62648) donor Stand, Run, Attack, and Death clips. Donor Walk penetrates the floor (foot pivot Z reaches −3.5144), so slow walking deliberately continues to use the native grounded strut. See `docs/art/reviews/2026-10-28-turkey-wowhead-motion-transfer.md` and `test-output/turkey-wow-motion-runtime/`.
- Existing transfers for Squirrel, Great Owl, Butterfly Dragon/Blinky, Sheep, and Skunk remain included from 1.2.84.

Native pixels and gameplay actions were preserved in these passes. Import scripts, source mappings, tests and review notes are kept alongside the game. Draft art/motion has not been approved by the user.

## Verification and build identity

- Full suite: **1,694 passed, 0 failed**.
- Syntax check: **508 runtime files**.
- Build identity: version `1.2.85`, built `2026-10-28T16:22:57.998Z`, `preview: false`, source dirty at package time.
- Package: `dist/1.2.85-2026-10-28T16-22-07-192Z/Wildbound-win32-x64/Wildbound.exe`.
- `Play Wildbound.cmd --check` selected this package. Desktop `Wildbound Worlds (1.2.85).lnk` targets `Play Wildbound.cmd`, has blank arguments, and uses the repository as its working directory.

## Remaining coverage and limits

This does **not** finish donor-motion mapping for all new creatures. The audit still identified several creatures routed through generic native approximation clips; follow-up work is in progress. Tests establish routing/data/render contracts, not that every motion feels correct in game. The current user has not yet playtested this package. Physical controllers, multiplayer, and performance remain unverified.

No commit or push. Launch the normal save profile with `Play Wildbound.cmd`; `--preview` uses a separate profile.
