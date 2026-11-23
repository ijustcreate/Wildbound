import test from 'node:test';
import assert from 'node:assert/strict';
import {Game} from '../src/core.mjs';
import {actionFeedback,playerFeedback} from '../src/action-feedback.mjs';
import {actionInputLabel} from '../src/action-prompts.mjs';
import {rememberSafePositions,recoverToSafety} from '../src/safe-recovery.mjs';
import {saveSession,restoreSession} from '../src/session.mjs';
import {resolvedDamageFeedback} from '../src/combat-feedback.mjs';
import {Profiles} from '../src/profiles.mjs';
const setup=()=>{const g=new Game(()=>.5);const p=g.addPlayer('keyboard','Alder');g.start();g.openingBoard=false;return {g,p};};
test('feedback is owned, merged, bounded, expires and is excluded from saves',()=>{
  const {g,p}=setup(),q=g.addPlayer('pad:0','Fern');
  actionFeedback(g,p,{key:'arrow',text:'Arrows',quantity:3});g.time+=.2;actionFeedback(g,p,{key:'arrow',text:'Arrows',quantity:2});
  assert.equal(playerFeedback(g,p)[0].quantity,5);assert.equal(playerFeedback(g,q).length,0);
  for(let i=0;i<20;i++)actionFeedback(g,p,{key:i,text:'Item '+i});
  assert.equal(playerFeedback(g,p).length,3);
  const restored=restoreSession(JSON.parse(JSON.stringify(saveSession(g))));assert.equal(playerFeedback(restored,restored.players[0]).length,0);
  g.time+=3;assert.equal(playerFeedback(g,p).length,0);
});
test('session snapshots exclude live audio services and remain cloneable for named world saves',()=>{
  const {g}=setup();g.trainAudio={cache:new WeakMap(),play(){}};
  const snapshot=saveSession(g);assert.equal(snapshot.state.trainAudio,undefined);assert.doesNotThrow(()=>structuredClone(snapshot));
});
test('pickup acknowledges only committed ownership and preserves full bag rewards',()=>{
  const {g,p}=setup();p.inventory=[];g.dropLoot(p.x,p.y,'arrow',3);const loot=g.loot.at(-1);
  assert.equal(g.collect(p,loot),true);assert.equal(g.collect(p,loot),false);
  assert.equal(playerFeedback(g,p)[0].quantity,3);
  p.inventory=Array.from({length:32},()=>({type:'sword',qty:1}));g.dropLoot(p.x,p.y,'potion',1);const potion=g.loot.at(-1);
  assert.equal(g.collect(p,potion),false);assert.ok(g.loot.includes(potion));assert.equal(playerFeedback(g,p)[0].kind,'failure');
});
test('potion refusal preserves inventory and successful feedback matches actual healing',()=>{
  const {g,p}=setup();p.inventory=[{type:'potion',qty:2}];p.hp=p.maxHp;
  assert.equal(g.usePotion(p),false);assert.equal(p.inventory[0].qty,2);assert.match(playerFeedback(g,p)[0].text,/already full/);
  p.hp=p.maxHp-3;assert.equal(g.usePotion(p),true);assert.equal(p.inventory[0].qty,1);assert.equal(playerFeedback(g,p)[0].quantity,3);
  p.inventory=[];p.hp-=4;assert.equal(g.usePotion(p),false);assert.match(playerFeedback(g,p)[0].text,/No health potions/);
});
test('prompt labels follow actual mapping and controller family',()=>{
  const g={mapping:{interact:0}},p={device:'pad:0',controllerFamily:'switch'};
  assert.equal(actionInputLabel(g,p,'interact'),'B');p.controllerFamily='playstation';assert.equal(actionInputLabel(g,p,'interact'),'Cross');
  p.device='keyboard';assert.equal(actionInputLabel(g,p,'loot'),'E');
});
test('recovery validates destinations at execution and preserves progress',()=>{
  const {g,p}=setup();g.blocked=(x,y)=>Math.abs(x-100)<12&&Math.abs(y-100)<12;
  p.x=150;p.y=150;rememberSafePositions(g,.7);p.x=100;p.y=100;p.hp=12;p.coins=87;p.heldChickenId=123;
  p.swordDash={};p.swordStrike={};p.jumpHeight=30;p.dashTime=.3;
  const bag=structuredClone(p.inventory),result=recoverToSafety(g,p);
  assert.equal(result.ok,true);assert.equal(g.blocked(p.x,p.y),false);assert.equal(p.hp,12);assert.equal(p.coins,87);
  assert.deepEqual(p.inventory,bag);assert.equal(p.heldChickenId,123);assert.equal(p.swordStrike,undefined);assert.equal(p.dashTime,0);
  g.blocked=()=>true;const point={x:p.x,y:p.y};assert.equal(recoverToSafety(g,p,{entrance:true}).ok,false);assert.deepEqual({x:p.x,y:p.y},point);
});
test('recovery keeps held inventory transactions, other players and custom rooms intact',()=>{
  const {g,p}=setup(),q=g.addPlayer('pad:0','Fern');p.ui={carry:{type:'sword'}};
  assert.equal(recoverToSafety(g,p).ok,false);assert.equal(p.ui.carry.type,'sword');p.ui=null;
  const qpos={x:q.x,y:q.y};g.blocked=()=>false;assert.equal(recoverToSafety(g,p).ok,true);assert.deepEqual({x:q.x,y:q.y},qpos);
  p.room=42;g.portals=[{id:42,oldWell:true}];assert.equal(recoverToSafety(g,p).ok,false);assert.equal(p.room,42);
});
test('recovery never selects non-solid quicksand, live lava or active traps',()=>{
  const {g,p}=setup();g.blocked=()=>false;g.terrain.fill('quicksand');
  assert.equal(recoverToSafety(g,p).ok,false);
  g.terrain.fill('grass');g.lava=[{x:p.x-140,y:p.y-140,life:5}];
  g.traps=[{x:p.x+16,y:p.y,life:10}];const result=recoverToSafety(g,p);
  assert.equal(result.ok,true);assert.ok(Math.hypot(p.x-g.traps[0].x,p.y-g.traps[0].y)>=24);
});
test('resolved damage aggregates actual amounts with a fixed simultaneous display cap',()=>{
  const g={effects:[],time:0},target={id:1,x:20,y:30};resolvedDamageFeedback(g,target,3);resolvedDamageFeedback(g,target,2);
  assert.equal(g.effects.length,1);assert.equal(g.effects[0].text,'5');
  for(let n=2;n<90;n++)resolvedDamageFeedback(g,{...target,id:n},1);
  assert.equal(g.effects.length,48);resolvedDamageFeedback(g,target,0);assert.equal(g.effects[0].text,'5');
});
test('profiles do not lose a return to the last saved state during an active write',async()=>{
  const original=globalThis.window;let release;const hold=new Promise(r=>release=r);const writes=[];
  globalThis.window={desktop:{saveProfiles:async data=>{writes.push(structuredClone(data));if(writes.length===2)await hold;}}};
  try{
    const profiles=new Profiles();await profiles.save();
    profiles.data.sharedStash=[{type:'arrow',qty:3}];const writing=profiles.save();
    await Promise.resolve();profiles.data.sharedStash=[];const final=profiles.save();release();await Promise.all([writing,final]);
    assert.deepEqual(writes.at(-1).sharedStash,[]);assert.equal(profiles.error,null);
  }finally{globalThis.window=original;}
});
