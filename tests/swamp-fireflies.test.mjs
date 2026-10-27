import test from 'node:test';
import assert from 'node:assert/strict';
import {Game} from '../src/core.mjs';
import {give,count} from '../src/items.mjs';
import {seedRealmLife,tickRealmLife,drawRealmLife} from '../src/realm-life.mjs';
import {firefliesAwake,marshFireflyHabitat,catchMarshFirefly,releaseMarshFirefly,MARSH_FIREFLY_LIMIT,drawMarshFireflyGlows} from '../src/swamp-fireflies.mjs';
import {lightSources} from '../src/night-cycle.mjs';
import {saveSession,restoreSession} from '../src/session.mjs';
import {releaseCritter} from '../src/living-ecosystem.mjs';
const setup=()=>{const g=new Game(()=>.5,{deferWorld:true});g.environment='swamp';const p=g.addPlayer('keyboard');g.start();g.openingBoard=false;g.sky.elapsed=320;g.bloom=3;p.equipment={hand1:'critter_net'};p.inventory=[];seedRealmLife(g);return {g,p};};
const flies=g=>g.realmState.animals.filter(a=>a.kind==='marsh_firefly');
const beside=(g,p)=>{const a=flies(g)[0];assert.ok(a);Object.assign(p,{x:a.x,y:a.y,faceX:1,faceY:0});return a;};
test('fireflies stay at bank/shallow habitats and appear only at night',()=>{
  const {g}=setup();assert.ok(flies(g).length>0);assert.ok(flies(g).length<=MARSH_FIREFLY_LIMIT);
  for(const a of flies(g))assert.ok(marshFireflyHabitat(g,a.x,a.y));
  for(const [time,expected]of [[0,false],[239,false],[260,false],[299,false],[300,true],[449,true],[450,false],[479,false],[480,false]]){g.sky.elapsed=time;assert.equal(firefliesAwake(g),expected);}
  g.sky.elapsed=80;const before=structuredClone(flies(g));tickRealmLife(g,.1);assert.deepEqual(flies(g).map(a=>[a.x,a.y]),before.map(a=>[a.x,a.y]));
  const pen=new Proxy({},{get:()=>()=>{throw Error('Hidden firefly was rendered');}}),only={...g,realmState:{...g.realmState,animals:flies(g)}};
  drawRealmLife(pen,only,'air');drawMarshFireflyGlows(pen,only,{x:800,y:800,zoom:1},800,600);
  g.sky.elapsed=320;for(let i=0;i<80;i++){g.time+=.1;tickRealmLife(g,.1);}for(const a of flies(g))assert.ok(marshFireflyHabitat(g,a.x,a.y));
});
test('real Attack/net path catches into either container, preserves metadata and never respawns on restore',()=>{
  for(const hand of ['hand1','hand2'])for(const container of ['empty_jar','critter_cage']){
    const {g,p}=setup(),a=beside(g,p);p.equipment={[hand]:'critter_net'};give(p.inventory,container);
    assert.ok(g.attack(p));assert.equal(count(p,'caught_marsh_firefly'),1);assert.equal(count(p,container),0);
    assert.equal(p.inventory.find(i=>i?.type==='caught_marsh_firefly').captureContainer,container);
    assert.ok(!flies(g).some(b=>b.id===a.id));
    const r=restoreSession(JSON.parse(JSON.stringify(saveSession(g))));seedRealmLife(r);r.sky.elapsed=350;tickRealmLife(r,.1);
    assert.ok(!flies(r).some(b=>b.id===a.id));assert.equal(count(r.players[0],'caught_marsh_firefly'),1);
  }
});
test('daytime catch and failed/full inventory transactions preserve wildlife and supplies',()=>{
  const {g,p}=setup(),a=beside(g,p);give(p.inventory,'empty_jar');g.sky.elapsed=20;assert.equal(catchMarshFirefly(g,p),false);assert.equal(count(p,'empty_jar'),1);
  g.sky.elapsed=320;p.inventory=[];assert.ok(catchMarshFirefly(g,p));assert.ok(flies(g).includes(a));
  p.inventory=[{type:'empty_jar',qty:2},...Array.from({length:23},()=>({type:'hat',qty:1}))];const before=structuredClone(p.inventory);
  assert.ok(catchMarshFirefly(g,p));assert.deepEqual(p.inventory,before);assert.ok(flies(g).includes(a));
  p.inventory=[{type:'crafting_bag',qty:1,contents:[{type:'empty_jar',qty:1}]}];assert.ok(catchMarshFirefly(g,p));assert.equal(count(p,'caught_marsh_firefly'),1);
});
test('release routes to bank habitat and returns the real container; daylight release consumes nothing',()=>{
  const {g,p}=setup();beside(g,p);give(p.inventory,'critter_cage');catchMarshFirefly(g,p);p.ui={};
  g.sky.elapsed=120;const before=structuredClone(p.inventory);assert.ok(releaseCritter(g,p,0));assert.deepEqual(p.inventory,before);
  g.sky.elapsed=320;assert.ok(releaseMarshFirefly(g,p,0));assert.equal(count(p,'caught_marsh_firefly'),0);assert.equal(count(p,'critter_cage'),1);
  const a=flies(g).find(a=>a.releasedOwner===p.id);assert.ok(a);assert.ok(marshFireflyHabitat(g,a.x,a.y));
  p.ui=null;assert.ok(catchMarshFirefly(g,p));assert.equal(count(p,'caught_marsh_firefly'),1);
});
test('firefly glow never adds expensive world-light sources',()=>{
  const {g}=setup();const before=lightSources(g).length;g.realmState.animals.push({...flies(g)[0],id:'extra-test'});g.time++;assert.equal(lightSources(g).length,before);
});
