import test from 'node:test';
import assert from 'node:assert/strict';
import {planPlayerPanels, openPlayArea} from '../src/player-panel-layout.mjs';

const players = Array.from({length: 4}, (_, id) => ({id, ui: {}}));
test('multiplayer merchants use readable full-window columns without a wasted center gap',()=>{
 for(const [width,height,count]of [[600,430,2],[1000,700,4],[1280,800,6]]){
  const party=Array.from({length:count},(_,id)=>({id,ui:{shop:'merchant'}})),boxes=[...planPlayerPanels(party,party,width,height).values()];
  assert.ok(boxes.every(b=>b.width>=288));
  for(const a of boxes){assert.ok(a.x>=0&&a.x+a.width<=width&&a.y>=0&&a.y+a.height<=height);for(const b of boxes)if(a!==b)assert.ok(a.x+a.width<=b.x||b.x+b.width<=a.x||a.y+a.height<=b.y||b.y+b.height<=a.y);}
 }
});

test('a second player keeps the first inventory full height and at its dock', () => {
  const one = planPlayerPanels(players, [players[0]], 1280, 700).get(0);
  const two = planPlayerPanels(players, players.slice(0, 2), 1280, 700);
  assert.equal(two.get(0).x, one.x);
  assert.equal(two.get(0).y, one.y);
  assert.equal(two.get(0).side, one.side);
  assert.equal(two.get(1).height, one.height);
  assert.ok(openPlayArea(two, 1280, 700).width >= 320);
});

test('closing a menu does not move a remaining player to the other side', () => {
  const together = planPlayerPanels(players, [players[0], players[1]], 1280, 700);
  const alone = planPlayerPanels(players, [players[1]], 1280, 700);
  assert.equal(together.get(1).side, alone.get(1).side);
  assert.equal(together.get(1).x+together.get(1).width, alone.get(1).x+alone.get(1).width);
  assert.equal(together.get(1).y, alone.get(1).y);
});

test('a bottom-docked player keeps the bottom edge when a top menu opens', () => {
  const alone = planPlayerPanels(players, [players[2]], 1280, 900).get(2);
  const together = planPlayerPanels(players, [players[1], players[2]], 1280, 900).get(2);
  assert.equal(alone.y + alone.height, together.y + together.height);
  assert.equal(alone.x, together.x);
});

test('crowded layouts fit panels without overlap', () => {
  const six = Array.from({length: 6}, (_, id) => ({id, ui: {loot: id % 2 === 0}}));
  for (const width of [1000, 1440, 1920]) {
    const layout = [...planPlayerPanels(six, six, width, 500).values()];
    for (const a of layout) {
      assert.ok(a.x >= 0 && a.x + a.width <= width);
      assert.ok(a.y >= 0 && a.y + a.height <= 500);
      for (const b of layout) if (a !== b) assert.ok(a.x + a.width <= b.x || b.x + b.width <= a.x || a.y + a.height <= b.y || b.y + b.height <= a.y);
    }
  }
});
