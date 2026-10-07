# Healing wand and halo — source implementation

Base HEAD: `edc664ea35a4c75710570680dca26c6e1387f658`, branch `main`. The shared checkout already contained extensive user/agent changes. No commit, push, packaging, version change, authored-rig edit or personal-save edit was performed.

## Behavior and balance

- `healing_wand` is common hand gear (either hand), costs 12 mana, and heals 24 HP per hit, increasing linearly to 36 HP at 1.2 seconds of charge. Uses the normal animated wand tip, 260-unit/sec speed, 280–560-unit charge-dependent range, 6–14-pixel size, wall collision and bounded square-particle trail. Color is `#9cddff`. Damage and offensive equipment/combo bonuses do not contribute to healing.
- `halo` is rare head gear with one trinket socket. Adds 25% outgoing and 25% incoming spell healing; these multiply, so an uncharged wand between two halo wearers heals 37.5 HP and a full charge heals 56.25 HP. Outgoing strength is captured when casting; incoming strength follows target equipment at each heal. Existing lunar self-cast healing also uses the healing helper.
- Casting the healing wand while wearing a halo adds one independent HoT stack on a valid hit, including a hit on a full-health living ally. Each stack heals 4 base HP once per second for three ticks. Caster halo makes that 5 HP per tick; recipient halo makes it 6.25 HP. Three stacks maximum across casters. Further hits at the cap never replace, delay or extend existing schedules. Removing gear after casting does not remove previously granted stacks.
- Healing affects living co-op players, friendly followers, hunter/ritual pets and owned summoned companions. Hostile/neutral creatures, wild ritual tigers, practice targets, defeated/downed/dead actors and charmed heroes cannot receive it. Projectiles pass through enemies without damage, healing, aggro, kill attribution or status effects. In PvP, other players and their pets are opponents; own pets and unowned friendly NPCs remain eligible. The caster is not a projectile target.
- Only effective HP restored appears as a green floating number (`#75ef93`); fractional values retain hundredths. Full overheal produces neither a healing number nor rising particles. Light-blue square particles rise above healed heads. Effects use the existing renderer and snapshot path.
- Mana discounts and normal regeneration apply. No ammunition or consumable is used. Dead, charmed, UI/room-bound and exhausted casters cannot release a healing bolt. Missing/dead casters or changed allegiance clear their pending HoT stacks.
- Room-bound heroes use `createRoomHealingBolt` below; the ordinary world casting entry point still rejects room origins. Room healing uses recipient `roomX`/`roomY`; numbers, rising particles and impact bursts carry `fx.room`. Projectiles and HoT retain their originating room, so crossing a portal cannot transfer an outside spell into an interior.

## Integration and ownership

`src/healing-magic.mjs` composes `fireSpell` and `tickAdventure` through a small hook at the end of `src/core.mjs`. The ordinary damage loop never receives healing bolts. Between steps the bolts remain in the existing `spells` array for native rendering, session restoration and host-authoritative multiplayer snapshots. A save during the ordinary step includes `healingBoltsInStep`, recovered and removed on the next step. HoT timers are stored on target actors, preserving partial elapsed time and remaining ticks through expedition save/reload. Character profiles preserve new gear IDs and sockets; transient combat stacks are expedition state.

The new item definitions are appended after existing definitions, preserving existing IDs/catalog order; ordinary loot and developer equipment catalogs discover them automatically. No starter or event indices changed. Honeycomb artwork was added in `src/item-art.mjs` at the parent's request: six amber pixel hex cells, cream wax rims and a honey drip. Its definition and consumption mechanics belong to the parent.

Exact source/doc/test paths changed by this work:

- `src/healing-magic.mjs`
- `src/core.mjs` (import and method-composition hook only)
- `src/items.mjs` (appended wand/halo definitions and stat labels only)
- `src/magic-bolt-effects.mjs` (rising healing particles)
- `src/gear-art.mjs` (halo inventory icon)
- `src/wearable-art.mjs` (floating halo in eight directions)
- `src/item-art.mjs` (honeycomb icon only)
- `tests/healing-magic.test.mjs`
- `scripts/verify-healing.cjs`
- `docs/history/2026-10-06-healing-magic.md`

## Verification

