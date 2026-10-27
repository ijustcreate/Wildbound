import test from 'node:test';
import assert from 'node:assert/strict';
import {Game} from '../src/core.mjs';
import {initializeAnaconda,anacondaBody,ANACONDA_TRAIL_LIMIT} from '../src/anaconda-body.mjs';
import {befriendCreature,tickFriendlyCreature} from '../src/friendly-creatures.mjs';
import {cycleFollowerControl} from '../src/follower-control.mjs';
import {findPath} from '../src/navigation.mjs';
const field=()=>{const g=new Game(()=>.5);g.phase='play';g.openingBoard=false;g.house=null;g.scenery=[];g.enemies=[];g.terrain.fill('grass');const p=g.addPlayer('keyboard');Object.assign(p,{x:800,y:600});return {g,p};};
const addSnake=(g,p,x=500,y=500)=>{const e={id:901,kind:'anaconda',x,y,faceX:1,faceY:0,hp:380,maxHp:380,speed:70,damage:26,cooldown:0,state:'idle',flash:0,step:0};g.enemies.push(e);initializeAnaconda(e,g);befriendCreature(e,p.id);return e;};
test('controlled anaconda body follows actual head travel through turns and remains bounded on release',()=>{
 const {g,p}=field(),e=addSnake(g,p);cycleFollowerControl(g,p);const before=anacondaBody(e).segments[12].x;
 for(const [x,y]of [[1,0],[0,-1],[-1,0],[0,1]])for(let n=0;n<55;n++){
  g.update(.02,{keyboard:{x,y}});const b=anacondaBody(e);assert.ok(Math.hypot(b.segments[0].x-p.x,b.segments[0].y-p.y)<1e-7);assert.ok(b.trail.length<=ANACONDA_TRAIL_LIMIT);
  for(let i=1;i<b.segments.length;i++)assert.ok(Math.hypot(b.segments[i].x-b.segments[i-1].x,b.segments[i].y-b.segments[i-1].y)<=10.0001);
 }
 assert.notEqual(anacondaBody(e).segments[12].x,before);assert.ok(anacondaBody(e).distance>200);
 cycleFollowerControl(g,p);assert.equal(e.controlledBy,undefined);assert.ok(Number.isFinite(p.x));
});
test('direct control uses the anaconda footprint instead of the smaller hero collision radius',()=>{
 const {g,p}=field(),e=addSnake(g,p);g.blocked=(x,y,r)=>x+r>550;cycleFollowerControl(g,p);
 for(let n=0;n<100;n++)g.update(.02,{keyboard:{x:1}});
 assert.ok(p.x<=534.00001);assert.equal(anacondaBody(e).segments[0].x,e.x);
});
test('anaconda trail survives negative Boundless coordinates and JSON restoration',()=>{
 const {g,p}=field();g.mapMode='boundless';g.blocked=()=>false;const e=addSnake(g,p,-300,-400);cycleFollowerControl(g,p);
 for(let n=0;n<60;n++)g.update(.02,{keyboard:{x:-1,y:1}});
 const restored=JSON.parse(JSON.stringify(e)),body=anacondaBody(restored,g);assert.ok(body.trail.some(t=>Math.hypot(t.x-restored.x,t.y-restored.y)>100));assert.equal(body.segments[0].x,restored.x);
});
test('forest followers route around an obstruction even when there is no house',()=>{
 const {g,p}=field();p.x=820;p.y=600;
 g.blocked=(x,y,r=0)=>x-r<0||y-r<0||x+r>1600||y+r>1600||(x+r>590&&x-r<630&&y+r>500&&y-r<700);
 for(const kind of ['wolf','anaconda']){
  const e={id:901,kind,x:500,y:600,hp:50,faction:'ally',allyOwner:p.id,speed:100,damage:1};
  g.enemies=[e];if(kind==='anaconda')initializeAnaconda(e,g);
  for(let n=0;n<600;n++){g.time+=.02;tickFriendlyCreature(g,e,.02);assert.equal(g.blocked(e.x,e.y,kind==='anaconda'?16:8),false);}
  assert.ok(Math.hypot(e.x-p.x,e.y-p.y)<80,kind+' reaches owner around obstacle');
 }
});
test('a blocked follower goal cell still yields the nearest reachable approach',()=>{
 const {g,p}=field();g.blocked=(x,y,r=0)=>x-r<0||y-r<0||x+r>1600||y+r>1600||(x>700&&x<760&&y>500&&y<700);
 const e={id:9,kind:'wolf',x:500,y:600,faction:'ally',allyOwner:p.id};
 const path=findPath(g,e,{x:730,y:600});assert.ok(path.length>0);assert.ok(path.at(-1).x>e.x);assert.equal(g.blocked(path.at(-1).x,path.at(-1).y,8),false);
});
test('anaconda routing can cross water while land-only followers keep their dry grid',()=>{
 const {g,p}=field();g.terrain.fill('water');p.x=800;p.y=600;
 const e=addSnake(g,p,500,600),path=findPath(g,e,p);assert.ok(path.length>0);
 const wolf={id:902,kind:'wolf',x:500,y:600,faction:'ally',allyOwner:p.id};assert.equal(findPath(g,wolf,p).length,0);
});
