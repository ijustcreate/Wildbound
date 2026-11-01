# Squirrel tail follow-up — draft

**Status:** Draft for user review; not approved. The original pass changed only Squirrel drawing. A later, separate pass added a squirrel-specific editable rig and bounding clips; see `2026-10-28-squirrel-bounding-motion-pass.md`. Behavior, event and habitat scale remain unchanged.

## Direction

- Reference: Wowhead modelviewer NPC 61081, side Stand at `test-output/modelviewer-references/61081-squirrel-side-idle.png`.
- User correction: the prior tail was still too small. Give the side and diagonal facings a broad, rounded plume about head-to-body height; resolve S/N head-on foreshortening as a curled, behind-the-haunch silhouette rather than a thin horizontal line.
- Keep the existing russet/tan palette, contour weight and native Wildbound pixel size. No surface texture was added.

## Review and verification

- Same-scale BEFORE/AFTER, all eight facings, native-size review, enlarged profile and source reference: `test-output/followup-roster-art/wildlife/squirrel-tail-pass5-reference-before-after.png`.
- Capture details: `test-output/followup-roster-art/wildlife/squirrel-tail-pass5-capture-report.json` (muted Electron; zero renderer errors).
- The original pass validated with 9 tests; the expanded wildlife pack now validates with 11 tests (run again before handoff).

Visual approval remains with the user. Motion review is now available in the separate bounding-motion board.
