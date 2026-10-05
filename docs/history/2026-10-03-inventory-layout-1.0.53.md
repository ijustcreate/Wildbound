# Inventory layout 1.0.53

Kept existing character/item art; did not integrate the rejected generated item atlas.

Fixed the inherited portrait translation that clipped the character. The top section now pairs a full character preview with all eleven equipment slots in anatomical rows. The single backpack displays all 24 slots with tighter spacing, larger original icons, clearer quantities, and quiet empty cells. Active equipment/backpack actions share one stable footer, including mouse-accessible unequip actions. Tooltips use UI-scale-correct coordinates, favor above-bag placement, and do not cover the selected slot in the focused checks.

Verified real Electron screenshots after iterative layout passes. The inventory sizing check passes at 850, 600, and 420 panel heights, checking selection stability, 11/24 slot counts, and tooltip/selected-slot separation. No physical controller test or complete game regression run was performed. Prior unpushed changes were preserved. Desktop remains Electron, not a browser launch; profiles and saves were not changed.
