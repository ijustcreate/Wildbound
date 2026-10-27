import test from 'node:test';
import assert from 'node:assert/strict';
import {dynamicShadowsEnabled,setDynamicShadowsEnabled} from '../src/shadow-settings.mjs';

function storage(initial){const values=new Map(Object.entries(initial||{}));return {getItem:key=>values.get(key)??null,setItem:(key,value)=>values.set(key,String(value)),values};}

test('dynamic shadows are default and setting either style replaces the other',()=>{
 const local=storage();assert.equal(dynamicShadowsEnabled(local),true);
 assert.equal(setDynamicShadowsEnabled(false,local),false);assert.equal(dynamicShadowsEnabled(local),false);assert.equal(local.values.get('wildbound-shadow-style'),'simple');
 assert.equal(setDynamicShadowsEnabled(true,local),true);assert.equal(dynamicShadowsEnabled(local),true);assert.equal(local.values.get('wildbound-shadow-style'),'dynamic');
});

test('unavailable local storage safely defaults to dynamic shadows',()=>{
 const broken={getItem(){throw Error('blocked');},setItem(){throw Error('blocked');}};
 assert.equal(dynamicShadowsEnabled(broken),true);assert.equal(setDynamicShadowsEnabled(false,broken),false);
});
