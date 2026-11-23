# Ready panel controller icons — November 17, 2026

Replaced the ready panel's small four-button clusters with single large A/B badges: green/red Xbox buttons and neutral Nintendo buttons, with dark lettering, a light rim and a dark raised edge. Both primary actions and the inline help use the same synchronous canvas artwork. Other controller diagrams remain available in Controls. Removed redundant separator dots beside the action badges.

The panel detects the connected pad family for styling; A confirms and B returns on both layouts, matching existing controller behavior. Fixed the existing undefined `pad` reference in mixed keyboard/controller accessibility labels and replaced physical-position labels with A/B names.

Validation: 10 focused lobby Node tests pass. Muted Electron with an isolated temporary profile passes five rendered configurations: Xbox, Switch, keyboard, mixed keyboard/pad and 480×600. Checks cover drawn badges, accessible labels and prompt containment; no renderer errors. Visual captures and report: `test-output/ready-icons/`. Hardware controllers were not tested.

Source: `Wildbound_worlds`, `f0b787ff33c3ac8f3675b48504937ebda4f0dcb5` plus modified source. No commit/push or packaged rebuild in this task; existing packaged desktop build does not yet include this change. Saves, authored artwork and unrelated local work preserved.
