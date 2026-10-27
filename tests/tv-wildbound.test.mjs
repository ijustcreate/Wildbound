import test from 'node:test';
import assert from 'node:assert/strict';
import {LobbyTelevision} from '../src/lobby-tv.mjs';
import {TV_CAVERN_SCENES,TV_SCENES_PER_LEVEL,TV_SECTION_TILES} from '../src/lobby-tv-levels.mjs';
import {TvWildbound,TV_WILDBOUND_GOAL,TV_WILDBOUND_WIDTH,TV_BOARD_X,TV_WILDBOUND_SCENE_TEMPLATES} from '../src/tv-wildbound.mjs';
import {Game} from '../src/core.mjs';
import {LobbyState,PlayableLobby} from '../src/playable-lobby.mjs';
import {LobbyPractice} from '../src/lobby-practice.mjs';
import {count,SLOTS,ITEMS} from '../src/items.mjs';
import {tickBlockParticles} from '../src/tv-block-art.mjs';

function playableTv(){
  const game=new Game(),heroes=[game.addPlayer('pad:0'),game.addPlayer('pad:1')],state=new LobbyState();state.sync(heroes);
  for(const p of heroes)Object.assign(state.members.get(p.id),{spawned:true,panel:null});
  const mode=new TvWildbound(heroes,12);mode.intro=2.8;mode.enemies=[];
  const lobby=Object.create(PlayableLobby.prototype);Object.assign(lobby,{getGame:()=>game,state,tvWildbound:mode,practice:new LobbyPractice(),sync(){},draw(){}});
  const tick=(inputs={})=>lobby.update(.05,inputs);
  return {game,heroes,mode,lobby,tick};
}
test('TV jump never inherits normal attack, and inventory navigation remains owned by its controller',()=>{
  const {game,heroes:[p,q],mode,tick}=playableTv();p.inventory=[{type:'sword',qty:1}];q.inventory=[{type:'stick',qty:1}];
  const actor=mode.players.get(p.id);actor.x=TV_BOARD_X;
  tick({'pad:0':{tvA:true,attack:true,lobbyInteract:true}});assert.equal(mode.progress,0);assert.ok(actor.vy<0);
  tick();tick({'pad:0':{inventory:true}});assert.ok(p.ui);assert.equal(q.ui,null);const position=[actor.x,actor.y];
  tick();tick({'pad:1':{inventory:true}});tick();tick({'pad:1':{next:true}});assert.equal(p.ui.index,0);assert.equal(q.ui.index,1);
  tick({'pad:0':{use:true,attack:true,tvA:true}});assert.equal(p.equipment.hand1,'sword');assert.deepEqual([actor.x,actor.y],position);assert.equal(mode.progress,0);
  tick();tick({'pad:0':{close:true}});assert.equal(p.ui,null);assert.ok(q.ui);assert.equal(game.phase,'lobby');
});
test('TV inventory drops gear and stacks into its own level, preserving sockets and manual pickup',()=>{
  const {game,heroes:[p],mode,tick}=playableTv();p.inventory=[{type:'potion',qty:3}];p.equipment.hand1='sword';p.equipmentSockets={hand1:['azure_bead']};tick();game.openInventory(p);
  game.inventoryAction(p,'dropOne');assert.equal(count(p,'potion'),2);assert.equal(mode.loot[0].qty,1);assert.equal(game.loot.length,0);
  game.inventoryAction(p,'panel:gear');p.ui.index=SLOTS.indexOf('hand1');
  game.inventoryAction(p,'drop');assert.equal(p.equipment.hand1,null);const item=mode.loot.find(i=>i.type==='sword');assert.deepEqual(item.sockets,['azure_bead']);
  game.inventoryAction(p,'close');const actor=mode.players.get(p.id);Object.assign(actor,{x:item.x,y:437});for(let i=0;i<20;i++)tick();assert.ok(mode.loot.includes(item),'manual drops do not auto-vacuum');
  tick({'pad:0':{interact:true}});assert.ok(p.inventory.some(i=>i?.type==='sword'&&i.sockets?.[0]==='azure_bead'));assert.equal(Object.keys(game).includes('tvWorld'),false);
});
test('Question blocks release one mushroom and bounded, expiring break shards',()=>{
  const {heroes:[hero],mode}=playableTv(),p=mode.players.get(hero.id),block=mode.blocks[10];hero.inventory=[];p.x=block.x;
  mode.step(.05,{[hero.id]:{jump:true}});assert.equal(block.used,true);assert.equal(mode.loot.length,1);assert.equal(mode.blockParticles.length,12);
  for(let i=0;i<25;i++)mode.step(.05,{});assert.equal(mode.blockParticles.length,0);assert.equal(count(hero,'unknown_mushroom'),1);
  mode.step(.05,{[hero.id]:{jump:true}});assert.equal(mode.loot.length,0);assert.equal(mode.blockParticles.length,0,'used blocks cannot duplicate rewards');
  const particles=Array.from({length:128},()=>({x:0,y:0,vx:1,vy:1,age:0,life:.1}));tickBlockParticles(particles,.2);assert.equal(particles.length,0);
});
test('Board rolls require a facing grounded strike; holding attack through the reveal cannot reroll',()=>{
  const mode=new TvWildbound([{id:1}],5),p=mode.players.get(1);mode.intro=2.8;mode.enemies=[];p.x=TV_BOARD_X-50;p.face=-1;
  mode.step(.05,{1:{attack:true}});assert.equal(mode.progress,0);mode.step(.05,{});p.face=1;mode.step(.05,{1:{attack:true}});const progress=mode.progress;assert.ok(progress>0);
  for(let i=0;i<100;i++)mode.step(.05,{1:{attack:true}});assert.equal(mode.progress,progress);
  mode.step(.05,{});mode.step(.05,{1:{attack:true}});assert.ok(mode.progress>progress);
});

