# Breakable terracotta pot

The previous pot filled almost as much of the yard view as the explorer and its opening read as a flat slit. The new compact silhouette shows an oval terracotta rim, a dark recessed mouth and a rounded body that tapers into the ground shadow. One broad lit plane and one darker side fold follow the nearby wooden and clay props. The smashed form uses the same clay ramp with a curled rim fragment and two body shards.

The integer-pixel artwork lives in [playground-art.mjs](../../src/playground-art.mjs). The intact pot has a 24 × 26 logical silhouette and rests at the existing world anchor. The existing pot footprint supplies collision and jump support.

The [before-and-after capture](../../test-output/playground-pot-art/comparison.png) pairs the same real seed-42 House & Yard placement and camera with native and enlarged artwork views. The muted source Electron check rendered the generated intact and broken pot in the depth queue. An ordinary sword strike broke it and session restore kept the broken state. The focused playground suite passed 12 tests.
