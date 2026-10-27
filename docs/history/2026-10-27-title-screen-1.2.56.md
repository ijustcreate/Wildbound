# 1.2.56 — title screen, direct joining and a single Studio toolbar

User request: remove the lobby header, Continue, Settings and Worlds buttons; rename Rig studio to Studio; let the room fill the available screen; add a pixel-art title scene and let any keyboard, mouse or controller gesture open Choose your explorer.

## Changes

- A separate 44px toolbar contains only Studio. The heading, readiness caption and footer help are hidden. The canvas fills the entire remaining viewport; the existing camera keeps room stations visible without stretching character art.
- A new project-local pixel illustration shows two explorers around the open Wildbound board, a lion, skeleton warriors and the WILDBOUND logo. The title prompt is real HTML. Artwork and prompt information: docs/art/2026-10-26-title-scene.md.
- Empty parties show the title. Any fresh keyboard key, mouse button, intentional mouse movement or wheel input joins the keyboard/mouse player and opens explorer selection. Studio remains accessible without joining.
- Any controller button, analog trigger or either stick joins its own device. Drift within .35 is ignored. The complete initiating gesture must return to neutral before explorer selection receives another controller action. The first gesture cannot choose/create a character or open Settings.
- Native controller ownership claims remain in place and occur before joining. Additional local players still join through the existing controller flow. Open dialogs block title input; no hidden player is created behind Studio.
- The web snapshot keeps the current-edition save namespace. The original, 1.0.74 and 1.2.55 releases remain preserved. The new latest target is releases/1.2.56/.
- An existing streaming persistence test used ten ticks despite time-budgeted forest generation. Under concurrent test load it occasionally asserted before the region existed. The fixture now waits for the target region to finish, verifies unload and still checks saved harvested state. No world-generation behavior changed.

## Verified source checks

All 1,515 Node tests pass in test-output/lobby-entry-all-tests-final.log. The first full run had one streaming-fixture timing failure; its focused retry passed, and the repaired fixture passed the complete rerun. Nineteen focused landing/lobby/settings tests pass.

Muted isolated Electron entry verification passes 28 checks with zero renderer errors: empty selection, saved explorer selection, keyboard letters/Enter/Space/Shift/arrows, mouse click-through protection, mouse movement/wheel, face/Start/Back/trigger/both sticks, held-gesture suppression, second controller and Studio input isolation. Viewports: 1440×900, 1920×1080, 800×600 and 640×420. Existing Xbox/Switch join/nameplate/storage/dash verification adds 25 passing checks. These are simulated controller inputs, not physical hardware tests.

The new web snapshot syntax-checks 409 runtime files. Browser package verification passes with zero renderer errors against the HTTP-served assembled Pages tree: redirects, save isolation/reload, Workshop, Worlds, real Game/Renderer operation and historical boots. All 428 historical runtime files match. The harness uses Electron offscreen rendering so minimized/occluded test windows cannot suspend the loader before module import. Final package/HTTP/deployment results and exact output paths are recorded in the local generated publication receipt under test-output/.

## Build and handoff

Starting source commit: d8515cc3268058f81646163b40cdd1a937fd3299, Wildbound_worlds, C:/Users/New User/Desktop/Wildbound. The release source is the commit containing this note; the web build identity also records its actual modified-source baseline separately.

Build the current Electron package and verify content, muted executable boot and launcher identity. Desktop shortcut Wildbound Worlds (1.2.56).lnk targets this checkout's Play Wildbound.cmd with no preview arguments, normal save profile. The exact selected executable is printed by Play Wildbound.cmd --check and recorded in wildbound-build.json. Earlier 1.2.55 packages remain intact.

Authored rigs, appearance definitions, player saves and unfinished drafts are preserved. No sound preference or system volume changes. No release upload or character-viewer Site deployment. Pixel title artwork is implemented for review; it is not a replacement for native gameplay character rigs.
