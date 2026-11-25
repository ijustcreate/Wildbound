# Wilds torch lighting and clock

The Wilds already advanced the shared day/night cycle, but its renderer bypassed the main HUD clock. Its night tint also dimmed the carried light after the ground and actors were drawn. A packed torch could emit more light than an equipped one.

The outdoor Wilds now opens its night tint around the same height-aware, occluded light masks used for the ground. Each camera reuses one half-resolution veil, and the full exploration overview skips local light work. The torch produces a warm pool when equipped in either hand, including when dynamic shadows are off. A packed torch still provides passive visibility and a smaller lighting contribution.

The Wilds minimap now shares a clock that shows 24-hour world time, the current phase, and progress since the 06:00 start of the game day. Outdoor Diagon Alley uses the same clock. Split views share one clock. Saved expedition time restores through the existing save format.

## Verification and desktop build

All 28 focused lighting and mountain tests passed. The packaged game passed 32 muted Electron checks using the native terrain worker, with zero renderer errors. The walkthrough covered the four phases, ticking and rollover, narrow and split-screen layouts, outdoor Diagon Alley, and both torch hands. At midnight, the equipped torch raised nearby ground luminance by 23.77 on the 0–255 scale, while terrain outside the radius measured zero change. A separate 25-check muted source run verified the light at the 465-pixel Greywake summit. A persistent Wilds roundtrip restored 04:45 Dawn from its saved world time.

Desktop build `1.2.169` was packaged from the modified `Wildbound_worlds` checkout at `a6cee9bc55ad12ed58df5c3d27b150449f31ef26`. Node parsed 1,246 runtime scripts, and all four scoped modules matched the package by hash. The exact executable `dist/1.2.169/Wildbound-win32-x64/Wildbound.exe` passed its muted lobby boot smoke test. The normal-profile shortcut `Wildbound Worlds (1.2.169).lnk` targets `Play Wildbound.cmd` with `-BuildDirectory "dist\1.2.169\Wildbound-win32-x64"`. The packaged walkthrough report and captures are in `test-output/wilds-light-and-clock/packaged/`.
