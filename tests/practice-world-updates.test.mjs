import test from 'node:test';
import assert from 'node:assert/strict';
import {Game,EVENTS,expeditionCameraTarget} from '../src/core.mjs';
import {LobbyPractice} from '../src/lobby-practice.mjs';
import {damageEnemy} from '../src/enemy-damage.mjs';
import {startJump,tickJump,supportHeight} from '../src/jumping.mjs';
import {navigateEnemy} from '../src/navigation.mjs';
import {summonGhost,tickGhosts} from '../src/temple.mjs';
import {tickSwimming} from '../src/swimming.mjs';
const world=()=>{const g=new Game(()=>.5);g.phase='play';g.openingBoard=false;g.terrain.fill('grass');g.scenery=[];g.house={walls:[],doors:[],furniture:[],pools:[],floors:[]};return g;};
test('Practice targets retain health through lethal damage and expire stacked typed text in half a second',()=>{
 const g=new LobbyPractice(),t=g.targets[0],hp=t.hp;
 damageEnemy(t,1e12);damageEnemy(t,13,'fire');damageEnemy(t,21,'ice');
 assert.equal(t.hp,hp);assert.equal(t.hits,3);assert.equal(t.combatText[0].type,'ice');
 g.updateTargets(.25);assert.ok(t.combatText[1].offset>0);g.updateTargets(.26);assert.equal(t.combatText.length,0);
});
test('A lion routes onto a bed and lands on its surface',()=>{
 const g=world();g.house.furniture=[{kind:'bed',x:300,y:280,w:80,h:64,surfaceHeight:12,jumpable:true}];
 const lion={id:5,kind:'lion',x:250,y:310,hp:100,speed:100,state:'hunt'};
 let landed=false;
 for(let n=0;n<150;n++){g.time+=.02;tickJump(lion,.02,g);navigateEnemy(g,lion,{x:350,y:310},.02);if(lion.groundHeight===12)landed=true;}
 assert.ok(lion.x>=300,'Lion crosses bed edge');assert.ok(landed,'Lion lands on bed');
});
test('A winding-up lion completes its pounce onto furniture',()=>{
 const g=world(),p=g.addPlayer('keyboard');Object.assign(p,{x:350,y:310,groundHeight:12,invuln:999});
 g.house.furniture=[{kind:'bed',x:300,y:280,w:80,h:64,surfaceHeight:12,jumpable:true}];
 g.spawnEvent(EVENTS.findIndex(e=>e.kind==='lion'));const lion=g.enemies[0];Object.assign(lion,{x:270,y:310,state:'windup',timer:.02,dx:1,dy:0,tacticTime:0});
 let onBed=false;for(let n=0;n<60;n++){g.update(.02,{});if(lion.groundHeight===12)onBed=true;}
 assert.ok(onBed,'Pounce lands on the raised bed');
});
test('Melee applies actual damage to the same immortal targets used by projectiles',()=>{
 const g=new LobbyPractice(),p=g.addPlayer('keyboard'),target=g.targets[0];
 Object.assign(p,{x:target.x,y:target.y+45,faceX:0,faceY:-1});p.equipment.hand1='sword';
 const hp=target.hp;g.attack(p,0);assert.ok(target.score>0);assert.equal(target.hp,hp);assert.equal(target.combatText[0].type,'physical');
});
test('Ghosts reset corpse state, cap at three, follow with animation, and attack nearby enemies',()=>{
 const g=world(),p=g.addPlayer('keyboard');Object.assign(p,{x:300,y:300});
 for(let n=0;n<4;n++)summonGhost(g,{kind:'lion',x:190+n*4,y:300,hp:0,defeated:true,deathTimer:5,killedBy:p.id,ritualKill:true,damage:10});
 assert.equal(g.ghosts.length,3);assert.ok(g.ghosts.every(a=>!a.defeated&&a.deathTimer===0));
 tickGhosts(g,.1);assert.ok(g.ghosts.some(a=>a.step>0&&a.animationAction==='walk'));
 const a=g.ghosts[0],enemy={x:a.x+20,y:a.y,hp:100};g.enemies=[enemy];tickGhosts(g,.1);
 assert.ok(enemy.hp<100);assert.ok(a.cooldown>0);assert.equal(a.animationAction,'attack');
});
test('Stumps block grounded movement, support landing, and allow walking off',()=>{
 const g=world();g.scenery=[{kind:'tree',fallen:true,depleted:true,x:300,y:280,rootY:300,size:64}];
 const p=g.addPlayer('keyboard');Object.assign(p,{x:280,y:300});g.moveActor(p,20,0);assert.ok(p.x<293);
 assert.ok(startJump(p));for(let n=0;n<12;n++)tickJump(p,.02,g);g.moveActor(p,300-p.x,0);
 for(let n=0;n<60;n++)tickJump(p,.02,g);assert.equal(p.groundHeight,6);assert.equal(supportHeight(g,p),6);
 g.moveActor(p,40,0);for(let n=0;n<60;n++)tickJump(p,.02,g);assert.equal(p.groundHeight,0);
});
test('Water depth transitions splash both ways and swimmers stay under bridge decks',()=>{
 const g=world(),p=g.addPlayer('keyboard');g.house=null;g.terrain[10*50+10]='water';g.terrain[10*50+11]='bridge';g.terrain[10*50+12]='shallow';
 Object.assign(p,{x:336,y:336});tickSwimming(g,p,{},.05);assert.ok(p.swimming);const splashes=()=>g.effects.filter(e=>e.particle==='splash').length;assert.equal(splashes(),1);
 p.x=368;tickSwimming(g,p,{},.05);assert.ok(p.swimming&&p.underBridge);assert.equal(supportHeight(g,p),0);
 p.x=400;tickSwimming(g,p,{},.05);assert.equal(p.swimming,false);assert.equal(splashes(),2);
 p.x=368;tickSwimming(g,p,{},.05);assert.equal(p.underBridge,false);assert.equal(p.groundHeight,10);
});
test('Opening camera contains the tabletop and legs at desktop and small sizes',()=>{
 const g=world();g.openingBoard=true;
 for(const [w,h] of [[1440,940],[1000,700],[390,700]]){const c=expeditionCameraTarget(g,w,h);assert.ok(h/2+(768-c.y)*c.zoom>=40);assert.ok(h/2+(815-c.y)*c.zoom<h-35);}
});
