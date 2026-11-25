import test from 'node:test';
import assert from 'node:assert/strict';
import {prepareWorldShadowFrame} from '../src/scene-casters.mjs';

test('split views reuse overlapping shadow regions and keep caster order at region edges', () => {
 const player = (id, x, y) => ({id, x, y, hp:10});
 const game = {generatedEnvironment:'forest', scenery:[], players:[
  player('left', -220, 800), player('outside-left', -220.01, 800),
  player('overlap', 1819.99, 800), player('right', 1820, 800),
  player('top', 800, -220), player('bottom', 800, 1820),
 ], enemies:[player('last', 800, 800)]};
 const shared = prepareWorldShadowFrame(game, {shareRegions:true});
 const solo = prepareWorldShadowFrame(game);
 const first = shared.region(0, 0);
 assert.strictEqual(shared.region(0, 0), first);
 assert.deepEqual(first, solo.region(0, 0));
 assert.deepEqual(first.casters.filter(c=>c.id).map(c=>c.id), ['left', 'overlap', 'top', 'last']);
 assert.deepEqual(shared.region(1, 0), solo.region(1, 0));
 assert.deepEqual(shared.region(1, 0).casters.map(c=>c.id), ['overlap', 'right']);
 assert.deepEqual(shared.region(-1, 0).casters.map(c=>c.id), ['left', 'outside-left']);
});

test('the next split frame sees in-place scenery edits, movement, and removed casters', () => {
 const tree = {kind:'tree', x:120, y:140, size:80, treeType:'oak'};
 const player = {id:'player', x:180, y:200, hp:10};
 const chest = {id:'chest', x:240, y:250};
 const game = {generatedEnvironment:'forest', scenery:[tree], players:[player], supplyChests:[chest]};
 const first = prepareWorldShadowFrame(game, {shareRegions:true});
 assert.ok(first.region(0, 0).casters.some(c=>c.shadowShape==='forest_canopy' && c.x===120));
 assert.ok(first.region(0, 0).casters.some(c=>c.id==='chest'));

 tree.x = 2050;
 player.x = 2100;
 chest.opened = true;
 const edited = prepareWorldShadowFrame(game, {shareRegions:true});
 assert.notEqual(edited.options.staticRevision, first.options.staticRevision);
 assert.ok(first.region(0, 0).casters.some(c=>c.id==='player' && c.x===180));
 assert.ok(!edited.region(0, 0).casters.some(c=>c.id==='player' || c.id==='chest' || c.shadowShape==='forest_canopy'));
 assert.ok(edited.region(1, 0).casters.some(c=>c.shadowShape==='forest_canopy' && c.x===2050));
 assert.ok(edited.region(1, 0).casters.some(c=>c.id==='player' && c.x===2100));

 tree.destroyed = true;
 const removed = prepareWorldShadowFrame(game, {shareRegions:true});
 assert.notEqual(removed.options.staticRevision, edited.options.staticRevision);
 assert.ok(!removed.region(1, 0).casters.some(c=>c.shadowShape==='forest_canopy'));
});
