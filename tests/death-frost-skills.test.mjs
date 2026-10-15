import test from 'node:test';
import assert from 'node:assert/strict';
import {Game} from '../src/core.mjs';
import {tickBansheeQueen,initializeBansheeQueen} from '../src/banshee-queen.mjs';
import {freezeBansheeTarget,tickPlayerIce} from '../src/frost-prison.mjs';
import {REAPER_EQUIPMENT,REAPER_SET,stat,setProgress} from '../src/items.mjs';
import {sampleDeathSteps,DEATH_STEP_LIMIT} from '../src/death-steps.mjs';
import {tickReaper} from '../src/reaper-ai.mjs';
import {reaperJointWorld} from '../src/reaper-effects.mjs';
import {defaultReaperMotion} from '../src/reaper-motion.mjs';
import {playerPose} from '../src/player-motion.mjs';
function field(){const g=new Game(()=>.5),p=g.addPlayer('keyboard','One');g.phase='play';g.openingBoard=false;g.scenery=[];g.terrain.fill('grass');g.enemies=[];g.house=null;Object.assign(p,{x:600,y:600,hp:100});return {g,p};}
function queen(g,d=250){const e={id:g.nextId++,kind:'banshee_queen',x:600+d,y:600,hp:340,maxHp:340,speed:44,damage:24,cooldown:0,flash:0,state:'hunt',faceX:-1,faceY:0};initializeBansheeQueen(e);g.enemies.push(e);return e;}
test('retreat dash travels away, obeys walls, fires three spread arrows and has cooldown',()=>{
 for(const wall of [false,true]){const {g,p}=field(),e=queen(g,80),start=e.x;let largest=0;const move=g.moveActor.bind(g);g.moveActor=(a,x,y)=>{largest=Math.max(largest,Math.hypot(x,y));return wall?0:move(a,x,y);};
 tickBansheeQueen(g,e,p,.01);assert.ok(e.bansheeDashLeft>0);tickBansheeQueen(g,e,p,.4);assert.equal(g.arrows.length,3);assert.equal(e.arrowsLeft,33);assert.ok(largest<=6);assert.equal(e.x>start,!wall);assert.ok(e.bansheeDashCooldown>7);assert.equal(new Set(g.arrows.map(a=>a.vy)).size,3);tickBansheeQueen(g,e,p,.1);assert.equal(g.arrows.length,3);}
});
test('safe ranged Queen holds still to charge; only full release is frost and interruption consumes cooldown',()=>{
 const {g,p}=field(),e=queen(g);e.bansheeSafeTime=2;tickBansheeQueen(g,e,p,.01);assert.ok(e.bansheeFrostCharge);const x=e.x,y=e.y;tickBansheeQueen(g,e,p,1.7);assert.equal(g.arrows.length,0);assert.deepEqual([e.x,e.y],[x,y]);tickBansheeQueen(g,e,p,.1);assert.equal(g.arrows.length,1);assert.ok(g.arrows[0].bansheeFrost);assert.ok(e.bansheeFrostCooldown>10);
 const second=queen(g);second.bansheeSafeTime=2;tickBansheeQueen(g,second,p,.01);second.flash=.2;tickBansheeQueen(g,second,p,.2);assert.ok(!second.bansheeFrostCharge);assert.ok(second.bansheeFrostCooldown>11);assert.equal(g.arrows.length,1);
});
test('a real frost projectile only freezes on successful damage; shield and invulnerability prevent it',()=>{
 for(const blocked of ['none','invuln','shield']){const {g,p}=field();p.invuln=blocked==='invuln'?1:0;if(blocked==='shield')g.shieldBlocks=()=>true;
 g.arrows.push({id:4,x:p.x,y:p.y,z:18,vx:0,vy:0,vz:0,gravity:0,damage:10,hostile:true,bansheeFrost:true,rangeLeft:460});g.tickAdventure(.01,{});assert.equal(p.bansheeIce>0,blocked==='none');if(blocked==='none'){assert.equal(p.bansheeIce,3);assert.equal(p.frozen,3);}}
});
test('ice prevents moving and attacking, thaws at 3 seconds, and friendly melee shatters without damage',()=>{
 const {g,p}=field(),q=g.addPlayer('pad:0','Two');Object.assign(q,{x:560,y:600,hp:100,faceX:1,faceY:0,equipment:{},attack:0});freezeBansheeTarget(g,p);const hp=p.hp;assert.equal(g.attack(p),false);g.update(.1,{keyboard:{x:1,attack:true}});assert.equal(p.x,600);assert.ok(p.bansheeIce>2.8);g.attack(q);assert.equal(p.frozen,0);assert.equal(p.hp,hp);
 freezeBansheeTarget(g,p);tickPlayerIce(p,2.99);assert.ok(p.frozen>0);tickPlayerIce(p,.01);assert.ok(p.frozen<1e-8);assert.ok(p.bansheeIce<1e-8);
});
test('friendly arrows rescue frozen players with PvP disabled',()=>{
 const {g,p}=field(),q=g.addPlayer('pad:0','Two');q.hp=100;freezeBansheeTarget(g,p);const hp=p.hp;g.arrows.push({id:77,owner:q.id,x:p.x,y:p.y,z:18,vx:0,vy:0,vz:0,damage:100,hostile:false});g.tickAdventure(.01,{});assert.equal(p.frozen,0);assert.equal(p.hp,hp);
});
test('six-piece Reaper set has exact thresholds; real scythe damage steals only health actually lost',()=>{
 const {g,p}=field();p.equipment={...REAPER_EQUIPMENT};assert.equal(REAPER_SET.length,6);assert.ok(setProgress(p,'reaper').complete);assert.equal(stat(p,'reaperDamage'),20);assert.equal(stat(p,'reaperLifeSteal'),.05);delete p.equipment.cape;assert.equal(stat(p,'reaperDamage'),0);assert.equal(stat(p,'deathSteps'),1);
 p.equipment={...REAPER_EQUIPMENT};p.hp=50;p.faceX=1;p.faceY=0;p.attack=0;g.enemies.push({id:99,kind:'skeleton',hp:10,maxHp:100,x:640,y:600,state:'hunt',speed:0});g.attack(p);assert.equal(g.enemies[0].hp,0);assert.equal(p.hp,50.5);
});
test('death trail requires 3 pieces, follows enemies too, is bounded and excludes jumps/teleports',()=>{
 const {g,p}=field();p.equipment={head:'reaper_hood',chest:'reaper_chest'};sampleDeathSteps(g);p.x+=20;g.time+=.1;assert.equal(sampleDeathSteps(g).length,0);p.equipment.gloves='reaper_gloves';sampleDeathSteps(g);p.x+=20;g.time+=.1;assert.ok(sampleDeathSteps(g).length>0);
 for(let i=0;i<100;i++){p.x+=10;g.time+=.01;sampleDeathSteps(g);}assert.ok(sampleDeathSteps(g).length<=DEATH_STEP_LIMIT);g.time+=3;assert.equal(sampleDeathSteps(g).length,0);p.jumpHeight=10;p.x+=20;g.time+=.1;assert.equal(sampleDeathSteps(g).length,0);
 const e={id:55,kind:'grim_reaper',hp:100,x:500,y:500,moving:true};g.enemies=[e];sampleDeathSteps(g);e.x+=20;g.time+=.1;assert.ok(sampleDeathSteps(g).some(s=>s.owner===55));
});
test('drain steals exactly 5 percent max health each half second and has no fractional-frame damage',()=>{
 const {g,p}=field(),e={id:99,kind:'grim_reaper',hp:20,maxHp:220,x:650,y:600,cooldown:10};p.maxHp=200;p.hp=100;g.enemies=[e];tickReaper(g,e,[p],.01);tickReaper(g,e,[p],.49);assert.equal(p.hp,100);tickReaper(g,e,[p],.01);assert.equal(p.hp,90);assert.equal(e.hp,30);tickReaper(g,e,[p],1);assert.equal(p.hp,70);assert.equal(e.hp,50);
});
test('channel raises only the free hand; beam follows hand and chest pose/elevation in eight views',()=>{
 const m=defaultReaperMotion();for(let d=0;d<8;d++){const a={kind:'grim_reaper',hp:100,x:50,y:70,faceX:-Math.sin(d*Math.PI/4),faceY:Math.cos(d*Math.PI/4),animationAction:'reaper_channel',playerFrame:8};const p=playerPose(a,0,m);assert.ok(p.handL[2]>p.handR[2]+10);const hand=reaperJointWorld(a,'handL',0,{model:m}),chest=reaperJointWorld(a,'chest',0,{model:m});assert.notDeepEqual(hand,chest);const air=reaperJointWorld({...a,jumpHeight:12},'handL',0,{model:m});assert.ok(Math.abs(air.y-(hand.y-12))<1e-8);}
});

