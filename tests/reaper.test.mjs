import test from 'node:test';
import assert from 'node:assert/strict';
import {tickReaper,initializeReaper,REAPER_DRAIN_COOLDOWN} from '../src/reaper-ai.mjs';
import {damageEnemy} from '../src/enemy-damage.mjs';
import {defaultReaperMotion,validateReaperMotion} from '../src/reaper-motion.mjs';
import {poseAt} from '../src/player-motion.mjs';
import {Game,EVENTS} from '../src/core.mjs';
import {ITEMS,REAPER_EQUIPMENT,REAPER_SET,equip,give} from '../src/items.mjs';
import {loadoutKind,nextCombo} from '../src/combat-combos.mjs';
import {rigPack} from '../src/project-rigs.mjs';
import {applyDefinitions} from '../src/definitions.mjs';
import {eventAvailable} from '../src/night-cycle.mjs';
import {selectEvent} from '../src/event-director.mjs';
import {initLivingEcosystem,livingDrainTargets} from '../src/living-ecosystem.mjs';
function setup(){
 const e={id:2,kind:'grim_reaper',x:400,y:400,hp:100,maxHp:220,damage:22,speed:54,cooldown:0},p={id:1,name:'Hero',x:500,y:400,hp:100};
 const g={players:[p],enemies:[e],traps:[],projectileBlocked:()=>false,blocked:()=>false,moveActor(a,x,y){a.x+=x;a.y+=y;return Math.hypot(x,y);},hurt(a,n){a.hp-=n;}};
 const tick=dt=>{e.cooldown-=dt;e.flash=Math.max(0,(e.flash||0)-dt);tickReaper(g,e,g.players,dt);};return {g,e,p,tick};
}
test('half-health gate; five uninterrupted seconds kill and completely heal',()=>{
 const {e,p,tick}=setup();e.hp=111;tick(.1);assert.ok(!e.reaperDrain);e.hp=110;tick(.1);assert.ok(e.reaperDrain);
 tick(2);assert.ok(e.hp>110&&e.hp<220);assert.ok(p.hp>0&&p.hp<100);assert.ok(e.reaperDrain);
 tick(2.99);assert.ok(p.hp>0);tick(.01);assert.equal(p.hp,0);assert.equal(e.hp,220);assert.equal(e.reaperCooldown,REAPER_DRAIN_COOLDOWN);assert.ok(!e.reaperDrain);
});
test('every actual damage hit immediately interrupts; no immediate recast',()=>{
 const {e,p,tick}=setup();tick(.1);tick(1);const hp=p.hp;damageEnemy(e,1);assert.ok(!e.reaperDrain);tick(.1);assert.equal(p.hp,hp);e.hp=50;tick(10);assert.ok(!e.reaperDrain);tick(8);tick(.1);assert.ok(e.reaperDrain);
});
test('death, distance, obstruction, rooms, vanished targets and freeze stop drain',()=>{
 for(const change of [({p})=>p.hp=0,({p})=>p.x=900,({g})=>g.projectileBlocked=()=>true,({p})=>p.room='crypt',({g})=>g.players=[],({e})=>e.frozen=1,({e})=>e.hp=0]){
  const s=setup();s.tick(.1);change(s);s.tick(.1);assert.ok(!s.e.reaperDrain);assert.ok(s.e.reaperCooldown>0);
 }
});
test('targets other monsters without a living player and survives JSON serialization',()=>{
 const {g,e,tick}=setup();g.players=[];const prey={id:3,kind:'wolf',x:450,y:400,hp:60,maxHp:60};g.enemies.push(prey);tick(.1);assert.equal(e.reaperDrain.target,'enemy:3');assert.doesNotThrow(()=>JSON.stringify(g));tick(5);assert.equal(prey.hp,0);assert.equal(e.hp,220);
});
test('cemetery critters are removed persistently; neutral cats are valid prey',()=>{
 for(const kind of ['grave_moth','crypt_beetle','graveyard_cat']){const {g,e,tick}=setup();g.players=[];g.graveyard={surfaceEcology:{caught:[],animals:[{id:4,kind,x:410,y:400}]}};tick(.1);assert.equal(e.reaperDrain.target,'grave:4');tick(5);assert.equal(g.graveyard.surfaceEcology.animals.length,0);assert.deepEqual(g.graveyard.surfaceEcology.caught,[4]);assert.equal(e.hp,220);}
});
test('nearest living target wins; practice dummies and self are excluded',()=>{
 const {g,e,tick}=setup();g.enemies.push({id:4,kind:'dummy',hp:100,practiceTarget:true,x:401,y:400},{id:5,kind:'wolf',hp:100,x:420,y:400});tick(.1);assert.equal(e.reaperDrain.target,'enemy:5');
});
test('ordinary ecosystem critters drain, die and stay gone after restore',()=>{
 const {g,e,tick}=setup();g.players=[];g.generatedEnvironment='forest';g.seed=1;g.livingEcosystem={version:1,biome:'forest',seed:1,caught:[],vines:[],ambient:{animals:[{id:7,kind:'frog',x:420,y:400}],time:0}};
 initLivingEcosystem(g);tick(.1);assert.equal(e.reaperDrain.target,'critter:7');tick(5);assert.equal(livingDrainTargets(g).length,0);initLivingEcosystem(g);assert.equal(livingDrainTargets(g).length,0);assert.deepEqual(g.livingEcosystem.caught,[7]);
});
test('Reaper can spawn in every zone and cemetery selection weight is quadrupled',()=>{
 const index=EVENTS.findIndex(e=>e.kind==='grim_reaper'),event=EVENTS[index];
 for(const zone of ['forest','temple','desert','ice','house','beach','graveyard']){
  const g=new Game(()=>.5);g.environment=zone;g.addPlayer('keyboard');g.start();assert.ok(eventAvailable(g,event),zone);g.spawnEvent(index);assert.ok(g.enemies.some(e=>e.kind==='grim_reaper'),zone);
 }
 const pool=[event,{name:'Alternative',kind:'bat',count:1,hp:10,weight:2}],wins={};
 for(const zone of ['forest','graveyard']){wins[zone]=0;for(let i=0;i<100;i++){const g={generatedEnvironment:zone,enemies:[],random:()=>(i+.5)/100};if(selectEvent(g,pool,()=>true)===0)wins[zone]++;}}
 assert.ok(wins.forest>0&&wins.forest<100);assert.ok(wins.graveyard>wins.forest+20);
});
test('scythes equip in both hands, use own attacks and have real reach',()=>{
 const p={inventory:[],equipment:{}};give(p.inventory,'reaper_scythe');equip(p,0);assert.equal(p.equipment.hand2,'occupied');assert.equal(loadoutKind(p),'scythe');assert.equal(nextCombo(p,'scythe',0).clip,'scythe_sweep');assert.equal(nextCombo(p,'scythe',.5).clip,'scythe_reap');assert.ok(ITEMS.reaper_scythe.reach>=70);
});
test('defeating the Grim Reaper drops every set piece for manual pickup even on an unlucky roll',()=>{
 const g=new Game(()=>.999),p=g.addPlayer('keyboard');g.start();g.openingBoard=false;
 const eventIndex=EVENTS.findIndex(event=>event.kind==='grim_reaper');g.spawnEvent(eventIndex);
 const reaper=g.enemies.find(enemy=>enemy.kind==='grim_reaper');assert.ok(reaper);
 g.enemies=[reaper];g.loot=[];Object.assign(reaper,{x:p.x+32,y:p.y,hp:0});
 g.update(.016,new Map());
 const drops=g.loot.filter(loot=>loot.source==='Grim Reaper gear');
 assert.deepEqual(drops.map(loot=>loot.type).sort(),[...REAPER_SET].sort());
 assert.ok(drops.every(loot=>loot.qty===1&&loot.manualPickup));
 g.update(.016,new Map());
 assert.equal(g.loot.filter(loot=>loot.source==='Grim Reaper gear').length,REAPER_SET.length);
});
test('new rig is editable and persisted; existing event indices survive old packs',()=>{
 const m=defaultReaperMotion();assert.ok(validateReaperMotion(m));assert.ok(rigPack(EVENTS,ITEMS).grim_reaper);assert.equal(EVENTS[71].kind,'oathless_captain');
 const events=structuredClone(EVENTS);applyDefinitions({version:1,events:events.filter(e=>e.kind!=='grim_reaper')},events,{});assert.ok(events.some(e=>e.kind==='grim_reaper'));
 for(const name of ['scythe_sweep','scythe_reap','reaper_raise','reaper_channel'])for(let f=0;f<m.clips[name].length;f+=.5){const p=poseAt(m,name,f);for(const v of Object.values(p))assert.ok(v.every(Number.isFinite));}
 assert.deepEqual(Object.keys(REAPER_EQUIPMENT).sort(),['cape','chest','gloves','hand1','hand2','head','pants']);
});
test('actual Game update starts drain, and player melee cancels it',()=>{
 const g=new Game(()=>.5),p=g.addPlayer('keyboard');g.start();g.openingBoard=false;g.scenery=[];g.water=[];g.event={...EVENTS.find(e=>e.kind==='grim_reaper')};g.spawnEvent(EVENTS.findIndex(e=>e.kind==='grim_reaper'));
 const e=g.enemies.find(e=>e.kind==='grim_reaper');assert.ok(e);Object.assign(e,{x:p.x+45,y:p.y,hp:90,cooldown:0,flash:0});Object.assign(p,{faceX:1,faceY:0,attack:0});
 g.update(.016,new Map());assert.ok(e.reaperDrain);g.attack(p);assert.ok(!e.reaperDrain);assert.ok(e.reaperCooldown>17);
});

