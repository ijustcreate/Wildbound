# TV interaction and map-table input follow-up

Real checkout: Desktop/Wildbound Server Branch Build, Wildbound_worlds,
modified source on 1bd5ef027966; retains version 1.2.35 and preceding updates.

TV snapping cause: tvA (bottom-face jump) also auto-joined the TV anywhere in
its old radial interaction range. Joining then deliberately seated the player
at a controller. Removed jump-to-join. Prompt, nearest-object selection and
direct open now require grounded feet in front beside a controller; airborne,
hovering, on-cabinet and behind-TV access is rejected. Jump+Interact cannot join.
Restored cabinet aspect ratio using uniform 0.8 scale and a 16:9 screen; solid
footprint follows its narrower width and the existing jumpable height stays 64.

Map selections (including Wildbound mode and Boundless toggle) now refresh
checks without closing the panel. Right face/B/Circle or the explicit Close
button closes it. A release latch consumes panel button holds after closing so
selection/back cannot become a world jump; interaction suppression no longer
gets overwritten by the station-press input path.

Muted isolated Electron verify-lobby-menu-tv.cjs exercised map choices, refreshed
selection, controller right-face close, explicit Close, held-jump suppression,
uniform TV rendering, jump/no-seat-snap and front-only deliberate interaction.
verify-lobby-geometry.cjs checked continuous jump clearance (peak 109.83,
maximum movement step 1.275, no teleport) and all four floor edges.
Unit regressions cover the same ownership/release and front-only gate.
No claim of physical-controller hardware testing. No personal saves, drafts,
authored rigs or controller mappings changed. No commit/push requested.

Published with the combined 1.2.36 release; see
[combined release](2026-10-18-combined-1.2.36.md) for final package identity,
full-suite and packaged-runtime results. Earlier build logs are historical.
