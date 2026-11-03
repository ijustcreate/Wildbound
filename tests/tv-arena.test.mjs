import test from 'node:test';
import assert from 'node:assert/strict';
import {TvWildbound,TV_BOARD_X,TV_WILDBOUND_WIDTH} from '../src/tv-wildbound.mjs';
import {moveArenaBody,createArenaLevel,arenaSolids} from '../src/tv-arena-level.mjs';
import {ARENA_SUBJECTS,arenaRigPack,replaceArenaRig} from '../src/tv-arena-creatures.mjs';
import {poseAt} from '../src/player-motion.mjs';
import {definitionPack,applyDefinitions} from '../src/definitions.mjs';
import {rigPack} from '../src/project-rigs.mjs';
import {renderLayers} from '../src/render-order.mjs';
const ready=()=>{const m=new TvWildbound([{id:'one',inventory:[]}],42);m.intro=3;return {m,p:m.players.get('one')};};
const tick=(m,n,commands={})=>{for(let i=0;i<n;i++)m.step(.05,commands);};

test('a board strike reveals the dice before enemies emerge at multiple elevations',()=>{
 const {m,p}=ready();Object.assign(p,{x:TV_BOARD_X,face:1});m.step(.016,{one:{attack:true}});
 assert.equal(m.wave,1);assert.equal(m.waveQueue.length,6);tick(m,65);assert.equal(m.enemies.length,0);
 tick(m,55);assert.equal(m.enemies.length,6);assert.ok(m.enemies.some(e=>e.y<437));
 assert.ok(m.enemies.every(e=>m.enemyRoster.includes(e.kind)));assert.equal(m.owners.get('one').progress,undefined);
});
test('the center board cannot be struck or called through the upper floors',()=>{
 const {m,p}=ready();Object.assign(p,{x:TV_BOARD_X,y:125,grounded:true,face:1});m.step(.016,{one:{attack:true}});assert.equal(m.progress,0);assert.equal(m.wave,0);
 m.progress=48;m.step(.016,{one:{loot:true}});assert.equal(m.won,false);
});
test('occupied alcoves defer their spawn without stopping the other alcoves',()=>{
 const {m,p}=ready(),s=m.enemySpawns[0];Object.assign(p,{x:s.x,y:s.y,grounded:true});m.queueWave();tick(m,40);
 assert.ok(m.waveQueue.some(q=>q.spawnId===s.id));assert.ok(m.enemies.length>0);
 p.x=TV_BOARD_X;tick(m,20);assert.equal(m.waveQueue.length,0);
});
test('all three tube pairs travel both ways and held interact cannot bounce the player back',()=>{
 for(const sourceIndex of [0,1,2,3,4,5]){
  const {m,p}=ready(),source=m.tubes[sourceIndex],target=m.tubes.find(t=>t.id===source.pair);
  Object.assign(p,{x:source.x,y:source.y,grounded:true});m.step(.05,{one:{loot:true}});assert.ok(p.tubeTransit);
  tick(m,20,{one:{loot:true}});assert.equal(p.x,target.x);assert.equal(p.y,target.y);assert.equal(p.tubeTransit,null);
  tick(m,40,{one:{loot:true}});assert.equal(p.x,target.x);assert.equal(p.y,target.y);
 }
});
test('tube transition protects only the traveling player and menus suspend that player',()=>{
 const {m,p}=ready();Object.assign(p,{x:m.tubes[0].x,y:m.tubes[0].y,grounded:true});m.step(.05,{one:{loot:true}});
 const time=p.tubeTransit.time;m.step(.05,{one:{paused:true}});assert.equal(p.tubeTransit.time,time);m.hurt(p);assert.equal(p.hp,3);
 tick(m,20);assert.equal(p.y,m.tubes[1].y);
});
test('Mossback retracts, is kicked, defeats another enemy, and ricochets at a solid side',()=>{
 const {m,p}=ready(),shell=m.spawnAt({x:1400,y:437,face:1},'mossback');shell.emerging=0;shell.speed=0;
 Object.assign(p,{x:1400,y:398,vy:180,grounded:false,invulnerable:0});m.step(.03,{});assert.equal(shell.shell,true);assert.ok(p.vy<0);assert.equal(p.hp,3);
 Object.assign(p,{x:1365,y:437,vy:0,grounded:true,face:1});m.attack(p);assert.equal(shell.shellSpeed,300);
 const target=m.spawnAt({x:1460,y:437,face:-1},'bramblecap');target.emerging=0;target.speed=0;tick(m,5);assert.equal(target.alive,false);
 shell.x=TV_WILDBOUND_WIDTH-shell.w/2-21;shell.shellSpeed=300;shell.face=1;m.step(.05,{});assert.ok(shell.shellSpeed<0);
});
test('stationary shells wake, and enemy/projectile/particle storage stays bounded',()=>{
 const {m,p}=ready();p.x=100;
 const e=m.spawnAt({x:1400,y:437,face:1},'mossback');Object.assign(e,{emerging:0,shell:true,shellSpeed:0,shellTimer:.03,h:23});m.step(.05,{});assert.equal(e.shell,false);assert.equal(e.h,32);
 for(let i=0;i<200;i++){const e=m.spawnAt({x:1400,y:437,face:1},'bramblecap');if(e)m.defeat(e);m.step(.05,{});}
 assert.ok(m.enemies.length<12);assert.ok(m.blockParticles.length<=128);
});
test('collision resolves platform tops, undersides, sides, and bounded arena edges',()=>{
 const solid=[{x:100,y:200,w:120,h:28}];
 const falling={x:150,y:195,vx:0,vy:200};moveArenaBody(falling,.05,solid);assert.equal(falling.y,200);assert.equal(falling.grounded,true);
 const rising={x:150,y:290,vx:0,vy:-400};moveArenaBody(rising,.05,solid);assert.equal(rising.y,286);assert.ok(rising.vy>=0);
 const side={x:85,y:240,vx:200,vy:0};assert.equal(moveArenaBody(side,.05,solid),true);assert.equal(side.x,88);
 const edge={x:35,y:437,vx:-430,vy:0};moveArenaBody(edge,.05,[]);assert.equal(edge.x,32);
});
test('all upper platforms are reachable using the actual jump collision solver',()=>{
 const level=createArenaLevel(),solids=arenaSolids(level),floor={x:32,y:437,w:2816,h:100},surfaces=[floor,...solids],edges=surfaces.map(()=>new Set());
 for(const [index,surface]of surfaces.entries()){
  for(let x=surface.x+14;x<=surface.x+surface.w-14;x+=16){
   if(solids.some(s=>s!==surface&&x+12>s.x&&x-12<s.x+s.w&&surface.y>s.y+.5&&surface.y-58<s.y+s.h-.5))continue;
   for(const direction of [-1,0,1]){
    const actor={x,y:surface.y,vx:direction*220,vy:-520};
    for(let i=0;i<65;i++){
     moveArenaBody(actor,.02,solids);
     if(actor.grounded){for(const [j,s]of surfaces.entries())if(Math.abs(actor.y-s.y)<.1&&actor.x+12>s.x&&actor.x-12<s.x+s.w)edges[index].add(j);break;}
    }
   }
  }
 }
 for(const [i,tube]of level.tubes.entries()){const j=level.tubes.findIndex(t=>t.id===tube.pair);edges[1+level.platforms.length+i].add(1+level.platforms.length+j);}
 const reached=new Set([0]),queue=[0];for(const source of queue)for(const dest of edges[source])if(!reached.has(dest)){reached.add(dest);queue.push(dest);}
 assert.deepEqual(level.platforms.flatMap((s,i)=>reached.has(i+1)?[]:[{x:s.x,y:s.y}]),[],'every platform has a playable jump route');
});
test('hearths set safe checkpoints and death returns to that elevation',()=>{
 const level=createArenaLevel(),solids=arenaSolids(level);
 for(const spawn of level.playerSpawns){assert.ok(spawn.x<TV_WILDBOUND_WIDTH-95,'hearth stays before the locked exit');assert.ok(!solids.some(s=>spawn.x+12>s.x&&spawn.x-12<s.x+s.w&&spawn.y>s.y+.5&&spawn.y-58<s.y+s.h-.5),'full player body fits at '+spawn.id);}
 const {m,p}=ready(),s=m.playerSpawns.find(s=>s.id==='crown');Object.assign(p,{x:s.x,y:s.y,grounded:true});m.step(.05,{one:{loot:true}});assert.equal(p.checkpointY,s.y);
 Object.assign(p,{hp:1,invulnerable:0,x:300,y:437});m.hurt(p);assert.equal(p.x,s.x);assert.equal(p.y,s.y);assert.equal(p.hp,3);
});
test('sunseeds collect once and every fifth restores one heart',()=>{
 const {m,p}=ready();p.hp=1;
 for(const s of m.pickups.slice(0,5)){Object.assign(p,{x:s.x,y:s.y+24,vy:0});m.step(.001,{});}
 assert.equal(m.sunseeds,5);assert.equal(p.hp,2);assert.equal(m.pickups.filter(s=>s.collected).length,5);
});
test('new native rigs retain every editable action and finite eight-view joint poses',()=>{
 for(const kind of ['bramblecap','mossback']){
  const m=ARENA_SUBJECTS[kind].data;
  for(const action of ['idle','walk','run','attack','hurt','death','jump','emerge','retract','shell','slide','wake']){
   assert.ok(m.clips[action].keys.length>=8);
   for(const f of [0,3,7,11,15])for(const p of Object.values(poseAt(m,action,f)))assert.ok(p.every(Number.isFinite));
  }
  for(const v of Object.values(m.visibility))assert.equal(v.length,8);
 }
});
test('saved pixel parts cannot expose a withdrawn Mossback head or legs',()=>{
 const subject=ARENA_SUBJECTS.mossback,model=subject.defaults(),sprite={width:1,height:1,x:0,y:0,palette:['transparent','#ffffff'],pixels:[1]};
 model.boneSprites=Object.fromEntries(['Ochre head','Short tail','Root foot footL','Root foot footR','Root foot rearFootL','Root foot rearFootR'].map(n=>[n,Array.from({length:8},()=>structuredClone(sprite))]));
 subject.draw({fillRect(){},fillStyle:''},{faceX:-1,faceY:0,animationAction:'slide',playerFrame:0},0,model);
 assert.deepEqual(renderLayers(model,2),['Stem body','Emerald shell']);
});
test('project rig packs preserve arena pixel work alongside existing subjects',()=>{
 const pack=rigPack([],{});assert.deepEqual(Object.keys(pack.arenaRigs),Object.keys(ARENA_SUBJECTS));
 const original=arenaRigPack(),edited=structuredClone(original.bramblecap);edited.clips.walk.keys[1].joints.head=[1,2,3];
 try{applyDefinitions({version:1,arenaRigs:{bramblecap:edited}},[],{});assert.deepEqual(definitionPack([],{}).arenaRigs.bramblecap.clips.walk.keys[1].joints.head,[1,2,3]);}finally{replaceArenaRig('bramblecap',original.bramblecap);}
});
