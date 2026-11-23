import test from 'node:test';
import assert from 'node:assert/strict';
import {BIOME_MIXED_EVENTS as cards,planBiomeEncounter as plan,encounterBiome,encounterContext,mixedEncounterDue,mixedPressureAllows,biomeEncounterSpot} from '../src/biome-encounters.mjs';
const setup=(n=1,progress=20)=>({generatedEnvironment:'forest',players:Array.from({length:n},(_,i)=>({id:i+1,x:800+i*30,y:800,hp:100,progress})),enemies:[],effects:[]});
test('ten biomes have two distinct small authored mixed encounters each',()=>{
 assert.equal(cards.length,20);assert.equal(new Set(cards.map(e=>e.name)).size,20);
 const zones=['forest','desert','ice','house','temple','graveyard','beach','swamp','caverns','shadow'];
 for(const zone of zones)assert.equal(cards.filter(e=>e.environment===zone).length,2,zone);
 for(const e of cards){assert.equal(e.enemies.length,3);assert.notEqual(e.enemies[0].kind,e.enemies[1].kind);assert.equal(e.verse.split('\n').length,2);assert.ok(e.tip.length>45);assert.ok(e.weight>0&&!e.devOnly);assert.equal(e.role,'ordinary');for(const u of e.enemies){assert.ok(u.hp<=120&&u.damage<=14);}}
});
test('early and later solo/co-op scale composition without inflating authored health or damage',()=>{
 for(const event of cards)for(const progress of [0,20])for(let n=1;n<=6;n++){
  const g=setup(n,progress),p=plan(g,event),expected=Math.min(6,(progress?3:2)+Math.min(4,n)-1);
  assert.equal(p.members.length,expected,event.name);assert.equal(p.partySize,Math.min(n,4));
  for(let i=0;i<Math.min(expected,3);i++){assert.equal(p.members[i].hp,event.enemies[i].hp);assert.equal(p.members[i].damage,event.enemies[i].damage);}
  assert.ok(p.members.filter(u=>['skeleton_caster','skeleton_wizard','necromancer'].includes(u.kind)||u.shoreRole==='healer').length<=1);
  assert.ok(p.members.filter(u=>u.combatRole==='shield').length<=1);
 }
});

test('every introductory pair has a distinct combat signature and matching advice',()=>{
 const signatures=cards.map(e=>e.enemies.slice(0,2).map(u=>u.kind+':'+(u.combatRole||'')).sort().join('|'));
 assert.equal(new Set(signatures).size,20);
 for(const e of cards){const small=plan(setup(1,0),e),full=plan(setup(),e);assert.equal(small.tip,e.pairTip);assert.ok(small.tip.length>40);assert.equal(full.tip,e.tip);}
});
test('only nearby living available explorers count, and the roller anchors the encounter',()=>{
 const g=setup(6);g.roll={playerId:2};g.players[1].x=2000;
 for(const p of g.players)if(p.id!==2)p.x=800;
 assert.equal(plan(g,cards[0]).partySize,1);assert.equal(plan(g,cards[0]).anchorId,2);
 g.players[0].x=2010;assert.equal(plan(g,cards[0]).partySize,2);
 for(const flag of ['disconnected','lobbyDisconnected','unavailable','spectator','ui']){g.players[0][flag]=true;assert.equal(plan(g,cards[0]).partySize,1,flag);delete g.players[0][flag];}
 g.players[0].hp=0;assert.equal(plan(g,cards[0]).partySize,1);
});
test('unresolved pressure reduces groups to a pair and never admits a one-species fragment',()=>{
 const g=setup();g.enemies=Array.from({length:3},(_,i)=>({id:20+i,kind:'skeleton',hp:20,x:850,y:800,faction:'enemy'}));
 assert.equal(plan(g,cards[0]).members.length,2);g.enemies.push({...g.enemies[0],id:30});assert.equal(plan(g,cards[0]),null);
 g.enemies.forEach(e=>e.x=3000);assert.equal(plan(g,cards[0]).members.length,3);
});
test('solo and duo get no fresh patrol on top of a nearby boss',()=>{
 const g=setup();for(const kind of ['dragon','hunter','krampus','succubus']){g.enemies=[{kind,hp:400,x:900,y:800,faction:'enemy'}];assert.equal(plan(g,cards[0]),null,kind);}
 g.players.push({...g.players[0],id:2});assert.equal(plan(g,cards[0]),null);
 g.players.push({...g.players[0],id:3});assert.ok(plan(g,cards[0]));
 g.enemies[0].faction='ally';assert.equal(plan(g,cards[0]).members.length,5);
});