- Initial focused Node run: 90 tests passed, zero failed, including 20 new healing tests plus spell economy/visuals, combat, equipment, ranger and ritual-pet regressions. After extending the room API: 87 focused regression tests passed, including 26 healing tests. Final healing/well run: 27 tests passed, zero failed, including the parent's actual well collision pipeline.
- Final native Electron 41.10.7: `scripts/verify-healing.cjs`, 32 checks, zero failures and no renderer errors. Covers real world and well projectile collision/healing, halos, effective numbers, HoT, session restoration, dead pet safety, PvP and synthetic network input-owner routing. Native art sheet, live Renderer world screenshot and parent well room rendering were visually inspected.
- Installed `node_modules/electron` lacked its binary. QA used the existing cached 41.10.7 archive extracted into ignored `test-output/healing-electron-runtime`, with a unique isolated `test-output/healing-profile-*` profile. Dependencies and running user games were not changed.
- Reports/art: `test-output/healing-qa.json`, `test-output/healing-sheet.png`, `test-output/healing-world.png`, `test-output/healing-room.png`; full Node log: `test-output/healing-full-suite.log`.
- This is source QA, not a packaged-build update, physical-controller playtest or a two-machine network playtest. Network coverage exercises the real host input/snapshot path with a synthetic remote owner.

Full Node suite before the room API extension: **939 passed, zero failed**, `test-output/healing-full-suite.log` (160.06 seconds). The final room extension has the focused/native checks above; the full suite was not repeated after it.

## Old-well integration exports (parent owns the well and renderer hooks)

```js
import {
  createRoomHealingBolt, spellHealingTargets, spellHealingPoint,
  hitHealingBolt, tickSpellHealing,
} from './healing-magic.mjs';
import {drawMagicBolt} from './magic-bolt-render.mjs';
import {finishMagicBolt, drawMagicBurst} from './magic-bolt-effects.mjs';

// Branch before the well's offensive wand/melee path, and return even if mana
// is exhausted. A healing wand must never fall through to offensive attacks.
if (ITEMS[p.equipment[slot]]?.healing) {
  const bolt = createRoomHealingBolt(g, p, charge, slot, {
    origin: {x:p.roomX, y:p.roomY}, aim:{x:aimX, y:aimY},
  });
  if (bolt) s.bolts.push(bolt);
  return;
}

// Room code advances healing bolts using tunnel collision, life/remaining and
// swept steps, and branches before checking its s.enemies damage candidates.
// spellHealingTargets already excludes other rooms, opponents and dead actors.
const candidates = spellHealingTargets(g, bolt);
const target = candidates.find(a => /* room swept collision/LOS */
  Math.hypot(spellHealingPoint(a).x-bolt.x,
             spellHealingPoint(a).y-bolt.y) < 16+(bolt.size||6)/2);
if (target && hitHealingBolt(g, bolt, target)) {
  bolt.life=0; finishMagicBolt(g, bolt, true);
}
// Use drawMagicBolt(c, bolt) for the usual light-blue pixel projectile.
// Draw g.effects where fx.room===portal.id in room-local canvas coordinates;
// drawMagicBurst handles healingRise as well as ordinary impact chips.
// The world renderer must skip room-tagged effects: if (fx.room) continue;
```

`createRoomHealingBolt(g,p,charge=0,slot='hand1',options={})` returns a paid bolt or `null`. Default origin is `p.roomX/p.roomY`; default direction is player facing. Optional `origin` and `aim` are `{x,y}` objects; invalid/zero aim fails without spending mana. It returns the bolt for the parent's room array, without adding it to world `g.spells`. It calls no world LOS, collision, auto-aim or animated-tip helper. Other helpers support same-room players and registered spirit companions; room enemies in `portal.well.enemies` remain ineligible.

`tickSpellHealing(g,dt)` is already called once per frame by the composed core adventure hook, including for room targets. **Do not add a second call from the well update.** The parent may instead relocate that single global hook deliberately if coordinating other room systems. World `src/render.mjs` and `src/old-well.mjs` were not edited by this work; their room filtering/attack/collision/rendering integration remains with the parent as requested.

Read-only integration review confirmed the parent has added `fx.room` filtering to the world renderer, `drawRoomSpellEffects`, native well projectile drawing and a healing-only branch in its swept collision pipeline. The final Node/native checks exercise those parent changes. At review time `attackInWell` selected only `hand1` and passed charge `0`; the parent still needs to pass the selected healing slot and accumulated charge for full offhand/charged input support. The exposed creator already supports both hands and all charge strengths. No core methods are being replaced wholesale; this work only added its import and the final prototype-composition hook.
