import test from 'node:test';
import assert from 'node:assert/strict';
import {advanceCombatImpacts, showCombatImpact, viewCombatImpact} from '../src/combat-impact.mjs';
import {combatTuning, DEFAULT_COMBAT_TUNING, normalizeCombatTuning, saveCombatTuning} from '../src/combat-workshop-settings.mjs';

test('combat drafts reject non-numeric settings and runtime changes use bounded values', () => {
  const draft = normalizeCombatTuning({impactShake:'100',counterBonus:10,guardWindow:-1,boomerangGuide:false});
  assert.equal(draft.impactShake,DEFAULT_COMBAT_TUNING.impactShake);
  assert.equal(draft.counterBonus,0.65);
  assert.equal(draft.guardWindow,0.1);
  assert.equal(draft.boomerangGuide,false);
  const prior = {...combatTuning};
  try {
    assert.deepEqual(saveCombatTuning(draft),draft);
    assert.equal(combatTuning.counterBonus,0.65);
  } finally {
    saveCombatTuning(prior);
  }
});

test('a clean cut, guard and wall contact use different editable effects and scoped camera feedback', () => {
  const game = {time:10, effects:[]};
  const attacker = {id:1,x:200,y:200};
  const target = {id:2,x:240,y:200,hp:80};
  assert.equal(showCombatImpact(game,attacker,target,{cut:true}).kind,'cut');
  assert.equal(game.combatHitstop||0,0);
  const guard = showCombatImpact(game,target,attacker,{kind:'shieldBlock'});
  const wall = showCombatImpact(game,attacker,target,{kind:'wallSlam'});
  assert.ok(wall.pause>guard.pause&&guard.pause>0);
  assert.equal(game.combatHitstop,wall.pause);
  assert.deepEqual(game.effects.map(effect=>effect.gameplayFx),['cut-impact','block','wall-impact']);
  assert.equal(showCombatImpact(game,attacker,target,{kind:'wallSlam'}),null);
  const close={x:220,y:200,zoom:1};
  const distant={x:1500,y:200,zoom:1};
  assert.notDeepEqual(viewCombatImpact(game,close,350,300,false),{x:0,y:0});
  assert.deepEqual(viewCombatImpact(game,distant,350,300,false),{x:0,y:0});
  assert.deepEqual(viewCombatImpact(game,close,350,300,true),{x:0,y:0});
  advanceCombatImpacts(game,0.4);
  assert.deepEqual(viewCombatImpact(game,close,350,300,false),{x:0,y:0});
});
