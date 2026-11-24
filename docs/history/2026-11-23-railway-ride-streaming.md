# Wild Lands train simulation and foreground streaming

Station cats previously planned routes for all eight stations while the train moved through the Wild Lands. The local fallback could rebuild a path in one update. Track queries ranked every route box each time they checked a segment. A V8 profile of a four-rider trip traced the longest update stalls to those cat path searches.

Cats now plan near the party and split local searches over several updates. Track lookup tests nearby boxes without repeatedly sorting allocations and retains stable edge order at intersections. Carriage walking skips collision checks on unmoving axes and checks furniture without creating a second array. Door, gangway, bridge, dash, and station collision remain covered by the existing gameplay tests.

The terrain worker prepares player collision, the floors under the active party and camera center, then visible scenery and surrounding detail. It picks the next job after the view publishes its whole plan. It also abandons obsolete room requests, predicts inward zoom from a signed width change, and charges both image bitmaps and typed geometry against the same 128 MiB decoded asset budget.

## Muted desktop measurements

The 1.2.123 package and the candidate source used the same four-rider trip, 192 px/s top speed, 422 scenery objects, and 600 measured updates per worker mode. First floor and visible region times start when the party's collision is ready. Update figures measure CPU simulation and the streaming timings measure worker delivery. Display frame rates and physical controller behavior require separate checks.

| Measurement | 1.2.123 | Candidate |
| --- | ---: | ---: |
| First visible floor tile | 4,072.5 ms | 155.4 ms |
| All visible scenery regions | 654.4 ms | 399.0 ms |
| Train update p95 with worker | 2.3 ms | 2.2 ms |
| Train update p95 in local fallback | 24.7 ms | 2.2 ms |
| Train update p99 in local fallback | 69.9 ms | 2.8 ms |
| Local fallback updates above 16.67 ms | 32 | 0 |

Fifty railway tests passed. The muted isolated Electron benchmark is `scripts/measure-railway-update.cjs`. Reports are `test-output/railway-update/baseline-1.2.123/report.json` and `test-output/railway-update/candidate-source/report.json`.
