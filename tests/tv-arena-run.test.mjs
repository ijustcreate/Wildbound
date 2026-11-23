import test from 'node:test';
import assert from 'node:assert/strict';
import {TvWildbound,TV_BOARD_X} from '../src/tv-wildbound.mjs';
import {startEncounter,openArenaBlessings,damageBriarHeart,previewEncounters,tickArenaRun,tickBlessings,arenaLoadout,tickArenaProjectiles,moveArenaEnemy,ammoCapacity} from '../src/tv-arena-run.mjs';
const create=(party=[{id:'one',name:'Lumen',equipment:{},inventory:[]}])=>{const m=new TvWildbound(party,42);m.intro=3;return {m,p:m.players.get(party[0].id)};};
const tick=(m,n,input={})=>{for(let i=0;i<n;i++)m.step(1/60,input);};
const enemy=(m,kind,x=1500,y=437)=>{const e=m.spawnAt({x,y,face:-1},kind);e.emerging=0;return e;};
const clear=(m)=>{m.rollView=null;m.waveQueue=[];for(const e of m.enemies)e.alive=false;for(const s of m.roundObjects)s.collected=true;tickArenaRun(m,.016,{});};
const choose=(m,commands)=>{if(m.pendingBlessing)openArenaBlessings(m);tickBlessings(m,.1,{});tickBlessings(m,.2,{});tickBlessings(m,.016,commands);};

