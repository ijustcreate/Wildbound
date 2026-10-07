import test from 'node:test';
import assert from 'node:assert/strict';
import {Game,EVENTS} from '../src/core.mjs';
import {selectEvent,rememberEvent,eventBoss,EVENT_HISTORY_LIMIT,EVENT_COVERAGE_LIMIT} from '../src/event-director.mjs';
import {eventAvailable} from '../src/night-cycle.mjs';
import {saveSession,restoreSession} from '../src/session.mjs';

const cards=Array.from({length:16},(_,i)=>({name:`Encounter ${i}`,kind:`species-${i}`,count:1,hp:30,weight:i===15?.01:10}));
const draw=(g,events=cards,available=()=>true)=>{
 const index=selectEvent(g,events,available);
 assert.notEqual(index,null);
 rememberEvent(g,events[index],index);
 return index;
};
const make=environment=>{
 const g=new Game(()=>.37);g.seed=1234;g.environment=environment;
 g.addPlayer('keyboard','Variety reviewer');g.start();g.openingBoard=false;
 return g;
};

test('Coverage visits even low-weight events before any repeat, for fixed and extreme random sources',()=>{
 for(const fixed of [0,.37,.999999,1,NaN]){
  const g={random:()=>fixed,enemies:[]};
  for(let cycle=0;cycle<4;cycle++){
   const seen=new Set();
   for(let i=0;i<cards.length;i++)seen.add(draw(g));
   assert.equal(seen.size,cards.length);
  }
  assert.equal(g.eventDirector.counts[cards[15].name],4);
 }
});

test('Authored weights still determine the order among equally seen encounters',()=>{
 const g={random:()=>.8,enemies:[]};
 const events=[{...cards[0],weight:1},{...cards[1],weight:9}];
 assert.equal(draw(g,events),1);assert.equal(draw(g,events),0);
});

test('Different names with the same lead species do not monopolize consecutive waves',()=>{
 const g={random:()=>0,enemies:[]};
 const events=[{...cards[0],kind:'skeleton'},{...cards[1],kind:'skeleton'},{...cards[2],kind:'bat'}];
 assert.equal(draw(g,events),0);assert.equal(draw(g,events),2);assert.equal(draw(g,events),1);
});

test('Disabled, biome-locked and temporarily blocked cards do not stall a coverage cycle',()=>{
 const g={random:()=>0,enemies:[]},events=[...cards.slice(0,4),{...cards[4],weight:0}];
 let night=false;const available=(_g,e)=>night||e!==events[3];
 for(let i=0;i<3;i++)assert.equal(draw(g,events,available),i);
 assert.equal(draw(g,events,available),0);
 night=true;assert.equal(draw(g,events,available),3);
 assert.equal(g.eventDirector.counts[events[4].name],undefined);
});

test('A new appended encounter gets coverage without changing saved event indices',()=>{
 const g={random:()=>0,enemies:[]},events=cards.slice(0,5);
 for(let i=0;i<10;i++)draw(g,events);
 events.push(cards[15]);assert.equal(draw(g,events),5);
 assert.equal(g.eventDirector.recent.at(-1).index,5);
});

test('Version-one director history migrates without erasing spacing, rolls or recent encounters',()=>{
 const g={random:()=>0,enemies:[],eventDirector:{version:1,draws:9,lastBossAt:7,recent:[{index:0,name:cards[0].name,kind:cards[0].kind,type:'enemy'}]}};
 assert.equal(draw(g),1);assert.equal(g.eventDirector.version,2);
 assert.equal(g.eventDirector.draws,10);assert.equal(g.eventDirector.lastBossAt,7);
 assert.equal(g.eventDirector.counts[cards[0].name],1);
});

test('Older packaged saves use their encountered-event map to favor unseen cards',()=>{
 const g={random:()=>0,enemies:[],encounteredEvents:{[cards[0].name]:true,[cards[1].name]:true}};
 assert.equal(draw(g),2);
});

test('Coverage and history stay bounded and sanitize invalid saved counters',()=>{
 const g={random:()=>0,enemies:[],eventDirector:{version:2,counts:{bad:NaN,negative:-1,okay:2.9},recent:[],draws:Infinity}};
 draw(g);assert.equal(g.eventDirector.counts.bad,undefined);assert.equal(g.eventDirector.counts.negative,undefined);assert.equal(g.eventDirector.counts.okay,2);
 for(let i=0;i<300;i++)rememberEvent(g,{name:`Edited ${i}`,kind:'bat'},i);
 assert.equal(g.eventDirector.recent.length,EVENT_HISTORY_LIMIT);
 assert.equal(Object.keys(g.eventDirector.counts).length,EVENT_COVERAGE_LIMIT);
});

