# Browser playtest feedback

The web game opens **Feedback** from the navigation bar and **Send feedback** from pause settings. Visitors can send a bug report or general feedback without an account. The form sends the selected type, report text, game version, screen and a randomly generated retry ID. A failed submission keeps the typed message. Desktop builds omit the feedback button because their HTML has no web endpoint configuration.

The separate Wildbound Playtest Feedback Site owns the private `playtest_reports` table in its `DB` binding. Read reports through the feedback site's database panel. The public worker accepts submissions from the official game origin and has no public report-reading route. Its source and append-only schema are in `services/playtest-feedback/`. The character viewer keeps its existing access policy and separate database.

The hosted preflight and anonymous write passed. Submitting the same test report ID twice produced one row. Local HTTP fixture tests cover browser submission, retry, controller keyboard and close behavior. The emitted `web-build.json` identifies the exact release source and version.

The same web update restores the Wild Lands salvage hold and places train and ship salvage materials directly in the backpack when a deck pickup cannot follow the vehicle. Nearby peaceful Alley pedestrians flee from any Death Eater mask. Fixed shopkeepers give a warning from their counter. Scheduled Fortescue customers go through the door, buy a cone at the counter and carry it around the district. The release snapshot contains these changes without the concurrent map and inventory drafts.
