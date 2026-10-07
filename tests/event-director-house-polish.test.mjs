import test from 'node:test';
import assert from 'node:assert/strict';
import {Game,EVENTS} from '../src/core.mjs';
import {selectEvent,rememberEvent,eventBoss,eventUnitStats,EVENT_HISTORY_LIMIT} from '../src/event-director.mjs';
import {eventAvailable} from '../src/night-cycle.mjs';
import {creatures} from '../src/definitions.mjs';
import {saveSession,restoreSession} from '../src/session.mjs';
import {defaultHouse} from '../src/house-design.mjs';
import {drawHouseFloor,drawHouseWall,drawHouseDoor} from '../src/house-architecture-art.mjs';
const make=env=>{const g=new Game(()=>.5);g.seed=1234;g.environment=env||'forest';g.addPlayer('keyboard','Reviewer');g.start();g.openingBoard=false;return g;};
const pool=[{name:'A',kind:'lion',count:1,hp:100},{name:'B',kind:'bat',count:5,hp:24},{name:'C',kind:'snake',count:4,hp:36},{name:'D',kind:'golem',count:1,hp:200},{name:'Boss',kind:'dragon',count:1,hp:310,weight:20}];
test('Director avoids the last three events, keeps variety with a fixed random source and bounds history',()=>{
 const g={random:()=>0,players:[],enemies:[]};
 for(let n=0;n<100;n++){const i=selectEvent(g,pool,()=>true);assert.ok(!g.eventDirector.recent.slice(-3).some(e=>e.name===pool[i].name));rememberEvent(g,pool[i],i);assert.ok(g.eventDirector.recent.length<=EVENT_HISTORY_LIMIT);}
});
test('Tiny custom pools fall back safely and never select a disabled or unavailable event',()=>{
 const g={random:()=>1,players:[],enemies:[]};const events=[pool[0],{...pool[1],weight:0}];
 for(let n=0;n<8;n++){assert.equal(selectEvent(g,events,()=>true),0);rememberEvent(g,events[0],0);}
 assert.equal(selectEvent(g,events,()=>false),null);
});
test('Bosses need three preceding encounters, three breathing-room events and no surviving hostile group',()=>{
 const g={random:()=>.9999,players:[],enemies:[]};
 for(let n=0;n<3;n++){const i=selectEvent(g,pool,()=>true);assert.ok(!eventBoss(pool[i]));rememberEvent(g,pool[i],i);}
 assert.equal(selectEvent(g,pool,()=>true),4);rememberEvent(g,pool[4],4);
 for(let n=0;n<3;n++){const i=selectEvent(g,pool,()=>true);assert.notEqual(i,4);rememberEvent(g,pool[i],i);}
 g.enemies=[{kind:'lion',hp:1,faction:'enemy'}];assert.notEqual(selectEvent(g,pool,()=>true),4);
});
test('Active weather, merchant, mystery and crowded hostile groups cannot be stacked by a random roll',()=>{
 const g={random:()=>.9,players:[],enemies:Array.from({length:12},()=>({kind:'lion',hp:1,faction:'enemy'})),weather:{life:20},merchant:{},mystery:{done:false},volcanoes:[{life:20}]};
 const e=[pool[0],{name:'Rain',kind:'monsoon',type:'monsoon'},{name:'Shop',kind:'merchant',type:'merchant'},{name:'Mystery',kind:'skeleton',type:'mystery'},{name:'Crater',kind:'volcano',type:'volcano'}];
 assert.equal(selectEvent(g,e,()=>true),null);
});
test('All maps retain availability rules, nonrepetition and bounded saved selection state',()=>{
 for(const env of ['forest','temple','desert','ice','house','beach','graveyard']){
  const g=make(env);for(let n=0;n<25;n++){const i=selectEvent(g,EVENTS,eventAvailable);assert.ok(i!==null);assert.ok(eventAvailable(g,EVENTS[i]));assert.ok(!g.eventDirector.recent.slice(-3).some(e=>e.name===EVENTS[i].name));rememberEvent(g,EVENTS[i],i);}
  const restored=restoreSession(JSON.parse(JSON.stringify(saveSession(g))));assert.deepEqual(restored.eventDirector,g.eventDirector);
 }
});
test('Lion events never roll tiger cosmetics, true tigers stay distinct and legacy save migration preserves custom art',()=>{
 const g=make('temple');g.round=10;g.random=()=>0;g.spawnEvent(0);assert.ok(g.enemies.some(e=>e.kind==='lion'));assert.ok(g.enemies.filter(e=>e.kind==='lion').every(e=>e.skin==='lion'));
 g.enemies=[];g.spawnEvent(EVENTS.findIndex(e=>e.kind==='tiger'));assert.equal(g.enemies.length,2);assert.ok(g.enemies.every(e=>e.kind==='tiger'&&e.skin==='tiger'));
 g.enemies.push({kind:'lion',skin:'tiger',id:990,hp:100},{kind:'lion',skin:'tiger',id:991,hp:100,rigOverride:{type:'quadruped'}});
 const restored=restoreSession(JSON.parse(JSON.stringify(saveSession(g))));assert.equal(restored.enemies.find(e=>e.id===990).skin,'lion');assert.equal(restored.enemies.find(e=>e.id===991).skin,'tiger');
});
test('Every encounter uses its own author stats; squad, edited species and explicit unit overrides have stable priority',()=>{
 const g=make();for(const name of ['The stone remembers','The stoneguard patrol','Cinder in the canopy','The armory wakes']){g.enemies=[];g.spawnEvent(EVENTS.findIndex(e=>e.name===name));const event=g.event,lead=g.enemies.find(e=>e.kind===event.kind);assert.equal(lead.hp,event.hp,name);assert.equal(lead.maxHp,event.hp);}
 const event=EVENTS.find(e=>e.name==='The stoneguard patrol');assert.deepEqual(eventUnitStats(event,null,'archer',creatures),event.squadStats.archer);
 const definitions={lion:{edited:true,stats:{hp:155,speed:61,damage:19}}};assert.equal(eventUnitStats(pool[0],null,'lion',definitions).hp,155);assert.equal(eventUnitStats(pool[0],{manualOverride:true,hp:90},'lion',definitions).hp,90);
});
test('Default event roster has unique save keys, two-line flavor and actionable tips without generic placeholder copy',()=>{
 assert.equal(EVENTS.length,69);assert.equal(new Set(EVENTS.map(e=>e.name)).size,69);assert.equal(EVENTS[59].kind,'old_well');assert.ok(EVENTS.slice(60).every(e=>e.environment==='graveyard'));
 for(const e of EVENTS){assert.equal(e.verse.split('\n').length,2,e.name);assert.ok(e.tip.length>=25,e.name);assert.ok(!e.verse.startsWith('The wild wakes beneath the sky'),e.name);if(!e.type||e.type==='enemy'){assert.ok(creatures[e.kind],e.name);assert.ok(e.count>=1&&e.count<=20);}}
});
test('Native House architecture is read-only, balanced and honors saved open doors and floor bounds',()=>{
 const h=defaultHouse(),saved=structuredClone(h),calls=[];let balance=0;
 const c=new Proxy({save:()=>balance++,restore:()=>balance--},{get:(t,k)=>k in t?t[k]:(...args)=>calls.push([k,...args]),set:(t,k,v)=>{t[k]=v;return true;}});
 drawHouseFloor(c,h);for(const b of h.walls)if(b.kind!=='window')drawHouseWall(c,b);for(const d of h.doors){drawHouseDoor(c,d);drawHouseDoor(c,{...d,open:true});}
 assert.equal(balance,0);assert.deepEqual(h,saved);assert.ok(calls.filter(c=>c[0]==='fillRect').length>100);assert.ok(calls.some(c=>c[0]==='clip'));
});
