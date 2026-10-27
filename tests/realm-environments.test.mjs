import test from 'node:test';
import assert from 'node:assert/strict';
import {REALMS,REALM_ASSETS,realmWorld,realmVoidBlocked,realmProp,realmFootprint,realmResourceScale,tickRealmHazards} from '../src/realm-world.mjs';
import {REALM_SPRITES} from '../src/realm-art.mjs';
import {FAUNA_SPRITES,REALM_FAUNA,REALM_EVENTS,seedRealmLife,startRealmEvent,tickRealmEvent,tickRealmLife} from '../src/realm-life.mjs';
import {MONARCH_FAIRY_DRAGON_RIG,drawMonarchFairyDragon} from '../src/monarch-fairy-dragon.mjs';
import {validateSprite} from '../src/pixels.mjs';
import {Game,EVENTS} from '../src/core.mjs';
import {harvest,tickEnvironment} from '../src/environment.mjs';
import {saveSession,restoreSession} from '../src/session.mjs';
import {footprintHit} from '../src/world.mjs';
import {terrainSupport} from '../src/terrain-support.mjs';
const game=env=>{const g=new Game(()=>.5);g.environment=env;g.seed=42;g.addPlayer('keyboard');g.start();g.bloom=3;return g;};
test('native realm catalogs and articulated fauna are valid editable indexed sprites',()=>{for(const [k,s]of Object.entries({...REALM_SPRITES,...FAUNA_SPRITES})){assert.ok(validateSprite(s),k);assert.ok(s.pixels.some(Boolean),k);}for(const env of REALMS)assert.equal(Object.keys(REALM_ASSETS[env]).length,8);});
test('nutria uses eight readable native views and separate animated paws instead of the boxy placeholder',()=>{
 const views=Array.from({length:8},(_,view)=>FAUNA_SPRITES['nutria_body_'+view]);
 assert.ok(views.every(validateSprite));assert.ok(views.every(sprite=>sprite.palette.includes('#d4b88c')));
 assert.notDeepEqual(views[0].pixels,views[4].pixels,'front and rear must turn with the animal');
 assert.notDeepEqual(views[0].pixels,views[2].pixels,'front and side must have distinct silhouettes');
 assert.ok(views[0].pixels.includes(7),'front view retains bright readable eyes');
 assert.ok(FAUNA_SPRITES.nutria_limb.pixels.some(pixel=>pixel===5),'moving paws retain their warm toes');
});
test('cave olms read as axolotl-like creatures with directional faces, pink gills, and articulated feet',()=>{
 const views=Array.from({length:8},(_,view)=>FAUNA_SPRITES['olm_body_'+view]);
 assert.ok(views.every(validateSprite));assert.ok(views.every(sprite=>sprite.palette.includes('#fa5b91')));
 assert.equal(new Set(views.map(sprite=>sprite.pixels.join(''))).size,8,'each facing has its own authored silhouette');
 assert.ok(views[0].pixels.includes(5),'front view has bright branching gills');
 assert.ok(views[0].pixels.includes(7),'front view has luminous eyes');
 assert.ok(FAUNA_SPRITES.olm_limb.pixels.includes(5),'separate animated feet retain pink toes');
});
test('seeded layouts keep every chamber connected on walkable ground across 12 seeds',()=>{
 for(const env of REALMS)for(let seed=0;seed<12;seed++){
  const w=realmWorld(seed,env,{authored:false});assert.deepEqual(w,realmWorld(seed,env,{authored:false}));
  const blocked=k=>['water','cave_void','shadow_void'].includes(k),seen=new Set([25*50+25]),queue=[25*50+25];
  for(let head=0;head<queue.length;head++){const id=queue[head],x=id%50,y=Math.floor(id/50);for(const [dx,dy]of [[1,0],[-1,0],[0,1],[0,-1]]){const nx=x+dx,ny=y+dy,n=ny*50+nx;if(nx>=0&&nx<50&&ny>=0&&ny<50&&!seen.has(n)&&!blocked(w.terrain[n])){seen.add(n);queue.push(n);}}}
  for(const room of w.realmState.chambers)assert.ok([...seen].some(i=>Math.hypot(i%50*32+16-room.x,Math.floor(i/50)*32+16-room.y)<100),`${env} seed ${seed} room ${room.x},${room.y}`);
  assert.ok(w.scenery.length<=158);assert.equal(w.scenery.filter(p=>p.kind==='ceiling_stalactite').length,env==='caverns'?5:0);
 }
});
test('cave and shadow void blocks flying, swimming and projectiles through Game.blocked',()=>{for(const env of ['caverns','shadow']){const g=game(env);assert.ok(g.blocked(32,32,8,true,true,false,0));assert.ok(realmVoidBlocked(g,32,32));assert.ok(!realmVoidBlocked(g,800,960,5));}});
test('low shelves support jumping; arches leave their middle open',()=>{const p=realmProp('limestone_shelf',500,500),g={scenery:[p],terrain:[]};const b=realmFootprint(p);assert.equal(terrainSupport(g,{x:500,y:495}),b.height);const a=realmProp('root_arch',700,500);assert.equal(footprintHit(a,null,700,500,8),false);assert.equal(footprintHit(a,null,700+a.size*.35,500,8),true);});
test('mangroves cut into persistent stumps while mined crystals shrink and vanish without falling',()=>{const g=game('swamp'),p=g.players[0];p.x=500;p.y=525;p.faceX=0;p.faceY=-1;g.scenery=[realmProp('mangrove',500,500)];assert.ok(harvest(g,p,999,90));for(let i=0;i<20;i++)tickEnvironment(g,.1);assert.ok(g.scenery[0].fallen);assert.ok(g.loot.some(l=>l.type==='log'));const crystal=realmProp('cave_crystal',500,500,0,{size:32});g.scenery=[crystal];assert.equal(realmResourceScale(crystal),1);harvest(g,p,12,90);const small=realmResourceScale(crystal);harvest(g,p,12,90);assert.ok(realmResourceScale(crystal)<small);harvest(g,p,12,90);assert.equal(realmResourceScale(crystal),.5);for(let i=0;i<3;i++)harvest(g,p,12,90);assert.ok(crystal.depleted);assert.equal(crystal.falling,undefined);assert.equal(realmFootprint(crystal),null);});
test('ceiling hazards warn, allow escape, strike once, and preserve spent state',()=>{const g=game('caverns'),h=g.scenery.find(p=>p.kind==='ceiling_stalactite'),p=g.players[0];Object.assign(p,{x:h.x,y:h.rootY});let damage=0;g.hurt=(_p,n)=>damage+=n;tickRealmHazards(g,.05);assert.equal(h.hazardState,'warning');for(let i=0;i<10;i++)tickRealmHazards(g,.1);assert.equal(damage,0);p.x+=100;for(let i=0;i<20;i++)tickRealmHazards(g,.1);assert.equal(damage,0);assert.equal(h.hazardState,'spent');Object.assign(p,{x:h.x,y:h.rootY});for(let i=0;i<30;i++)tickRealmHazards(g,.1);assert.equal(damage,0);const h2=g.scenery.find(q=>q.kind==='ceiling_stalactite'&&q!==h);Object.assign(p,{x:h2.x,y:h2.rootY});for(let i=0;i<30;i++)tickRealmHazards(g,.1);assert.equal(damage,5);const restored=restoreSession(JSON.parse(JSON.stringify(saveSession(g))));assert.equal(restored.scenery.find(q=>q.id===h.id).hazardState,'spent');});
test('each map has its own neutral wildlife and critters, retained on reload',()=>{for(const env of REALMS){const g=game(env),animals=seedRealmLife(g);for(const kind of REALM_FAUNA[env])assert.ok(animals.some(a=>a.kind===kind),env+': '+kind);assert.ok(animals.every(a=>a.neutral));const before=animals.length;for(let i=0;i<60;i++){g.time+=.1;tickRealmLife(g,.1);}assert.equal(seedRealmLife(g).length,before);const restored=restoreSession(JSON.parse(JSON.stringify(saveSession(g))));assert.deepEqual(restored.realmState.animals,g.realmState.animals);}});
test('shadow fauna upgrades saved harts in place and adds peaceful monarch fairy dragons',()=>{
 const g=game('shadow'),animals=seedRealmLife(g),hart=animals.find(a=>a.kind==='shadow_stag'),dragons=animals.filter(a=>a.kind==='monarch_fairy_dragon');
 assert.ok(hart);assert.equal(dragons.length,4);assert.ok(dragons.every(a=>a.neutral));assert.ok(REALM_FAUNA.shadow.includes('shadow_stag'));
 const position={x:hart.x,y:hart.y,id:hart.id};hart.kind='pale_hart';animals.splice(animals.indexOf(dragons[0]),1);g.realmState.faunaVersion=1;
 const upgraded=seedRealmLife(g);assert.deepEqual({x:hart.x,y:hart.y,id:hart.id},position);assert.equal(hart.kind,'shadow_stag');assert.equal(upgraded.filter(a=>a.kind==='monarch_fairy_dragon').length,4);
 const dragon=upgraded.find(a=>a.kind==='monarch_fairy_dragon'),p=g.players[0];Object.assign(p,{x:dragon.x+12,y:dragon.y,hp:100});const before={x:dragon.x,y:dragon.y};tickRealmLife(g,.1);assert.equal(dragon.fleeing,true);assert.ok(Math.hypot(dragon.x-before.x,dragon.y-before.y)>0);
 assert.deepEqual(MONARCH_FAIRY_DRAGON_RIG.views,[0,1,2,3,4,5,6,7]);assert.ok(MONARCH_FAIRY_DRAGON_RIG.joints.wingL&&MONARCH_FAIRY_DRAGON_RIG.joints.wingR);
 const render=(d,time,state='idle')=>{const calls=[],ctx={save(){},restore(){},translate(){},scale(){},fillRect(x,y,w,h){calls.push([Math.round(x),Math.round(y),w,h]);},drawImage(){calls.push('frame');},set imageSmoothingEnabled(_v){}};drawMonarchFairyDragon(ctx,{...dragon,faceX:Math.sin(d*Math.PI/4),faceY:Math.cos(d*Math.PI/4),state,moving:state==='flutter'},time,42);return calls.join(';');};
 const views=Array.from({length:8},(_,d)=>render(d,.1));assert.equal(new Set(views).size,8,'dragon is built for eight distinct facing angles');assert.notEqual(render(0,.1,'idle'),render(0,.1,'flutter'),'wing pose changes between idle and active flight');
});
test('two events per realm; exploration rewards once and respects pause',()=>{for(const env of REALMS){assert.equal(REALM_EVENTS.filter(e=>e.environment===env).length,2);const g=game(env),event=REALM_EVENTS.find(e=>e.environment===env&&e.type==='realm_expedition');assert.ok(EVENTS.some(e=>e.name===event.name));assert.ok(startRealmEvent(g,event));const e=g.realmState.event;g.paused=true;tickRealmEvent(g,10);assert.equal(e.elapsed,0);g.paused=false;for(const n of e.nodes){Object.assign(g.players[0],{x:n.x,y:n.y});tickRealmEvent(g,2.1);}assert.ok(e.done);const count=g.loot.length;tickRealmEvent(g,10);assert.equal(g.loot.length,count);}});
test('normal event spawning places the real roster outside void and exploration nodes on clear ground',()=>{for(const event of REALM_EVENTS){const g=game(event.environment);g.spawnEvent(EVENTS.findIndex(e=>e.name===event.name));if(event.type==='realm_expedition'){assert.ok(g.realmState.event);for(const n of g.realmState.event.nodes)assert.equal(g.blocked(n.x,n.y,12,false,false,false,0),false,event.name);}else{assert.equal(g.eventSpawnCount,event.count,event.name);assert.equal(g.enemies.filter(e=>e.kind===event.kind).length,event.count,event.name);for(const a of g.enemies)assert.equal(realmVoidBlocked(g,a.x,a.y+14,8),false,event.name);}}});