test('Finishing the 2D world creates one level-scaled party treasure chest without changing expedition rewards',()=>{
  const {game,heroes:[p,q],mode,tick}=playableTv();p.level=q.level=12;mode.progress=TV_WILDBOUND_GOAL;
  const actor=mode.players.get(p.id);Object.assign(actor,{x:TV_WILDBOUND_WIDTH-96,y:437,vy:0});
  tick({'pad:0':{tvRight:true}});assert.equal(mode.won,true);assert.equal(mode.victoryRewards.length,7);
  assert.ok(mode.victoryRewards.some(item=>ITEMS[item.type].rarity==='legendary'));
  const rewards=structuredClone(mode.victoryRewards),pool=mode.victoryRewards;mode.finish();for(let i=0;i<100;i++)tick();
  assert.equal(mode.victoryRewards,pool);assert.deepEqual(pool,rewards);assert.equal(game.victoryRewards,undefined);
  assert.equal(game.phase,'lobby');assert.equal(p.progress,0);
});

test('2D treasure opens for its owner, stays shared across reopen/co-op, and must be looted before returning',()=>{
  const {game,heroes:[p,q],mode,lobby,tick}=playableTv();p.inventory=[];q.inventory=[];mode.finish();tick();
  let returns=0;lobby.returnFromTv=()=>{returns++;for(const hero of game.players)hero.ui=null;};
  const pool=mode.victoryRewards,total=pool.length;
  tick({'pad:0':{interact:true}});assert.equal(p.ui.storage,'tv-victory');assert.equal(q.ui,null);assert.equal(game.storageFor(p),pool);
  assert.equal(pool.filter(Boolean).length,total,'opening does not also loot');game.inventoryAction(p,'tvReturn');assert.equal(mode.requestLobbyReturn,false);
  tick();tick({'pad:0':{use:true}});assert.equal(p.inventory.filter(Boolean).length,1);assert.equal(pool.filter(Boolean).length,total-1);
  tick();tick({'pad:0':{close:true}});tick();tick({'pad:1':{interact:true}});assert.equal(q.ui.storage,'tv-victory');assert.equal(game.storageFor(q),pool);
  game.inventoryAction(q,'lootAll');assert.equal(pool.some(Boolean),false);assert.equal(q.inventory.filter(Boolean).reduce((sum,item)=>sum+item.qty,0),total-1);assert.equal(returns,0);
  tick();tick({'pad:1':{use:true}});assert.equal(returns,1);assert.equal(p.ui,null);assert.equal(q.ui,null);
});

