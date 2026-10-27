import {drawGraveyardProp} from '../src/graveyard-art.mjs';
import {normalizeMapping} from '../src/controls.mjs';
import fs from 'node:fs';
import test from 'node:test';
import assert from 'node:assert/strict';
import {Game} from '../src/core.mjs';
import {swordStep} from '../src/sword-feel.mjs';
import {defaultNativePlayerMotion,upgradePlayerToNative} from '../src/player-motion.mjs';
import {scenePropCasters} from '../src/scene-casters.mjs';
const setup=()=>{const g=new Game(()=>.5);const p=g.addPlayer('keyboard');g.start();g.openingBoard=false;g.scenery=[];g.terrain.fill('grass');g.weather=null;g.event=null;Object.assign(p,{x:600,y:600,faceX:1,faceY:0,equipment:{hand1:'sword'}});const e={id:901,kind:'lion',x:640,y:600,hp:1000,maxHp:1000,speed:0,damage:0,frozen:100,state:'hunt',cooldown:99,faceX:-1,faceY:0};g.enemies=[e];return {g,p,e};};
const tick=(g,n)=>{for(let i=0;i<n;i++)g.update(.02,{});};
test('sword contact waits for the active cut, hits once, steps forward and holds locally',()=>{
 const {g,p,e}=setup();g.attack(p);assert.equal(e.hp,1000);tick(g,3);assert.equal(e.hp,1000);tick(g,2);assert.ok(e.hp<1000);const hp=e.hp;
 assert.ok(p.x>600&&p.x<=607.01);assert.ok(p.swordHitPause>0);assert.ok(g.effects.some(f=>f.swordImpact));tick(g,15);assert.equal(e.hp,hp);
});
test('misses have no impact feedback and menus, dash and changed equipment cancel pending strikes',()=>{
 const miss=setup();miss.e.x=1000;miss.g.attack(miss.p);tick(miss.g,12);assert.ok(!miss.g.effects.some(f=>f.swordImpact));
 for(const cancel of [p=>p.ui={panel:'gear'},p=>p.dashTime=.2,p=>p.equipment.hand1='bow']){const {g,p,e}=setup();g.attack(p);cancel(p);tick(g,12);assert.equal(e.hp,1000);assert.equal(p.swordStrike,undefined);}
});
test('sword step integrates to its bounded reach and does not overshoot on skipped frames',()=>{
 for(const clip of ['swipe_one','swipe_big']){let total=0;for(let i=0;i<60;i++)total+=swordStep(clip,i/60,(i+1)/60);assert.equal(Math.round(total),clip==='swipe_big'?10:7);assert.equal(swordStep(clip,1,2),0);}
});
test('native sword keys stay editable and authored replacements are preserved',()=>{
 const m=defaultNativePlayerMotion();assert.equal(m.nativeSwordRevision,1);const old=structuredClone(m);old.clips.slash=structuredClone(m.nativeSwordSource.slash);delete old.nativeSwordRevision;delete old.nativeSwordSource;
 old.clips.slash.keys[0].joints.handR[0]+=.1;const edited=structuredClone(old.clips.slash);assert.deepEqual(upgradePlayerToNative(old).clips.slash,edited);assert.deepEqual(upgradePlayerToNative(m),m);
});
test('rebuilt scenery arrays retain the static shadow revision until geometry changes',()=>{
 const p={kind:'tree',x:400,y:500,size:80},g={scenery:[p]};const first=scenePropCasters(g);g.scenery=[p];assert.equal(scenePropCasters(g).revision,first.revision);
 g.scenery=[{...p}];assert.equal(scenePropCasters(g).revision,first.revision);g.scenery[0].size=120;assert.notEqual(scenePropCasters(g).revision,first.revision);
});

test('right trigger is dash after migrating a reversed old shoulder pair',()=>{
 const m=normalizeMapping({dodge:4,block:5,attack:3,interact:2});assert.equal(m.dodge,7);assert.equal(m.block,6);assert.equal(m.attack,3);
});
test('shared generation-4 project rig receives native sword keys without rewriting authored data',()=>{
 const raw=fs.readFileSync(new URL('../authored/rigs.json',import.meta.url),'utf8'),m=upgradePlayerToNative(JSON.parse(raw).player);
 assert.equal(m.nativeSwordRevision,1);assert.equal(m.locomotionRevision,2);assert.equal(fs.readFileSync(new URL('../authored/rigs.json',import.meta.url),'utf8'),raw);
});
test('all five cemetery tree silhouettes keep every branch above the root plane',()=>{
 for(let variant=0;variant<5;variant++){
  let maxY=-Infinity;const c={save(){},restore(){},translate(){},fillRect(x,y,w,h){if(this.fillStyle==='#2b3530'||this.fillStyle==='#465044')maxY=Math.max(maxY,y+h);}};
  drawGraveyardProp(c,{graveyard:true,kind:'leafless_tree',x:0,y:0,rootY:0,size:150,variant});assert.ok(maxY<=6,'branch below ground in variant '+variant);
 }
});
