# Wildbound 1.0.16

- Enemy corpses lie horizontally on their receiving surface without arbitrary screen rotation. Settled death poses are used when available, with airborne and movement offsets cleared. Existing fade timing is retained.
- Blue elemental projectiles are icy shards with cold trails, never fire patches or burning. Existing saved water-tagged projectiles also receive the fix. Fire elementals retain fire behavior.
- Embedded arrow tips stay at ground level; shafts lean upward with fletching above the grass and a small shadow at the entry point. Collection behavior is unchanged.

Verified with 354 passing automated tests and an Electron-rendered contact sheet covering six corpse types and eight embedded-arrow directions.
