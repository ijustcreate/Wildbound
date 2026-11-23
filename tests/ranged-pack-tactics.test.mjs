import test from 'node:test';
import assert from 'node:assert/strict';
import {enemyPursuitGoal} from '../src/enemy-systems.mjs';
import {rangedFootwork} from '../src/ranged-footwork.mjs';
import {Game} from '../src/core.mjs';
import {initializeTacticalEnemy} from '../src/combat-tactics-state.mjs';
import {retrieveEnemyArrows} from '../src/arrow-supplies.mjs';
import {tickTacticalEnemy} from '../src/combat-tactics.mjs';
import {tickSpeciesCombat} from '../src/enemy-species-combat.mjs';

function pack(){const p={id:1,x:600,y:600,hp:100,faceX:1,faceY:0},enemies=Array.from({length:4},(_,i)=>({id:10+i,kind:'skeleton',x:300,y:400+i*40,hp:100,group:1,state:'hunt'}));return {g:{time:20,players:[p],enemies},p,enemies};}
test('same-type packs split direct pursuit, four-tile lead, intercept and flank goals',()=>{
 const {g,p,enemies}=pack();enemies.forEach(e=>enemyPursuitGoal(g,e,p));g.time+=.1;p.x+=10;
 const goals=enemies.map(e=>enemyPursuitGoal(g,e,p));assert.equal(goals[0],p);assert.equal(goals[1].x,p.x+128);assert.equal(goals[1].y,p.y);
 assert.equal(new Set(enemies.map(e=>e.pursuitTactic.role)).size,4);assert.notDeepEqual(goals[2],goals[3]);assert.ok(!g.effects);
 const slots=enemies.map(e=>e.pursuitTactic.slot);g.enemies=[...g.enemies].reverse();g.enemies[0].hp=0;enemies.filter(e=>e.hp>0).forEach(e=>enemyPursuitGoal(g,e,p));assert.deepEqual(enemies.map(e=>e.pursuitTactic.slot),slots);
 g.enemies.find(a=>a.pursuitTactic.slot===0).hp=0;const promoted=g.enemies.filter(a=>a.hp>0).sort((a,b)=>a.pursuitTactic.slot-b.pursuitTactic.slot)[0];assert.equal(enemyPursuitGoal(g,promoted,p),p);assert.equal(promoted.pursuitTactic.role,'hunter');
 assert.doesNotThrow(()=>JSON.stringify(g));
});
test('pursuit does not predict stationary players, crowd melee, rewrite committed attacks or recruit allies',()=>{
 const {g,p,enemies}=pack();const e=enemies[1];enemyPursuitGoal(g,e,p);assert.deepEqual(enemyPursuitGoal(g,e,p),{x:p.x,y:p.y});
 e.x=p.x-50;e.y=p.y;assert.equal(enemyPursuitGoal(g,e,p),p);e.x=300;e.state='windup';assert.equal(enemyPursuitGoal(g,e,p),p);
 e.state='hunt';e.faction='ally';assert.equal(enemyPursuitGoal(g,e,p),p);const loot={x:100,y:100};assert.equal(enemyPursuitGoal(g,enemies[0],loot),loot);
});
test('close pressure offers one brief evade followed by two seconds planted',()=>{
 const g={time:20},e={x:0,y:0},p={x:140,y:0};assert.ok(rangedFootwork(g,e,p).evade);
 g.time+=.4;assert.ok(rangedFootwork(g,e,p).plant);g.time+=1.8;assert.ok(rangedFootwork(g,e,p).plant);g.time+=.2;assert.ok(rangedFootwork(g,e,p).evade);
});
function scene(tactical){const g=new Game(()=>.5),p=g.addPlayer('keyboard');g.start();Object.assign(g,{time:20,openingBoard:false,scenery:[],house:null,enemies:[],traps:[],weather:null});g.terrain.fill('grass');g.persist=()=>{};g.onSound=()=>{};Object.assign(p,{x:600,y:600,hp:100});
 const e={id:900,kind:'archer',x:635,y:600,hp:100,maxHp:100,speed:70,damage:8,faceX:-1,faceY:0,cooldown:0,state:'hunt',arrowsLeft:0,startingArrows:12};g.configureCreature(e,false);e.arrowsLeft=0;e.cooldown=0;if(tactical){e.combatRole='archer';initializeTacticalEnemy(e);e.arrowsLeft=0;e.cooldown=0;}g.enemies=[e];return {g,p,e};}
for(const tactical of [false,true])test((tactical?'tactical':'ordinary')+' empty archer commits a readable bow bash and finite recovery',()=>{
 const {g,p,e}=scene(tactical);let hits=0,prepared=false;g.hurt=()=>hits++;
 for(let i=0;i<100;i++){g.time+=.02;(tactical?tickTacticalEnemy:tickSpeciesCombat)(g,e,.02,[p]);if((e.tactics||e.speciesCombat)?.phase==='windup')prepared=true;if(i<20)assert.equal(hits,0);}
 assert.ok(prepared);assert.ok(hits>0);assert.equal(g.arrows.length,0);assert.equal(e.arrowsLeft,0);
});
test('resupply yields to close pressure and abandons unreachable arrows instead of monopolizing cleanup',()=>{
 const {g,p,e}=scene(false);g.loot=[{id:9,type:'arrow',qty:3,x:1000,y:600}];assert.equal(retrieveEnemyArrows(g,e,.05,{target:p}),false);
 p.x=300;g.navigateEnemy=()=>false;g.blocked=()=>true;assert.ok(retrieveEnemyArrows(g,e,.05,{target:p}));g.time+=2.1;assert.equal(retrieveEnemyArrows(g,e,.05,{target:p}),false);assert.equal(e.retrievingArrows,false);
});
