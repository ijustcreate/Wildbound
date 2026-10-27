# Headwear per-view art and cosmetic glasses / 1.2.31

Wildbound_worlds, base commit 1bd5ef027966, modified/uncommitted source.
Normal Electron save profile; existing games/builds and personal saves untouched.

The previous turned-headwear draft was rejected. This pass replaces its active
renderer, not just its palette. All 23 head-slot IDs use resolved-headwear.mjs:
skull-local one-world-pixel drawings, crown top around -10, clear face opening,
five view plans and symmetric opposite views with screen-fixed upper-left light.
Construction polygons union into one silhouette; broad shadow/body/highlight
clusters, one or two signature features, then a mostly dark outer contour.
Thin circlets/horns/halos selectively break the lit contour so they retain color.
Rear helmets close the neck guard and omit visor slits. Open cowls leave the
underlying eyes untouched. Pumpkin, skull cowl, turtle shell, spectral cowl,
horns and living crown remain distinct silhouettes. Native pixel capture and
per-facing custom wearable pixels/transforms remain authoritative. This is a
testable art revision, not a claim of user aesthetic approval.

Face details now includes Glasses alongside freckles/scar. Both creation UIs
derive their options from FACE_STYLES. Glasses use the existing appearance.face
save field, not a gear slot or stat item. face-accessories.mjs draws open frames
at editable eye joints after helmet/custom-headgear/spectral-eye drawing, inside
the existing head rotation/scale. Rear views hide lenses; rear diagonals show
only the near temple. Skin marks keep their existing below-headgear ordering.

Verification: headwear-glasses.test.mjs covers all head IDs/views, pivot stability,
palette visibility, saved appearance and post-helmet glasses ordering. Isolated
muted Electron checks creation selection and 184 editable head captures, plus
assembled eight-view glasses/helmet sheets. review-headwear-capes.cjs covers
5,696 assembled renders and movement/jump/attack/death samples. Creator UI checks
now exercise the nine-option face carousel and actual glasses selection.

No commit/push requested. Preserve unrelated pre-existing house revision test
failures separately; no physical-controller or hardware-performance claims.
