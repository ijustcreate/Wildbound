import test from 'node:test';
import assert from 'node:assert/strict';
import {LobbyTelevision} from '../src/lobby-tv.mjs';
import {LobbyState,PlayableLobby} from '../src/playable-lobby.mjs';
import {Game} from '../src/core.mjs';
import {TV_SCENES,TV_CAVERN_SCENES,TV_SCENES_PER_LEVEL,TV_SECTION_TILES,tvSceneIndex} from '../src/lobby-tv-levels.mjs';
import {canUseLobbyTV} from '../src/lobby-scene.mjs';

test('TV interaction requires the floor beside a front controller, not behind or on the cabinet',()=>{
 for(const s of [{x:785,y:165},{x:723,y:200},{x:785,y:234},{x:723,y:234,jumpHeight:1},{x:723,y:234,groundHeight:64},{x:723,y:234,wingHover:true}])assert.equal(canUseLobbyTV(s),false,JSON.stringify(s));
 for(const x of [723,847])assert.equal(canUseLobbyTV({x,y:234}),true);
});

test('jumping near or behind the TV never joins it or snaps the explorer to a controller',()=>{
 for(const [x,y,jumpHeight]of [[785,165,0],[723,234,0],[723,234,20]]){
  const game=new Game(),p=game.addPlayer('pad:0'),state=new LobbyState(),television=new LobbyTelevision(),lobby=Object.create(PlayableLobby.prototype);
  state.sync(game.players);const s=state.members.get(p.id);Object.assign(s,{spawned:true,panel:null,x,y,jumpHeight});
  Object.assign(lobby,{getGame:()=>game,state,television,practice:{players:[],stepPractice(){}},sync(){},draw(){},area:{querySelector:()=>({textContent:''})}});
  lobby.update(.016,{'pad:0':{jump:true,tvA:true}});
  assert.equal(television.players.has(p.id),false);assert.deepEqual([s.x,s.y],[x,y]);
 }
});

test('closing a selection panel consumes its held buttons until released',()=>{
 const game=new Game(),p=game.addPlayer('pad:0'),state=new LobbyState(),lobby=Object.create(PlayableLobby.prototype);state.sync(game.players);
 const s=state.members.get(p.id);Object.assign(s,{spawned:true,panel:'environment'});let received;
 Object.assign(lobby,{getGame:()=>game,state,television:new LobbyTelevision(),nodes:new Map(),positionPanels(){},practice:{players:[],stepPractice(_dt,_p,_m,input){received=input[p.device];}},sync(){},draw(){},area:{querySelector:()=>({textContent:''})}});
 lobby.update(.016,{'pad:0':{jump:true,tvA:true}});assert.equal(received.jump,false);
 lobby.close(p);lobby.update(.016,{'pad:0':{jump:true,tvA:true}});assert.equal(received.jump,false);
 lobby.update(.016,{'pad:0':{}});lobby.update(.016,{'pad:0':{jump:true}});assert.equal(received.jump,true);
});

test('the lobby TV accepts two players and pauses when both walk away',()=>{
  const tv=new LobbyTelevision();
  assert.equal(tv.join('one'),true);assert.equal(tv.join('two'),true);assert.equal(tv.join('three'),false);
  tv.step(.05,{'one':{right:true},'two':{}});
  assert.ok(tv.players.get('one').x>28);
  tv.leave('one');tv.leave('two');
  const time=tv.time;tv.step(.05,{});assert.equal(tv.time,time);
  assert.equal(tv.started,true);
});

test('lobby TV joins the physical controller side and reserves left red and right green for solo players',()=>{
 for(const [x,slot]of [[723,0],[847,1]]){
  const game=new Game(),player=game.addPlayer('pad:0'),state=new LobbyState(),television=new LobbyTelevision(),lobby=Object.create(PlayableLobby.prototype);
  state.sync(game.players);Object.assign(state.members.get(player.id),{spawned:true,panel:null,x,y:234});
  Object.assign(lobby,{getGame:()=>game,state,television,practice:{players:[]},sound(){}});
  lobby.open(player,'television');
  assert.equal(television.players.get(player.id).slot,slot,`controller at ${x} selects seat ${slot}`);
  assert.equal(television.controllers[slot].owner,player.id);
  assert.deepEqual([state.members.get(player.id).x,state.members.get(player.id).y],[slot?847:723,234]);
 }
});

