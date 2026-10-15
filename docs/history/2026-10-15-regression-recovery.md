# Wildbound 1.2.2 — restored inventory, jump and humanoid hand fixes

Trace of the missing fixes found two connected stick-stack failures. Stackable slotted supplies had received equipment sockets, causing inventory capacity and merge logic to treat each stick as a singleton. Quick pickup also auto-equipped stackable slotted items. Socket assignment now applies only to singleton gear, and quick pickup leaves stackable items in the backpack.

Legacy player saves can override the newer quick jump arc: restore re-applies the old impulse of 125 and has no gravity field. Session restore now migrates those legacy defaults to impulse 180 and gravity 720 while preserving other saved/custom values. This retains the roughly matching apex and shortens airtime.

Humanoid hands are larger in the shared renderer across all eight facings and all humanoid rigs. The palm artwork is drawn around the existing hand joint; rig bones, weapon/wand anchors and attachment scales are unchanged. A renderer study covers idle, run, custom appearance and sword/shield equipment.

Focused checks: stick equip/quick-pickup/break behavior, restored legacy jump defaults, all authored humanoid clips/facings, follower control and authored rig immutability. Desktop package identity and launcher verification are recorded with the release.
