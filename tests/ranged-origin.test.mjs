import test from 'node:test';
import assert from 'node:assert/strict';
import {Game} from '../src/core.mjs';
import {drawBowAim,projectedAimTrajectory} from '../src/bow-aim.mjs';
import {LobbyPractice} from '../src/lobby-practice.mjs';
import {wandTipWorld,heldItemWorld,playerFrame} from '../src/player-motion.mjs';
import {rangedLaunchOrigin} from '../src/ranged-launch.mjs';
function guide(p,time,scale=1,world=null,lift=0){const points=[];let aimed=false;const c=new Proxy({globalAlpha:1,setLineDash(dash){aimed=dash.length===2;},restore(){aimed=false;},moveTo(x,y){if(aimed)points.push({x,y});}},{get:(o,k)=>o[k]||(()=>{})});drawBowAim(c,p,scale,time,world,lift);return points;}
function setup(equipment,env='forest'){const g=new Game(()=>.5),p=g.addPlayer('keyboard');g.start();g.openingBoard=false;g.house=null;g.scenery=[];g.enemies=[];g.terrain.fill('grass');g.generatedEnvironment=env;Object.assign(p,{x:500,y:500,hp:100,mana:100,bowAiming:true,equipment,inventory:[{type:'arrow',qty:999}]});return {g,p};}
const close=(a,b,message)=>assert.ok(Math.hypot(a.x-b.x,a.y-b.y)<1e-7,message+' '+JSON.stringify({a,b}));
test('Actual releases match the visible guide origins at continuous angles, three charges and both render sizes',()=>{
 for(const equipment of [{hand1:'bow'},{hand1:'wand'},{hand1:'sword',hand2:'wand'},{hand1:'wand',hand2:'fire_wand'},{hand1:'boomerang'}])for(const env of ['forest','lobby']){const {g,p}=setup(equipment,env),scale=env==='lobby'?86/48:1;
 for(const charge of [0,.6,1.2])for(let d=0;d<360;d+=5){Object.assign(p,{faceX:Math.cos(d*Math.PI/180),faceY:Math.sin(d*Math.PI/180),charge,attack:0,attackClip:null,mana:100,queuedAttack:null});g.arrows=[];g.spells=[];g.boomerangs=[];const before=guide(p,g.time,scale);g.attack(p,charge);const shots=[...g.spells,...g.arrows,...g.boomerangs];assert.equal(shots.length,before.length,JSON.stringify(equipment));for(let i=0;i<shots.length;i++){const shot=shots[i];close(before[i],{x:shot.x,y:shot.y-(shot.type?16:shot.z??16)},JSON.stringify({equipment,env,charge,d}));const speed=Math.hypot(shot.vx,shot.vy);close({x:shot.vx/speed,y:shot.vy/speed},{x:p.faceX,y:p.faceY},'Continuous flight direction');}}
 }
});
test('Projected wand guide stays registered through aimed release and recovery, including dual wield',()=>{
 const {g,p}=setup({hand1:'wand',hand2:'fire_wand'});Object.assign(p,{faceX:.6,faceY:-.8,charge:1.2,jumpHeight:19,groundHeight:7,appearance:{build:'broad'}});const before=guide(p,0);g.attack(p,1.2);for(const remaining of [.34,.25,.1,0]){p.attack=remaining;const after=guide(p,0);for(let i=0;i<2;i++){close(before[i],after[i],'Aim hand must not jump on release');const tip=wandTipWorld(p,i?'hand2':'hand1',0);close(after[i],tip,'Guide starts at the visible wand tip');}assert.equal(playerFrame(p,0,undefined,'cast'),playerFrame(p,100,undefined,'cast'));}
});
test('Boomerang launches from right hand rather than the bow hand or feet',()=>{
 const {g,p}=setup({hand1:'boomerang'});p.faceX=1;p.faceY=0;p.charge=.6;const hand=heldItemWorld(p,'hand1',0),origin=rangedLaunchOrigin(p,0,'boomerang');close(hand,{x:origin.x,y:origin.y-origin.z},'Right-hand origin');g.attack(p,.6);const b=g.boomerangs[0];close(hand,{x:b.x,y:b.y-16},'Visible boomerang launch');assert.ok(Math.hypot(b.x-p.x,b.y-16-p.y)>5);
});

test('A thin window clips the guide without breaking until the actual shot, using each flight radius',()=>{
 const {g,p}=setup({hand1:'bow'});
 Object.assign(p,{faceX:1,faceY:0,charge:1.2});
 const origin={x:500,y:500,z:18},direction={x:1,y:0};
 const window={kind:'window',x:568.5,y:476,w:1,h:48};
 g.house={walls:[window],doors:[],furniture:[]};
 const preview=kind=>projectedAimTrajectory(p,{origin,direction,kind,charge:p.charge,world:g}).at(-1);
 const arrow=preview('bow'),spell=preview('magic');
 assert.ok(arrow.x>=567.25&&arrow.x<=567.5);
 assert.ok(spell.x>=561.25&&spell.x<=561.5);
 assert.equal(window.broken,undefined);
 assert.equal(g.projectileBlocked(568,500,1,true),true);
 assert.equal(window.broken,true);
 assert.equal(preview('bow').x,1060);
 assert.equal(preview('magic').x,1060);
});

test('The raised guide starts at the raised hand and probes unshifted flight coordinates',()=>{
 const {p}=setup({hand1:'wand'});
 Object.assign(p,{faceX:1,faceY:0,charge:1.2,trainVisualLift:24});
 const origin=rangedLaunchOrigin(p,0,'magic'),y=[];
 const world={projectileBlocked(x,at,radius,impact){y.push(at);assert.equal(radius,7);assert.equal(impact,false);return x>origin.x+30;}};
 const [visible]=guide(p,0,1,world,24);
 close(visible,{x:origin.x,y:origin.y-16-24},'Visible weapon on the raised deck');
 assert.ok(y.length>0&&y.every(at=>at===origin.y));
});

test('Lobby guides stop inside the actual practice floor',()=>{
 const g=new LobbyPractice();
 const p=g.addPlayer('keyboard');
 const path=projectedAimTrajectory(p,{origin:{x:900,y:390,z:16},direction:{x:1,y:0},kind:'magic',charge:1.2,world:g});
 assert.ok(path.at(-1).x>=1016.75&&path.at(-1).x<=1017);
});