test('lobby TV keeps red left and green right when a right-side player joins first',()=>{
 const tv=new LobbyTelevision();
 assert.equal(tv.join('right',1),true);assert.equal(tv.join('left',0),true);
 assert.equal(tv.players.get('right').slot,1);assert.equal(tv.players.get('left').slot,0);
 assert.equal(tv.join('another-right',1),false,'an occupied physical controller cannot claim the same player slot');
});

test('Interact beside a controller takes input from practice and walking away releases it',()=>{
  const game=new Game(),player=game.addPlayer('pad:0');
  const lobby=Object.create(PlayableLobby.prototype),state=new LobbyState(),television=new LobbyTelevision();
  state.sync(game.players);Object.assign(state.members.get(player.id),{spawned:true,panel:null,x:723,y:234});
  let practiceInput;
  Object.assign(lobby,{getGame:()=>game,state,television,practice:{players:[],stepPractice(_dt,_players,members,inputs){practiceInput=inputs['pad:0'];members.get(player.id).x+=(practiceInput.walkX||practiceInput.x||0)*120;}},sync(){},draw(){},area:{querySelector:()=>({textContent:''})}});
  lobby.update(.05,{'pad:0':{lobbyInteract:true}});
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
test('piranha plants appear in about one quarter of lobby TV pipes, deterministically',()=>{
 const countPlants=seed=>{
  const tv=new LobbyTelevision(seed),pipes=[];
  for(let section=0;section<TV_SCENES_PER_LEVEL;section++){
   tv.camera=section*TV_SECTION_TILES*16;tv.spawnEnemies();
   pipes.push(...tv.scene(section).pipes.map(([offset])=>`${section}:${offset}`));
  }
  const plants=[...tv.enemies.values()].filter(e=>e.kind==='piranha').map(e=>{
   const match=[...tv.enemies.keys()].find(key=>tv.enemies.get(key)===e);return match?.slice('plant:'.length);
  }).sort();
  assert.ok(plants.length>=Math.floor(pipes.length/4)&&plants.length<=Math.ceil(pipes.length/4),`${plants.length} plants for ${pipes.length} pipes`);
  return plants;
 };
 assert.deepEqual(countPlants(42),countPlants(42),'same seed preserves the plant locations');
 assert.notDeepEqual(countPlants(42),countPlants(43),'seed rotates which pipes have plants');
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
 tv.pickups();const mushroom=tv.powerups.get(`powerup:${box.section}`);assert.ok(mushroom.y<box.y);mushroom.emerging=0;
 Object.assign(p,{x:mushroom.x,y:mushroom.y,vy:0});tv.step(.016,{});assert.equal(p.powered,true);
 assert.deepEqual([p.w,p.h],[14,20]);
 p.fire=false;Object.assign(p,{x:32,y:104,vy:0,invulnerable:0});tv.enemies.set('test',{x:32,y:108,w:13,h:12,vx:0,vy:0,alive:true});tv.step(.016,{});
 assert.equal(p.alive,true);assert.equal(p.powered,false);assert.deepEqual([p.w,p.h],[12,16]);assert.ok(p.invulnerable>1);
});
test('stomping defeats a goomba and bounces the player',()=>{
 const tv=new LobbyTelevision(42);tv.join('one');const p=tv.players.get('one');Object.assign(p,{x:32,y:91,vy:50,grounded:false});
 const e={x:32,y:108,w:13,h:12,vx:0,vy:0,alive:true};tv.enemies.set('test',e);tv.step(.03,{});
 assert.equal(e.alive,false);assert.equal(p.alive,true);assert.ok(p.vy<0);assert.equal(tv.score,100);
});
test('stomping a turtle converts it to a shell owned by the stomping player without stopping the game',()=>{
 const tv=new LobbyTelevision(42);tv.join('one');const p=tv.players.get('one');
 const turtle={x:32,y:108,w:13,h:12,vx:0,vy:0,alive:true,kind:'turtle'};tv.enemies.set('turtle',turtle);
 Object.assign(p,{x:32,y:91,vy:80,grounded:false,invulnerable:0,face:1});
 assert.doesNotThrow(()=>tv.step(.03,{}));
 assert.equal(turtle.kind,'shell');assert.equal(turtle.kickedBy,'one');assert.ok(p.vy<0,'the stomp bounces the player');
 assert.doesNotThrow(()=>tv.step(.03,{}),'later updates continue after the shell is created');
 assert.ok(Number.isFinite(tv.time));
});
test('pipes take both players underground and return to the same pipe without refilling coins',()=>{
 const tv=new LobbyTelevision(42);tv.join('one');tv.join('two');const p=tv.players.get('one');
 const pipe=tv.blocks(0,1400).find(b=>b.kind==='pipe'&&b.coinWorld);tv.camera=pipe.x-120;Object.assign(p,{x:pipe.x+2,y:pipe.y-p.h,grounded:true});
 const returnCamera=tv.camera;
 tv.step(.016,{one:{down:true}});assert.equal(tv.area,'underground');assert.equal(tv.players.size,2);assert.equal(tv.enemies.size,0);assert.equal(tv.camera,0);
 const coin=tv.pickups()[0];Object.assign(p,{x:coin.x,y:coin.y,vy:0});tv.step(.016,{});assert.equal(tv.coins,1);
 tv.pipeCooldown=0;Object.assign(p,{x:216,y:88-p.h,grounded:true,vy:0});tv.step(.016,{one:{down:true}});
 assert.equal(tv.area,'overworld');assert.equal(tv.camera,returnCamera);assert.ok(Math.abs(p.x-pipe.x)<2);assert.ok([...tv.players.values()].every(p=>p.alive&&p.y+p.h===pipe.y));
 tv.enterPipe(pipe);assert.equal(tv.pickups().length,pipe.coinCount-1);
 tv.reset();assert.equal(tv.area,'overworld');assert.equal(tv.coins,0);assert.equal(tv.collected.size,0);
 assert.equal(tv.released.size,0);
});

test('only marked pipes enter the coin world and each marked pipe has its own remembered coin haul',()=>{
 const tv=new LobbyTelevision(42),pipes=tv.blocks(0,5000).filter(b=>b.kind==='pipe');
 assert.ok(pipes.some(p=>p.coinWorld));assert.ok(pipes.some(p=>!p.coinWorld));
 const [first,second]=pipes.filter(p=>p.coinWorld);assert.ok(second);
 tv.enterPipe(first);const firstCoins=tv.pickups();assert.equal(firstCoins.length,first.coinCount);const key=firstCoins[0].key;tv.collected.add(key);tv.usePipe();tv.enterPipe(first);assert.equal(tv.pickups().length,first.coinCount-1);tv.usePipe();
 tv.enterPipe(second);assert.equal(tv.pickups().length,second.coinCount);assert.notEqual(tv.pickups()[0].key,key);
 assert.ok(pipes.filter(p=>p.coinWorld).some(p=>p.coinCount!==first.coinCount),'different marked pipes hold different amounts of coins');
});

test('R dashes in the chosen direction on cooldown, powered characters crouch, and turtle shells ricochet through enemies',()=>{
 const tv=new LobbyTelevision(42);tv.join('one');const p=tv.players.get('one');Object.assign(p,{x:100,y:120-20,w:14,h:20,powered:true,grounded:true,invulnerable:0});
 tv.step(.05,{one:{down:true}});assert.deepEqual([p.w,p.h],[14,16]);
 tv.step(.05,{one:{down:false,right:true,dash:true}});assert.ok(p.x>100);assert.ok(p.dashCooldown>1.7);
 for(let i=0;i<4;i++)tv.step(.05,{one:{right:true,dash:false}});assert.equal(p.dashTime,0);const cd=p.dashCooldown;tv.step(.05,{one:{right:true,dash:true}});assert.equal(p.dashTime,0);assert.ok(p.dashCooldown<cd,'R remains locked out until cooldown ends');
 const shell={x:p.x+30,y:p.y+6,w:14,h:9,vx:148,vy:0,alive:true,kind:'shell',safeTimer:0};const enemy={x:shell.x+12,y:shell.y,w:13,h:12,vx:0,vy:0,alive:true,kind:'goomba'};tv.enemies.set('shell',shell);tv.enemies.set('target',enemy);tv.step(.12,{one:{}});assert.equal(enemy.alive,false);
});

test('a flower fireball bounces, and mushrooms drift while flowers stay in place',()=>{
 const tv=new LobbyTelevision(42);tv.join('one');const p=tv.players.get('one');Object.assign(p,{x:100,y:120-20,fire:true,fireCooldown:0,grounded:true});
 tv.step(.02,{one:{attack:true}});assert.equal(tv.fireballs.length,1);const ball=tv.fireballs[0];ball.y=120-5;ball.vy=0;tv.step(.02,{});assert.ok(ball.vy<0||ball.bounces>0);
 const mushroomSection=[...Array(14).keys()].find(s=>tv.scene(s).powerup==='mushroom');const flowerSection=[...Array(14).keys()].find(s=>tv.scene(s).powerup==='flower');
 tv.released.add(mushroomSection);tv.camera=mushroomSection*448;tv.pickups();tv.powerups.get(`powerup:${mushroomSection}`).emerging=0;const mx=tv.powerups.get(`powerup:${mushroomSection}`).x;tv.step(.1,{});assert.ok(tv.powerups.get(`powerup:${mushroomSection}`).x>mx);
 if(flowerSection!==undefined){tv.released.add(flowerSection);tv.camera=flowerSection*448;tv.pickups();const flower=tv.powerups.get(`powerup:${flowerSection}`),fx=flower.x;tv.step(.1,{});assert.equal(flower.x,fx);}
});


test('sliding shells fall down real gaps and despawn below the television',()=>{
 const tv=new LobbyTelevision(42);tv.join('one');const gap=tv.scene(0).gaps[0],x=gap*16-10;tv.camera=x-80;
 Object.assign(tv.players.get('one'),{x:x-40,y:104,invulnerable:10});
 const shell={x,y:111,w:14,h:9,vx:148,vy:0,alive:true,kind:'shell',safeTimer:0};tv.enemies.set('pit-shell',shell);
 let fell=false;for(let i=0;i<90&&shell.alive;i++){tv.step(1/60,{});if(shell.y>120)fell=true;}
 assert.ok(fell,'shell descends below ground over gap');assert.equal(shell.alive,false);assert.ok(shell.y>168);
});

test('underground rooms have authored masonry roofs, block stairs, safe seams and green pipes',()=>{
 assert.ok(new Set(TV_CAVERN_SCENES.map(s=>s.name)).size===14);
 for(const s of TV_CAVERN_SCENES){assert.ok(s.ceiling.length>12);assert.ok(s.gaps.every(c=>c>=6&&c<=21));assert.ok(s.pipes.length);}
 const tv=new LobbyTelevision(42);tv.level=2;const blocks=tv.blocks(0,448);
 assert.ok(blocks.some(b=>b.kind==='ceiling'));assert.ok(blocks.some(b=>b.kind==='hill'));assert.ok(blocks.some(b=>b.kind==='pipe'));
 const brick=blocks.find(b=>b.kind==='brick');tv.breakBrick(brick);assert.ok(!tv.blocks(0,448).some(b=>b.key===brick.key));
 assert.ok(tv.blockCache.size<=96);tv.level=1;assert.ok(!tv.blocks(0,448).some(b=>b.kind==='ceiling'));
});

test('two-player camera advances smoothly without reversing or snapping on input handoffs',()=>{
 const tv=new LobbyTelevision(42);tv.join('one');tv.join('two');tv.spawnEnemies=()=>{};let last=0;
 for(let i=0;i<160;i++){for(const [id,p]of tv.players)Object.assign(p,{x:tv.camera+(id==='one'?150:65)+i*.1,y:40,vy:0,invulnerable:10});tv.step(1/60,{one:{right:i%2===0},two:{right:i%2===1}});assert.ok(tv.camera>=last);assert.ok(tv.camera-last<9,'bounded camera displacement');last=tv.camera;}
});
