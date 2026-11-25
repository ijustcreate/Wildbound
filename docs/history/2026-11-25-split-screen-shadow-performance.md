# Split-screen shadow preparation and frame benchmarks

The world renderer assembles the shadow casters once per split-screen frame. Panes still choose regions from their own camera bounds. Panes that cover the same region reuse its caster list while keeping their own transforms and shadow rendering. The next frame reads current prop and actor state, including moved trees, destroyed objects, opened chests, and jumping actors. The railway uses its own shadow renderer.

Run the benchmark from the checkout root with Node and the project's Electron dependency installed.

```powershell
node scripts/benchmark-gameplay.cjs local --quick
```

The benchmark runs nine fixed cases with two, three, and four separate camera views. The scenarios are a moving Wild Lands train with one driver and other explorers on the ground, a forest monsoon, and 24 enemies distributed around the party. It records mean, p95, and worst frame times, average FPS, and CPU update and draw timings. Transition timings cover setup, first draw, scenario activation with split views, and railway terrain readiness. Each run uses a muted Electron window and an isolated profile.

Use `--cpu` to measure fixed-step CPU update and draw costs in a hidden window. Foreground runs check the window's frame cadence before sampling and leave FPS unavailable when delivery is interrupted or throttled. Set `WILDBOUND_AUDIT_SCENES` to a comma-separated list such as `train-travel-2,heavy-weather-3,crowded-fight-4` for a shorter run. Reports go to `test-output/gameplay-benchmark/<label>/report.json`.

## Verification

The muted CPU matrix completed all nine cases with the expected view counts and zero renderer errors. All three train cases advanced 168 world pixels during their 60 measured steps. The table gives p95 total CPU time per measured update and draw on an Intel Core i7-1365U with Iris Xe graphics. Railway terrain became ready in 1.19–1.60 seconds after the first scenario draw. The renderer ran from source in an isolated profile.

| Scenario | Two views | Three views | Four views |
| --- | ---: | ---: | ---: |
| Train travel | 133.6 ms | 176.2 ms | 142.7 ms |
| Forest monsoon | 125.3 ms | 134.5 ms | 255.8 ms |
| Crowded fight | 372.6 ms | 346.6 ms | 259.0 ms |

The CPU report is `test-output/gameplay-benchmark/matrix/report.json`. The first foreground smoke exercised the cadence probe and sampled the four-view monsoon while diagnostics were also running. Its receipt is `test-output/gameplay-benchmark/foreground-smoke/report.json`.

The complete foreground run used the captured candidate source after a concurrent railway edit interrupted the working-tree run. Each cell shows average FPS and p95 delivered frame time over 60 sampled frames.

| Scenario | Two views | Three views | Four views |
| --- | ---: | ---: | ---: |
| Train travel | 16.30 / 83.4 ms | 10.78 / 183.3 ms | 12.55 / 116.7 ms |
| Forest monsoon | 16.99 / 66.8 ms | 13.05 / 133.3 ms | 9.63 / 133.4 ms |
| Crowded fight | 4.68 / 250.0 ms | 4.23 / 266.6 ms | 3.51 / 316.7 ms |

The foreground report with transition and CPU timings is `test-output/gameplay-benchmark/foreground-matrix-verified/report.json`. The two-view train case also passed again from the current checkout after the railway edit, with a receipt at `test-output/gameplay-benchmark/current-train-recheck/report.json`.

The muted native comparison matched every captured shadow mask, pane transform, and composed canvas pixel across three two-view frames. Moving a tree and lifting an actor each changed the shadows immediately. The verifier is `scripts/verify-split-shadow-prep.cjs`, and its receipt is `test-output/split-shadow-equivalence/report.json`. The focused shadow, lighting, camera, and Live Edit batch passed 45 Node tests. The separate camera rendering, shadow settings, contact shadow, and fern batch passed 18 tests.

## Before and after

Matched source snapshots used the same assets and 1442 × 780 backing canvas. The four-view monsoon and crowded fight each ran for 60 fixed warmup steps and 60 measured steps in muted Electron. Both cases went from four scenery caster scans per measured frame to one. CPU draw p95 moved from 128.5 to 95.1 ms in the monsoon and from 301.1 to 188.2 ms in the crowded fight. Simulation timing also varied between runs, so the scan counts are the direct measure of eliminated work. Receipts are `test-output/gameplay-benchmark/ab-before/report.json` and `test-output/gameplay-benchmark/ab-after/report.json`.

## Build identity

The source runs used the modified `Wildbound_worlds` checkout at `a6cee9bc55ad12ed58df5c3d27b150449f31ef26`. `Play Wildbound.cmd --check` resolved the installed normal-profile launcher to `dist/1.2.176/Wildbound-win32-x64/Wildbound.exe`. The changes in this handoff were tested from source.
