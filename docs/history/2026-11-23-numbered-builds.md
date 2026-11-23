# Sequential Wildbound builds and the combined release

Several desktop packages identified themselves as 1.2.113 while shipping different snapshots. Their timestamped folders and feature-specific shortcuts made it hard to identify the newest executable.

Desktop and browser packagers now reserve the next number from the same sequence. The executable and its packaged app metadata carry the assigned desktop version. The manifest also identifies the source version, Git commit, modification status and preview profile. The standard launcher picks the highest completed normal build for its checkout. The versioned Desktop shortcut pins the exact package it identifies. Night Hunt and Varied Events use the sequence and retain their own launcher behavior.

Version reservations live in the local repository's common Git directory. Linked worktrees reserve numbers together. Failed or interrupted attempts keep their reservation, so a partial package's number cannot be reused. Separate clones use their own local reservations.

The coordinated release brings the completed gameplay work into one source snapshot, including ranged cleanup and pack pursuit, native forest tree variants, rendering and collision optimizations, the Overlook hedge maze and its reward, and native pixel recipes in the Workshop and Studio. Regressions in animated gear, stock gait head alignment and co-op panel position were repaired. The game and default GitHub READMEs link directly to the latest playable browser edition and describe the major game systems.

Publication uses the active game branch `Wildbound_worlds`, the game overview on `main`, and the browser output on `gh-pages`. The desktop executable and browser release each retain their source identity in their build manifests. Previous browser releases and the original edition stay available.