test('Full backpacks cannot destroy 2D victory rewards or trigger an early lobby return',()=>{
  const {game,heroes:[p],mode,tick}=playableTv();p.inventory=Array.from({length:24},()=>({type:'sword',qty:1}));mode.finish();tick();
  tick({'pad:0':{interact:true}});const before=structuredClone(mode.victoryRewards);
  game.inventoryAction(p,'lootAll');game.inventoryAction(p,'tvReturn');assert.deepEqual(mode.victoryRewards,before);assert.equal(mode.requestLobbyReturn,false);assert.match(p.ui.notice,/full|room/i);
  game.inventoryAction(p,'close');game.openInventory(p);game.inventoryAction(p,'drop');assert.equal(p.inventory.filter(Boolean).length,23);
  game.openInventory(p,'tv-victory');game.inventoryAction(p,'use');assert.equal(mode.victoryRewards.filter(Boolean).length,before.length-1);
});

test('Returning after TV treasure persists actual heroes, closes party loot panels and retains lobby selections',()=>{
  const {game,heroes,mode,lobby}=playableTv();let saved=0,kept=0;game.persist=()=>{saved++;assert.ok(heroes.every(p=>!p.ui));};
  mode.finish();mode.victoryRewards.fill(null);for(const p of heroes)game.openInventory(p,'tv-victory');
  lobby.reset=()=>{delete game.tvWorld;lobby.tvWildbound=null;};lobby.keepSelectedPlayers=()=>kept++;
  lobby.returnFromTv();assert.equal(saved,1);assert.equal(kept,1);assert.equal(lobby.tvWildbound,null);assert.equal(game.phase,'lobby');
});

test('TV level 2 has its own scenes and its castle transfers the party',()=>{
  const tv=new LobbyTelevision(42);tv.join('one');tv.join('two');
  tv.nextLevel();assert.equal(tv.level,2);
  assert.equal(tv.scene(0),TV_CAVERN_SCENES[0]);
  const p=tv.players.get('one'),flag=TV_SCENES_PER_LEVEL*TV_SECTION_TILES*16+17*16;
  tv.camera=flag-180;Object.assign(p,{x:flag-60,y:80,grounded:false,invulnerable:10});
  tv.step(.016,{one:{right:true}});assert.equal(tv.completed,false);
  Object.assign(p,{x:flag-12,y:80,vy:0,grounded:false});tv.step(.05,{one:{right:true}});
  assert.ok(tv.finishTimer>0);
  for(let i=0;i<121;i++)tv.step(.05,{});
  assert.equal(tv.level,2);assert.equal(tv.completed,true);assert.equal(tv.players.size,2);
  const time=tv.time;tv.step(.05,{});assert.equal(tv.time,time);
});

test('2D board rolls on a fresh hit and remains isolated from the normal game',()=>{
  const hero={id:'one',name:'Scout',appearance:{},equipment:{}};
  const mode=new TvWildbound([hero],7),p=mode.players.get('one');
  mode.step(2.8);assert.equal(mode.ready,false,'intro advances with bounded frame time');
  for(let i=0;i<56;i++)mode.step(.05);
  assert.equal(mode.ready,true);
  p.x=TV_BOARD_X;mode.step(.016,{one:{attack:true}});
  assert.ok(mode.progress>=1&&mode.progress<=6);const progress=mode.progress;
  mode.step(.016,{one:{attack:true}});assert.equal(mode.progress,progress,'holding hit does not reroll');
  for(let i=0;i<90;i++)mode.step(.05,{one:{attack:false}});
  mode.step(.016,{one:{attack:true}});
  assert.ok(mode.progress>progress);
  assert.deepEqual(new Set(mode.enemies.map(e=>e.kind)),new Set(['goomba','skeleton','skeleton_unarmed','archer','lion','tiger','bat']));
  assert.equal(hero.progress,undefined);
});