test('Small custom pools alternate safely, all-disabled pools return null and selection does not consume a card',()=>{
 const g={random:()=>0,enemies:[]},events=cards.slice(0,2);
 assert.equal(selectEvent(g,events,()=>true),0);assert.equal(selectEvent(g,events,()=>true),0);
 assert.equal(g.eventDirector.draws,0);
 for(let i=0;i<10;i++)assert.equal(draw(g,events),i%2);
 assert.equal(selectEvent(g,events.map(e=>({...e,weight:0})),()=>true),null);
});

test('First actual rolls now honor variety instead of forcing the same lion or tiger opener',()=>{
 for(const env of ['forest','temple','desert','ice','house','beach']){
  const starts=new Set();
  for(const random of [0,.25,.5,.75,.99]){
   const g=make(env);g.random=()=>random;const p=g.players[0];
   g.roll={playerId:p.id,total:2,resolved:false};g.resolveRoll();
   assert.ok(g.event);assert.ok(eventAvailable(g,g.event));assert.ok(!eventBoss(g.event));
   starts.add(g.event.name);
  }
  assert.ok(starts.size>=4,env+' opener variety');
 }
});

test('Every biome covers its daytime roster, preserves boss pacing and restores its coverage through JSON saves',()=>{
 for(const env of ['forest','temple','desert','ice','house','beach']){
  const g=make(env),expected=EVENTS.filter(e=>(e.weight??10)>0&&eventAvailable(g,e)),seen=new Set();
  let lastBoss=-99;
  for(let i=0;i<expected.length+25&&seen.size<expected.length;i++){
   const index=draw(g,EVENTS,eventAvailable),e=EVENTS[index];
   assert.ok(eventAvailable(g,e));
   if(eventBoss(e)){assert.ok(i>=3);assert.ok(i-lastBoss>=3);lastBoss=i;}
   seen.add(e.name);
  }
  assert.equal(seen.size,expected.length,env+' full available coverage');
  const reload=restoreSession(JSON.parse(JSON.stringify(saveSession(g))));
  assert.deepEqual(reload.eventDirector,JSON.parse(JSON.stringify(g.eventDirector)));
  reload.random=()=>.37;assert.equal(selectEvent(reload,EVENTS,eventAvailable),selectEvent(g,EVENTS,eventAvailable));
 }
});

test('Night-only encounters rejoin an existing daytime run rather than being starved by familiar cards',()=>{
 const g=make('forest');
 for(let i=0;i<65;i++)draw(g,EVENTS,eventAvailable);
 g.sky.elapsed=320;const nights=EVENTS.filter(e=>e.times?.includes('night')&&!e.times.includes('day')&&eventAvailable(g,e));
 const seen=new Set();for(let i=0;i<15;i++)seen.add(EVENTS[draw(g,EVENTS,eventAvailable)].name);
 assert.ok(nights.length>=3);assert.ok(nights.every(e=>seen.has(e.name)));
});

test('Bosses, active hazards and crowded waves cannot bypass safety gates just because they are unseen',()=>{
 const g=make('forest');g.eventDirector={version:2,draws:20,lastBossAt:0,recent:[],counts:Object.fromEntries(EVENTS.filter(e=>!eventBoss(e)).map(e=>[e.name,9]))};
 g.enemies=[{kind:'lion',hp:100,faction:'enemy'}];
 assert.ok(!eventBoss(EVENTS[draw(g,EVENTS,eventAvailable)]));
 g.enemies=Array.from({length:12},()=>({kind:'lion',hp:1,faction:'enemy'}));
 g.merchant={};g.mystery={done:false};g.weather={life:20};g.volcanoes=[{life:10}];
 const onlyUnsafe=EVENTS.filter(e=>!e.type||['enemy','mystery','merchant','monsoon','sandstorm','thunderstorm','blizzard','volcano'].includes(e.type));
 assert.equal(selectEvent(g,onlyUnsafe,eventAvailable),null);
});

test('A new expedition keeps coverage rather than restarting the same encounter sequence',()=>{
 const g=make('forest');for(let i=0;i<10;i++)draw(g,EVENTS,eventAvailable);
 const before=JSON.stringify(g.eventDirector);g.newExpedition();
 assert.equal(JSON.stringify(g.eventDirector),before);
});