test('board rolls credit progress immediately and fresh strikes can roll during encounters',()=>{
 const {m,p}=create();assert.equal(previewEncounters(m).length,6);p.x=TV_BOARD_X;m.step(.016,{one:{attack:true}});
 const first=m.lastRoll;assert.equal(m.progress,first);assert.equal(m.roll(),false);tick(m,120,{one:{attack:true}});assert.equal(m.wave,1);
 m.step(.016,{});m.step(.016,{one:{attack:true}});assert.equal(m.wave,2);assert.equal(m.progress,first+m.lastRoll);
});
test('marked seeds and guards are optional bonus goals, not a board lock',()=>{
 const {m}=create();startEncounter(m,3,'one');assert.equal(m.progress,3);assert.equal(m.roundObjects.length,5);assert.equal(m.roll(),true);assert.ok(m.progress>3);
});
test('Briar Hearts emit fixed lanes and destroying their source removes its hazards',()=>{
 const {m,p}=create();startEncounter(m,5,'one');const root=m.thornRoots[0];p.invulnerable=0;p.x=root.x;p.y=root.y;
 for(let i=0;i<16;i++)tickArenaRun(m,.05,{});assert.equal(m.hp,undefined);assert.ok(m.hazards.length>0);assert.ok(m.hazards.every(h=>m.thornRoots.some(r=>r.id===h.source)));
 const xs=m.hazards.map(h=>h.x);p.x=2500;tickArenaRun(m,.05,{});assert.deepEqual(m.hazards.map(h=>h.x),xs);
 damageBriarHeart(m,root,2);assert.equal(root.hp,0);assert.ok(!m.hazards.some(h=>h.source===root.id));
});
test('roster introduces the caster then flyer; late sixth face queues a champion',()=>{
 const {m}=create();m.queueWave();assert.deepEqual(new Set(m.waveQueue.map(q=>q.kind)),new Set(['bramblecap','mossback']));
 m.waveQueue=[];m.roundsCleared=1;m.queueWave();assert.ok(m.waveQueue.some(q=>q.kind==='sporecap'));assert.ok(!m.waveQueue.some(q=>q.kind==='thornwing'));
 m.waveQueue=[];m.roundsCleared=2;startEncounter(m,6,'one');assert.equal(m.encounter.kind,'champion');assert.ok(m.waveQueue.some(q=>q.champion));assert.ok(m.waveQueue.some(q=>q.kind==='slime'||q.kind==='beetle'));
});
test('reaching space 48 wins without clearing creatures, seeds or using an exit',()=>{
 for(const roll of [1,3,5,6]){const {m}=create();m.progress=47;startEncounter(m,roll,'one');m.step(.016,{});assert.equal(m.won,true);assert.equal(m.progress,48);}
});
test('blessings require fresh input, preserve player ownership and wait for the whole party',()=>{
 const {m,p}=create([{id:'one'},{id:'two'}]);startEncounter(m,1,'one');clear(m);openArenaBlessings(m);const q=m.players.get('two');
 for(let i=0;i<30;i++)tickBlessings(m,.02,{one:{attack:true},two:{attack:true}});assert.equal(p.blessingChoice.done,false);
 tickBlessings(m,.05,{});tickBlessings(m,.05,{one:{right:true}});assert.equal(p.blessingChoice.index,1);assert.equal(q.blessingChoice.index,0);
 tickBlessings(m,.05,{one:{loot:true},two:{paused:true,loot:true}});assert.equal(p.blessingChoice.done,true);assert.equal(q.blessingChoice.done,false);assert.equal(m.roundState,'blessing');
 tickBlessings(m,.05,{});tickBlessings(m,.05,{two:{loot:true}});assert.equal(m.roundState,'idle');
});
test('blessings never exceed three distinct types or rank II; renewal remains available',()=>{
 const {m,p}=create();p.blessings={airStep:2,quiver:2,sporeward:2};p.hp=1;p.arenaAmmo=0;
 startEncounter(m,1,'one');clear(m);openArenaBlessings(m);assert.deepEqual(p.blessingChoice.offers,['supplies']);choose(m,{one:{loot:true}});
 assert.equal(Object.keys(p.blessings).length,3);assert.equal(p.hp,3);assert.equal(p.arenaAmmo,8);assert.equal(ammoCapacity(p),8);
});
test('coyote time jumps after leaving a platform and expired grace does not',()=>{
 for(const [delay,expected]of [[.04,true],[.15,false]]){
  const {m,p}=create();Object.assign(p,{x:1288,y:317,grounded:true});m.step(.016,{one:{right:true}});
  // Move beyond the entire lower route, retaining the real movement state.
  p.x=1805;for(let t=0;t<delay;t+=.01)m.step(.01,{});m.step(.01,{one:{jump:true}});assert.equal(p.vy<0,expected);
 }
});
test('jump buffered before touching ground launches on the first supported frame',()=>{
 const {m,p}=create();Object.assign(p,{x:1440,y:430,vy:250,grounded:false,coyote:0});m.step(.03,{one:{jump:true}});assert.equal(p.y,437);
 m.step(.016,{one:{jump:true}});assert.ok(p.vy< -500);
});
test('directional dodges have brief protection, limited air uses and landing refills them',()=>{
 const {m,p}=create();Object.assign(p,{x:1440,y:280,vy:0,grounded:false,invulnerable:0,coyote:0});m.step(.016,{one:{up:true,right:true,dash:true}});
 assert.ok(p.vx>0&&p.vy<0);assert.equal(p.airDodges,1);m.hurt(p);assert.equal(p.hp,3);
 p.dashTime=0;p.dashCooldown=0;m.step(.016,{});m.step(.016,{one:{dash:true}});assert.equal(p.dashTime,0);
 p.blessings.airStep=1;p.dashCooldown=0;m.step(.016,{});m.step(.016,{one:{dash:true}});assert.ok(p.dashTime>0);assert.equal(p.airDodges,2);
 Object.assign(p,{x:1440,y:437,grounded:true});m.step(.016,{});assert.equal(p.airDodges,0);
});
test('fast fall and Down plus Jump drop through ledges while tubes remain solid',()=>{
 const {m,p}=create();Object.assign(p,{x:1440,y:197,vy:0,grounded:true});tick(m,15,{one:{down:true,jump:true}});assert.ok(p.y>240);tick(m,60,{});assert.equal(p.y,317);
 Object.assign(p,{y:230,grounded:false,vy:5});m.step(.016,{one:{down:true}});assert.ok(p.vy>420);
});
test('arrow recovery is finite and does not spend or duplicate the main inventory',()=>{
 const hero={id:'one',equipment:{hand1:'starter_bow'},inventory:[{type:'arrow',qty:99}]};const original=structuredClone(hero.inventory),{m,p}=create([hero]);Object.assign(p,{x:2750,y:437,face:1});
 m.attack(p);assert.equal(p.arenaAmmo,3);for(let i=0;i<60;i++)tickArenaProjectiles(m,1/60);
 assert.equal(m.supplyDrops.filter(s=>s.kind==='arrow').length,1);const drop=m.supplyDrops[0];Object.assign(p,{x:drop.x,y:drop.y+24});tickArenaRun(m,.016,{});assert.equal(p.arenaAmmo,4);tickArenaRun(m,.016,{});assert.equal(p.arenaAmmo,4);assert.deepEqual(hero.inventory,original);
 p.arenaAmmo=0;p.attackCooldown=0;assert.equal(m.attack(p),false);assert.equal(m.projectiles.length,0);
});
test('main-hand equipment wins over offhand and live weapon changes take effect',()=>{
 const hero={id:'one',equipment:{hand1:'sword',hand2:'starter_bow'}}, {m,p}=create([hero]);assert.equal(arenaLoadout(m,p).role,'melee');hero.equipment.hand1='starter_boomerang';assert.equal(arenaLoadout(m,p).role,'returning');
});
test('returning blades hit once per enemy and return without ammunition; spell charges stay local',()=>{
 const hero={id:'one',equipment:{hand1:'starter_boomerang'},mana:57}, {m,p}=create([hero]);Object.assign(p,{x:1440,y:437,face:1});const e=enemy(m,'sporecap',1540);e.hp=5;m.attack(p);
 for(let i=0;i<150;i++)tickArenaProjectiles(m,1/60);assert.equal(e.hp,4);assert.equal(m.projectiles.length,0);assert.equal(p.arenaAmmo,4);
 hero.equipment.hand1='starter_wand';p.attackCooldown=0;m.attack(p);assert.equal(p.charges,2);assert.equal(hero.mana,57);
});
test('spear kit controls a longer narrow lane and armored gear grants a rechargeable guard',()=>{
 const hero={id:'one',equipment:{chest:'armor',head:'hat',shoulders:'shoulder_armor'}},{m,p}=create([hero]);assert.equal(arenaLoadout(m,p).heavy,true);
 Object.assign(p,{x:1440,y:437,face:1,arenaKit:'spear',invulnerable:0});const far=enemy(m,'sporecap',1530),offLane=enemy(m,'bramblecap',1530,350);m.attack(p);assert.equal(far.hp,1);assert.equal(offLane.alive,true);
 m.hurt(p);assert.equal(p.hp,3);assert.equal(p.guard,6);p.invulnerable=0;m.hurt(p);assert.equal(p.hp,2);
});
test('Up attack changes kits between rounds without mutating equipped items or rolling',()=>{
 const hero={id:'one',equipment:{hand1:'sword'}},{m,p}=create([hero]);p.x=TV_BOARD_X;const gear=structuredClone(hero.equipment);
 for(const role of ['spear','bow','returning','spell','melee']){m.step(.016,{one:{up:true,attack:true}});assert.equal(arenaLoadout(m,p).role,role);m.step(.016,{});}
 assert.equal(m.wave,0);assert.deepEqual(hero.equipment,gear);
});
test('stomp spores damage nearby enemies and melee can retract a Mossback before kicking it',()=>{
 const {m,p}=create();const e=enemy(m,'bramblecap',1440);Object.assign(p,{x:1440,y:397,vy:250,grounded:false});m.step(.03,{});assert.equal(e.alive,false);assert.equal(m.projectiles.filter(s=>s.kind==='spore').length,3);
 m.enemies=[];p.attackCooldown=0;Object.assign(p,{x:1400,y:437,face:1});const turtle=enemy(m,'mossback',1435);m.attack(p);assert.equal(turtle.shell,true);p.blessings.shellheart=2;p.attackCooldown=0;m.attack(p);assert.equal(turtle.shellSpeed,430);
});
test('players, projectiles and shells use all reciprocal tubes with arrival warnings',()=>{
 for(const sourceIndex of [0,1,2,3,4,5]){
  const {m,p}=create(),t=m.tubes[sourceIndex],dest=m.tubes.find(s=>s.id===t.pair);
  Object.assign(p,{x:t.x,y:t.y,grounded:true,invulnerable:0});assert.equal(m.tryTube(p),true);assert.ok(m.tubeWarnings.some(w=>w.x===dest.x));assert.ok(p.invulnerable>1);
  const shell=enemy(m,'mossback',t.x-47,t.y+t.h);Object.assign(shell,{shell:true,shellSpeed:300});moveArenaEnemy(m,shell,.016);assert.ok(shell.shellTransit);for(let i=0;i<25;i++)moveArenaEnemy(m,shell,.016);assert.ok(Math.abs(shell.x-dest.x)<160);assert.ok(shell.tubeCooldown>0);
  const shot={kind:'arrow',friendly:true,owner:p.id,x:t.x-30,y:t.y+20,vx:560,vy:0,life:1,hitIds:[]};m.projectiles=[shot];tickArenaProjectiles(m,.03);assert.ok(shot.tubeTransit);for(let i=0;i<7;i++)tickArenaProjectiles(m,.03);assert.ok(Math.abs(shot.x-dest.x)<100);assert.ok(shot.tubeCooldown>0);
 }
});
test('caster and flying harasser telegraph before striking, and sporeward blocks hostile spores',()=>{
 const {m,p}=create();Object.assign(p,{x:1440,y:437,invulnerable:0});const caster=enemy(m,'sporecap',1640);moveArenaEnemy(m,caster,.016);assert.ok(caster.cast);assert.equal(m.projectiles.length,0);
 for(let i=0;i<60;i++)moveArenaEnemy(m,caster,.016);assert.equal(m.projectiles.length,1);
 const flyer=enemy(m,'thornwing',1510,320);moveArenaEnemy(m,flyer,.016);assert.ok(flyer.swoop);assert.equal(flyer.swoop.time,.016);
 p.blessings.sporeward=1;m.projectiles=[{kind:'spore',friendly:false,x:p.x,y:p.y-24,vx:0,vy:0,life:1}];tickArenaProjectiles(m,.016);assert.equal(p.hp,3);
});
test('ricochet blessings add finite bounces before a shot becomes a recoverable pickup',()=>{
 const {m,p}=create();p.arenaKit='bow';p.blessings.ricochet=1;Object.assign(p,{x:2820,y:437,face:1});m.attack(p);
 for(let i=0;i<8;i++)tickArenaProjectiles(m,1/60);assert.equal(m.projectiles[0].bounces,0);assert.ok(m.projectiles[0].vx<0);assert.equal(m.supplyDrops.length,0);
 for(let i=0;i<140;i++)tickArenaProjectiles(m,1/60);assert.equal(m.projectiles.length,0);assert.equal(m.supplyDrops.length,1);
});
test('TV spell charges and borrowed kits preserve normal mana, gear and inventory across actual steps',()=>{
 const hero={id:'one',equipment:{hand1:'starter_wand'},mana:57,inventory:[{type:'arrow',qty:6}]},{m,p}=create([hero]),snapshot=structuredClone(hero);
 p.x=1800;m.step(.016,{one:{attack:true}});tick(m,90,{});assert.equal(p.charges,2);assert.equal(hero.mana,57);assert.deepEqual(hero.equipment,snapshot.equipment);assert.deepEqual(hero.inventory,snapshot.inventory);
});
test('disconnects do not strand the remaining party at a blessing screen',()=>{
 const {m}=create([{id:'one'},{id:'two',lobbyDisconnected:true}]);startEncounter(m,1,'one');clear(m);choose(m,{one:{loot:true}});assert.equal(m.roundState,'idle');
});
test('death preserves the active encounter and chosen blessings',()=>{
 const {m,p}=create();startEncounter(m,1,'one');p.blessings.sporeward=1;Object.assign(p,{hp:1,invulnerable:0,x:2500,y:437});m.hurt(p);
 assert.equal(m.roundState,'active');assert.equal(p.blessings.sporeward,1);assert.equal(p.x,p.checkpoint);assert.equal(p.hp,3);
});

test('both highest crowns support a side approach, standing and drop-through',()=>{
 for(const [x,dir] of [[460,'left'],[2420,'right']]){const {m,p}=create();Object.assign(p,{x,y:197,grounded:true,vy:0,invulnerable:100});m.step(1/60,{one:{jump:true,[dir]:true}});tick(m,40,{one:{jump:true,[dir]:true}});tick(m,60,{});assert.equal(p.y,116);assert.equal(p.grounded,true);assert.equal(p.bodyHeight,58);tick(m,20,{});assert.equal(p.y,116);m.step(1/60,{one:{down:true,jump:true}});tick(m,100,{});assert.ok(p.y>116);}
});
test('Briar Hearts can be uprooted by real Interact input and hit by arrows',()=>{
 const {m,p}=create();startEncounter(m,5,'one');const [a,b]=m.thornRoots;Object.assign(p,{x:a.x,y:a.y,grounded:true});m.step(.016,{one:{loot:true}});assert.equal(a.hp,0);
 m.projectiles=[{friendly:true,kind:'arrow',x:b.x-12,y:b.y-22,vx:240,vy:0,life:1,damage:2,hitIds:[]}];tickArenaProjectiles(m,.05);assert.equal(b.hp,0);
});