test('2D movement scrolls, goombas stomp, and the exit requires board progress',()=>{
  const mode=new TvWildbound([{id:'one',name:'Scout'}],12),p=mode.players.get('one');
  for(let i=0;i<57;i++)mode.step(.05);
  const goomba=mode.enemies.find(e=>e.kind==='goomba');
  Object.assign(p,{x:goomba.x,y:goomba.y-31,vy:250,grounded:false,invulnerable:0});
  mode.step(.03);assert.equal(goomba.alive,false);assert.ok(p.vy<0);
  Object.assign(p,{x:1700,y:437,vy:0});mode.step(.016,{one:{right:true}});assert.ok(mode.camera>0);
  Object.assign(p,{x:TV_WILDBOUND_WIDTH-101,y:437,vy:0});mode.step(.05,{one:{right:true}});
  assert.equal(mode.won,false);
  mode.progress=TV_WILDBOUND_GOAL;mode.step(.05,{one:{right:true}});
  assert.equal(mode.won,true);
});

test('final board progress can call WILDBOUND at the center without reaching the far gate',()=>{
 const mode=new TvWildbound([{id:'one',name:'Scout'}],12),p=mode.players.get('one');mode.intro=2.8;mode.enemies=[];mode.progress=TV_WILDBOUND_GOAL;
 Object.assign(p,{x:TV_BOARD_X,y:437,grounded:true});mode.step(.05,{one:{loot:true}});
 assert.equal(mode.won,true);assert.match(mode.message,/Scout calls WILDBOUND/);assert.ok(p.x<TV_WILDBOUND_WIDTH-100,'the player remains at the center board');
});

test('side-view archer fires, cats chase, and bats swoop through the player lane',()=>{
  const mode=new TvWildbound([{id:'one',name:'Scout'}],5),p=mode.players.get('one');
  for(let i=0;i<57;i++)mode.step(.05);
  const archer=mode.enemies.find(e=>e.kind==='archer');
  Object.assign(p,{x:archer.x-100,y:437,invulnerable:10});mode.camera=archer.x-350;archer.cooldown=0;
  mode.step(.016);assert.equal(mode.projectiles.length,1);assert.ok(mode.projectiles[0].vx<0);
  const lion=mode.enemies.find(e=>e.kind==='lion');
  Object.assign(p,{x:lion.x-90,y:437});const before=lion.x;
  mode.step(.05);assert.ok(lion.x<before,'lion turns and charges toward the player');
  const bat=mode.enemies.find(e=>e.kind==='bat');
  const heights=[];for(let i=0;i<90;i++){mode.step(.05);heights.push(bat.y);}
  assert.ok(Math.max(...heights)>390,'bat reaches the grounded player lane');
});

test('TV Wildbound builds a seed-shuffled course from reusable scene templates',()=>{
 const a=new TvWildbound([],42),b=new TvWildbound([],42),other=new TvWildbound([],43);
 assert.equal(a.scenes.length,TV_WILDBOUND_SCENE_TEMPLATES.length);
 assert.deepEqual(a.scenes.map(s=>s.name),b.scenes.map(s=>s.name),'same seed repeats the scene order');
 assert.notDeepEqual(a.scenes.map(s=>s.name),other.scenes.map(s=>s.name),'new seed changes the course');
 assert.equal(new Set(a.scenes.map(s=>s.name)).size,a.scenes.length,'each course uses every template once');
 assert.equal(a.blocks.length,a.scenes.reduce((n,s)=>n+s.blocks.length,0));
 for(const block of a.blocks)assert.ok(block.x>=0&&block.x<TV_WILDBOUND_WIDTH&&block.y<437);
 assert.ok(a.enemies.some(e=>e.kind==='archer')&&a.enemies.some(e=>e.kind==='tiger'));
});

test('TV Wildbound dodge triggers a directional burst with a cooldown',()=>{
 const mode=new TvWildbound([{id:'one',name:'Scout'}],42),p=mode.players.get('one');mode.intro=2.8;mode.enemies=[];
 Object.assign(p,{x:200,y:437,face:1});mode.step(.05,{one:{right:true,dash:true}});
 assert.equal(p.dashDirection,1);assert.ok(p.x>220,'dash travels faster than a normal run');assert.ok(p.dashCooldown>.6);
 const before=p.x;mode.step(.05,{one:{right:true,dash:true}});assert.ok(p.x>before,'held dash continues briefly');
 p.dashTime=0;const cooldown=p.dashCooldown;mode.step(.05,{one:{right:true,dash:false}});mode.step(.05,{one:{right:true,dash:true}});
 assert.ok(Math.abs(p.dashCooldown-(cooldown-.1))<1e-8);assert.equal(p.dashTime,0,'dash cannot retrigger during cooldown');
});

