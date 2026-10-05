import test from 'node:test';import assert from 'node:assert/strict';
import {Game} from '../src/core.mjs';import {ITEMS} from '../src/items.mjs';
import {drawMagicBolt,magicBoltGlow} from '../src/magic-bolt-render.mjs';
import {finishMagicBolt,drawMagicBurst} from '../src/magic-bolt-effects.mjs';
import {drawFriendshipHearts} from '../src/friendship-hearts.mjs';
const canvas=()=>{const calls=[],c=new Proxy({globalAlpha:1,calls},{set(o,k,v){if(k==='globalCompositeOperation')calls.push(['composite',v]);if(k==='fillStyle'||k==='strokeStyle')calls.push(['color',v]);o[k]=v;return true;},get(o,k){if(k in o)return o[k];return (...args)=>{assert.ok(args.every(v=>typeof v!=='number'||Number.isFinite(v)));calls.push([k,...args]);};}});return c;};
test('wand colour is preserved and basic glow is lower than premium glow',()=>{
 const g=new Game(()=>.5),p=g.addPlayer('keyboard');p.mana=999;
 for(const type of ['starter_wand','wand','fire_wand','ice_wand','necromancer_wand','friendship_wand']){p.equipment.hand1=type;assert.equal(g.fireSpell(p),true);const b=g.spells.at(-1);assert.equal(b.color,ITEMS[type].artColor||ITEMS[type].color);assert.equal(b.glow,magicBoltGlow(ITEMS[type]));}
 assert.ok(magicBoltGlow(ITEMS.wand)<magicBoltGlow(ITEMS.necromancer_wand));assert.ok(magicBoltGlow(ITEMS.friendship_wand)<.05);
});
test('coloured projectiles and bursts never use additive blending or white sparks',()=>{
 for(const color of ['#90baff','#ff7938','#7edcff','#b36de0']){const c=canvas();drawMagicBolt(c,{x:50,y:50,vx:260,vy:0,size:8,color,age:.5});assert.ok(c.calls.some(v=>v[0]==='color'&&v[1]===color));assert.ok(!c.calls.some(v=>v.includes('lighter')||v.includes('#edffff')||v.includes('#f2efff')));assert.ok(c.calls.filter(v=>v[0]==='ellipse').length<=7);
 const g={effects:[]};finishMagicBolt(g,{x:50,y:50,color},true);drawMagicBurst(c,g.effects[0]);assert.ok(!c.calls.some(v=>v.includes('lighter')));}
});
test('friendship projectile and impact draw pink heart shapes instead of round white cores',()=>{
 const c=canvas(),bolt={x:50,y:50,vx:260,vy:0,size:8,color:'#ffb4df',friendship:true,age:.5};drawMagicBolt(c,bolt);assert.ok(c.calls.some(v=>v[0]==='color'&&v[1]==='#ff80b5'));assert.equal(c.calls.filter(v=>v[0]==='ellipse').length,0);
 const g={effects:[]};finishMagicBolt(g,bolt,true);assert.equal(g.effects[0].friendship,true);drawMagicBurst(c,g.effects[0]);
});
test('hearts appear only over living friendship allies, not enemies or Ranger pets',()=>{
 for(const actor of [{hp:10,faction:'ally',allyOwner:0},{hp:0,faction:'ally',allyOwner:0},{hp:10,faction:'enemy',allyOwner:1},{hp:10,faction:'ally',owner:1}]){const c=canvas();drawFriendshipHearts(c,{x:50,y:80,kind:'lion',...actor},2);assert.equal(c.calls.some(v=>v[0]==='fillRect'),actor.hp>0&&actor.faction==='ally'&&actor.allyOwner!=null);}
});
test('expired bolts draw nothing and newborn trails stay at their emission tip',()=>{
 const c=canvas();drawMagicBolt(c,{x:50,y:50,remaining:0});assert.equal(c.calls.length,0);drawMagicBolt(c,{x:50,y:50,vx:260,vy:0,age:0});for(const v of c.calls.filter(v=>v[0]==='ellipse'))assert.ok(v[1]<=50&&v[1]>=48);
});
