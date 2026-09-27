# Wildbound 1.0.3 · Equipment preview and wolf packs

Launch **Play Wildbound.cmd** or **dist/1.0.3/Wildbound-win32-x64/Wildbound.exe**.

- Chest decoration now stays between the chest and pelvis and follows wearable fitting. Custom chest art replaces the decoration too, so a second untransformed patch does not remain behind the character.
- Equipped Rig Studio paper-doll slots display item artwork; custom per-facing pixels appear in the slot when selected for that facing.
- The first lion in a House expedition is placed on a clear interior floor, away from players. Subsequent encounters retain their exterior spawn behavior. The first-lion flag is included in expedition snapshots.
- Wolves use an independent, editable and saved canine rig with pointed ears, elongated muzzle, lean legs, a bushy tail and diagonal trot. The alpha is larger with pale neck markings.
- Pack members follow their alpha while approaching, share a player target, flank and take turns committing to telegraphed bites. A living member takes leadership when the alpha dies. Navigation and bite line-of-sight respect house walls. Traps can interrupt or capture wolves.
- Original synthesized howl, snarl, yelp and whimper assets replace the wolves' generic monster sounds. The alpha howls periodically.

Validation: 229 automated tests passed, including new gear, indoor spawn, wolf model/audio, leadership and bite checks. 118 packaged-app smoke checks passed. An offscreen Electron check rendered the studio and all eight wolf facings and decoded every wolf audio asset. A simulation confirmed packs can approach and damage their target.

Visual check: test-output/gear-wolves.png. The sounds are stylized synthesis, not animal recordings. Pack balance and sound quality remain subject to gameplay preference.
