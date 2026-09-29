# Wildbound 1.0.8

This build follows 1.0.7 with player equipment and sprite-rendering improvements.

## Included

- Correct front/rear arm layering around the player body.
- More readable gloves with cuffs, palms, finger highlights and directional thumb shapes.
- Better boot ankle, sole and toe alignment during idle and running animations.
- 2× nearest-neighbor backing resolution for the main world renderer; world scale and pixel-art geometry remain unchanged.
- Regression tests for gloves and boots.

## Build and shortcut

- Desktop package: `dist/1.0.8/Wildbound-win32-x64`
- Create the matching Windows shortcut with `powershell -ExecutionPolicy Bypass -File scripts/create-desktop-shortcut.ps1`.

The shortcut script reads the version from `package.json`, so it creates `Wildbound Latest (1.0.8).lnk` and targets the matching packaged executable.

## Verification

- 332 automated tests passed.
- Character study rendered from the shared runtime renderer.