test('incoming heavy pairs respect the same weighted local budget as existing heavies',()=>{
 const g=setup(),event=cards.find(e=>e.enemies[0].kind==='golem');
 g.enemies=Array.from({length:3},(_,i)=>({id:20+i,kind:'skeleton',hp:20,x:850,y:800}));
 assert.equal(plan(g,event),null,'a two-body heavy pair costs three pressure, not two');
 g.enemies.pop();assert.equal(plan(g,event).members.length,2,'trim the third member while retaining a coherent pair');
});
test('dangerous weather caps even a four-player group at two bodies',()=>{
 const g=setup(4);g.weather={type:'blizzard',life:20};assert.equal(plan(g,cards[0]).members.length,2);
 g.weather=null;g.volcanoes=[{x:850,y:800,life:20}];assert.equal(plan(g,cards[0]).members.length,2);
});
test('ordinary random waves also respect the local budget while a mixed patrol is unresolved',()=>{
 const g=setup();g.enemies=[{kind:'skeleton',hp:40,x:900,y:800,biomeMixed:true,faction:'enemy'},{kind:'archer',hp:30,x:950,y:800,biomeMixed:true,faction:'enemy'}];
 assert.equal(mixedPressureAllows(g,{kind:'lion',count:5}),false);assert.ok(mixedPressureAllows(g,{kind:'lion',count:2}));assert.ok(mixedPressureAllows(g,{kind:'merchant',type:'merchant'}));
 g.enemies=[];assert.ok(mixedPressureAllows(g,{kind:'lion',count:5}),'legacy rosters retain their independent policy without a mixed group');
});
test('mixed cadence counts local combat cards and resets after a mixed group',()=>{
 const g=setup(),ordinary={type:'enemy',role:'ordinary',zone:'forest'};
 assert.equal(mixedEncounterDue(g,[ordinary,ordinary]),false);assert.ok(mixedEncounterDue(g,[ordinary,ordinary,ordinary]));
 assert.equal(mixedEncounterDue(g,[ordinary,ordinary,{...ordinary,mixed:true},ordinary]),false);
 assert.equal(mixedEncounterDue(g,[ordinary,ordinary,{...ordinary,role:'peaceful'}]),false);
 assert.equal(mixedEncounterDue(g,[ordinary,ordinary,{...ordinary,zone:'ice'}]),false);
});
test('Wild Lands uses actual terrain/portal region while preserving the game world settings',()=>{
 const g=setup();g.trainTest={design:{wildLands:true}};
 for(const [x,y,zone]of [[3000,1850,'temple'],[8200,4300,'ice'],[13200,2400,'swamp'],[3300,7800,'graveyard'],[8000,7800,'house']]){Object.assign(g.players[0],{x,y});assert.equal(encounterBiome(g),zone);assert.equal(encounterContext(g).generatedEnvironment,zone);assert.equal(g.generatedEnvironment,'forest');}
 g.trainTest.design.activeRoom='shadow';assert.equal(encounterBiome(g),'shadow');g.trainTest.design.activeRoom='diagon';assert.equal(plan(g,cards[0]),null);
});
test('arrival placement is off the party, collision checked, and keeps authored cards and floor effects unchanged',()=>{
 const g=setup(4),before=JSON.stringify(cards);g.blocked=(x,y)=>x>1050;
 const p=plan(g,cards[0]);
 for(const [i,u]of p.members.entries()){const spot=biomeEncounterSpot(g,p,u,i,0);assert.ok(spot);assert.ok(!g.blocked(spot.x,spot.y));assert.ok(g.players.every(q=>Math.hypot(q.x-spot.x,q.y-spot.y)>=180));g.enemies.push({...u,...spot,hp:u.hp});}
 assert.equal(JSON.stringify(cards),before);assert.equal(g.effects.length,0);g.blocked=()=>true;assert.equal(biomeEncounterSpot(g,p,p.members[0],0,0),null);
});
