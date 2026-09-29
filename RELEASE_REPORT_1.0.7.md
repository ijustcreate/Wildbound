# Wildbound 1.0.7

This build includes the changes made after the 1.0.6 development build.

## Included

- New bone and gear studio tools, item previews and related editor styling.
- Expanded character appearance, motion, wearable art and render-order updates.
- Chained encounter actions, grouped enemy waves and event rewards.
- Controller-friendly settings tabs for display/audio, explorer options and controls.
- Updated authored rig data and regression tests for the new studio features.

## Build

- Desktop package: `dist/1.0.7/Wildbound-win32-x64`
- Web package: generated separately with `node scripts/build-web.cjs`
- Windows shortcut: run `powershell -ExecutionPolicy Bypass -File scripts/create-desktop-shortcut.ps1`; it reads `package.json` and creates `Wildbound Latest (1.0.7).lnk` pointing at the matching packaged executable.

## Verification

Run `npm test`, `npm run test:app`, and `npm run package` from the project root.
