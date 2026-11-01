import test from 'node:test';
import assert from 'node:assert/strict';
import { ITEMS, itemKind } from '../src/items.mjs';
import { ITEM_ART_TYPES, paintItem } from '../src/item-art.mjs';
import { DEFAULT_APPEARANCE } from '../src/appearance.mjs';
import { defaultPlayerMotion, directionVector, drawPlayer } from '../src/player-motion.mjs';

test('Violet Wisp Bow is a normal, obtainable two-handed bow with its own item icon', () => {
  assert.equal(itemKind('umbral_bow'), 'bow');
  assert.equal(ITEMS.umbral_bow.slot, 'hand1');
  assert.equal(ITEMS.umbral_bow.twoHanded, true);
  assert.equal(ITEMS.umbral_bow.rarity, 'rare');
  assert.equal(ITEMS.umbral_bow.bossOnly, undefined);
  assert.ok(ITEM_ART_TYPES.includes('umbral_bow'));
  const pixels = new Set();
  const c = { fillStyle: '', fillRect(x,y,w,h) { pixels.add(`${x},${y},${w},${h}:${this.fillStyle}`); } };
  paintItem(c, 'umbral_bow');
  assert.ok(pixels.size > 20);
  assert.ok([...pixels].some(pixel => pixel.includes('#d93bcf')));
  assert.ok([...pixels].some(pixel => pixel.includes('#211d2a')));
});

test('Violet Wisp Bow renders magenta limbs and a dark string through all facings and aim clips', () => {
  const model = defaultPlayerMotion();
  const colors = new Set();
  const c = new Proxy({fillStyle:'#000000'}, {
    get(target,key){ if(key in target)return target[key];return ()=>{}; },
    set(target,key,value){target[key]=value;return true;},
  });
  c.fillRect = (...args) => { assert.ok(args.every(Number.isFinite)); colors.add(c.fillStyle); };
  for (const action of ['idle','walk','run','draw','ranged']) for(let d=0;d<8;d++) {
    const [faceX,faceY] = directionVector(d);
    const actor = {faceX,faceY,hp:100,appearance:DEFAULT_APPEARANCE,animationAction:action,equipment:{hand1:'umbral_bow'},inventory:[{type:'arrow',qty:2}],charge:action==='draw'?.7:0};
    assert.doesNotThrow(()=>drawPlayer(c,actor,.3,model), `${action} facing ${d}`);
  }
  assert.ok(colors.has('#d744d2'));
  assert.ok(colors.has('#211d2a'));
  assert.ok(colors.has('#37233d'));
});
