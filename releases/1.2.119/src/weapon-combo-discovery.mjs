import {actionFeedback} from './action-feedback.mjs';

export const weaponComboCatalog = Object.freeze({
  fire_arrows: {
    name: 'Flame Arrow', icon: 'arrow',
    hint: 'Watch what happens when an arrow crosses a source of heat.',
    how: 'Shoot an arrow through a lit campfire. The lit arrow can set its target alight.',
  },
  ice_shatter: {
    name: 'Ice Shatter', icon: 'ice_wand',
    hint: 'Ice can make a tough enemy brittle.',
    how: 'Charge an ice spell to freeze a foe, then land a heavy melee hit to burst its ice into nearby enemies.',
  },
  body_collision: {
    name: 'Enemy Bowling', icon: 'sword',
    hint: 'Look for enemies standing in a line.',
    how: 'Hit an enemy with a heavy strike so it crashes into another enemy.',
  },
  wall_slam: {
    name: 'Wall Slam', icon: 'barricade',
    hint: 'A solid obstacle changes how a fight plays out.',
    how: 'Knock an enemy into a solid obstacle with a heavy strike.',
  },
  trap_bowling: {
    name: 'Trap Bowling', icon: 'trap',
    hint: 'Try setting up an ambush along your line of attack.',
    how: 'Set a trap, then drive an enemy into it with a heavy strike.',
  },
  chain_reaction: {
    name: 'Chain Reaction', icon: 'iron_sword',
    hint: 'A tight cluster gives you more than one target.',
    how: 'Bowl an enemy into a second enemy and send that one into a third.',
  },
  fire_bowling: {
    name: 'Fire Bowling', icon: 'fire_wand',
    hint: 'Think about what two enemies might pass on when they collide.',
    how: 'Knock a burning enemy into another enemy to spread the fire.',
  },
  return_flank: {
    name: 'Return Flank', icon: 'starter_boomerang',
    hint: 'A returning weapon can reach where a shield cannot.',
    how: 'Throw past a shield, change position, and bring the boomerang back through the guard’s rear.',
  },
  counterattack: {
    name: 'Rush Counter', icon: 'shield',
    hint: 'An enemy that has just committed to a rush needs time to recover.',
    how: 'Time your block or dodge to open a rush counter, then land a heavy melee hit before the opening closes.',
  },
  thermal_shock: {
    name: 'Thermal Shock', icon: 'fire_wand',
    hint: 'Sudden heat can break a brittle target.',
    how: 'Hit an iced enemy with a fire spell or flaming arrow before it thaws. The heat breaks the ice and staggers ordinary enemies.',
  },
  team_elements: {
    name: 'Elemental Assist', icon: 'ice_wand',
    hint: 'A partner can finish what your frost started.',
    how: 'Freeze an enemy, then have a different explorer shatter the ice with heavy melee or break it with fire.',
  },
  team_guard: {
    name: 'Guard and Strike', icon: 'shield',
    hint: 'A shield can create an opening for someone else.',
    how: 'Catch a rush with a timed shield block. Have a teammate land the heavy counter while the enemy is open.',
  },
  team_trap: {
    name: 'Trap Assist', icon: 'trap',
    hint: 'A teammate’s trap makes a good destination.',
    how: 'Set a capture or interrupt trap and have a different explorer launch an enemy into it.',
  },
});

export function knownWeaponCombos(...players) {
  const found = new Set();
  for (const player of players) {
    const discoveries = player?.field?.weaponCombos;
    if (!Array.isArray(discoveries)) continue;
    for (const id of discoveries) {
      if (typeof id === 'string' && Object.hasOwn(weaponComboCatalog, id)) found.add(id);
    }
  }
  return [...found];
}

export function recordWeaponCombo(game, player, id, {silent=false, persist=true}={}) {
  if (!player || !game.players?.includes(player) || typeof id !== 'string' || !Object.hasOwn(weaponComboCatalog, id)) return false;
  const known = knownWeaponCombos(player);
  if (known.includes(id)) return false;

  player.field ??= {};
  player.field.weaponCombos = [...known, id];
  if (!silent) {
    const {name} = weaponComboCatalog[id];
    actionFeedback(game, player, {key: `combo:${id}`, text: `Discovered · ${name}`});
    game.message?.(`${player.name || 'Explorer'} discovered ${name}. Find it in Field Kit → Combos.`);
    game.onSound?.('discovery', player);
  }
  if (persist) game.persist?.();
  return true;
}
