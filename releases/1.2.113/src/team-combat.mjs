import {actionFeedback} from './action-feedback.mjs';
import {combatTuning} from './combat-workshop-settings.mjs';
import {recordWeaponCombo, weaponComboCatalog} from './weapon-combo-discovery.mjs';

export function recordTeamFinish(game, setupId, finisher, discovery) {
  if (setupId == null) return false;
  const setup = game.players?.find(player => player.id === setupId);
  if (!setup || setup === finisher || !game.players.includes(finisher) || !Object.hasOwn(weaponComboCatalog, discovery)) return false;

  const players = [setup, finisher];
  const learned = players.map(player => recordWeaponCombo(game, player, discovery, {silent:true,persist:false}));
  const name = weaponComboCatalog[discovery].name;
  if (combatTuning.teamCallouts || learned.includes(true)) {
    players.forEach((player, index) => {
      const role = index === 0 ? 'Setup' : 'Finish';
      actionFeedback(game, player, {key:`combo:${discovery}`, text:`${name} · ${role}`});
    });
  }
  if (learned.includes(true)) {
    game.message?.(`${setup.name || 'Explorer'} and ${finisher.name || 'Explorer'} discovered ${name}.`);
    game.onSound?.('discovery', finisher);
    game.persist?.();
  }
  return true;
}
