# Character direction / cute skeletons / 1.2.28

Source checkout Wildbound_worlds, base commit 1bd5ef027966, modified source.
Normal Electron profile; existing running builds and user saves left untouched.

The first new hair/cap study and tall skeleton skulls were explicitly rejected.
The user then supplied a large-headed, compact pixel skeleton. Revision 2 now
uses a 68%-height, 78%-breadth humanoid body with larger face attachment offsets
and oversized rounded skull artwork. It retains the Captain-compatible hierarchy,
retargeted editable clips, gear sockets and custom source provenance. Exact prior
default geometry migrates; edited rest rigs are not replaced. Krampus remains a
distinct demon, not converted into a small bone skeleton. Helmet/circlet art fits
the larger head; custom per-view offsets/pixels retain precedence.

Other work in this pass:

- Native shared hair recipe grammar, four colors, separate front/rear layers,
  nineteen existing IDs and independent facial hair/color; construction controls
  in Appearance/Studio/Field Kit. See docs/CHARACTER_ART_DIRECTION.md.
- Smaller warm-plane noses, broad fringe shapes, connected native body contours.
  Study palette changes do not recolor saved characters.
- Circular controller aim dead zone preserves small angles near cardinal axes.
  Firing remains immediate. Arrow trails record actual position and height, fade
  after impact and stay bounded.
- Nearby dynamic light sources tint assembled humanoids and gear with directional
  alpha-clipped color, outside animation caches. No normal maps or wall occlusion;
  hardware FPS and physical-controller feel have not been measured.

Verification:

- Full suite earlier in pass: 1,358/1,363 passed. Three newly exposed hair/pendant
  failures subsequently fixed and focused rerun passed (35/35). Remaining two are
  pre-existing house layout tests expecting revision 2, actual revision 3.
- After compact skeleton change: 42/42 focused humanoid/appearance/creature/winter
  checks passed. Eight-view actual Electron hair/facial-hair/skeleton sheets and
  lighting sample generated in test-output/character-direction.
- Actual Electron creator (19 hair / 8 face choices, three viewport sizes), Studio
  transform/undo/color/IK/sprite capture and inventory sizes passed.
- Wardrobe renderer: 176 items × eight directions × seven states = 9,856 renders,
  no errors. This checks coverage and fit, not bespoke artistic approval of every
  item. User taste remains the acceptance criterion; do not call rejected studies
  approved. The later skull revision does not change player wardrobe geometry.
- 1.2.27 package was verified and shortcut created before the user's compact-skull
  correction. 1.2.28 supersedes that test build. No Git commit/push requested.
