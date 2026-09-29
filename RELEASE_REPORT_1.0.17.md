# Wildbound 1.0.17

## Forest

Oak, birch and pine trees are assembled procedurally from trunk, branches and
foliage. Seeded height, width, lean, branching and leaf clusters provide variation
without separate full-tree sprite sheets. Summer, autumn and winter reuse the
same structure. Deciduous trees lose foliage in winter; evergreens retain snowy
foliage. Stumps retain the original root position and scale when trees fall.

Trees have ground shadows and sparse falling leaves. Ground litter scatters as
players walk through it; pass-through bushes rustle and settle. Natural forest
water gains shoreline reeds and lily pads, while house pools are explicitly
tagged and excluded. Cosmetic litter motion resets when loading a session.

Use **Editor → Forest** for season previews and per-species evergreen/deciduous
settings; Save retains these settings on this device. Auto uses winter on ice
maps and summer elsewhere. House Builder selected trees also offer individual
species and leaf-habit overrides. These are seasonal appearance controls, not
a simulation of a yearly calendar.

## Capes

The collar follows both animated shoulder joints, including unequal shoulder
heights. Cloth motion starts immediately below the pins and continues down the
cape. Custom painted rigid attachments retain their existing behavior.

## Verification

359 automated tests pass. Electron checks cover forest controls, live game
rendering, 27 tree/season variations, cape silhouettes and the rig editor.
