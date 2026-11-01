# Wowhead motion transfer and creature polish — 1.2.86

Packaged the modified Wildbound_worlds checkout (`d2720a4da60b468884b350e422ae7ab875c31f61`) as a normal-profile Windows desktop build. This is a review build, not a web release; source was not committed or pushed.

## Added since 1.2.85

- Transferred Jammer/Triceratops (Wowhead NPC 142151) Stand, Walk, Run, and AttackUnarmed motion into the native editable rig. Native charge/headbutt behavior remains. Corrected the near-floor foot pose. See `docs/art/reviews/2026-10-28-jammer-wowhead-motion-transfer.md` and `test-output/jammer-wow-motion-runtime/eight-facings.png`.
- Transferred Golden Retriever (NPC 120973) Stand, Walk, and Run while retaining native sit, wag, fetch, and combat actions. See `docs/art/reviews/2026-10-28-golden-retriever-wowhead-motion-transfer.md` and `test-output/golden-retriever-wow-motion-transfer/`.
- Transferred Bouncer/jumping spider (NPC 222532) Stand, Walk, and Run while retaining native pounce/bite behavior and the no-web rule. Clamped donor foot penetration to ground level. See `docs/art/reviews/2026-10-28-bouncer-wowhead-motion-transfer.md` and `test-output/bouncer-wowhead-motion-transfer/`.
- Corrected the wildlife test's expected Bouncer donor provenance. Existing transfers for Squirrel, Great Owl, Butterfly Dragon/Blinky, Sheep, Skunk, Llama, Turkey, and Clinging Remains remain included from 1.2.84–1.2.85. Turkey's donor Walk still fails floor contact, so its native grounded strut remains routed for slow walking.

Native pixels and gameplay actions were preserved in these passes. Draft motion has not been approved by the user.

## Verification and build identity

- Full suite: **1,695 passed, 0 failed**.
- Syntax check: **512 runtime files**.
- Build identity: version `1.2.86`, built `2026-10-28T17:38:47.752Z`, `preview: false`, source dirty at package time.
- Package: `dist/1.2.86-2026-10-28T17-38-27-084Z/Wildbound-win32-x64/Wildbound.exe`.
- `Play Wildbound.cmd --check` selected this package. Desktop `Wildbound Worlds (1.2.86).lnk` targets `Play Wildbound.cmd`, has blank arguments, and uses the repository as its working directory.

## Remaining coverage and limits

- Scruffbeak/Flying Raptor (NPC 253399) is held because flight/dive/action sequence labels and pose mappings are not confirmed. Audit: `docs/art/reviews/2026-10-28-scruffbeak-wowhead-motion-audit.md`.
- Tyri/Archangel (NPC 79181) is held because wing-joint semantics and a flight clip are not unambiguous. Audit: `docs/art/reviews/2026-10-28-tyri-wowhead-motion-audit.md`.
- Flipper/Penguin (NPC 169479) is held because the donor has no confirmed forward swim/swim-idle clip and its custom hierarchy needs pose mapping. Audit: `docs/art/reviews/2026-10-28-flipper-wowhead-motion-audit.md`.
- Other newly added creatures still need donor-motion mapping and review; this build does not complete the full requested roster or all Wowhead animation sets. Prior Fox, Llama, Sheep, Squirrel, and Turkey art/motion drafts still need user playtest/approval.
- Tests establish routing/data/render contracts, not that every animation feels right in play. User playtest, physical controllers, multiplayer, and performance remain unverified.

No commit or push. Launch the normal save profile with `Play Wildbound.cmd`; `--preview` uses a separate profile.
