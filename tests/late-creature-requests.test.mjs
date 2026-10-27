import test from 'node:test';import assert from 'node:assert/strict';
import {Game,EVENTS} from '../src/core.mjs';
import {eventAvailable} from '../src/night-cycle.mjs';
import {tickNightEnemy} from '../src/night-enemies.mjs';
import {seedWildFauna,tickWildFauna} from '../src/wild-fauna.mjs';
import {creatures,definitionPack,applyDefinitions} from '../src/definitions.mjs';
import {ITEMS} from '../src/items.mjs';
import {honeyCatMotion,defaultHoneyCat,validateHoneyCat} from '../src/honey-cat.mjs';
import {defaultFireflyMotion,validateFireflyMotion} from '../src/firefly-motion.mjs';
const setup=()=>{const g=new Game(()=>.3),p=g.addPlayer('keyboard');g.start();g.openingBoard=false;g.enemies=[];g.scenery=[];g.traps=[];g.terrain.fill('sand');g.blocked=()=>false;g.projectileBlocked=()=>false;Object.assign(p,{x:550,y:500,hp:100,invuln:0,equipment:{}});return{g,p};};
test('desert matriarch encounter spawns one boss and four existing scorpions, with a dodgeable poison sting',()=>{
 const {g,p}=setup(),event=EVENTS.find(e=>e.kind==='scorpion_boss');for(const env of['forest','ice','swamp']){g.generatedEnvironment=env;assert.equal(eventAvailable(g,event),false);}g.generatedEnvironment='desert';assert.ok(eventAvailable(g,event));g.spawnEvent(EVENTS.indexOf(event),{force:true,test:true});assert.equal(g.enemies.filter(e=>e.kind==='scorpion_boss').length,1);assert.equal(g.enemies.filter(e=>e.kind==='scorpion').length,4);assert.ok(g.enemies.filter(e=>e.kind==='scorpion').every(e=>e.hp===34));
 const e=g.enemies.find(e=>e.kind==='scorpion_boss');Object.assign(e,{x:500,y:500,spawnReadyAt:0,faceX:1,faceY:0});const hp=p.hp;tickNightEnemy(g,e,p,.05);assert.equal(p.hp,hp);assert.equal(e.night.phase,'windup');assert.equal(e.night.strike,'sting');
 for(let i=0;i<21;i++)tickNightEnemy(g,e,p,.05);assert.ok(p.hp<hp);assert.equal(p.poison,4);
 const {g:other,p:q}=setup(),boss={...e,hp:420,maxHp:420,night:{phase:'windup',timer:.1,duration:1,strike:'sting',targetId:q.id,aim:{x:q.x,y:q.y}},x:500,y:500};other.enemies=[boss];q.y+=90;tickNightEnemy(other,boss,q,.2);assert.equal(q.hp,100,'stepping out avoids the locked sting');assert.ok(!q.poison);
});
test('werewolves exclude desert and snow, warn before a locked leap, and recover instead of stacking contact hits',()=>{
 const {g,p}=setup(),event=EVENTS.find(e=>e.kind==='werewolf');for(const env of['desert','ice']){g.generatedEnvironment=env;assert.equal(eventAvailable(g,event),false);}for(const env of['forest','temple','house','beach','graveyard','swamp','caverns','shadow']){g.generatedEnvironment=env;assert.ok(eventAvailable(g,event),env);}
 const e={...event,id:900,x:500,y:500,maxHp:event.hp,faceX:1,faceY:0,night:{phase:'idle',timer:0,cooldown:0,awoke:true}};g.enemies=[e];tickNightEnemy(g,e,p,.05);assert.equal(e.night.phase,'windup');assert.equal(p.hp,100);const aim={...e.night.aim};p.y+=100;for(let i=0;i<30;i++)tickNightEnemy(g,e,p,.05);assert.equal(p.hp,100);assert.deepEqual(e.night.aim,aim);assert.ok(['recover','idle'].includes(e.night.phase));
});
test('chickens seed as peaceful wildlife, peck and flee without attacking; Honey and firefly rigs persist editable parts',()=>{
 const {g,p}=setup();g.generatedEnvironment='house';g.wildFaunaState=null;seedWildFauna(g,true);const chicken=g.enemies.find(e=>e.kind==='chicken');assert.ok(chicken);assert.equal(chicken.faction,'neutral');assert.equal(creatures.chicken.behaviors.melee,false);chicken.x=p.x+30;chicken.y=p.y;p.equipment.hand1='sword';tickWildFauna(g,chicken,.1,[p]);assert.equal(chicken.state,'flee');assert.equal(p.hp,100);
 const cat=defaultHoneyCat(),fly=defaultFireflyMotion();assert.ok(validateHoneyCat(cat));assert.ok(validateFireflyMotion(fly));assert.equal(cat.provenance.display,11709);assert.equal(fly.provenance.display,137015);cat.boneSprites={'Cat head':{0:{width:1,height:1,x:0,y:0,palette:['transparent','#ff00ff'],pixels:[1]}}};const pack=structuredClone(definitionPack(EVENTS,ITEMS)),before=structuredClone(honeyCatMotion);pack.graveyard_cat=cat;applyDefinitions(pack,EVENTS,ITEMS);assert.deepEqual(honeyCatMotion.boneSprites,cat.boneSprites);Object.assign(honeyCatMotion,before);if(!before.boneSprites)delete honeyCatMotion.boneSprites;
});

test('New motion donors have complete editor joint hierarchies',async()=>{for(const kind of ['werewolf','scorpion_boss','fox','dragon','chicken','squashling','graveyard_cat','marsh_firefly']){const {default:model}=await import('../src/'+kind+'-donor-data.mjs');for(const [name,joint]of Object.entries(model.joints))assert.ok(!joint.parent||model.joints[joint.parent],kind+'/'+name+' missing parent '+joint.parent);}});