test('equipped bows spend arrows and wands spend mana to hit enemies at range',()=>{
 const enemy=()=>({kind:'goomba',home:160,x:160,y:437,w:28,h:25,speed:38,hp:1,face:-1,phase:0,alive:true,hit:0,cooldown:0});
 const archer={id:'archer',name:'Archer',inventory:[{type:'arrow',qty:2}],equipment:{hand1:'starter_bow'},mana:100,maxMana:100};
 const bowMode=new TvWildbound([archer],7),bowPlayer=bowMode.players.get(archer.id);bowMode.intro=2.8;bowMode.camera=0;bowMode.enemies=[enemy()];Object.assign(bowPlayer,{x:80,y:437,face:1});
 bowMode.step(.01,{archer:{attack:true}});assert.equal(count(archer,'arrow'),1);assert.equal(bowMode.projectiles[0].kind,'arrow');
 for(let i=0;i<6&&bowMode.enemies[0].alive;i++)bowMode.step(.05,{archer:{attack:false}});
 assert.equal(bowMode.enemies[0].alive,false,'arrow hits defeat a one-health enemy');

 const mage={id:'mage',name:'Mage',inventory:[],equipment:{hand1:'starter_wand'},mana:100,maxMana:100};
 const wandMode=new TvWildbound([mage],8),wandPlayer=wandMode.players.get(mage.id);wandMode.intro=2.8;wandMode.camera=0;wandMode.enemies=[enemy()];Object.assign(wandPlayer,{x:80,y:437,face:1});
 wandMode.step(.01,{mage:{attack:true}});assert.equal(wandMode.projectiles[0].kind,'magic');assert.ok(mage.mana<100);
 for(let i=0;i<8&&wandMode.enemies[0].alive;i++)wandMode.step(.05,{mage:{attack:false}});
 assert.equal(wandMode.enemies[0].alive,false,'wand bolts hit at range');
});

test('jumping on an armored enemy head defeats it and bounces the explorer',()=>{
 const mode=new TvWildbound([{id:'one',name:'Scout'}],13),p=mode.players.get('one');mode.intro=2.8;mode.enemies=[{kind:'skeleton',home:200,x:200,y:437,w:37,h:52,speed:0,hp:2,face:1,phase:0,alive:true,hit:0,cooldown:0}];
 Object.assign(p,{x:200,y:437-52-7,vy:180,grounded:false,invulnerable:0});mode.step(.03,{});
 assert.equal(mode.enemies[0].alive,false);assert.ok(p.vy<0,'successful stomp bounces the player');
});

test('lobby switches to the TV world without starting or mutating its regular game',()=>{
  const game=new Game(),hero=game.addPlayer('keyboard','Scout');
  const state=new LobbyState(),television=new LobbyTelevision(7);
  state.sync(game.players);Object.assign(state.members.get(hero.id),{spawned:true,panel:null,x:785,y:165});
  television.join(hero.id);television.completed=true;
  const lobby=Object.create(PlayableLobby.prototype);
  Object.assign(lobby,{getGame:()=>game,state,television,practice:{stepPractice(){}},sync(){},draw(){},panels:{replaceChildren(){}},area:{querySelector:()=>({textContent:''})},root:{querySelector:()=>({textContent:''})}});
  lobby.update(.016,{});
  assert.ok(lobby.tvWildbound instanceof TvWildbound);
  const firstScenes=lobby.tvWildbound.scenes.map(scene=>scene.name);
  lobby.tvWildbound=null;
  lobby.update(.016,{});
  assert.notDeepEqual(lobby.tvWildbound.scenes.map(scene=>scene.name),firstScenes,'a second visit should shuffle the scene order');
  assert.equal(game.phase,'lobby');assert.equal(game.players[0],hero);
  assert.equal(hero.progress,0);
});
