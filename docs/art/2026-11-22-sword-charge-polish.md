# Charged sword visual brief — November 22, 2026

Status: implemented draft reviewed in the native renderer; user aesthetic approval pending. This is one coherent sword effect, not a replacement character/gear catalog.

Primary direction: the user's held-out sword sketch from the original request, with the blade extending behind a side-facing hero. Keep the existing Wildbound body, facial identity, clothing, sword shape and articulated rig. Use chunky native pixel clusters and the established palette grouping; no photoreal texture, blur, screen-filling flashes or baked character frames.

The visual hierarchy is blade first, reachable lane second, transient ground wake third. Early charge uses tempered bronze (`#d5ad72`), gathering energy moves toward pale teal (`#86d7d6`), and full charge resolves to restrained sun gold (`#f6d888`) with ivory cores (`#fff8d7`). A dark teal exterior keyline (`#173b40`) preserves the lane against grass and pale sand. The landing seal is a compact blade/guard shape; an amber cross indicates a blocked endpoint. Sparse distance marks stay fixed in world units as reach grows.

The player compresses into a grounded, rest-relative coil; support feet do not slide. The sword, traveling bands, tip star and swipe ribbon all use the same hand/tip vectors in eight directions. Release blends into the existing editable heavy swipe, then settles through braking/recovery. Custom painted wearables retain their per-view attachment transforms. No authored rig/clip/palette data is replaced.

The ready cue happens once per held attack. The release snap, floor dust, tapered afterimages, directional impact ejecta, brake and cancellation residue have finite lives. Ground marks draw beneath actors; contact sparks draw above them. A charged hit pauses the attacker once per strike, avoiding repeated crowd stalls. All effect budgets and afterimage histories are bounded.

Review corrections: the first ground-wake study produced repeated solid arrowheads; replace those with restrained longitudinal streaks and a few outward drifting dust chips. The eight-view QA sheet initially reused one actor's cached presentation; use distinct fixture IDs and clear locomotion overrides to inspect actual turning geometry. These are recorded separately from technical check counts.

Native source review artifacts: `test-output/sword-polish/source/phase-review.png`, `eight-directions.png`, `contrast-review.png`, `world-full-charge.png`, `world-dash.png`, `world-contact.png`, `world-blocked.png`, and the two-player wide/narrow images. Authored rig SHA-256 remains `9a2c55d1090231ce5ec11cf06091224a9efb1b62a0c1bb0b3eb312a0cdad0be1`.


## User follow-up: simplify the ground visual

The user prefers a much quieter footprint. Current direction supersedes the decorative ground lane above: one faint rectangular fill, one thin outlined edge and a simple end cap. Remove inner rails, ticks, moving diamonds, endpoint symbols, foot runes/motes and the separate full-charge floor flourish. Let blade light and the stopping edge communicate readiness. Preserve obstacle clipping, footprint dimensions and floor registration.
