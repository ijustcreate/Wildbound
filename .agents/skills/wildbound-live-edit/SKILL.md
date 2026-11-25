---
name: wildbound-live-edit
description: Extend or verify Wildbound’s in-game Edit mode for scene placement, ground painting, spawn definitions, and headwear fitting. Use when adapting an existing authoring system to the running game or fixing live editing and save behavior.
---

# Wildbound Live Edit

Read [the proposal](../../../docs/design/LIVE_EDIT_MODE.md) and inspect `src/live-editor.mjs`, the relevant `src/live-edit-*.mjs` adapter, and its runtime caller. The floating inspector uses the live renderer’s camera transform. Keep selection, dragging, and numeric changes on that same path.

Expose stable editor IDs from the native scene records. For procedural content, derive the ID from the source region and generation key. Apply positions to the records that own collision and rendering. Check linked lights, door destinations, spawn anchors, and spatial caches when changing native geometry. Keep a brush stroke or pointer drag undoable as a single operation.

Persist only the sparse authored edits through `LiveEditState`. Use the matching scene key on fresh visits and replay headwear fits by explorer, item, and rendered head facing. Existing shared fits remain a fallback for facings without an override. Keep visual facing previews separate from the actor’s movement and aiming. Keep profile saves, current encounters, and authored template drafts independent. Extend the existing authoring studio when an edit needs the full rig, terrain recipe, or animation tools.

Verify in a muted Electron test profile using the visible Edit button and actual scene pointer input. Check immediate visual and gameplay state, Undo and Redo, Save, and re-entry from a fresh game instance. Include a compact window or split view when changing hit testing or inspector layout. For pixel or rig artwork, follow the [Wildbound art workflow](../wildbound-art/SKILL.md).
