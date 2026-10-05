import test from 'node:test';
import assert from 'node:assert/strict';
import {LobbyTelevision} from '../src/lobby-tv.mjs';
import {LobbyState,PlayableLobby} from '../src/playable-lobby.mjs';
import {Game} from '../src/core.mjs';
import {TV_SCENES,TV_CAVERN_SCENES,TV_SCENES_PER_LEVEL,TV_SECTION_TILES,tvSceneIndex} from '../src/lobby-tv-levels.mjs';

test('the lobby TV accepts two players and pauses when both walk away',()=>{
  const tv=new LobbyTelevision();
  assert.equal(tv.join('one'),true);assert.equal(tv.join('two'),true);assert.equal(tv.join('three'),false);
  tv.step(.05,{'one':{right:true},'two':{}});
  assert.ok(tv.players.get('one').x>28);
  tv.leave('one');tv.leave('two');
  const time=tv.time;tv.step(.05,{});assert.equal(tv.time,time);
  assert.equal(tv.started,true);
});

test('A at the TV takes input from practice and walking away releases it',()=>{
  const game=new Game(),player=game.addPlayer('pad:0');
  const lobby=Object.create(PlayableLobby.prototype),state=new LobbyState(),television=new LobbyTelevision();
  state.sync(game.players);Object.assign(state.members.get(player.id),{spawned:true,panel:null,x:785,y:165});
  let practiceInput;
  Object.assign(lobby,{getGame:()=>game,state,television,practice:{stepPractice(_dt,_players,members,inputs){practiceInput=inputs['pad:0'];members.get(player.id).x+=(practiceInput.walkX||practiceInput.x||0)*120;}},sync(){},draw(){},area:{querySelector:()=>({textContent:''})}});
  lobby.update(.05,{'pad:0':{tvA:true,attack:true}});
  assert.equal(television.players.has(player.id),true);
  assert.deepEqual(practiceInput,{x:0,y:0});
  assert.equal(television.players.get(player.id).jumps,0,'joining does not spend a jump');
  lobby.update(.016,{'pad:0':{tvA:false}});
  lobby.update(.016,{'pad:0':{tvA:true}});
  assert.equal(television.players.get(player.id).jumps,1,'bottom face button jumps');
  lobby.update(.016,{'pad:0':{tvX:true,tvRight:true}});
  assert.equal(television.players.get(player.id).vx,105,'left face button runs');
  lobby.update(.05,{'pad:0':{tvA:false,walkX:1}});
  assert.equal(television.players.has(player.id),false);
});

test('endless terrain, breakable bricks, enemies and respawn remain available',()=>{
  const tv=new LobbyTelevision();tv.join('one');
  assert.equal(tv.terrain(13),null);
  assert.equal(tv.terrain(28+13),tv.scene(1).gaps.includes(13)?null:'ground');
  assert.ok(tv.blocks(0,2000).some(b=>b.kind==='brick'));
  const brick=tv.blocks(0,200).find(b=>b.kind==='brick');
  const player=tv.players.get('one');
  Object.assign(player,{x:brick.x+2,y:brick.y+brick.h+1,vy:-120});
  tv.move(player,.02,true);
  assert.equal(tv.broken.has(brick.key),true);
  assert.equal(tv.particles.length,8,'broken brick emits fragments');
  for(let i=0;i<20;i++)tv.step(.05,{});
  assert.equal(tv.particles.length,0,'fragments expire');
  tv.die(player);assert.equal(player.alive,false);
  for(let i=0;i<24;i++)tv.step(.05,{});
  assert.equal(player.alive,true);
  assert.ok(tv.enemies.size>0);
});

