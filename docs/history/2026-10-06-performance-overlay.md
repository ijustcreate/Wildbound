# Dev-menu performance overlay

Added a session-only **On-screen FPS + diagnostics** toggle and **Reset performance samples** button to the GM field console. Existing Field Kit profiling also drives the overlay. Default off; no save/profile changes. Measurements reuse bounded 240-sample windows; text refreshes twice per second and never intercepts pointer input.

Reports actual frame cadence, frame-time mean/p95/max, frames over 33.34ms, total frame CPU, simulation, world rendering, inventory, per-animation-call cost, saves, scene array counts, canvas backing resolution, JS heap when Chromium exposes it, and recent renderer errors. CPU costs are not GPU timings; animation is nested in world cost, not an additive category. Counters describe allocated scene entries, not culling or draw calls. Tab visibility transitions reset measurements to exclude suspension history.

Verification: three focused profiling/formatting tests pass; fourteen existing field-system tests passed during the same run (an initial new test had an incorrect expected FPS and was corrected). Isolated Electron verifies the actual pause/dev toggle, live samples, input transparency, reset, small-window bounds, and immediate hiding. Generated screenshot/report under ignored `test-output/performance-overlay`; software-rendered QA is not a hardware performance benchmark.

Source-only change; no version bump, new desktop package, commit, push, or web deployment requested for this follow-up. Concurrent artwork and event-board work preserved.
