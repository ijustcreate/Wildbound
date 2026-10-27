# Native player and wardrobe pass — 1.2.26

The player project loader now explicitly migrates the recognized shipping
humanoid to Captain-derived body proportions and native pixel volumes. Player
joint names, visibility, appearance, equipment slots, render-order IDs and
sprite editor capture remain supported. Generic rig imports still preserve
legacy clips, and enemy variants do not inherit the player migration.

The base locomotion and reaction actions use Captain keys retargeted by segment
direction and target bone length. Missing player actions remain editable keys
on the new base. Original joints and edited clips are retained in
nativeHumanoidSource for recovery/export. Custom rest geometry opts out of
automatic conversion. The player has 42 actions; Captain and April gain the
missing player actions without replacing their existing clips. Captain's
completed library has 63 actions, including ranged/cast, harvesting, pickup,
carry, salvage, hover, scythe actions, sleeping and revival.

Native limbs, torso, shoulder coverage and hips replace screen-space capsules.
Local part caches are bounded to 384 entries and include geometry, orientation,
view and palette. Native part images still participate in the sprite capture
system. Editor scale/shear now records clip-specific IK exclusions so authored
length changes survive redraw/undo instead of being snapped back.

Wardrobe work covers all 176 slotted definitions through the shared material
ramps and fitted renderer. Gloves now turn in profile/rear and follow forearms;
shoulder pieces have rear fastenings. Ranger hood uses hood art; cloth hoods
have a rounded crown, continuous cheek/collar rim and closed rear. Santa hat,
Friendship wand and Sword of a Thousand Truths have explicit visual families.
The net is painted from its grip and swings using the melee motion vector;
boomerangs have fitted directional silhouettes. April's blade has its own icon.
The item editor includes the back slot and identifies the new base contract.

QA: scripts/review-native-wardrobe.cjs runs isolated muted Electron, renders
every slotted item in eight directions across seven actions, and exports
11 slot contact sheets with native/enlarged views and a JSON report under
test-output/native-wardrobe. One complete sweep is 9,856 renders. Visual review
of those sheets is separate from machine checks; shared procedural improvements
do not constitute 176 individually repainted bespoke assets.

Creator and inventory Electron UI verification passed across large/small
viewports. Migration tests verify fixed bone lengths, action completeness,
idempotence and preserved original data. No saves are migrated or cleared.
Older packaged executables can remain open during the new build's creation.