test('14 distinct scenes shuffle reproducibly with safe seams',()=>{
 assert.equal(TV_SCENES.length,14);assert.equal(new Set(TV_SCENES.map(s=>JSON.stringify(s))).size,14);
 assert.equal(TV_CAVERN_SCENES.length,14);assert.notDeepEqual(TV_CAVERN_SCENES[0].gaps,TV_SCENES[0].gaps);
 const bag=Array.from({length:14},(_,i)=>tvSceneIndex(i+1,42));assert.equal(new Set(bag).size,14);
 assert.deepEqual(bag,Array.from({length:14},(_,i)=>tvSceneIndex(i+1,42)));
 assert.notDeepEqual(bag,Array.from({length:14},(_,i)=>tvSceneIndex(i+1,123)));
 for(const s of TV_SCENES){assert.ok(s.gaps.every(c=>c>=6&&c<=21));assert.ok(s.pipes.length);}
});

test('five sections per level lead to a jumped flag and timed castle entry on both courses',()=>{
 const tv=new LobbyTelevision(42);tv.join('one');tv.join('two');
 assert.equal(TV_SCENES_PER_LEVEL,5);
 const [a,b]=[...tv.players.values()],flag=TV_SCENES_PER_LEVEL*TV_SECTION_TILES*16+17*16;
 assert.equal(tv.terrain(TV_SCENES_PER_LEVEL*TV_SECTION_TILES+13),'ground');
 assert.ok(tv.blocks(flag-220,flag).some(v=>v.kind==='hill'));
 tv.camera=flag-150;Object.assign(a,{x:flag-10,y:104,vy:0,invulnerable:10});
 tv.step(.016,{});assert.equal(tv.finishTimer,0,'walking under the flag does not finish');
 Object.assign(a,{x:flag-10,y:80,vy:0,invulnerable:10});
 tv.step(.016,{});assert.ok(tv.flagged.has('one'));assert.ok(tv.finishTimer>0);
 Object.assign(b,{x:flag-10,y:80,vy:0,invulnerable:10});
 tv.step(.016,{});assert.ok(tv.flagged.has('two'));
 for(let i=0;i<45;i++)tv.step(.05,{});
 assert.ok(a.x>flag+80&&b.x>flag+80,'both flagged players walk into the castle');
 for(let i=0;i<123;i++)tv.step(.05,{});
 assert.equal(tv.level,2);assert.equal(tv.camera,0);assert.ok(tv.stageNotice>0);assert.equal(tv.flagged.size,0);
 assert.notDeepEqual(tv.scene(0),TV_SCENES[0]);
 tv.camera=flag-150;Object.assign(a,{x:flag-10,y:80,vy:0,invulnerable:10});
 tv.step(.016,{});assert.ok(tv.finishTimer>0);
 for(let i=0;i<123;i++)tv.step(.05,{});
 assert.equal(tv.level,2);assert.equal(tv.completed,true,'the second castle enters TV Wildbound');
});
test('two separate jump presses work; holding or pressing a third time cannot fly',()=>{
 const tv=new LobbyTelevision(42);tv.join('one');const p=tv.players.get('one');
 tv.step(.016,{one:{jump:true}});assert.equal(p.jumps,1);const first=p.vy;
 tv.step(.016,{one:{jump:true}});assert.ok(p.vy>first);assert.equal(p.jumps,1);
 tv.step(.016,{});tv.step(.016,{one:{jump:true}});assert.equal(p.jumps,2);assert.ok(p.vy< -170);
 tv.step(.016,{});tv.step(.016,{one:{jump:true}});assert.equal(p.jumps,2);assert.ok(p.vy> -170);
 for(let i=0;i<100;i++)tv.step(.016,{});assert.equal(p.grounded,true);assert.equal(p.jumps,0);
});
test('camera waits for an idle trailing player; screen edges never kill or drag them',()=>{
 const tv=new LobbyTelevision(42);tv.join('one');tv.join('two');const a=tv.players.get('one'),b=tv.players.get('two');
 Object.assign(a,{x:230,y:20,invulnerable:100});Object.assign(b,{x:32,y:104,invulnerable:100});
 for(let i=0;i<10;i++)tv.step(.016,{one:{right:true}});
 assert.equal(tv.camera,0);assert.equal(b.x,32);assert.equal(a.alive,true);assert.ok(a.x<=244);
 tv.step(.016,{one:{right:true},two:{right:true}});assert.ok(tv.camera>0);
 b.x=tv.camera;tv.step(.016,{two:{left:true}});assert.ok(b.x>=tv.camera);assert.equal(b.alive,true);
});
test('coins collect once and mushrooms absorb an enemy hit',()=>{
 const tv=new LobbyTelevision(42);tv.join('one');const p=tv.players.get('one');
 const coin=tv.pickups().find(v=>v.kind==='coin');Object.assign(p,{x:coin.x,y:coin.y});tv.step(.016,{});
 assert.equal(tv.coins,1);assert.ok(!tv.pickups().some(v=>v.key===coin.key));tv.step(.016,{});assert.equal(tv.coins,1);
 assert.equal(tv.pickups().some(v=>v.kind==='mushroom'),false,'mushrooms begin inside question blocks');
 const box=tv.blocks(0,200).find(v=>v.kind==='question');assert.ok(box);
 Object.assign(p,{x:box.x+2,y:box.y+box.h+1,vy:-120,grounded:false});tv.move(p,.02,true);
 assert.ok(tv.released.has(box.section));
 const mushroom=tv.pickups().find(v=>v.kind==='mushroom');assert.ok(mushroom.y<box.y);
 Object.assign(p,{x:mushroom.x,y:mushroom.y,vy:0});tv.step(.016,{});assert.equal(p.powered,true);
 assert.deepEqual([p.w,p.h],[14,20]);
 Object.assign(p,{x:32,y:104,vy:0,invulnerable:0});tv.enemies.set('test',{x:32,y:108,w:13,h:12,vx:0,vy:0,alive:true});tv.step(.016,{});
 assert.equal(p.alive,true);assert.equal(p.powered,false);assert.deepEqual([p.w,p.h],[12,16]);assert.ok(p.invulnerable>1);
});
test('stomping defeats a goomba and bounces the player',()=>{
 const tv=new LobbyTelevision(42);tv.join('one');const p=tv.players.get('one');Object.assign(p,{x:32,y:91,vy:50,grounded:false});
 const e={x:32,y:108,w:13,h:12,vx:0,vy:0,alive:true};tv.enemies.set('test',e);tv.step(.03,{});
 assert.equal(e.alive,false);assert.equal(p.alive,true);assert.ok(p.vy<0);assert.equal(tv.score,100);
});
test('pipes take both players underground and return to the same pipe without refilling coins',()=>{
 const tv=new LobbyTelevision(42);tv.join('one');tv.join('two');const p=tv.players.get('one');
 const pipe=tv.blocks(320,420).find(b=>b.kind==='pipe');tv.camera=200;Object.assign(p,{x:pipe.x+2,y:pipe.y-p.h,grounded:true});
 tv.step(.016,{one:{down:true}});assert.equal(tv.area,'underground');assert.equal(tv.players.size,2);assert.equal(tv.enemies.size,0);assert.equal(tv.camera,0);
 const coin=tv.pickups()[0];Object.assign(p,{x:coin.x,y:coin.y,vy:0});tv.step(.016,{});assert.equal(tv.coins,1);
 tv.pipeCooldown=0;Object.assign(p,{x:216,y:88-p.h,grounded:true,vy:0});tv.step(.016,{one:{down:true}});
 assert.equal(tv.area,'overworld');assert.equal(tv.camera,200);assert.equal(p.x,pipe.x);assert.ok([...tv.players.values()].every(p=>p.alive&&p.y+p.h===pipe.y));
 tv.enterPipe(pipe);assert.equal(tv.pickups().length,23);
 tv.reset();assert.equal(tv.area,'overworld');assert.equal(tv.coins,0);assert.equal(tv.collected.size,0);
 assert.equal(tv.released.size,0);
});
