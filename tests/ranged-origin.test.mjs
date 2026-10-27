import test from 'node:test';
import assert from 'node:assert/strict';
import {Game} from '../src/core.mjs';
import {drawBowAim} from '../src/bow-aim.mjs';
import {wandTipWorld,heldItemWorld,playerFrame} from '../src/player-motion.mjs';
import {rangedLaunchOrigin} from '../src/ranged-launch.mjs';
function guide(p,time,scale=1){const points=[],c=new Proxy({moveTo:(x,y)=>points.push({x,y})},{get:(o,k)=>o[k]||(()=>{})});drawBowAim(c,p,scale,time);return points;}
function setup(equipment,env='forest'){const g=new Game(()=>.5),p=g.addPlayer('keyboard');g.start();g.openingBoard=false;g.house=null;g.scenery=[];g.enemies=[];g.terrain.fill('grass');g.generatedEnvironment=env;Object.assign(p,{x:500,y:500,hp:100,mana:100,bowAiming:true,equipment,inventory:[{type:'arrow',qty:999}]});return {g,p};}
const close=(a,b,message)=>assert.ok(Math.hypot(a.x-b.x,a.y-b.y)<1e-7,message+' '+JSON.stringify({a,b}));
test('Actual releases match guide origins at continuous angles, three charges and both render sizes',()=>{
 for(const equipment of [{hand1:'bow'},{hand1:'wand'},{hand1:'sword',hand2:'wand'},{hand1:'wand',hand2:'fire_wand'},{hand1:'boomerang'}])for(const env of ['forest','lobby']){const {g,p}=setup(equipment,env),scale=env==='lobby'?86/48:1;
 for(const charge of [0,.6,1.2])for(let d=0;d<360;d+=5){Object.assign(p,{faceX:Math.cos(d*Math.PI/180),faceY:Math.sin(d*Math.PI/180),charge,attack:0,attackClip:null,mana:100,queuedAttack:null});g.arrows=[];g.spells=[];g.boomerangs=[];const before=guide(p,g.time,scale);g.attack(p,charge);const shots=[...g.spells,...g.arrows,...g.boomerangs];assert.equal(shots.length,before.length,JSON.stringify(equipment));for(let i=0;i<shots.length;i++){const shot=shots[i],z=shot.z??16;close(before[i],{x:shot.x,y:shot.y-z},JSON.stringify({equipment,env,charge,d}));const speed=Math.hypot(shot.vx,shot.vy);close({x:shot.vx/speed,y:shot.vy/speed},{x:p.faceX,y:p.faceY},'Continuous flight direction');}}
 }
});
test('Wand hand stays at the guide through aimed release and recovery, including dual wield',()=>{
 const {g,p}=setup({hand1:'wand',hand2:'fire_wand'});Object.assign(p,{faceX:.6,faceY:-.8,charge:1.2,jumpHeight:19,groundHeight:7,appearance:{build:'broad'}});const before=guide(p,0);g.attack(p,1.2);for(const remaining of [.34,.25,.1,0]){p.attack=remaining;const after=guide(p,0);for(let i=0;i<2;i++){close(before[i],after[i],'Aim hand must not jump on release');close(after[i],wandTipWorld(p,i?'hand2':'hand1',0),'Guide stays on visible wand tip');}assert.equal(playerFrame(p,0,undefined,'cast'),playerFrame(p,100,undefined,'cast'));}
});
test('Boomerang launches from right hand rather than the bow hand or feet',()=>{
 const {g,p}=setup({hand1:'boomerang'});p.faceX=1;p.faceY=0;p.charge=.6;const hand=heldItemWorld(p,'hand1',0),origin=rangedLaunchOrigin(p,0,'boomerang');close(hand,{x:origin.x,y:origin.y-origin.z},'Right-hand origin');g.attack(p,.6);const b=g.boomerangs[0];close(hand,{x:b.x,y:b.y-16},'Visible boomerang launch');assert.ok(Math.hypot(b.x-p.x,b.y-16-p.y)>5);
});
