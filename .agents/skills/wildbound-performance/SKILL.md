---
name: wildbound-performance
description: Reproduce and measure performance problems in the Wildbound desktop game, including train scenes, crowded fights, split views, and live editor overhead. Use for frame-time diagnosis and before-and-after verification of runtime optimizations.
---

# Wildbound performance

Check the actual desktop build and renderer state first. Use `node scripts/read-live.cjs` for an active game’s local diagnostics and `src/performance-overlay.mjs` for frame, simulation, render, and actor counts. See [live diagnostics](../../../docs/live-diagnostics.md) for what that snapshot records.

Start from a repeatable case that matches the symptom. Record build, scene and position, player and enemy count, train state, camera views, window size, and shadow settings. Sample both warm frames and the transition that triggers a stall. Compare median, p95, and worst frames while keeping the scene and settings fixed. Separate simulation cost, rendering CPU work, and end-to-end frame times.

Use the repository’s muted Electron profiling entry points, especially `scripts/profile-wild-lands.cjs` for the railway and `scripts/performance-audit-scenes.mjs` for repeatable scene measurements. Inspect the relevant update or draw counters and a CPU profile before selecting an optimization. Compare Edit mode on and off when investigating editor overhead. Report the measured case and hardware or render limits alongside results.
