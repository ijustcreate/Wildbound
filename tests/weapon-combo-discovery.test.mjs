import test from 'node:test';
import assert from 'node:assert/strict';
import {Game} from '../src/core.mjs';
import {Profiles} from '../src/profiles.mjs';
import {saveSession, restoreSession} from '../src/session.mjs';
import {playerFeedback} from '../src/action-feedback.mjs';
import {knownWeaponCombos, recordWeaponCombo} from '../src/weapon-combo-discovery.mjs';

test('a weapon combo is announced and saved once for the explorer who discovered it', () => {
  const player = {id: 1, name: 'Rowan'}, partner = {id: 2, name: 'Moss'};
  const messages = [], sounds = [];
  let saves = 0;
  const game = {time: 4, players: [player, partner], persist: () => saves++,
    message: text => messages.push(text), onSound: (...args) => sounds.push(args)};

  assert.equal(recordWeaponCombo(game, player, 'fire_arrows'), true);
  assert.equal(recordWeaponCombo(game, player, 'fire_arrows'), false);
  assert.equal(recordWeaponCombo(game, {id: player.id}, 'ice_shatter'), false);
  assert.equal(recordWeaponCombo(game, player, '__proto__'), false);
  assert.deepEqual(knownWeaponCombos(player), ['fire_arrows']);
  assert.deepEqual(knownWeaponCombos(partner), []);
  assert.equal(playerFeedback(game, player).length, 1);
  assert.equal(playerFeedback(game, partner).length, 0);
  assert.equal(messages.length, 1);
  assert.match(messages[0], /Rowan discovered Flame Arrow/);
  assert.deepEqual(sounds, [['discovery', player]]);
  assert.equal(saves, 1);
});

test('a restored expedition keeps discoveries and an older checkpoint cannot erase the character record', async () => {
  const original = new Game(() => .4);
  const player = original.addPlayer('keyboard');
  original.start();
  player.profileId = 'rowan';
  recordWeaponCombo(original, player, 'ice_shatter');
  const restored = restoreSession(JSON.parse(JSON.stringify(saveSession(original))));
  const explorer = restored.players[0];
  assert.deepEqual(knownWeaponCombos(explorer), ['ice_shatter']);
  assert.equal(recordWeaponCombo(restored, explorer, 'ice_shatter'), false);

  const profiles = new Profiles();
  profiles.save = async () => {};
  const profile = profiles.create('Rowan');
  profile.id = 'rowan';
  profile.field = {weaponCombos: ['fire_arrows', ['ice_shatter'], 'unknown']};
  restored.profileRevisions = {heroes: {rowan: 0}, stash: 0};
  profiles.reconcileCheckpoint(restored);
  assert.deepEqual(knownWeaponCombos(explorer), ['ice_shatter', 'fire_arrows']);
  assert.equal(recordWeaponCombo(restored, explorer, 'fire_arrows'), false);

  profile.revision = 1;
  profile.field.weaponCombos = ['chain_reaction'];
  profiles.reconcileCheckpoint(restored);
  await profiles.capture(restored);
  assert.deepEqual(knownWeaponCombos(explorer), ['ice_shatter', 'fire_arrows', 'chain_reaction']);
  assert.deepEqual(knownWeaponCombos(profiles.data.heroes[0]), ['ice_shatter', 'fire_arrows', 'chain_reaction']);
});
