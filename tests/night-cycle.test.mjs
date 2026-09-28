import test from 'node:test';
import assert from 'node:assert/strict';
import { Game, EVENTS } from '../src/core.mjs';
import { daylight, timeOfDay, sightRadius, lightAt, tickNightCycle, emitNoise, loudestNoise, eventAvailable, enemyVisibility } from '../src/night-cycle.mjs';
import { saveSession, restoreSession } from '../src/session.mjs';
import { tickHazards } from '../src/hazards.mjs';

const setup = () => { const g = new Game(() => .2); const p = g.addPlayer('keyboard'); g.start(); g.openingBoard = false; return {g,p}; };
test('Sky phases change vision, light reveals stalkers, and the clock survives saving', () => {
  const {g,p} = setup();
  assert.equal(timeOfDay(g), 'day'); assert.equal(daylight(g),1);
  g.sky.elapsed = 330;
  assert.equal(timeOfDay(g), 'night'); assert.ok(sightRadius(g,p) < 150);
  const stalker = {kind:'night_stalker',hp:90,x:p.x+20,y:p.y,state:'stalk'};
  assert.ok(enemyVisibility(g,stalker) < .1);
  p.equipment.hand2 = 'lantern'; assert.equal(sightRadius(g,p),150);
  assert.ok(lightAt(g,stalker) > .7); assert.equal(enemyVisibility(g,stalker),1);
  const restored = restoreSession(JSON.parse(JSON.stringify(saveSession(g))));
  assert.equal(restored.sky.elapsed,330); assert.equal(timeOfDay(restored),'night');
  assert.equal(restored.players[0].equipment.hand2,'lantern');
  g.phase='paused'; tickNightCycle(g,10); assert.equal(g.sky.elapsed,330);
});
test('Event weighting respects time and biome and noise decays without changing sound settings', () => {
  const {g,p} = setup();
  const event={environments:['forest','temple'],times:['night']};
  assert.equal(eventAvailable(g,event),false);g.sky.elapsed=320;assert.equal(eventAvailable(g,event),true);
  g.generatedEnvironment='ice';assert.equal(eventAvailable(g,event),false);
  emitNoise(g,p,'rifle',700);
  assert.equal(loudestNoise(g,{x:p.x+400,y:p.y,id:900})?.kind,'rifle');
  assert.equal(loudestNoise(g,{x:p.x+800,y:p.y,id:900}),null);
  tickNightCycle(g,7);assert.equal(loudestNoise(g,{x:p.x,y:p.y,id:900}),null);
});
test('Stampedes mix elephants, zebras and pelicans with rhinos and all runners move', () => {
  const {g} = setup();g.spawnEvent(EVENTS.findIndex(e=>e.type==='stampede'));
  assert.equal(g.enemies.length,20);
  assert.deepEqual(new Set(g.enemies.map(e=>e.kind)),new Set(['rhino','elephant','zebra','pelican']));
  const positions=g.enemies.map(e=>e.x);tickHazards(g,.1);
  g.enemies.forEach((e,i)=>assert.notEqual(e.x,positions[i]));
});
