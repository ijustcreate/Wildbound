import test from 'node:test';
import assert from 'node:assert/strict';
import {spatialMenuNeighbor} from '../src/menu-navigation.mjs';

const button = (x, y) => ({
  disabled: false,
  getClientRects: () => [1],
  getBoundingClientRect: () => ({left: x, top: y, width: 80, height: 40}),
});

test('map selection follows physical rows and columns', () => {
  const [a,b,c,d,e,f] = [button(0,0),button(100,0),button(0,50),button(100,50),button(0,100),button(100,100)];
  const cells=[a,b,c,d,e,f];
  assert.equal(spatialMenuNeighbor(cells,a,1,0),b);
  assert.equal(spatialMenuNeighbor(cells,a,0,1),c);
  assert.equal(spatialMenuNeighbor(cells,d,-1,0),c);
  assert.equal(spatialMenuNeighbor(cells,d,0,1),f);
  assert.equal(spatialMenuNeighbor(cells,b,1,0),b);
});

test('disabled and hidden controls are skipped', () => {
  const a=button(0,0),b=button(100,0),c=button(200,0);
  b.disabled=true;
  assert.equal(spatialMenuNeighbor([a,b,c],a,1,0),c);
});

test('creator grid moves between the nearest visible color and preview controls', () => {
  const rotate=button(10,0),skin=button(110,0),hair=button(110,50),shirt=button(110,100),pants=button(110,150),shoes=button(110,200);
  const cells=[rotate,skin,hair,shirt,pants,shoes];
  assert.equal(spatialMenuNeighbor(cells,skin,0,1),hair);
  assert.equal(spatialMenuNeighbor(cells,rotate,1,0),skin);
});
