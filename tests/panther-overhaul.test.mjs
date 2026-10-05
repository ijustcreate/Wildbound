import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {defaultBeastMotion,validateBeastMotion} from '../src/beast-motion.mjs';
import {poseAt} from '../src/player-motion.mjs';
import {tickPanther,pantherBranch} from '../src/panther-ai.mjs';
import {Game,EVENTS} from '../src/core.mjs';

const makeGame=()=>({scenery:[],traps:[],hits:[],sounds:[],moveActor(e,x,y){e.x+=x;e.y+=y;return Math.hypot(x,y);},hurt(p,damage){p.hp-=damage;this.hits.push(damage);},onSound(cue){this.sounds.push(cue);}});
const makePanther=()=>({kind:'panther',x:0,y:0,faceX:1,faceY:0,orbit:1,state:'hunt',cooldown:0,speed:80,damage:15,hp:100});

test('authored Panther has distinct complete animation clips and passes rig validation',()=>{
 const model=JSON.parse(fs.readFileSync(new URL('../authored/rigs.json',import.meta.url))).beastMotions.panther;
 assert.ok(validateBeastMotion('panther',model));
 for(const clip of ['prowl','booty_shake','crouch','sit','lie','branch_lie','climb','swipe_left','swipe_right','bite','swoop'])assert.ok(model.clips[clip]?.keys.length>=2,clip);
 assert.notDeepEqual(model.clips.swipe_left.keys[1].joints.frontPawL,model.clips.swipe_right.keys[1].joints.frontPawL);
 const idle=poseAt(model,'idle',0),lie=poseAt(model,'lie',4);
 assert.ok(lie.head[2]<idle.head[2]-10);
 assert.ok(lie.eyeL[2]<idle.eyeL[2]-10);
 assert.ok(lie.tailTip[2]<idle.tailTip[2]-10);
 assert.equal(defaultBeastMotion('snow_leopard').type,'snow_leopard');
});

test('Panther rests, climbs a branching tree, then descends when approached',()=>{
 const game=makeGame(),e=makePanther(),p={x:600,y:0,hp:100};
 game.scenery=[{id:'small',kind:'tree',x:10,y:-35,rootY:0,size:70},{id:'oak',kind:'tree',treeType:'oak',x:15,y:-40,rootY:0,size:120}];
 assert.equal(pantherBranch(game,e)?.id,'oak');
 tickPanther(game,e,p,.1);assert.equal(e.state,'sit');
 tickPanther(game,e,p,2);assert.equal(e.state,'lie');
 tickPanther(game,e,p,3.3);assert.equal(e.state,'prowl');
 for(let i=0;i<20 && e.state==='prowl';i++)tickPanther(game,e,p,.1);
 assert.equal(e.state,'climb');
 tickPanther(game,e,p,.75);assert.equal(e.state,'branch_rest');assert.ok(e.groundHeight>0);
 p.x=40;tickPanther(game,e,p,.1);assert.equal(e.state,'descend');
 tickPanther(game,e,p,.5);assert.equal(e.groundHeight,0);
});

test('Panther spends energy on swoop and alternates directional swipes',()=>{
 const game=makeGame(),e=makePanther(),p={x:110,y:0,hp:100};
 tickPanther(game,e,p,.01);assert.equal(e.state,'windup');assert.ok(e.pantherEnergy<60);
 tickPanther(game,e,p,.5);assert.equal(e.state,'swoop');
 tickPanther(game,e,p,.15);assert.ok(e.x>0);
 tickPanther(game,e,p,.2);assert.equal(e.state,'recover');
 tickPanther(game,e,p,.3);assert.equal(e.state,'hunt');
 e.x=64;e.pantherDecision=0;e.cooldown=0;e.pantherEnergy=50;
 tickPanther(game,e,p,.01);assert.equal(e.state,'swipe');assert.equal(e.animationAction,'swipe_left');
 tickPanther(game,e,p,.4);tickPanther(game,e,p,.3);e.cooldown=0;e.pantherDecision=0;e.pantherEnergy=50;
 tickPanther(game,e,p,.01);assert.equal(e.animationAction,'swipe_right');
 assert.ok(game.hits.length>=2);
});

test('Adventure routes spawned Panther through the energy driven AI',()=>{
 const game=new Game(()=>.5),player=game.addPlayer('keyboard');game.start();
 game.spawnEvent(EVENTS.findIndex(event=>event.kind==='panther'));
 const panther=game.enemies.find(enemy=>enemy.kind==='panther');assert.ok(panther);
 player.x=300;player.y=300;panther.x=410;panther.y=300;panther.cooldown=0;
 game.update(.05);
 assert.equal(panther.state,'windup');
 assert.equal(panther.animationAction,'crouch');
 assert.ok(panther.pantherEnergy<100);
});
