# Wildbound 1.0.2 · House saving

- **Save & use in game** saves the visible layout, makes it active, and updates a running House expedition. **Use this version** now also saves current edits rather than silently using the previous saved copy.
- Continuing a saved House expedition checks for a changed active design and applies it. An unchanged design preserves runtime door states.
- Unfinished drafts recover when reopening the builder or app. The toolbar distinguishes a recovered draft from the active layout. Invalid layouts remain recoverable but cannot replace the active house; the validation error stays visible.
- House versions and drafts are written to `house-designs-v1.json` in the app's stable user-data directory, using atomic writes and a backup. Existing browser-stored layouts are preserved.
- Live application preserves characters, inventory and expedition progress. Actors covered by new geometry are moved to nearby clear space. Architecture, terrain and scenery refresh together.
- The current map must be House & Yard for live application. Other environments are unaffected. Network clients save their local design; the host controls the shared map.

Use: open House Builder, edit, then choose **Save & use in game**. The confirmation states whether the current expedition was updated or the design is ready for the next House expedition.

All 1.0.1 features remain included. Saved characters are preserved.
