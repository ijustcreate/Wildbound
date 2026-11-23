# Split camera focus and easing

## Changes

- Split panes now aim slightly ahead of each character (up to 28 world pixels, constrained by pane size), so the character sits modestly behind center and more of the forward path stays visible.
- Facing direction is smoothed with shortest-angle interpolation over about 0.29 seconds. Room changes, teleports and reduced-motion preference reset the heading directly.
- Shared-to-split entry keeps the previous shared camera framing while each pane opens. Pane position reveals over the configured 0.62 seconds; zoom blends over about 0.77 seconds. Camera follow is damped during the reveal.
- The camera editor's split reveal range is 0.5–1.1 seconds.
- Split panes no longer draw duplicate minimaps. The regular world minimap or train route map is composited once over the shared split-screen frame.

## Review

Captured six split-entry and turn stages in a muted, isolated Electron session using `test-output/split-camera-motion-preview.cjs`. Electron reported `muted: true` and no renderer console errors. The settled split capture shows one map overlay across both panes. Captures also show a subtle forward lead and eased facing changes. This is a source review only; no test suite or desktop package build was run, and hardware/controller play was not performed.

## Handoff

Modified source: `src/split-screen-motion.mjs`, `src/split-screen-renderer.mjs`, `src/multiplayer-camera.mjs`, `src/camera-editor.mjs`, `src/render.mjs`, and `src/train-world-art.mjs`. No commit or package build was made. Screenshot-only captures are under ignored `test-output/split-camera-motion-preview/`.
