# Wildbound 1.0.5 · Humanoid combat, jumping and temple tigers

- Dual wands launch each spell at its own visible tip, using the current hand pose, facing, build, item fit and hand rotation. Custom wand pixels use their topmost tip. The spell's existing render height is accounted for and new fireball trails grow from the muzzle.
- Default melee chain: swipe one, swipe two, broad finishing swipe. Default unarmed chain: left, right, left, right, uppercut. Finishers have increased damage/reach; the sword finisher covers a wider arc. Quick attack presses can buffer the next strike during recovery. A pause of 0.8 seconds after recovery restarts a sequence.
- **Rig studio → Combos** supports adding/removing combos, enabling one per attack type, adding/removing/reordering steps, editing animation, damage, reach, arc and duration, previewing eight facings, and saving locally. Removing all combos restores basic single strikes. Poses remain editable in the humanoid rig's clip selector.
- Humanoid clips now include walk, melee variations, left/right punches, uppercut, cast, jump takeoff/air/fall, landing, swimming, interaction, revive, get-up and death, alongside existing idle/run/block/dash/hurt/bow animations. Older edited rigs gain missing clips without replacing existing edits.
- Jump with **J** on keyboard or **B** on a standard controller. Jump is remappable in Settings and separate from dodge. It has a cooldown, airborne height and landing state; it does not bypass walls. Enemy **Creature → behaviors → jump** is an editable ability. Monkeys, lions and tigers default on; skeletons default off. Disabled species can be explicitly enabled in the editor.
- The shared lion rig now renders a mane-free orange tiger skin with cream muzzle and dark body, face, leg and tail stripes. Choose **Tiger / lion rig** to inspect it. Jungle Temple has a tiger encounter and its opening roll summons tigers.

Use the new desktop shortcut or **Play Wildbound.cmd** to launch 1.0.5. An already running older version must be closed before it can be cleaned up.

Validation: 242 unit tests and 118 packaged-app smoke checks passed. The combo editor and eight-facing wand/tiger visuals were checked in Electron. Desktop shortcut: Wildbound 1.0.5.lnk. Old build cleanup was blocked by automatic approval policy; no old versions were deleted. Version 1.0.2 was also detected running.

