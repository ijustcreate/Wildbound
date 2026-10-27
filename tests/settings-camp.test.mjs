import test from 'node:test';
import assert from 'node:assert/strict';
import {readCampInputSettings,shapeCampStick} from '../src/settings-camp.mjs';
test('Camp input defaults preserve analog aim and its radial dead zone',()=>{
 const settings=readCampInputSettings({getItem:()=>null});
 assert.deepEqual(shapeCampStick(.1,.1,settings),{x:0,y:0});
 const stick=shapeCampStick(.6,.4,settings);assert.ok(Math.abs(stick.x-.6)<1e-10);assert.ok(Math.abs(stick.y-.4)<1e-10);
});
test('Camp inversion and response preserve direction and bound analog magnitude',()=>{
 const settings={response:2,deadzone:.18,invertX:true,invertY:true};
 const stick=shapeCampStick(.3,.4,settings);assert.ok(Math.abs(stick.x+.15)<1e-10);assert.ok(Math.abs(stick.y+.2)<1e-10);
 const outside=shapeCampStick(1,1,settings);assert.ok(Math.abs(Math.hypot(outside.x,outside.y)-1)<1e-10);
});
test('Malformed saved Camp settings fall back and clamp unsafe values',()=>{
 assert.equal(readCampInputSettings({getItem:()=>'{broken'}).response,1);
 const settings=readCampInputSettings({getItem:()=>JSON.stringify({response:99,deadzone:-2,invertX:'yes',vibration:false})});
 assert.equal(settings.response,2);assert.equal(settings.deadzone,.05);assert.equal(settings.invertX,false);assert.equal(settings.vibration,false);
});
