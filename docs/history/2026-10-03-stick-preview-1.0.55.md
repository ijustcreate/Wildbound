# Stick weapon and inventory preview — 1.0.55

Sticks remain stackable crafting material but equip individually as low-damage swords. Both inventory equip and dragging an unsplit stack take one stick. Held rendering uses a wooden branch rather than a metal sword; the original inventory/ground stick icon is retained. Each successful melee attack gives each equipped stick one 5% break roll, regardless of targets hit; misses do not roll. Broken sticks disappear from the hand without touching the remaining pack stack and do not auto-equip replacements. Lobby practice propagates breakage to the selected hero so it is not silently restored. Tooltip explains the risk.

Inventory preview always uses idle animation with a wall-clock time source (including paused/lobby simulation), plus left/right buttons stepping through eight directions. Preview changes do not change world-facing direction.

Focused stick tests pass for stack dragging, sword classification, break threshold, misses, and manual replacement. Real Electron inventory check passes for preview button rotation, selected-slot tooltip separation, rarity colors, and geometry at three heights. Screenshot inspected with equipped stick and both preview buttons. Physical controller behavior and a full-game regression run were not tested. Existing saves and unpushed changes preserved.
