import test from 'node:test';import assert from 'node:assert/strict';
import {TvWildbound} from '../src/tv-wildbound.mjs';
import {TV_NEW_ENEMIES,TV_ENEMY_THEMES,arenaRosterTheme,tvEnemyPoseTime} from '../src/tv-arena-roster.mjs';
import {moveArenaEnemy,tickArenaProjectiles} from '../src/tv-arena-run.mjs';
import {ARENA_ENEMIES} from '../src/tv-arena-level.mjs';
import {parallaxTiles,TV_PARALLAX_LAYERS} from '../src/tv-arena-parallax.mjs';
import {playerPose,playerMotion} from '../src/player-motion.mjs';
import {mergeArenaDesign,sameArenaPixels} from '../src/tv-arena-design-merge.mjs';
import {makeArenaRigV2} from '../src/tv-arena-creature-design.mjs';
const create=()=>{const m=new TvWildbound([{id:'one',name:'Lumen',equipment:{},inventory:[]}],42);m.intro=3;const p=m.players.get('one');p.invulnerable=100;return {m,p};};
const ticks=(m,n,commands={})=>{for(let i=0;i<n;i++)m.step(1/60,commands);};

test('ten additional Wildbound enemies form five bounded four-species encounter themes',()=>{
 assert.equal(Object.keys(TV_NEW_ENEMIES).length,10);assert.equal(new Set(ARENA_ENEMIES).size,14);
 const introduced=new Set();for(let cleared=2;cleared<7;cleared++){const theme=arenaRosterTheme(cleared);assert.equal(theme.roster.length,4);theme.roster.forEach(k=>introduced.add(k));const {m}=create();m.roundsCleared=cleared;m.queueWave();assert.ok(m.waveQueue.every(q=>theme.roster.includes(q.kind)));}
 assert.ok(Object.keys(TV_NEW_ENEMIES).every(k=>introduced.has(k)));assert.equal(TV_ENEMY_THEMES.length,5);
});
for(const kind of Object.keys(TV_NEW_ENEMIES)){
 test(kind+' has finite side-view physics, bounded motion and damageable combat state',()=>{
  for(const y of [437,317]){const {m,p}=create();p.x=1510;p.y=y;const e=m.spawnAt({x:1200,y,face:1},kind);e.emerging=0;
   for(let i=0;i<720;i++){m.step(1/60,{});assert.ok([e.x,e.y,e.vx,e.vy].every(Number.isFinite),kind+' finite at '+i);assert.ok(e.x>=20&&e.x<=2860);assert.ok(e.y>=-200&&e.y<=437);if(!e.alive)break;}
   e.alive=true;e.emerging=0;m.damageEnemy(e,20);assert.equal(e.alive,false);assert.ok(m.supplyDrops.length<=80);
  }
 });
}
test('frog performs a real ballistic jump onto a higher one-way route',()=>{
 const {m,p}=create();Object.assign(p,{x:1440,y:317});const e=m.spawnAt({x:1130,y:437,face:1},'frog');Object.assign(e,{emerging:0,grounded:true});let landed=false;
 for(let i=0;i<180;i++){m.step(1/60,{});if(e.grounded&&e.y===317)landed=true;}assert.ok(landed);
});
test('bat and imp flight stays outside fully solid tubes while passing one-way ledges',()=>{
 for(const kind of ['bat','imp']){const {m,p}=create();p.x=530;p.y=437;const tube=m.tubes[0],e=m.spawnAt({x:390,y:415,face:1},kind);e.emerging=0;
  for(let i=0;i<120;i++){m.step(1/60,{});const overlaps=e.x+e.w/2>tube.x-tube.w/2+.1&&e.x-e.w/2<tube.x+tube.w/2-.1&&e.y>tube.y+.1&&e.y-e.h<tube.y+tube.h-.1;assert.equal(overlaps,false,kind+' at '+i);}
 }
});
test('archer draw telegraphs and spends a finite six-arrow quiver',()=>{
 const {m,p}=create();Object.assign(p,{x:1440,y:437});const e=m.spawnAt({x:1650,y:437,face:-1},'archer');e.emerging=0;
 moveArenaEnemy(m,e,.016);assert.equal(e.intent.kind,'arrow');assert.equal(m.projectiles.length,0);
 for(let i=0;i<2400;i++){m.time+=1/60;moveArenaEnemy(m,e,1/60);}assert.equal(e.ammo,0);assert.equal(m.projectiles.filter(s=>s.kind==='enemy-arrow').length,6);
});
test('boar charges after a warning and snake/imp launch their native-flavored projectiles',()=>{
 for(const [kind,shot]of [['snake','venom'],['imp','ember'],['boar',null]]){
  const {m,p}=create();p.x=1440;const e=m.spawnAt({x:1650,y:437,face:-1},kind);e.emerging=0;moveArenaEnemy(m,e,.016);assert.ok(e.intent);assert.equal(m.projectiles.length,0);let maxSpeed=0;
  for(let i=0;i<90;i++){m.time+=1/60;moveArenaEnemy(m,e,1/60);maxSpeed=Math.max(maxSpeed,Math.abs(e.vx));}
  if(shot)assert.ok(m.projectiles.some(s=>s.kind===shot));else assert.ok(maxSpeed>=300);
 }
});
test('Down produces a smaller collider and a slower crouched walk; release restores standing',()=>{
 const {m,p}=create();p.x=1440;ticks(m,12,{one:{down:true,right:true}});assert.equal(p.crouching,true);assert.equal(p.bodyHeight,34);assert.equal(p.vx,90);assert.ok(p.crouchBlend>.9);
 ticks(m,14,{one:{right:true}});assert.equal(p.crouching,false);assert.equal(p.bodyHeight,58);assert.equal(p.vx,180);assert.equal(p.crouchBlend,0);
});
test('crouch pose bends knees and lowers the whole upper rig without changing normal players',()=>{
 const base=playerPose({animationAction:'idle',faceX:1,faceY:0},0),crouch=playerPose({animationAction:'idle',faceX:1,faceY:0,tvCrouch:1},0);
 assert.ok(crouch.head[2]<base.head[2]-10);assert.ok(crouch.kneeL[1]>base.kneeL[1]);assert.deepEqual(crouch.footL,base.footL);assert.deepEqual(playerPose({animationAction:'idle',faceX:1,faceY:0},0),base);assert.ok(playerMotion.clips.idle);
});
test('crouching fits under a solid ceiling and cannot stand into it',()=>{
 const {m,p}=create();p.x=1440;m.solids.push({x:1400,y:360,w:160,h:40});m.step(.016,{one:{down:true}});assert.equal(p.bodyHeight,34);
 ticks(m,12,{});assert.equal(p.crouching,true);assert.equal(p.y,437);p.x=1700;ticks(m,12,{});assert.equal(p.crouching,false);
});
test('blocked crouch jumps latch the button and do not jump automatically after leaving the ceiling',()=>{
 const {m,p}=create();p.x=1440;m.solids.push({x:1400,y:360,w:160,h:40});m.step(.016,{one:{down:true}});ticks(m,12,{one:{jump:true}});assert.equal(p.y,437);assert.equal(p.crouching,true);p.x=1700;ticks(m,12,{one:{jump:true}});assert.equal(p.y,437);m.step(.016,{});m.step(.016,{one:{jump:true}});assert.ok(p.vy<0);
});
test('crouch ducks an already-fired head-height arrow, while the standing collider is hit',()=>{
 for(const crouch of [false,true]){const {m,p}=create();p.x=1440;p.invulnerable=0;if(crouch)m.step(.016,{one:{down:true}});m.projectiles=[{friendly:false,kind:'enemy-arrow',x:p.x-4,y:397,vx:0,vy:0,life:1}];tickArenaProjectiles(m,.016);assert.equal(p.hp,crouch?3:2);}
});
test('committed enemy attacks can be interrupted and missed archer arrows are recoverable once',()=>{
 const {m,p}=create();p.x=1440;const e=m.spawnAt({x:1650,y:437,face:-1},'archer');e.emerging=0;moveArenaEnemy(m,e,.016);assert.ok(e.intent);m.damageEnemy(e,1);assert.equal(e.intent,null);assert.ok(e.recovery>0);
 m.projectiles=[{friendly:false,kind:'enemy-arrow',x:100,y:200,vx:0,vy:0,life:.01}];tickArenaProjectiles(m,.02);assert.equal(m.supplyDrops.filter(s=>s.kind==='arrow').length,1);tickArenaProjectiles(m,.02);assert.equal(m.supplyDrops.filter(s=>s.kind==='arrow').length,1);
});
test('Down plus fresh Jump drops through all ledge tiers, holding never repeats, and solid tubes stay solid',()=>{
 for(const y of [197,317]){const {m,p}=create();Object.assign(p,{x:1440,y,grounded:true});m.step(.016,{one:{down:true,jump:true}});assert.ok(p.dropThrough>0);ticks(m,90,{one:{down:true,jump:true}});assert.equal(p.y,y===197?317:437);assert.ok(p.grounded);}
 const {m,p}=create(),t=m.tubes[0];m.platforms=[];m.solids=m.solids.filter(s=>s.style==='tube');Object.assign(p,{x:t.x,y:t.y,grounded:true});ticks(m,80,{one:{down:true,jump:true}});assert.equal(p.y,t.y);assert.ok(p.grounded);
});
test('parallax layers cover negative and wide cameras without gaps and have distinct scroll rates',()=>{
 assert.equal(TV_PARALLAX_LAYERS.length,4);assert.equal(new Set(TV_PARALLAX_LAYERS.map(l=>l.speed)).size,4);
 for(const camera of [-2100,0,960,2880])for(const left of [-700,0])for(const width of [960,2880]){const tiles=parallaxTiles(camera,left,width,1024,.28);assert.ok(tiles[0].x<=left);assert.ok(tiles.at(-1).x+1024>=left+width);for(let i=1;i<tiles.length;i++){assert.equal(tiles[i].x-tiles[i-1].x,1024);assert.notEqual(tiles[i].mirror,tiles[i-1].mirror);}}
});
test('asset upgrade replaces recognized defaults while preserving custom colors, joints and motion keys',()=>{
 const old=makeArenaRigV2('mossback'),saved=structuredClone(old),next=structuredClone(old);next.palette.cap='#445566';next.joints.head.position[2]++;next.clips.walk.keys[1].joints.head=[4,5,6];saved.palette.body='#abcdef';saved.clips.idle.keys[0].joints.head=[2,3,4];
 const merged=mergeArenaDesign(saved,old,next);assert.equal(merged.palette.cap,'#445566');assert.equal(merged.palette.body,'#abcdef');assert.deepEqual(merged.clips.idle,saved.clips.idle);assert.deepEqual(merged.clips.walk,next.clips.walk);assert.deepEqual(merged.joints.head,next.joints.head);
 const a={x:0,y:0,width:2,height:1,palette:['transparent','#112233','#ffffff'],pixels:[1,2]},b={...a,palette:['transparent','#ffffff','#112233'],pixels:[2,1]};assert.ok(sameArenaPixels(a,b));b.pixels=[1,1];assert.equal(sameArenaPixels(a,b),false);
});

test('arena attack poses follow windup and release timers',()=>{
 for(const kind of ['archer','imp','snake','boar','bat']){
  const e={kind,alive:true,intent:{time:.2,duration:.8}};
  assert.equal(tvEnemyPoseTime(e),.25);e.intent.time=.6;
  assert.ok(Math.abs(tvEnemyPoseTime(e)-.75)<1e-9);
 }
 assert.equal(tvEnemyPoseTime({kind:'skeleton',alive:true,intent:{time:.65,duration:.55,hit:true}}).toFixed(2),'0.50');
 assert.equal(tvEnemyPoseTime({kind:'archer',alive:true}),undefined);
});
