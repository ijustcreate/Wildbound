# Cleaner sword ground preview

User requested a cleaner ground visual after the thirteen-part sword polish pass.

The held-charge footprint is now a single faint rectangular fill, a thin outline with a subdued contrast keyline, and one stopping edge. Full charge brightens that edge; an obstruction colors it amber. Removed the inset rails, distance ticks, traveling ground diamond, landing seal, endpoint halo, gathering motes, foot runes and extra ready-floor flourish. The existing player-selection ring remains the ordinary player marker. Blade energy and dash/swipe behavior are unchanged.

The existing native review now checks that the ready event adds no separate ground decal. All 35 muted Electron source checks pass, including bright/dark terrain, actual carriage-floor visibility, collision-clipped reach, moving carriage alignment and narrow two-player rendering. Reviewed captures: `test-output/sword-polish/clean-source/`. No new unit tests or gameplay changes were needed for this visual cleanup. Desktop receipts follow below.

Checkout: `C:/Users/New User/Desktop/Wildbound`, branch `Wildbound_worlds`, base `f0b787ff33c3ac8f3675b48504937ebda4f0dcb5` plus existing modified source. Unrelated work, authored rigs and personal saves were preserved. No commit, push or web publication requested or performed. Use the normal profile through `Play Wildbound.cmd` with blank arguments. Full-suite and physical-controller verification are not claimed for this visual-only change.

Final receipts: canonical packaging passed 894 runtime syntax checks and produced `dist/1.2.108-2026-11-23T02-50-29-232Z/Wildbound-win32-x64`, built UTC `2026-11-23T02:51:21.585Z`, modified source at the commit above, preview:false. This output passes all 35 packaged native checks and actual EXE boot smoke.

The version advanced concurrently to 1.2.108, and a second concurrent package became the launcher selection: `dist/1.2.108-2026-11-23T02-51-29-749Z/Wildbound-win32-x64`, built UTC `2026-11-23T02:51:46.485Z`, same modified-source commit and normal profile. The cleaned art module matches source by SHA-256. This exact selection also passes all 35 native checks with errors:[] and failedRequests:[], and actual EXE boot smoke reports failed:0, ready lobby and muted test audio. Review receipts: `test-output/sword-polish/clean-source/`, `clean-packaged/` and `clean-launcher/`.

Desktop `Wildbound Worlds (1.2.108).lnk` targets repository `Play Wildbound.cmd`, blank arguments, repository working directory and project icon. Final `Play Wildbound.cmd --check` selects the second verified output. Restart through the normal launcher to load the cleaner ground preview. Existing saves, authored assets and player sound preferences were not replaced.
