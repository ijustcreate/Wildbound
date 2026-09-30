import test from 'node:test';
import assert from 'node:assert/strict';
import {wheelColor,colorWheelPoint,CREATION_COLORS} from '../src/creation-menu.mjs';
test('Spectrum preserves existing colors and includes fifteen named palette colors',()=>{
 assert.equal(CREATION_COLORS.length,15);
 for(const [,color] of CREATION_COLORS){const p=colorWheelPoint(color);assert.equal(wheelColor(p.x,p.y,p.value),color);}
 assert.equal(wheelColor(0,0),'#ffffff');assert.equal(wheelColor(1,0,0),'#000000');
});
